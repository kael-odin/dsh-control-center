import { randomUUID } from 'node:crypto'
import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import type { SettingsProvider } from '@deepseek-ai/dsh-settings'
import type { CredentialProvider } from '@deepseek-ai/dsh-credentials'
import type { AttachmentStore } from '@deepseek-ai/dsh-attachment'
import type { LlmRuntime } from '@deepseek-ai/dsh-llm'
import { getPath } from '@deepseek-ai/dsh-client-schema-form'
import { bindTypertRemote, Remote } from '@deepseek-ai/dsh-typert-protocol'
import type {
  PaintingCatalogModel, PaintingCatalogView, PaintingHistoryId, PaintingHistoryItem, PaintingHistoryPage,
  PaintingImageRef, PaintingJobView, PaintingRequest, PaintingStartResult,
} from './painting-types.ts'

const MAX_TEXT_CHARS = 20_000
const MAX_HISTORY_PAGE = 100
const DEFAULT_SAMPLES = 1

function markPaintingRemoteMethods(service: PaintingService): void {
  const initializers: Array<(this: PaintingService) => void> = []
  for (const [method, exportName] of [
    ['catalog', 'catalog'], ['start', 'start'], ['get', 'get'], ['cancel', 'cancel'],
    ['listHistory', 'history'], ['deleteHistory', 'deleteHistory'],
  ] as const) {
    const implementation = Reflect.get(PaintingService.prototype, method) as (this: PaintingService, ...args: never[]) => unknown
    const decorator = Remote(exportName as never)
    decorator(implementation, {
      kind: 'method', name: method, static: false, private: false,
      access: { has: value => method in value, get: value => Reflect.get(value, method) as never },
      addInitializer: initializer => { initializers.push(initializer) },
      metadata: undefined,
    })
  }
  for (const initialize of initializers) initialize.call(service)
}

interface MutableJob {
  view: PaintingJobView
  controller: AbortController
  task: Promise<void>
}

function cloneJob(view: PaintingJobView): PaintingJobView {
  return structuredClone(view)
}

function assertPrompt(prompt: string): string {
  const trimmed = typeof prompt === 'string' ? prompt.trim() : ''
  if (trimmed.length === 0) throw new Error('painting prompt must not be blank')
  if (trimmed.length > MAX_TEXT_CHARS) throw new Error(`painting prompt exceeds ${MAX_TEXT_CHARS} characters`)
  return trimmed
}

function sampleCountOf(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(n) || n < 1 || n > 8) throw new Error('sampleCount must be an integer from 1 through 8')
  return n
}

/**
 * Resolve a configured provider's endpoint from settings through the same
 * authority the Models page reads.
 * @param settings - Host settings service.
 * @param llm - Host LLM service.
 * @param providerId - provider route key.
 * @returns resolved display name, endpoint, and settings identity.
 */
/** Provider profile value: a plain object with optional endpoint and key-ref. */
interface PaintingProviderProfile {
  baseURL?: unknown
  apiKeyEnv?: unknown
}

function providerProfile(settings: SettingsProvider, ns: string, path: readonly string[]): PaintingProviderProfile {
  const view = settings.describe().find(candidate => candidate.ns === ns)
  const raw = view === undefined ? undefined : getPath(view.value, path)
  return (typeof raw === 'object' && raw !== null ? raw : {}) as PaintingProviderProfile
}

/**
 * Resolve a configured provider's endpoint from settings through the same
 * authority the Models page reads.
 * @param settings - Host settings service.
 * @param llm - Host LLM service.
 * @param providerId - provider route key.
 * @returns resolved display name, endpoint, and settings identity.
 */
async function resolveProvider(
  settings: SettingsProvider,
  llm: LlmRuntime,
  providerId: string,
): Promise<{ name: string; baseURL: string; settingsNs: string; settingsPath: readonly string[] }> {
  const directory = llm.listConfigurableProviders()
  const entry = directory.find(candidate => candidate.provider === providerId)
  if (entry === undefined) throw new Error(`provider "${providerId}" has no configurable route`)
  const settingsNs = entry.settingsNs
  const settingsPath = [...entry.settingsPath]
  const baseURLValue = providerProfile(settings, settingsNs, settingsPath).baseURL
  const baseURL = typeof baseURLValue === 'string' && baseURLValue.trim().length > 0
    ? baseURLValue.trim().replace(/\/$/, '')
    : undefined
  if (baseURL === undefined) throw new Error(`provider "${providerId}" has no endpoint configured`)
  return { name: entry.displayName, baseURL, settingsNs, settingsPath }
}

/**
 * Get the provider credential value through the DSH credentials authority.
 * @param settings - Host settings service.
 * @param credentials - Host credentials service.
 * @param providerId - provider route key (diagnostic only).
 * @param ns - provider settings namespace.
 * @param path - provider settings path.
 * @returns the resolved secret value, or '' when unconfigured.
 */
