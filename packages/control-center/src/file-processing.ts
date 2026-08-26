/**
 * File processing Host service.
 *
 * The service owns the safe settings projection, credential references, host
 * capability checks, and the single dispatch path used by both RPC and the
 * model-facing `read_document` tool.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { credentialRef, isCredentialRefName } from '@deepseek-ai/dsh-credentials'
import type { CredentialProvider } from '@deepseek-ai/dsh-credentials'
import type { FileSystem, FsTarget } from '@deepseek-ai/dsh-fs'
import type { SubprocessRuntime } from '@deepseek-ai/dsh-subprocess'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { settingsNamespace, type SettingsScope } from '@deepseek-ai/dsh-settings'
import Schema from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ToolExecution } from '@deepseek-ai/dsh-tools'
import type { ContentBlock } from '@deepseek-ai/dsh-llm/types'
import { PaddleOCRClient } from '@paddleocr/api-sdk'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import { Unzip, UnzipInflate, UnzipPassThrough } from 'fflate'
import { basename, dirname, extname, join } from 'node:path'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import type {
  FileConvertRequest,
  FileConvertResult,
  FileProcessingConfigView,
  FileProcessingTaskResult,
  FileProcessingTaskStatus,
  FileProcessingTaskView,
  FileProcessorCredentialView,
  FileProcessorEntry,
  FileProcessorFeature,
  FileProcessorId,
  FileProcessorOverride,
  FileProcessorOverrideInput,
  FileProcessorOverrideView,
  FileProcessorStatus,
} from './file-processing-types.ts'
import { stripProcessorSecrets } from './file-processing-settings.ts'
import {
  isZipContentType,
  readBoundedResponseBytes,
  readBoundedResponseJson,
  sanitizeRemoteStorageUrl,
  sanitizeSignedUploadHeaders,
} from './file-processing-url-policy.ts'
import {
  canResumeRemoteTask,
  FileProcessingTaskStore,
  taskView,
  type FileProcessingTaskRecord,
} from './file-processing-tasks.ts'

const FP_NAMESPACE = settingsNamespace('control-center-file-processing')
const MAX_TEXT_BYTES = 8 * 1024 * 1024
const MAX_IMAGE_BYTES = 50 * 1024 * 1024
const MAX_DOCUMENT_BYTES = 200 * 1024 * 1024
const MAX_ZIP_BYTES = 200 * 1024 * 1024
const MAX_ZIP_ENTRIES = 2_000
const MAX_MARKDOWN_BYTES = 20 * 1024 * 1024
const MAX_PROVIDER_JSON_BYTES = 1 * 1024 * 1024
const TESSERACT_GRACE_MS = 3_000

const REMOTE_DOCUMENT_PROCESSORS = new Set<FileProcessorId>(['paddleocr', 'mineru', 'doc2x'])

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'json', 'ts', 'tsx', 'js', 'jsx', 'css', 'html', 'yaml', 'yml',
  'toml', 'py', 'go', 'rs', 'c', 'cpp', 'h', 'sh', 'sql', 'xml', 'csv',
])

const IMAGE_MEDIA_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  tif: 'image/tiff',
  tiff: 'image/tiff',
}

const CATALOG: Omit<FileProcessorEntry, 'status'>[] = [
  {
    id: 'system', name: 'System OCR', description: 'Uses the operating system OCR runtime when the desktop bridge supplies one.',
    apiKeyWebsite: null, features: ['image_to_text'], requiresApiKey: false,
    languageOptions: ['auto', 'en', 'zh-Hans', 'ja', 'ko', 'fr', 'de', 'es'],
  },
  {
    id: 'tesseract', name: 'Tesseract', description: 'Runs the locally installed Tesseract executable.',
    apiKeyWebsite: null, features: ['image_to_text'], requiresApiKey: false,
    languageOptions: ['auto', 'eng', 'chi_sim', 'jpn', 'kor', 'fra', 'deu', 'spa'],
  },
  {
    id: 'paddleocr', name: 'PaddleOCR', description: 'PaddleOCR cloud OCR and document parsing service.',
    apiKeyWebsite: 'https://aistudio.baidu.com/paddleocr/', features: ['image_to_text', 'document_to_markdown'], requiresApiKey: true,
    apiHostDefaults: { image_to_text: 'https://paddleocr.aistudio-app.com/', document_to_markdown: 'https://paddleocr.aistudio-app.com/' },
    modelDefaults: { image_to_text: 'PP-OCRv6', document_to_markdown: 'PaddleOCR-VL-1.6' },
    languageOptions: ['auto', 'ch', 'en', 'japan', 'korean', 'france', 'german', 'spanish'],
  },
  {
    id: 'local-paddleocr', name: 'Local PaddleOCR', description: 'Requires the desktop-local PaddleOCR model runtime.',
    apiKeyWebsite: null, features: ['image_to_text'], requiresApiKey: false, requiresLocalModel: true,
    languageOptions: ['auto', 'ch', 'en', 'japan', 'korean'],
  },
  {
    id: 'ovocr', name: 'OpenVINO OCR', description: 'Legacy OpenVINO OCR selection. It remains readable but has no DSH runtime adapter yet.',
    apiKeyWebsite: null, features: ['image_to_text'], requiresApiKey: false,
    languageOptions: ['auto', 'en', 'ch'],
  },
  {
    id: 'mistral', name: 'Mistral OCR', description: 'Mistral OCR for images and documents.',
    apiKeyWebsite: 'https://mistral.ai/api-keys', features: ['image_to_text', 'document_to_markdown'], requiresApiKey: true,
    apiHostDefaults: { image_to_text: 'https://api.mistral.ai', document_to_markdown: 'https://api.mistral.ai' },
    modelDefaults: { image_to_text: 'mistral-ocr-latest', document_to_markdown: 'mistral-ocr-latest' }, languageOptions: ['auto'],
  },
  {
    id: 'local-document', name: 'Local Document', description: 'Reads text files and extracts the text layer from PDF documents locally.',
    apiKeyWebsite: null, features: ['document_to_markdown'], requiresApiKey: false, languageOptions: [],
  },
  {
    id: 'mineru', name: 'MinerU', description: 'OpenDataLab document extraction service.',
    apiKeyWebsite: 'https://mineru.net/apiManage', features: ['document_to_markdown'], requiresApiKey: true,
    apiHostDefaults: { document_to_markdown: 'https://mineru.net' }, modelDefaults: { document_to_markdown: 'pipeline' }, languageOptions: [],
  },
  {
    id: 'doc2x', name: 'Doc2X', description: 'Document restoration and Markdown conversion service.',
    apiKeyWebsite: 'https://open.noedgeai.com/apiKeys', features: ['document_to_markdown'], requiresApiKey: true,
    apiHostDefaults: { document_to_markdown: 'https://v2.doc2x.noedgeai.com' }, modelDefaults: { document_to_markdown: 'v3-2026' }, languageOptions: [],
  },
  {
    id: 'open-mineru', name: 'Open MinerU', description: 'Self-hosted MinerU document parser.',
    apiKeyWebsite: 'https://github.com/opendatalab/MinerU/', features: ['document_to_markdown'], requiresApiKey: false,
    apiHostDefaults: { document_to_markdown: 'http://127.0.0.1:8000' }, languageOptions: [],
  },
]

interface FileProcessingSettings {
  defaultDocumentProcessor: FileProcessorId
  defaultImageProcessor: FileProcessorId
  overrides: Partial<Record<FileProcessorId, FileProcessorOverride>>
}

interface ResolvedInput {
  target: FsTarget
  path: string
  bytes: number
  extension: string
  feature: FileProcessorFeature
}

type RemotePollOutcome =
  | { kind: 'pending'; progress: number; stage?: string }
  | { kind: 'completed'; text: string }
  | { kind: 'failed'; error: string }

function mergeOverride(current: FileProcessorOverride | undefined, patch: FileProcessorOverrideInput): FileProcessorOverride {
  return {
    ...current,
    ...patch,
    ...(patch.capabilities === undefined ? {} : { capabilities: { ...current?.capabilities, ...patch.capabilities } }),
    ...(patch.options === undefined ? {} : { options: { ...current?.options, ...patch.options } }),
  }
}

function capabilityConfig(
  entry: Omit<FileProcessorEntry, 'status'>,
  override: FileProcessorOverride | undefined,
  feature: FileProcessorFeature,
): { apiHost: string; modelId: string } {
  const current = override?.capabilities?.[feature]
  return {
    apiHost: (current?.apiHost ?? override?.apiHost ?? entry.apiHostDefaults?.[feature] ?? '').trim(),
    modelId: (current?.modelId ?? override?.model ?? entry.modelDefaults?.[feature] ?? '').trim(),
  }
}

function featureForExtension(extension: string): FileProcessorFeature {
  return IMAGE_MEDIA_TYPES[extension] === undefined ? 'document_to_markdown' : 'image_to_text'
}

function isSupported(entry: Omit<FileProcessorEntry, 'status'>, feature: FileProcessorFeature): boolean {
  return entry.features.includes(feature)
}

function entryFor(id: FileProcessorId): Omit<FileProcessorEntry, 'status'> {
  const entry = CATALOG.find(candidate => candidate.id === id)
  if (entry === undefined) throw new Error(`Unknown file processor: ${id}`)
  return entry
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message
    .replace(/Bearer\s+[^\s,;]+/giu, 'Bearer [redacted]')
    .replace(/https?:\/\/[^\s,;]+/giu, '[redacted-url]')
    .slice(0, 500)
}

function mimeFor(extension: string): string {
  const mime = IMAGE_MEDIA_TYPES[extension]
  if (mime === undefined) throw new Error(`Unsupported image type: .${extension}`)
  return mime
}

function parseMistralPages(payload: unknown): string {
  const pages = typeof payload === 'object' && payload !== null ? (payload as { pages?: unknown }).pages : undefined
  if (!Array.isArray(pages)) throw new Error('Mistral OCR response does not contain pages')
  const text = pages.flatMap(page => typeof page === 'object' && page !== null && typeof (page as { markdown?: unknown }).markdown === 'string'
    ? [(page as { markdown: string }).markdown.trim()]
    : []).filter(Boolean).join('\n\n').trim()
  if (text === '') throw new Error('Mistral OCR returned no text')
  return text
}

function blobOf(bytes: Uint8Array): Blob {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return new Blob([copy.buffer])
}

function isTerminalTaskStatus(status: FileProcessingTaskStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled' || status === 'interrupted'
}

function taskArtifactFileName(taskId: string): string {
  if (!/^file-processing-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(taskId)) {
    throw new Error('Invalid file processing task id')
  }
  return `${taskId}.md`
}

function deadlineSignal(record: FileProcessingTaskRecord, signal: AbortSignal): AbortSignal {
  const remainingMs = Date.parse(record.deadlineAt) - Date.now()
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
    throw new Error('Remote document task exceeded its deadline.')
  }
  return AbortSignal.any([signal, AbortSignal.timeout(remainingMs)])
}

function waitWithSignal(delayMs: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, delayMs)
    const onAbort = (): void => {
      clearTimeout(timer)
      signal.removeEventListener('abort', onAbort)
      reject(signal.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError'))
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

function safeZipMarkdown(bytes: Uint8Array): string {
  if (bytes.byteLength > MAX_ZIP_BYTES) throw new Error('Document archive exceeds the compressed size limit')
  let entries = 0
  let selected: Uint8Array | undefined
  let selectedError: unknown
  const unzipper = new Unzip(file => {
    entries += 1
    if (entries > MAX_ZIP_ENTRIES) {
      selectedError = new Error('Document archive has too many entries')
      file.terminate()
      return
    }
    const name = file.name
    if (name.startsWith('/') || name.includes('\\') || name.split('/').some(segment => segment === '..')) {
      selectedError = new Error('Document archive contains an unsafe entry path')
      file.terminate()
      return
    }
    if (!name.toLowerCase().endsWith('.md') || selected !== undefined) return
    if (file.originalSize !== undefined && file.originalSize > MAX_MARKDOWN_BYTES) {
      selectedError = new Error('Document Markdown exceeds the output size limit')
      file.terminate()
      return
    }
    const chunks: Uint8Array[] = []
    let total = 0
    file.ondata = (error, chunk, final) => {
      if (error !== null) {
        selectedError = error
        return
      }
      total += chunk.byteLength
      if (total > MAX_MARKDOWN_BYTES) {
        selectedError = new Error('Document Markdown exceeds the output size limit')
        file.terminate()
        return
      }
      chunks.push(chunk)
      if (!final) return
      const merged = new Uint8Array(total)
      let offset = 0
      for (const part of chunks) {
        merged.set(part, offset)
        offset += part.byteLength
      }
      selected = merged
    }
    file.start()
  })
  unzipper.register(UnzipPassThrough)
  unzipper.register(UnzipInflate)
  unzipper.push(bytes, true)
  if (selectedError !== undefined) throw selectedError
  if (selected === undefined) throw new Error('Document archive does not contain a Markdown file')
  const text = new TextDecoder('utf-8', { fatal: true }).decode(selected).trim()
  if (text === '') throw new Error('Document archive contains empty Markdown output')
  return text
}

/** File processing service mounted by the Control Center host plugin. */
export class FileProcessingService extends Service {
  readonly typertRemote = bindTypertRemote(this, 'controlCenterFileProcessing')
  private readonly scope: SettingsScope<FileProcessingSettings>
  private taskStore: FileProcessingTaskStore | undefined
  private readonly taskControllers = new Map<string, AbortController>()
  private readonly taskRuns = new Map<string, Promise<void>>()
  private readonly taskSubmissions = new Map<string, Promise<void>>()

