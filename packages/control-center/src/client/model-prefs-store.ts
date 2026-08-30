/**
 * Per-purpose model preferences (快捷模型 / 翻译模型 / 绘画模型) plus the
 * Cherry 重试设置: the shared store behind the 默认模型 page.
 *
 * The prefs live in the `control-center-model-prefs` settings namespace — the
 * same DSH authority every other surface reads — so a choice made here is what
 * a freshly opened translation or painting workspace preselects, instead of
 * "whatever the catalog listed first". The catalog itself comes from
 * `llm.models`, the same groups the selectors already offer.
 *
 * The retry group is Cherry `chat.retry.*`: an enable switch, max attempts,
 * backoff, and fallback routes. Saving it projects a DSH provider-owned
 * `retryPolicy` into every live provider profile (see retry-policy.ts), so the
 * official harness retry plugin enforces it on real requests — including agent
 * sessions, which control-center does not own.
 */

import type { ClientRemote, ModelProviderGroup,SettingsPathOpView } from '@deepseek-ai/dsh-api-remotes/client'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import { messageOf } from './store.ts'

export const MODEL_PREFS_NAMESPACE = 'control-center-model-prefs'

/** One purpose's stored selection, or null while unset. */
export interface ModelPrefSelection {
  provider: string
  model: string
}

/** One Cherry-style fallback route (`chat.retry.fallback_model_ids`). */
export interface RetryFallbackRoute {
  provider: string
  model: string
}

/** The persisted retry configuration. */
export interface RetryConfig {
  enabled: boolean
  maxAttempts: number
  backoff: boolean
  fallbacks: readonly RetryFallbackRoute[]
}

export interface ModelPrefsState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  /**
   * Failure of the LAST WRITE, independent of load status — one failed
   * preference write must not replace the whole page with the load-failed
   * view.
   */
  writeError: string | null
  /**
   * False when the running host does not register the preference namespace
   * (an older deployed bundle). The page then renders an honest notice and
   * keeps default/current selection working instead of failing wholesale.
   */
  available: boolean
  writable: boolean
  revision: number | null
  translation: ModelPrefSelection | null
  painting: ModelPrefSelection | null
  quick: ModelPrefSelection | null
  retry: RetryConfig
  groups: readonly ModelProviderGroup[]
}

function readSelection(
  value: unknown,
  schema: SettingsSchemaOperations,
  kind: 'translation' | 'painting' | 'quick',
): ModelPrefSelection | null {
  const provider = schema.getPath(value, [`${kind}Provider`])
  const model = schema.getPath(value, [`${kind}Model`])
  if (typeof provider !== 'string' || provider.length === 0) return null
  if (typeof model !== 'string' || model.length === 0) return null
  return { provider, model }
}

/** Read the persisted retry config, tolerating partial or older sections. */
export function readRetryConfig(value: unknown, schema: SettingsSchemaOperations): RetryConfig {
  const enabled = schema.getPath(value, ['retryEnabled'])
  const maxAttempts = schema.getPath(value, ['retryMaxAttempts'])
  const backoff = schema.getPath(value, ['retryBackoff'])
  const rawFallbacks = schema.getPath(value, ['retryFallbacks'])
  const fallbacks = Array.isArray(rawFallbacks)
    ? rawFallbacks.flatMap((entry): RetryFallbackRoute[] => {
        if (typeof entry !== 'object' || entry === null) return []
        const provider = schema.getPath(entry, ['provider'])
        const model = schema.getPath(entry, ['model'])
        if (typeof provider !== 'string' || provider.length === 0) return []
        if (typeof model !== 'string' || model.length === 0) return []
        return [{ provider, model }]
      })
    : []
  return {
    enabled: enabled === true,
    // Cherry clamps to 1–10; anything else falls back to its default of 3.
    maxAttempts: typeof maxAttempts === 'number' && Number.isSafeInteger(maxAttempts) && maxAttempts >= 1 && maxAttempts <= 10
      ? maxAttempts
      : 3,
    backoff: backoff !== false,
    fallbacks,
  }
}