async function resolveKey(
  settings: SettingsProvider,
  credentials: CredentialProvider,
  providerId: string,
  ns: string,
  path: readonly string[],
): Promise<string> {
  const refName = providerProfile(settings, ns, path).apiKeyEnv
  if (typeof refName !== 'string' || refName.length === 0) return ''
  const resolved = await credentials.resolve(refName as never)
  if (resolved === undefined) throw new Error(`provider "${providerId}" has no credential configured for ${refName}`)
  return resolved.value.trim()
}

interface GeneratedImage {
  data: Uint8Array
  mediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'
  width: number
  height: number
  name?: string
}

/** Call an OpenAI-compatible `/images/generations` endpoint and decode returned images. */
async function callImageGeneration(baseURL: string, apiKey: string, model: string, prompt: string, params: Record<string, unknown>, signal: AbortSignal, onProgress: (fraction: number) => void): Promise<GeneratedImage[]> {
  const payload: Record<string, unknown> = {
    model,
    prompt,
    ...params,
  }
  onProgress(0.2)
  const response = await fetch(`${baseURL}/images/generations`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(apiKey.length === 0 ? {} : { authorization: `Bearer ${apiKey}` }),
    },
    body: JSON.stringify(payload),
    signal,
  })
  onProgress(0.5)
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`image generation failed (HTTP ${response.status}): ${text.slice(0, 300)}`)
  }
  const body = (await response.json()) as { data?: Array<{ b64_json?: string; url?: string; revised_prompt?: string }> }
  const items = body.data ?? []
  if (items.length === 0) throw new Error('image generation returned no images')
  const images: GeneratedImage[] = []
  let fraction = 0.6
  for (const item of items) {
    const fromB64 = typeof item.b64_json === 'string' && item.b64_json.length > 0
    let bytes: Uint8Array
    if (fromB64) {
      bytes = Uint8Array.from(Buffer.from(item.b64_json as string, 'base64'))
    } else {
      const url = item.url
      if (typeof url !== 'string' || url.length === 0) throw new Error('image generation returned an item with no data')
      const fetched = await fetch(url, { signal })
      if (!fetched.ok) throw new Error(`failed to download generated image (HTTP ${fetched.status})`)
      bytes = new Uint8Array(await fetched.arrayBuffer())
    }
    const dimensions = detectDimensions(bytes)
    images.push({ data: bytes, mediaType: 'image/png', width: dimensions.width, height: dimensions.height })
    fraction += 0.4 / items.length
    onProgress(Math.min(0.95, fraction))
  }
  return images
}

/** Heuristic PNG/JPEG dimension probe for the durable ref metadata. */
function detectDimensions(bytes: Uint8Array): { width: number; height: number } {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    const width = ((bytes[16] ?? 0) << 24) | ((bytes[17] ?? 0) << 16) | ((bytes[18] ?? 0) << 8) | (bytes[19] ?? 0)
    const height = ((bytes[20] ?? 0) << 24) | ((bytes[21] ?? 0) << 16) | ((bytes[22] ?? 0) << 8) | (bytes[23] ?? 0)
    return { width: width > 0 ? width : 1024, height: height > 0 ? height : 1024 }
  }
  if (bytes.length >= 8 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] !== undefined) {
    const width = ((bytes[6] ?? 0) << 8) | (bytes[7] ?? 0)
    const height = ((bytes[4] ?? 0) << 8) | (bytes[5] ?? 0)
    return { width: width > 0 ? width : 1024, height: height > 0 ? height : 1024 }
  }
  return { width: 1024, height: 1024 }
}

/** Real implicit HTTPS proxy intended for internal fetch calls; kept for parity. */
export const PAINTING_FETCH_TIMEOUT_MS = 90_000

/** Real async image-generation jobs and durable gallery over DSH providers, credentials, and attachments. */
export class PaintingService extends Service {
  static inject = ['settings', 'credentials', 'llm', 'attachments']
  readonly typertRemote = bindTypertRemote(this, 'controlCenterPainting')

  private readonly jobs = new Map<string, MutableJob>()
  private readonly history = new Map<PaintingHistoryId, PaintingHistoryItem>()
  private accepting = true

  constructor(ctx: Context) {
    super(ctx, 'controlCenterPainting')
    markPaintingRemoteMethods(this)
    ctx.effect(() => async () => {
      this.accepting = false
      for (const job of this.jobs.values()) job.controller.abort()
      await Promise.allSettled([...this.jobs.values()].map(job => job.task))
      this.jobs.clear()
    }, 'control-center.painting: settle jobs')
  }

  async catalog(): Promise<PaintingCatalogView> {
    const llm = this.ctx.get('llm') as LlmRuntime
    const directory = llm.listConfigurableProviders()
    const models: PaintingCatalogModel[] = []
    for (const provider of directory) {
      try {
        const listed = await llm.listModels(provider.provider)
        for (const model of listed) {
          models.push({ providerId: provider.provider, id: model.id, label: model.name })
        }
      } catch {
        // A directory entry with no live route just contributes no catalog rows.
      }
    }
    return { models, errors: [] }
  }