  constructor(ctx: Context, _config?: { logger?: Context['logger'] }) {
    super(ctx, 'controlCenterFileProcessing')
    this.scope = ctx.settings.register(FP_NAMESPACE, Schema.object({
      defaultDocumentProcessor: Schema.union(['local-document', 'mineru', 'paddleocr', 'doc2x', 'mistral', 'open-mineru']).default('local-document'),
      defaultImageProcessor: Schema.union(['system', 'tesseract', 'paddleocr', 'local-paddleocr', 'ovocr', 'mistral']).default('tesseract'),
      overrides: Schema.dict(Schema.any()).default({}),
    }), {
      base: { defaultDocumentProcessor: 'local-document', defaultImageProcessor: 'tesseract', overrides: {} },
    })
    void this.migrateLegacySecrets()
    this.registerTool()
    const taskStoreFiber = ctx.inject(['storageDomain'], storageCtx => {
      const opening = this.startTaskStore(storageCtx).catch(error => {
        this.ctx.logger.warn(`File processing task store failed to start: ${safeError(error)}`)
        return undefined
      })
      storageCtx.effect(() => async () => {
        const store = await opening
        if (store === undefined || this.taskStore !== store) return
        await this.stopTaskRuns()
        this.taskStore = undefined
        await store.close()
      }, 'control-center.file-processing: close task store binding')
    })
    ctx.effect(() => () => taskStoreFiber.dispose(), 'control-center.file-processing: dispose task store binding')
    ctx.effect(() => async () => {
      await this.stopTaskRuns()
      await taskStoreFiber.dispose()
      const store = this.taskStore
      this.taskStore = undefined
      await store?.close()
    }, 'control-center.file-processing: settle tasks')
  }

  private async stopTaskRuns(): Promise<void> {
    for (const controller of this.taskControllers.values()) controller.abort()
    await Promise.allSettled([...this.taskRuns.values(), ...this.taskSubmissions.values()])
    this.taskControllers.clear()
    this.taskRuns.clear()
    this.taskSubmissions.clear()
  }