const DEFAULT_RETRY_CONFIG: RetryConfig = { enabled: false, maxAttempts: 3, backoff: true, fallbacks: [] }

/** The shared controller (one per client surface). */
export class ModelPrefsStore {
  readonly store: SnapshotStore<ModelPrefsState> = createSnapshotStore<ModelPrefsState>({
    status: 'idle', error: null, writeError: null, available: true, writable: false, revision: null,
    translation: null, painting: null, quick: null, retry: DEFAULT_RETRY_CONFIG, groups: [],
  })

  private generation = 0

  constructor(
    private readonly api: Pick<ClientRemote, 'settings' | 'session'>,
    private readonly schema: SettingsSchemaOperations,
  ) {}

  async load(): Promise<void> {
    const generation = ++this.generation
    this.store.update((state) => { state.status = 'loading'; state.error = null })
    try {
      const [settingsResponse, modelsResponse] = await Promise.all([
        this.api.settings.describe(),
        this.api.session.modelCatalog(),
      ])
      const settings = settingsResponse
      const catalog = modelsResponse
      if (!settings.ok) throw new Error(settings.error.message)
      if (!catalog.ok) throw new Error(catalog.error.message)
      if (generation !== this.generation) return
      const namespace = settings.value.namespaces.find(view => view.ns === MODEL_PREFS_NAMESPACE)
      if (namespace === undefined) {
        // Older host without the namespace: degrade, never fail the page.
        this.store.update((state) => {
          state.status = 'ready'
          state.available = false
          state.writable = false
          state.revision = null
          state.groups = catalog.value.groups
        })
        return
      }
      const value = namespace.value
      this.store.update((state) => {
        state.status = 'ready'
        state.available = true
        state.writable = settings.value.writable
        state.revision = namespace.revision
        state.translation = readSelection(value, this.schema, 'translation')
        state.painting = readSelection(value, this.schema, 'painting')
        state.quick = readSelection(value, this.schema, 'quick')
        state.retry = readRetryConfig(value, this.schema)
        state.groups = catalog.value.groups
      })
    } catch (error) {
      if (generation !== this.generation) return
      this.store.update((state) => {
        state.status = 'error'
        state.error = messageOf(error)
      })
    }
  }

  /** Persist one purpose's selection; keeps the others untouched. */
  async save(kind: 'translation' | 'painting' | 'quick', selection: ModelPrefSelection): Promise<boolean> {
    return this.mutate([
      { op: 'set', path: [`${kind}Provider`], value: selection.provider },
      { op: 'set', path: [`${kind}Model`], value: selection.model },
    ])
  }

  /** Persist the retry configuration as one atomic section write. */
  async saveRetry(config: RetryConfig): Promise<boolean> {
    return this.mutate([
      { op: 'set', path: ['retryEnabled'], value: config.enabled },
      { op: 'set', path: ['retryMaxAttempts'], value: config.maxAttempts },
      { op: 'set', path: ['retryBackoff'], value: config.backoff },
      {
        op: 'set',
        path: ['retryFallbacks'],
        value: config.fallbacks.map(fallback => ({ provider: fallback.provider, model: fallback.model })),
      },
    ])
  }

  /** Shared mutate-then-reload tail behind every preference write. */
  private async mutate(ops: ReadonlyArray<{ op: 'set'; path: string[]; value: unknown }>): Promise<boolean> {
    const snapshot = this.store.getSnapshot()
    if (snapshot.revision === null || !snapshot.available) return false
    this.store.update((state) => { state.writeError = null })
    const response = await this.api.settings.mutate(MODEL_PREFS_NAMESPACE, [...ops] as unknown as SettingsPathOpView[], snapshot.revision)
    if (!response.ok) {
      const failure = response
      this.store.update((state) => {
        state.writeError = failure.error.message
      })
      return false
    }
    // Reload rather than hand-patch: the describe also refreshes the catalog
    // and keeps revision authoritative for the next write.
    await this.load()
    return true
  }
}