  start(request: PaintingRequest): PaintingStartResult {
    if (!this.accepting) throw new Error('painting service is stopping')
    const resolved: PaintingRequest = {
      providerId: (request.providerId ?? '').trim(),
      model: (request.model ?? '').trim(),
      prompt: assertPrompt(request.prompt),
      params: request.params === undefined ? {} : structuredClone(request.params),
      sampleCount: sampleCountOf(request.sampleCount ?? DEFAULT_SAMPLES),
    }
    if (resolved.providerId.length === 0 || resolved.model.length === 0) throw new Error('painting provider and model are required')
    const now = Date.now()
    const jobId = `painting-${randomUUID()}`
    const controller = new AbortController()
    const view: PaintingJobView = {
      jobId,
      status: 'running',
      providerId: resolved.providerId,
      model: resolved.model,
      prompt: resolved.prompt,
      params: structuredClone(resolved.params),
      sampleCount: resolved.sampleCount,
      progress: 0,
      createdImages: [],
      createdAt: now,
      updatedAt: now,
    }
    const mutable: MutableJob = { view, controller, task: Promise.resolve() }
    this.jobs.set(jobId, mutable)
    mutable.task = this.run(mutable, resolved)
    return { jobId }
  }

  get(jobId: string): PaintingJobView {
    const job = this.jobs.get(jobId)
    if (job === undefined) throw new Error(`unknown painting job "${jobId}"`)
    return cloneJob(job.view)
  }

  cancel(jobId: string): PaintingJobView {
    const job = this.jobs.get(jobId)
    if (job === undefined) throw new Error(`unknown painting job "${jobId}"`)
    if (job.view.status === 'running') job.controller.abort()
    return cloneJob(job.view)
  }

  listHistory(cursor: string | null, limit: number): PaintingHistoryPage {
    const bounded = Math.min(MAX_HISTORY_PAGE, Math.max(1, Math.trunc(limit)))
    const ordered = [...this.history.values()].sort((left, right) => right.createdAt - left.createdAt)
    const offset = cursor === null ? 0 : Number.parseInt(cursor, 10)
    if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('invalid painting history cursor')
    const items = ordered.slice(offset, offset + bounded).map(item => structuredClone(item))
    const next = offset + items.length
    return { items, ...(next < ordered.length ? { nextCursor: String(next) } : {}) }
  }

  deleteHistory(id: PaintingHistoryId): { absent: true } {
    this.history.delete(id)
    return { absent: true }
  }

  private async run(job: MutableJob, request: PaintingRequest): Promise<void> {
    try {
      const settings = this.ctx.get('settings') as SettingsProvider
      const credentials = this.ctx.get('credentials') as CredentialProvider
      const llm = this.ctx.get('llm') as LlmRuntime
      const attachments = this.ctx.get('attachments') as AttachmentStore
      const provider = await resolveProvider(settings, llm, request.providerId)
      const apiKey = await resolveKey(settings, credentials, request.providerId, provider.settingsNs, provider.settingsPath)
      job.view.progress = 0.1
      const generated = await callImageGeneration(
        provider.baseURL, apiKey, request.model, request.prompt, request.params, job.controller.signal,
        (fraction) => { job.view.progress = fraction; job.view.updatedAt = Date.now() },
      )
      if (job.controller.signal.aborted) {
        job.view.status = 'cancelled'
        return
      }
      const refs: PaintingImageRef[] = []
      for (const image of generated.slice(0, request.sampleCount)) {
        const ref = await attachments.saveImage({
          data: image.data,
          mediaType: image.mediaType,
          name: `${request.model}.png`,
        })
        refs.push({
          attachmentId: ref.attachmentId,
          mediaType: ref.mediaType,
          bytes: ref.bytes,
          width: ref.width,
          height: ref.height,
          dataUrl: `data:${ref.mediaType};base64,${Buffer.from(image.data).toString('base64')}`,
        })
      }
      job.view.progress = 1
      job.view.createdImages = refs
      job.view.status = 'completed'
      const id = `painting-history-${randomUUID()}`
      const item: PaintingHistoryItem = {
        id,
        prompt: request.prompt,
        model: request.model,
        providerId: request.providerId,
        images: structuredClone(refs),
        createdAt: Date.now(),
      }
      this.history.set(id, item)
      job.view.historyId = id
    } catch (error) {
      job.view.status = job.controller.signal.aborted ? 'cancelled' : 'error'
      if (job.view.status === 'error') job.view.error = error instanceof Error ? error.message : String(error)
    } finally {
      job.view.updatedAt = Date.now()
    }
  }
}

export default PaintingService