  private async startTaskStore(ctx: Context): Promise<FileProcessingTaskStore> {
    if (this.taskStore !== undefined) return this.taskStore
    const store = await FileProcessingTaskStore.open(ctx)
    this.taskStore = store
    for (const record of store.list()) {
      const submissionWasInterrupted = record.status === 'queued'
        || (record.status === 'running' && record.providerTaskId === undefined)
      if (submissionWasInterrupted) {
        await store.update(record.id, current => ({
          ...current,
          status: 'interrupted',
          updatedAt: new Date().toISOString(),
          error: 'The host restarted while this remote provider request was being submitted. Start a new document task.',
        }))
        continue
      }
      if (canResumeRemoteTask(record)) this.resumeRemoteTask(record)
    }
    return store
  }

  private requireTaskStore(): FileProcessingTaskStore {
    if (this.taskStore === undefined) {
      throw new Error('Remote document processing is unavailable until the DSH storage-domain runtime is ready')
    }
    return this.taskStore
  }

  private taskArtifactPath(taskId: string): string {
    return join(resolveDshHome(), 'file-processing', 'results', taskArtifactFileName(taskId))
  }

  private async readTaskArtifact(record: FileProcessingTaskRecord): Promise<string | undefined> {
    const expectedPath = this.taskArtifactPath(record.id)
    if (record.status !== 'completed' || record.artifactPath !== expectedPath) return undefined
    try {
      return await readFile(expectedPath, 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
      throw error
    }
  }

  private credentials(): CredentialProvider {
    const credentials = this.ctx.get('credentials') as CredentialProvider | undefined
    if (credentials === undefined) throw new Error('File processing credentials are unavailable in this runtime')
    return credentials
  }

  private fileSystem(): FileSystem {
    const fs = this.ctx.get('fs') as FileSystem | undefined
    if (fs === undefined) throw new Error('File processing requires the DSH filesystem service')
    return fs
  }

  private subprocess(): SubprocessRuntime | undefined {
    return this.ctx.get('subprocess') as SubprocessRuntime | undefined
  }

  private credentialRef(processor: FileProcessorId, slot: number): string {
    return `CC_FILE_PROCESSING_${processor.toUpperCase().replace(/-/g, '_')}_API_KEY_${slot + 1}`
  }

  private refsFor(processor: FileProcessorId, override: FileProcessorOverride | undefined): string[] {
    if (override?.credentialRefs !== undefined) {
      return override.credentialRefs.filter((ref): ref is string => typeof ref === 'string' && isCredentialRefName(ref))
    }
    return [this.credentialRef(processor, 0)]
  }

  private async migrateLegacySecrets(): Promise<void> {
    if (this.ctx.get('credentials') === undefined) return
    const current = this.scope.get()
    let changed = false
    const overrides: Partial<Record<FileProcessorId, FileProcessorOverride>> = { ...current.overrides }
    for (const [rawProcessor, rawOverride] of Object.entries(current.overrides)) {
      const processor = rawProcessor as FileProcessorId
      const legacy = rawOverride?.apiKeys?.filter(value => typeof value === 'string' && value.trim() !== '') ?? []
      if (legacy.length === 0) continue
      const refs = legacy.map((_, index) => this.credentialRef(processor, index))
      for (const [index, value] of legacy.entries()) {
        await this.credentials().set(credentialRef(refs[index]!), value.trim())
      }
      const { apiKeys: _apiKeys, ...safe } = rawOverride
      overrides[processor] = { ...safe, credentialRefs: refs }
      changed = true
    }
    if (changed) await this.scope.update({ overrides })
  }

  private async credentialViews(processor: FileProcessorId, override: FileProcessorOverride | undefined): Promise<FileProcessorCredentialView[]> {
    const entry = entryFor(processor)
    if (!entry.requiresApiKey) return []
    const credentials = this.ctx.get('credentials') as CredentialProvider | undefined
    if (credentials === undefined) {
      return this.refsFor(processor, override).map(ref => ({ ref, configured: false, writable: false }))
    }
    return Promise.all(this.refsFor(processor, override).map(async ref => {
      const info = await credentials.describe(credentialRef(ref))
      return { ref, configured: info.configured, writable: info.writable, ...(info.source === undefined ? {} : { source: info.source }) }
    }))
  }

  private async resolveApiKeyRef(
    processor: FileProcessorId,
    override: FileProcessorOverride | undefined,
  ): Promise<{ ref: string; value: string }> {
    for (const ref of this.refsFor(processor, override)) {
      const resolved = await this.credentials().resolve(credentialRef(ref))
      if (resolved?.value.trim()) return { ref, value: resolved.value.trim() }
    }
    throw new Error(`${entryFor(processor).name} requires an API key in Settings > Document Processing / OCR`)
  }

  private async resolveApiKey(processor: FileProcessorId, override: FileProcessorOverride | undefined): Promise<string> {
    return (await this.resolveApiKeyRef(processor, override)).value
  }

  private async resolveTaskApiKey(record: FileProcessingTaskRecord): Promise<string> {
    if (record.credentialRef === undefined) {
      throw new Error(`${entryFor(record.processor).name} task has no credential reference; start a new task`)
    }
    const resolved = await this.credentials().resolve(credentialRef(record.credentialRef))
    if (resolved?.value.trim()) return resolved.value.trim()
    throw new Error(`${entryFor(record.processor).name} task credential is no longer configured`)
  }

  private async statusFor(entry: Omit<FileProcessorEntry, 'status'>, feature: FileProcessorFeature): Promise<FileProcessorStatus> {
    if (!isSupported(entry, feature)) return { code: 'unavailable', message: 'This processor does not support the selected feature.' }
    if (entry.id === 'ovocr') return { code: 'unavailable', message: 'OpenVINO OCR has no DSH runtime adapter yet.' }
    if (entry.id === 'system') return { code: 'needs-runtime', message: 'System OCR requires the desktop native OCR bridge.' }
    if (entry.id === 'local-paddleocr') return { code: 'needs-runtime', message: 'Local PaddleOCR requires the desktop model runtime.' }
    if (entry.id === 'tesseract') {
      const subprocess = this.subprocess()
      if (subprocess === undefined) return { code: 'needs-runtime', message: 'Tesseract requires the DSH subprocess service.' }
      try {
        await subprocess.resolveExecutable('tesseract')
        return { code: 'ready', message: 'Tesseract is available.' }
      } catch {
        return { code: 'needs-runtime', message: 'Install Tesseract and make it available on PATH.' }
      }
    }
    if (entry.requiresApiKey) {
      const override = this.scope.get().overrides[entry.id]
      const configured = (await this.credentialViews(entry.id, override)).some(view => view.configured)
      if (!configured) return { code: 'needs-credential', message: 'Add an API key to enable this processor.' }
      if (REMOTE_DOCUMENT_PROCESSORS.has(entry.id) && this.taskStore === undefined) {
        return { code: 'needs-runtime', message: 'The durable document task runtime is still starting.' }
      }
      return { code: 'ready', message: 'Credential configured.' }
    }
    if (entry.id === 'open-mineru') {
      return { code: 'ready', message: 'Self-hosted endpoint will be checked when processing starts.' }
    }
    return { code: 'ready', message: 'Available.' }
  }

  private async catalogView(): Promise<FileProcessorEntry[]> {
    return Promise.all(CATALOG.map(async entry => {
      const statuses = await Promise.all(entry.features.map(async feature => [feature, await this.statusFor(entry, feature)] as const))
      return { ...entry, status: Object.fromEntries(statuses) }
    }))
  }

  private registerTool(): void {
    const tools = this.ctx.get('tools')
    if (tools === undefined) return
    const readDisposer = tools.register(defineTool({
      name: 'read_document',
      description: 'Read a local text document, extract a PDF text layer, or OCR an image using the configured document-processing provider. Some remote document parsers return a task id; then use read_document_task to collect the result.',
      parameters: { path: { type: 'string', required: true, description: 'Path to the file to process.' } },
      output: {
        schema: {
          type: 'object', additionalProperties: false,
          properties: {
            path: { type: 'string', required: true },
            processor: { type: 'string', required: true },
            text: { type: 'string', required: true },
            taskId: { type: 'string' },
          },
        },
        render: (_args, value): ContentBlock[] => [{ type: 'text', text: value.text as string || '(empty file)' }],
      },
      execute: async (args: { path: string }, exec) => {
        const result = await this.convertPath(args.path, undefined, exec)
        return {
          path: result.path,
          processor: result.processor,
          text: result.text,
          ...(result.taskId === undefined ? {} : { taskId: result.taskId }),
        }
      },
    }))
    const taskDisposer = tools.register(defineTool({
      name: 'read_document_task',
      description: 'Read the status or completed Markdown output of a remote document-processing task returned by read_document.',
      parameters: { task_id: { type: 'string', required: true, description: 'Task id returned by read_document.' } },
      output: {
        schema: {
          type: 'object', additionalProperties: false,
          properties: {
            taskId: { type: 'string', required: true },
            status: { type: 'string', required: true },
            text: { type: 'string', required: true },
          },
        },
        render: (_args, value): ContentBlock[] => [{ type: 'text', text: value.text as string }],
      },
      execute: async (args: { task_id: string }) => {
        const result = await this.getTaskResult(args.task_id)
        const text = result.text ?? `[document task ${result.task.taskId}: ${result.task.status}${result.task.detail === undefined ? '' : `, ${result.task.detail}`}]`
        return { taskId: result.task.taskId, status: result.task.status, text }
      },
    }))
    this.ctx.effect(() => () => { readDisposer(); taskDisposer() })
  }

  async listProcessors(): Promise<FileProcessorEntry[]> {
    return this.catalogView()
  }

  async getConfig(): Promise<FileProcessingConfigView> {
    const current = this.scope.get()
    const overrides: Partial<Record<FileProcessorId, FileProcessorOverrideView>> = {}
    const credentials: Partial<Record<FileProcessorId, FileProcessorCredentialView[]>> = {}
    for (const entry of CATALOG) {
      const override = current.overrides[entry.id]
      const safe = stripProcessorSecrets(override)
      if (safe !== undefined) overrides[entry.id] = safe
      const views = await this.credentialViews(entry.id, override)
      if (views.length > 0) credentials[entry.id] = views
    }
    return {
      defaultDocumentProcessor: current.defaultDocumentProcessor,
      defaultImageProcessor: current.defaultImageProcessor,
      overrides,
      credentials,
    }
  }

  async setDefault(feature: FileProcessorFeature, processor: FileProcessorId): Promise<{ absent: true }> {
    const entry = entryFor(processor)
    if (!isSupported(entry, feature)) throw new Error(`${entry.name} does not support ${feature}`)
    const status = await this.statusFor(entry, feature)
    if (status.code !== 'ready') throw new Error(status.message)
    await this.scope.update(feature === 'image_to_text'
      ? { defaultImageProcessor: processor }
      : { defaultDocumentProcessor: processor })
    return { absent: true }
  }

  async setOverride(processor: FileProcessorId, override: FileProcessorOverrideInput): Promise<{ absent: true }> {
    entryFor(processor)
    const current = this.scope.get()
    await this.scope.update({ overrides: { ...current.overrides, [processor]: mergeOverride(current.overrides[processor], override) } })
    return { absent: true }
  }

  async setApiKey(processor: FileProcessorId, slot: number, value: string): Promise<{ absent: true }> {
    if (!Number.isSafeInteger(slot) || slot < 0) throw new Error('API key slot must be a non-negative integer')
    if (value.trim() === '') throw new Error('API key cannot be empty')
    if (!entryFor(processor).requiresApiKey) throw new Error(`${processor} does not use an API key`)
    const current = this.scope.get()
    const existing = this.refsFor(processor, current.overrides[processor])
    const refs = [...existing]
    while (refs.length <= slot) refs.push(this.credentialRef(processor, refs.length))
    await this.credentials().set(credentialRef(refs[slot]!), value.trim())
    const { apiKeys: _apiKeys, ...safe } = current.overrides[processor] ?? {}
    await this.scope.update({ overrides: { ...current.overrides, [processor]: { ...safe, credentialRefs: refs } } })
    return { absent: true }
  }

  async clearApiKey(processor: FileProcessorId, slot: number): Promise<{ absent: true }> {
    if (!Number.isSafeInteger(slot) || slot < 0) throw new Error('API key slot must be a non-negative integer')
    const current = this.scope.get()
    const refs = this.refsFor(processor, current.overrides[processor])
    const ref = refs[slot]
    if (ref === undefined) return { absent: true }
    await this.credentials().unset(credentialRef(ref))
    return { absent: true }
  }

  async convert(request: FileConvertRequest): Promise<FileConvertResult> {
    const result = await this.convertPath(request.path, request.processor)
    return { processor: result.processor, feature: result.feature, text: result.text, bytes: result.bytes, ...(result.taskId === undefined ? {} : { taskId: result.taskId }) }
  }

  async listTasks(): Promise<FileProcessingTaskView[]> {
    return this.requireTaskStore().list().map(taskView)
  }

  async getTask(taskId: string): Promise<FileProcessingTaskView> {
    const record = this.requireTaskStore().get(taskId)
    if (record === undefined) throw new Error(`Unknown file processing task: ${taskId}`)
    return taskView(record)
  }

  async getTaskResult(taskId: string): Promise<FileProcessingTaskResult> {
    const record = this.requireTaskStore().get(taskId)
    if (record === undefined) throw new Error(`Unknown file processing task: ${taskId}`)
    if (record.artifactPath === undefined) return { task: taskView(record) }
    const text = await this.readTaskArtifact(record)
    return text === undefined ? { task: taskView(record) } : { task: taskView(record), text }
  }

  async cancelTask(taskId: string): Promise<FileProcessingTaskView> {
    const store = this.requireTaskStore()
    const current = store.get(taskId)
    if (current === undefined) throw new Error(`Unknown file processing task: ${taskId}`)
    const updated = await store.update(taskId, task => {
      if (isTerminalTaskStatus(task.status)) return task
      return {
        ...task,
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
        error: 'Cancelled by user',
      }
    })
    if (updated.status === 'cancelled') {
      this.taskControllers.get(taskId)?.abort(new DOMException('Task cancelled', 'AbortError'))
    }
    return taskView(updated)
  }

  private async convertPath(path: string, requestedProcessor?: FileProcessorId, exec?: ToolExecution): Promise<ResolvedInput & FileConvertResult> {
    const input = await this.resolveInput(path, exec)
    const settings = this.scope.get()
    const processor = requestedProcessor ?? (input.feature === 'image_to_text'
      ? settings.defaultImageProcessor
      : settings.defaultDocumentProcessor)
    const entry = entryFor(processor)
    if (!isSupported(entry, input.feature)) throw new Error(`${entry.name} does not support .${input.extension} files`)
    const status = await this.statusFor(entry, input.feature)
    if (status.code !== 'ready') throw new Error(status.message)
    const result = await this.dispatch(input, processor, settings.overrides[processor], exec?.signal)
    return { ...input, ...result }
  }

  private async resolveInput(path: string, exec?: ToolExecution): Promise<ResolvedInput> {
    const fs = this.fileSystem()
    const cwd = exec?.agent?.session.header.cwd
    const target = await fs.resolve(path, exec === undefined
      ? undefined
      : { ...(cwd === undefined ? {} : { cwd }), signal: exec.signal })
    if (exec === undefined) {
      const home = await fs.resolve(resolveDshHome())
      if (!fs.contains(home, target)) {
        throw new Error('File processing RPC only accepts files inside the DSH home')
      }
    }
    const info = await fs.stat(target, exec?.signal)
    if (info === undefined) throw new Error(`File not found: ${target.displayPath}`)
    if (info.type !== 'file') throw new Error(`Not a regular file: ${target.displayPath}`)
    const extension = extname(target.displayPath).slice(1).toLowerCase()
    if (extension === '') throw new Error('File type cannot be determined from its extension')
    const feature = featureForExtension(extension)
    const maxBytes = feature === 'image_to_text' ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES
    if (info.size !== undefined && info.size > maxBytes) throw new Error(`File exceeds the ${maxBytes}-byte processing limit`)
    return { target, path: target.displayPath, bytes: info.size ?? 0, extension, feature }
  }

  private async dispatch(
    input: ResolvedInput,
    processor: FileProcessorId,
    override: FileProcessorOverride | undefined,
    signal?: AbortSignal,
  ): Promise<FileConvertResult> {
    switch (processor) {
      case 'local-document':
        return this.localDocument(input, signal)
      case 'tesseract':
        return this.tesseract(input, override, signal)
      case 'mistral':
        return this.mistral(input, override, signal)
      case 'paddleocr':
        if (input.feature === 'document_to_markdown') return this.startRemoteDocumentTask(input, processor, override, signal)
        return this.paddleOcr(input, override, signal)
      case 'open-mineru':
        return this.openMineru(input, override, signal)
      case 'mineru':
      case 'doc2x':
        return this.startRemoteDocumentTask(input, processor, override, signal)
      case 'system':
      case 'local-paddleocr':
      case 'ovocr':
        throw new Error((await this.statusFor(entryFor(processor), input.feature)).message)
    }
  }

  private async startRemoteDocumentTask(
    input: ResolvedInput,
    processor: Extract<FileProcessorId, 'paddleocr' | 'mineru' | 'doc2x'>,
    override: FileProcessorOverride | undefined,
    signal?: AbortSignal,
  ): Promise<FileConvertResult> {
    const store = this.requireTaskStore()
    const config = capabilityConfig(entryFor(processor), override, 'document_to_markdown')
    if (config.apiHost === '') throw new Error(`${entryFor(processor).name} requires an API endpoint`)

    const credential = await this.resolveApiKeyRef(processor, override)
    const createdAt = new Date().toISOString()
    const taskId = `file-processing-${randomUUID()}`
    const record: FileProcessingTaskRecord = {
      id: taskId,
      processor,
      feature: 'document_to_markdown',
      sourcePath: input.path,
      sourceName: basename(input.path),
      sourceBytes: input.bytes,
      apiHost: config.apiHost,
      modelId: config.modelId,
      credentialRef: credential.ref,
      stage: 'submitting',
      status: 'queued',
      progress: 0,
      createdAt,
      updatedAt: createdAt,
      deadlineAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      attempts: 0,
    }
    await store.put(record)

    const controller = new AbortController()
    // A durable task outlives the tool/RPC invocation that created it. Only
    // reject an already-cancelled invocation before publishing the task; do not
    // bind the task controller to the caller's short-lived execution signal.
    if (signal?.aborted) {
      controller.abort(signal.reason)
      await store.update(taskId, current => ({
        ...current,
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
        error: 'Cancelled before remote submission started',
      }))
    }
    this.taskControllers.set(taskId, controller)
    const run = this.submitAndRunTask(taskId, input.target, credential.value, store, controller.signal).finally(() => {
      this.taskControllers.delete(taskId)
      this.taskRuns.delete(taskId)
      this.taskSubmissions.delete(taskId)
    })
    this.taskSubmissions.set(taskId, run)
    return { processor, feature: input.feature, text: `[document processing task started: ${taskId}]`, bytes: input.bytes, taskId }
  }

  private async submitAndRunTask(
    taskId: string,
    source: FsTarget,
    key: string,
    store: FileProcessingTaskStore,
    signal: AbortSignal,
  ): Promise<void> {
    try {
      const current = store.get(taskId)
      if (current === undefined || isTerminalTaskStatus(current.status)) return
      const submitting = await store.update(taskId, record => {
        if (isTerminalTaskStatus(record.status)) return record
        return {
          ...record,
          status: 'running',
          stage: 'submitting',
          attempts: record.attempts + 1,
          updatedAt: new Date().toISOString(),
          error: undefined,
        }
      })
      if (isTerminalTaskStatus(submitting.status)) return
      const operationSignal = deadlineSignal(submitting, signal)
      const submitted = await this.submitRemoteTask(submitting, source, key, operationSignal)
      const running = await store.update(taskId, record => {
        if (isTerminalTaskStatus(record.status)) return record
        return {
          ...record,
          providerTaskId: submitted.providerTaskId,
          stage: submitted.stage,
          status: 'running',
          updatedAt: new Date().toISOString(),
          error: undefined,
        }
      })
      if (running.status !== 'running' || running.providerTaskId === undefined) return
      await this.runRemoteTask(taskId, store, signal)
    } catch (error) {
      if (signal.aborted) {
        const current = store.get(taskId)
        if (current !== undefined && current.status === 'cancelled') return
      }
      await this.markTaskFailed(store, taskId, safeError(error))
    }
  }

  private startTaskRun(taskId: string): void {
    if (this.taskRuns.has(taskId) || this.taskSubmissions.has(taskId)) return
    const store = this.requireTaskStore()
    const record = store.get(taskId)
    if (record === undefined || isTerminalTaskStatus(record.status)) return
    const controller = new AbortController()
    this.taskControllers.set(taskId, controller)
    const run = this.runRemoteTask(taskId, store, controller.signal).finally(() => {
      this.taskControllers.delete(taskId)
      this.taskRuns.delete(taskId)
    })
    this.taskRuns.set(taskId, run)
  }

  private resumeRemoteTask(record: FileProcessingTaskRecord): void {
    if (canResumeRemoteTask(record)) this.startTaskRun(record.id)
  }

  private async markTaskFailed(store: FileProcessingTaskStore, taskId: string, error: string): Promise<void> {
    await store.update(taskId, current => {
      if (isTerminalTaskStatus(current.status)) return current
      return {
        ...current,
        status: 'failed',
        updatedAt: new Date().toISOString(),
        error: error.slice(0, 500),
      }
    })
  }

  private async completeTask(
    store: FileProcessingTaskStore,
    record: FileProcessingTaskRecord,
    text: string,
  ): Promise<void> {
    if (Date.parse(record.deadlineAt) <= Date.now()) {
      await this.markTaskFailed(store, record.id, 'Remote document task exceeded its deadline.')
      return
    }
    const artifactPath = this.taskArtifactPath(record.id)
    const beforeCommit = store.get(record.id)
    if (beforeCommit === undefined || isTerminalTaskStatus(beforeCommit.status)) return

    await mkdir(dirname(artifactPath), { recursive: true })
    try {
      await writeFile(artifactPath, text, { encoding: 'utf8', flag: 'wx' })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    }
    const committed = await store.update(record.id, current => {
      if (isTerminalTaskStatus(current.status) || Date.parse(current.deadlineAt) <= Date.now()) return current
      return {
        ...current,
        status: 'completed',
        progress: 100,
        updatedAt: new Date().toISOString(),
        stage: 'completed',
        artifactPath,
        error: undefined,
      }
    })
    if (committed.status !== 'completed') {
      await rm(artifactPath, { force: true }).catch(() => undefined)
      if (Date.parse(committed.deadlineAt) <= Date.now()) {
        await this.markTaskFailed(store, record.id, 'Remote document task exceeded its deadline.')
      }
    }
  }

  private async runRemoteTask(taskId: string, store: FileProcessingTaskStore, signal: AbortSignal): Promise<void> {
    let record = store.get(taskId)
    if (record === undefined || isTerminalTaskStatus(record.status)) return
    try {
      if (record.providerTaskId === undefined) return
      while (!signal.aborted) {
        const latest = store.get(taskId)
        if (latest === undefined || isTerminalTaskStatus(latest.status)) return
        const operationSignal = deadlineSignal(latest, signal)
        const outcome = await this.pollRemoteTask(latest, store, operationSignal)
        if (outcome.kind === 'pending') {
          const updated = await store.update(taskId, current => {
            if (isTerminalTaskStatus(current.status)) return current
            return {
              ...current,
              status: 'running',
              stage: outcome.stage ?? current.stage,
              progress: outcome.progress,
              updatedAt: new Date().toISOString(),
            }
          })
          if (isTerminalTaskStatus(updated.status)) return
          await waitWithSignal(Math.min(1_500, Math.max(1, Date.parse(updated.deadlineAt) - Date.now())), deadlineSignal(updated, signal))
          continue
        }
        if (outcome.kind === 'failed') {
          await this.markTaskFailed(store, taskId, outcome.error)
          return
        }
        await this.completeTask(store, latest, outcome.text)
        return
      }
    } catch (error) {
      if (signal.aborted) return
      const latest = store.get(taskId)
      const message = latest !== undefined && Date.parse(latest.deadlineAt) <= Date.now()
        ? 'Remote document task exceeded its deadline.'
        : safeError(error)
      await this.markTaskFailed(store, taskId, message)
    }
  }

  private async submitRemoteTask(
    record: FileProcessingTaskRecord,
    source: FsTarget,
    key: string,
    signal: AbortSignal,
  ): Promise<{ providerTaskId: string; stage: string }> {
    const submitting = record
    let providerTaskId: string
    let stage: string
    switch (submitting.processor) {
      case 'paddleocr': {
        const client = new PaddleOCRClient({
          token: key,
          baseUrl: submitting.apiHost,
          pollTimeout: Math.max(1, Date.parse(submitting.deadlineAt) - Date.now()),
          fetch,
        })
        const job = await client.submitDocumentParsing({
          filePath: this.fileSystem().processPath(source),
          ...(submitting.modelId === '' ? {} : { model: submitting.modelId }),
        }, { signal })
        providerTaskId = job.jobId
        stage = 'polling'
        break
      }
      case 'mineru': {
        const bytes = await this.fileSystem().readBytes(source, signal, MAX_DOCUMENT_BYTES)
        const response = await fetch(`${submitting.apiHost.replace(/\/+$/, '')}/api/v4/file-urls/batch`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: '*/*' },
          body: JSON.stringify({
            files: [{ name: submitting.sourceName, data_id: submitting.id }],
            ...(submitting.modelId === '' ? {} : { model_version: submitting.modelId }),
          }),
          signal,
        })
        if (!response.ok) throw new Error(`MinerU upload URL request failed: HTTP ${response.status}`)
        const payload = await readBoundedResponseJson<{ code?: unknown; data?: { batch_id?: unknown; file_urls?: unknown; headers?: unknown } }>(response, MAX_PROVIDER_JSON_BYTES, signal)
        const batchId = payload.data?.batch_id
        const rawUploadUrl = Array.isArray(payload.data?.file_urls) ? payload.data.file_urls[0] : undefined
        if (payload.code !== 0 || typeof batchId !== 'string' || typeof rawUploadUrl !== 'string') {
          throw new Error('MinerU upload URL response is invalid')
        }
        const uploadUrl = sanitizeRemoteStorageUrl(rawUploadUrl, {
          provider: 'mineru', apiHost: submitting.apiHost, kind: 'upload',
        })
        const rawHeaders = Array.isArray(payload.data?.headers) ? payload.data.headers[0] : undefined
        const uploadHeaders = sanitizeSignedUploadHeaders(rawHeaders)
        const upload = await fetch(uploadUrl, {
          method: 'PUT',
          ...(uploadHeaders === undefined ? {} : { headers: uploadHeaders }),
          body: blobOf(bytes),
          signal,
          redirect: 'error',
        })
        if (!upload.ok) throw new Error(`MinerU upload failed: HTTP ${upload.status}`)
        providerTaskId = batchId
        stage = 'polling'
        break
      }
      case 'doc2x': {
        const bytes = await this.fileSystem().readBytes(source, signal, MAX_DOCUMENT_BYTES)
        const preupload = await fetch(`${submitting.apiHost.replace(/\/+$/, '')}/api/v2/parse/preupload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(submitting.modelId === '' ? {} : { model: submitting.modelId }),
          signal,
        })
        if (!preupload.ok) throw new Error(`Doc2X preupload request failed: HTTP ${preupload.status}`)
        const payload = await readBoundedResponseJson<{ code?: unknown; data?: { uid?: unknown; url?: unknown }; msg?: unknown; message?: unknown }>(preupload, MAX_PROVIDER_JSON_BYTES, signal)
        const uid = payload.data?.uid
        const rawUploadUrl = payload.data?.url
        if (payload.code !== 'success' || typeof uid !== 'string' || typeof rawUploadUrl !== 'string') {
          throw new Error(typeof payload.msg === 'string' ? safeError(payload.msg) : typeof payload.message === 'string' ? safeError(payload.message) : 'Doc2X preupload response is invalid')
        }
        const uploadUrl = sanitizeRemoteStorageUrl(rawUploadUrl, {
          provider: 'doc2x', apiHost: submitting.apiHost, kind: 'upload',
        })
        const upload = await fetch(uploadUrl, { method: 'PUT', body: blobOf(bytes), signal, redirect: 'error' })
        if (!upload.ok) throw new Error(`Doc2X upload failed: HTTP ${upload.status}`)
        providerTaskId = uid
        stage = 'parsing'
        break
      }
    }
    return { providerTaskId, stage }
  }

  private async pollRemoteTask(
    record: FileProcessingTaskRecord,
    store: FileProcessingTaskStore,
    signal: AbortSignal,
  ): Promise<RemotePollOutcome> {
    if (record.providerTaskId === undefined) return { kind: 'failed', error: 'Remote task has no provider task id.' }
    const key = await this.resolveTaskApiKey(record)
    switch (record.processor) {
      case 'paddleocr': return this.pollPaddleDocument(record, key, signal)
      case 'mineru': return this.pollMineruDocument(record, key, signal)
      case 'doc2x': return this.pollDoc2xDocument(record, store, key, signal)
    }
  }

  private async pollPaddleDocument(record: FileProcessingTaskRecord, key: string, signal: AbortSignal): Promise<RemotePollOutcome> {
    const client = new PaddleOCRClient({
      token: key,
      baseUrl: record.apiHost,
      pollTimeout: Math.max(1, Date.parse(record.deadlineAt) - Date.now()),
      fetch,
    })
    const status = await client.getStatus(record.providerTaskId!, { signal })
    if (status.state === 'failed') return { kind: 'failed', error: status.errorMsg === '' ? 'PaddleOCR document parsing failed.' : safeError(status.errorMsg) }
    if (status.state !== 'done') {
      const progress = status.progress?.totalPages
        ? Math.min(99, Math.round((status.progress.extractedPages / status.progress.totalPages) * 100))
        : 0
      return { kind: 'pending', progress, stage: 'polling' }
    }
    const result = await client.waitDocumentParsingResult(record.providerTaskId!, { signal })
    const text = result.pages.map(page => page.markdownText).filter(Boolean).join('\n\n').trim()
    return text === '' ? { kind: 'failed', error: 'PaddleOCR completed without Markdown output.' } : { kind: 'completed', text }
  }

  private async pollMineruDocument(record: FileProcessingTaskRecord, key: string, signal: AbortSignal): Promise<RemotePollOutcome> {
    const response = await fetch(`${record.apiHost.replace(/\/+$/, '')}/api/v4/extract-results/batch/${encodeURIComponent(record.providerTaskId!)}`, {
      headers: { Authorization: `Bearer ${key}`, Accept: '*/*' }, signal,
    })
    if (!response.ok) return { kind: 'failed', error: `MinerU status request failed: HTTP ${response.status}` }
    const payload = await readBoundedResponseJson<{ code?: unknown; data?: { extract_result?: Array<{ state?: unknown; err_msg?: unknown; full_zip_url?: unknown; extract_progress?: { extracted_pages?: unknown; total_pages?: unknown } }> }; msg?: unknown }>(response, MAX_PROVIDER_JSON_BYTES, signal)
    const result = payload.data?.extract_result?.[0]
    if (payload.code !== 0) return { kind: 'failed', error: typeof payload.msg === 'string' ? safeError(payload.msg) : 'MinerU status response is invalid.' }
    if (result === undefined) return { kind: 'pending', progress: 0, stage: 'polling' }
    if (result.state === 'failed') return { kind: 'failed', error: typeof result.err_msg === 'string' ? safeError(result.err_msg) : 'MinerU document parsing failed.' }
    if (result.state !== 'done') {
      const done = typeof result.extract_progress?.extracted_pages === 'number' ? result.extract_progress.extracted_pages : 0
      const total = typeof result.extract_progress?.total_pages === 'number' ? result.extract_progress.total_pages : 0
      return { kind: 'pending', progress: total > 0 ? Math.min(99, Math.round((done / total) * 100)) : 0, stage: 'polling' }
    }
    if (typeof result.full_zip_url !== 'string') return { kind: 'failed', error: 'MinerU completed without a result archive URL.' }
    return { kind: 'completed', text: await this.downloadMarkdownArchive('mineru', result.full_zip_url, record.apiHost, signal) }
  }

  private async pollDoc2xDocument(
    record: FileProcessingTaskRecord,
    store: FileProcessingTaskStore,
    key: string,
    signal: AbortSignal,
  ): Promise<RemotePollOutcome> {
    const base = record.apiHost.replace(/\/+$/, '')
    // `export-submitting` is persisted before the export POST is sent, so a host
    // restart in that window must re-run the parse-status/export flow instead of
    // polling a result endpoint the export never reached. Re-issuing is safe:
    // the status check gates it and the export request targets the same uid.
    if (record.stage === 'parsing' || record.stage === 'export-submitting') {
      const statusResponse = await fetch(`${base}/api/v2/parse/status?uid=${encodeURIComponent(record.providerTaskId!)}`, {
        headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' }, signal,
      })
      if (!statusResponse.ok) return { kind: 'failed', error: `Doc2X parse status failed: HTTP ${statusResponse.status}` }
      const payload = await readBoundedResponseJson<{ code?: unknown; data?: { status?: unknown; progress?: unknown; detail?: unknown }; msg?: unknown; message?: unknown }>(statusResponse, MAX_PROVIDER_JSON_BYTES, signal)
      const status = payload.data?.status
      if (payload.code !== 'success') return { kind: 'failed', error: typeof payload.msg === 'string' ? safeError(payload.msg) : typeof payload.message === 'string' ? safeError(payload.message) : 'Doc2X status response is invalid.' }
      if (status === 'failed') return { kind: 'failed', error: typeof payload.data?.detail === 'string' ? safeError(payload.data.detail) : 'Doc2X document parsing failed.' }
      if (status !== 'success') return { kind: 'pending', progress: typeof payload.data?.progress === 'number' ? Math.min(98, payload.data.progress) : 0, stage: 'parsing' }

      const exporting = await store.update(record.id, current => {
        if (isTerminalTaskStatus(current.status)) return current
        return { ...current, stage: 'export-submitting', progress: 99, updatedAt: new Date().toISOString() }
      })
      if (isTerminalTaskStatus(exporting.status)) return { kind: 'pending', progress: exporting.progress, stage: exporting.stage }

      const exportResponse = await fetch(`${base}/api/v2/convert/parse`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ uid: record.providerTaskId, to: 'md', formula_mode: 'normal', formula_level: 0 }),
        signal,
      })
      if (!exportResponse.ok) return { kind: 'failed', error: `Doc2X export request failed: HTTP ${exportResponse.status}` }
      const exportPayload = await readBoundedResponseJson<{ code?: unknown; data?: { status?: unknown }; msg?: unknown; message?: unknown }>(exportResponse, MAX_PROVIDER_JSON_BYTES, signal)
      if (exportPayload.code !== 'success' || exportPayload.data?.status === 'failed') {
        return { kind: 'failed', error: typeof exportPayload.msg === 'string' ? safeError(exportPayload.msg) : typeof exportPayload.message === 'string' ? safeError(exportPayload.message) : 'Doc2X export request failed.' }
      }
      await store.update(record.id, current => {
        if (isTerminalTaskStatus(current.status)) return current
        return { ...current, stage: 'exporting', progress: 99, updatedAt: new Date().toISOString() }
      })
      return { kind: 'pending', progress: 99, stage: 'exporting' }
    }
    const resultResponse = await fetch(`${base}/api/v2/convert/parse/result?uid=${encodeURIComponent(record.providerTaskId!)}`, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' }, signal,
    })
    if (!resultResponse.ok) return { kind: 'failed', error: `Doc2X export status failed: HTTP ${resultResponse.status}` }
    const payload = await readBoundedResponseJson<{ code?: unknown; data?: { status?: unknown; url?: unknown }; msg?: unknown; message?: unknown }>(resultResponse, MAX_PROVIDER_JSON_BYTES, signal)
    if (payload.code !== 'success') return { kind: 'failed', error: typeof payload.msg === 'string' ? safeError(payload.msg) : typeof payload.message === 'string' ? safeError(payload.message) : 'Doc2X export status is invalid.' }
    if (payload.data?.status === 'failed') return { kind: 'failed', error: 'Doc2X Markdown export failed.' }
    if (payload.data?.status !== 'success' || typeof payload.data?.url !== 'string') return { kind: 'pending', progress: 99, stage: 'exporting' }
    return { kind: 'completed', text: await this.downloadMarkdownArchive('doc2x', payload.data.url, record.apiHost, signal) }
  }

  private async downloadMarkdownArchive(
    provider: Extract<FileProcessorId, 'mineru' | 'doc2x'>,
    url: string,
    apiHost: string,
    signal: AbortSignal,
  ): Promise<string> {
    const candidate = sanitizeRemoteStorageUrl(url, { provider, apiHost, kind: 'download' })
    const response = await fetch(candidate, { signal, redirect: 'error' })
    if (!response.ok) throw new Error(`Remote result archive download failed: HTTP ${response.status}`)
    if (!isZipContentType(response.headers.get('content-type'))) {
      throw new Error('Remote result archive returned an unexpected content type')
    }
    return safeZipMarkdown(await readBoundedResponseBytes(response, MAX_ZIP_BYTES, signal))
  }

  private async localDocument(input: ResolvedInput, signal?: AbortSignal): Promise<FileConvertResult> {
    if (input.feature === 'image_to_text') throw new Error('Local document processing does not support images')
    if (TEXT_EXTENSIONS.has(input.extension)) {
      const bytes = await this.fileSystem().readBytes(input.target, signal, MAX_TEXT_BYTES)
      const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      return { processor: 'local-document', feature: input.feature, text, bytes: bytes.byteLength }
    }
    if (input.extension !== 'pdf') throw new Error(`Local document processing does not support .${input.extension} files`)
    const bytes = await this.fileSystem().readBytes(input.target, signal, MAX_DOCUMENT_BYTES)
    const text = await extractPdfText(bytes)
    if (text === '') throw new Error('This PDF has no extractable text layer; choose an OCR or cloud document processor')
    return { processor: 'local-document', feature: input.feature, text, bytes: bytes.byteLength }
  }

  private async tesseract(input: ResolvedInput, override: FileProcessorOverride | undefined, signal?: AbortSignal): Promise<FileConvertResult> {
    if (input.feature !== 'image_to_text') throw new Error('Tesseract only supports images')
    const subprocess = this.subprocess()
    if (subprocess === undefined) throw new Error('Tesseract requires the DSH subprocess service')
    const executable = await subprocess.resolveExecutable('tesseract', undefined, signal)
    const langs = override?.options?.langs ?? override?.languages ?? []
    const configured = langs.filter(language => language !== 'auto')
    const argv = [executable, this.fileSystem().processPath(input.target), 'stdout', ...(configured.length === 0 ? [] : ['-l', configured.join('+')])]
    const handle = subprocess.spawn({
      argv,
      cwd: dirname(this.fileSystem().processPath(input.target)),
      stdio: {
        stdin: 'ignore',
        stdout: { maxBytes: MAX_TEXT_BYTES },
        stderr: { maxBytes: 64 * 1024 },
      },
      graceMs: TESSERACT_GRACE_MS,
      ...(signal === undefined ? {} : { signal }),
    })
    const outcome = await handle.done
    const stdout = handle.collected.stdout?.readFrom(0).text ?? ''
    const stderr = handle.collected.stderr?.readFrom(0).text.trim() ?? ''
    if (outcome.exitCode !== 0) throw new Error(`Tesseract failed${stderr === '' ? '' : `: ${stderr.slice(0, 500)}`}`)
    const text = stdout.trim()
    if (text === '') throw new Error('Tesseract returned no text')
    return { processor: 'tesseract', feature: input.feature, text, bytes: input.bytes }
  }

  private async mistral(input: ResolvedInput, override: FileProcessorOverride | undefined, signal?: AbortSignal): Promise<FileConvertResult> {
    const key = await this.resolveApiKey('mistral', override)
    const config = capabilityConfig(entryFor('mistral'), override, input.feature)
    const host = (config.apiHost || 'https://api.mistral.ai').replace(/\/+$/, '')
    const model = config.modelId || 'mistral-ocr-latest'
    let uploadedFileId: string | undefined
    try {
      let document: Record<string, string>
      if (input.feature === 'image_to_text') {
        const bytes = await this.fileSystem().readBytes(input.target, signal, MAX_IMAGE_BYTES)
        document = { type: 'image_url', image_url: `data:${mimeFor(input.extension)};base64,${Buffer.from(bytes).toString('base64')}` }
      } else {
        const bytes = await this.fileSystem().readBytes(input.target, signal, MAX_DOCUMENT_BYTES)
        const form = new FormData()
        form.set('purpose', 'ocr')
        form.set('file', blobOf(bytes), basename(input.path))
        const upload = await fetch(`${host}/v1/files`, {
          method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form,
          ...(signal === undefined ? {} : { signal }),
        })
        if (!upload.ok) throw new Error(`Mistral file upload failed: HTTP ${upload.status}`)
        const uploaded = await readBoundedResponseJson<{ id?: unknown }>(upload, MAX_PROVIDER_JSON_BYTES, signal)
        if (typeof uploaded.id !== 'string' || uploaded.id === '') throw new Error('Mistral file upload returned no file id')
        uploadedFileId = uploaded.id
        const signed = await fetch(`${host}/v1/files/${encodeURIComponent(uploadedFileId)}/url`, {
          headers: { Authorization: `Bearer ${key}` },
          ...(signal === undefined ? {} : { signal }),
        })
        if (!signed.ok) throw new Error(`Mistral signed URL request failed: HTTP ${signed.status}`)
        const signedPayload = await readBoundedResponseJson<{ url?: unknown }>(signed, MAX_PROVIDER_JSON_BYTES, signal)
        if (typeof signedPayload.url !== 'string' || signedPayload.url === '') throw new Error('Mistral signed URL response is invalid')
        // The URL is fetched server-side by Mistral, but only hand over a plain
        // https locator: no embedded credentials or fragments.
        const signedUrl = new URL(signedPayload.url)
        if (signedUrl.protocol !== 'https:' || signedUrl.username !== '' || signedUrl.password !== '' || signedUrl.hash !== '') {
          throw new Error('Mistral signed URL response is invalid')
        }
        document = { type: 'document_url', document_url: signedPayload.url, document_name: basename(input.path) }
      }
      const response = await fetch(`${host}/v1/ocr`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          document,
          ...(input.feature === 'document_to_markdown' ? { table_format: 'html' } : {}),
          include_image_base64: false,
        }),
        ...(signal === undefined ? {} : { signal }),
      })
      if (!response.ok) throw new Error(`Mistral OCR failed: HTTP ${response.status}`)
      return { processor: 'mistral', feature: input.feature, text: parseMistralPages(await readBoundedResponseJson<unknown>(response, MAX_PROVIDER_JSON_BYTES, signal)), bytes: input.bytes }
    } finally {
      if (uploadedFileId !== undefined) {
        await fetch(`${host}/v1/files/${encodeURIComponent(uploadedFileId)}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${key}` },
        }).catch(error => this.ctx.logger.warn(`Mistral OCR cleanup failed: ${safeError(error)}`))
      }
    }
  }

  private async paddleOcr(input: ResolvedInput, override: FileProcessorOverride | undefined, signal?: AbortSignal): Promise<FileConvertResult> {
    if (input.feature !== 'image_to_text') throw new Error('PaddleOCR document parsing requires the durable task runtime')
    const key = await this.resolveApiKey('paddleocr', override)
    const config = capabilityConfig(entryFor('paddleocr'), override, input.feature)
    const client = new PaddleOCRClient({
      token: key,
      ...(config.apiHost === '' ? {} : { baseUrl: config.apiHost }),
      fetch,
    })
    const result = await client.ocr({
      filePath: this.fileSystem().processPath(input.target),
      ...(config.modelId === '' ? {} : { model: config.modelId }),
    }, signal === undefined ? undefined : { signal })
    const text = result.pages.flatMap(page => {
      const values = (page.prunedResult as { rec_texts?: unknown } | null)?.rec_texts
      return Array.isArray(values) ? values.filter((value): value is string => typeof value === 'string') : []
    }).join('\n').trim()
    if (text === '') throw new Error('PaddleOCR returned no text')
    return { processor: 'paddleocr', feature: input.feature, text, bytes: input.bytes }
  }

  private async openMineru(input: ResolvedInput, override: FileProcessorOverride | undefined, signal?: AbortSignal): Promise<FileConvertResult> {
    if (input.feature !== 'document_to_markdown') throw new Error('Open MinerU only supports documents')
    const config = capabilityConfig(entryFor('open-mineru'), override, input.feature)
    if (config.apiHost === '') throw new Error('Open MinerU requires an API endpoint')
    const bytes = await this.fileSystem().readBytes(input.target, signal, MAX_DOCUMENT_BYTES)
    const form = new FormData()
    form.set('return_md', 'true')
    form.set('response_format_zip', 'true')
    form.set('files', blobOf(bytes), basename(input.path))
    const response = await fetch(`${config.apiHost.replace(/\/+$/, '')}/file_parse`, {
      method: 'POST', body: form,
      ...(signal === undefined ? {} : { signal }),
    })
    if (!response.ok) throw new Error(`Open MinerU request failed: HTTP ${response.status}`)
    if (response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/zip') {
      throw new Error('Open MinerU returned an unexpected content type')
    }
    return { processor: 'open-mineru', feature: input.feature, text: safeZipMarkdown(await readBoundedResponseBytes(response, MAX_ZIP_BYTES, signal)), bytes: input.bytes }
  }

  [Symbol.dispose](): void {
    // The settings scope and registered effect own their own lifecycles.
  }
}

/** Extract the text layer of a PDF in the Node host. */
async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const { getDocument } = await import('pdfjs-dist')
  const task = getDocument({ data: bytes })
  const document = await task.promise
  try {
    const pages: string[] = []
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber)
      const content = await page.getTextContent()
      const text = content.items.map(item => 'str' in item ? item.str : '').join(' ').replace(/\s+/gu, ' ').trim()
      if (text !== '') pages.push(text)
    }
    return pages.join('\n\n')
  } finally {
    await task.destroy()
  }
}
