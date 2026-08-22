/**
 * Per-purpose model preferences (翻译模型 / 绘画模型): the shared store behind
 * the 默认模型 page and the workspaces that honor them.
 *
 * The prefs live in the `control-center-model-prefs` settings namespace — the
 * same DSH authority every other surface reads — so a choice made here is what
 * a freshly opened translation or painting workspace preselects, instead of
 * "whatever the catalog listed first". The catalog itself comes from
 * `llm.models`, the same groups the selectors already offer.
 */

import type { IApiClient, ModelProviderGroup } from '@deepseek-ai/dsh-api-remotes/client'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import { messageOf } from './store.ts'

export const MODEL_PREFS_NAMESPACE = 'control-center-model-prefs'

/** One purpose's stored selection, or null while unset. */
export interface ModelPrefSelection {
  provider: string
  model: string
}

export interface ModelPrefsState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
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
  groups: readonly ModelProviderGroup[]
}

function readSelection(value: unknown, schema: SettingsSchemaOperations, kind: 'translation' | 'painting'): ModelPrefSelection | null {
  const provider = schema.getPath(value, [`${kind}Provider`])
  const model = schema.getPath(value, [`${kind}Model`])
  if (typeof provider !== 'string' || provider.length === 0) return null
  if (typeof model !== 'string' || model.length === 0) return null
  return { provider, model }
}

/** The shared controller (one per client surface). */
export class ModelPrefsStore {
  readonly store: SnapshotStore<ModelPrefsState> = createSnapshotStore<ModelPrefsState>({
    status: 'idle', error: null, available: true, writable: false, revision: null,
    translation: null, painting: null, groups: [],
  })

  private generation = 0

  constructor(
    private readonly api: Pick<IApiClient, 'settings' | 'llm'>,
    private readonly schema: SettingsSchemaOperations,
  ) {}

  async load(): Promise<void> {
    const generation = ++this.generation
    this.store.update((state) => { state.status = 'loading'; state.error = null })
    try {
      const [settingsResponse, modelsResponse] = await Promise.all([
        this.api.settings.describe({}),
        this.api.llm.models({}),
      ])
      const settings = settingsResponse.result
      const catalog = modelsResponse.result
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

  /** Persist one purpose's selection; keeps the other untouched. */
  async save(kind: 'translation' | 'painting', selection: ModelPrefSelection): Promise<boolean> {
    const snapshot = this.store.getSnapshot()
    if (snapshot.revision === null || !snapshot.available) return false
    this.store.update((state) => { state.status = 'loading'; state.error = null })
    const response = await this.api.settings.mutate({
      ns: MODEL_PREFS_NAMESPACE,
      expectedRevision: snapshot.revision,
      ops: [
        { op: 'set', path: [`${kind}Provider`], value: selection.provider },
        { op: 'set', path: [`${kind}Model`], value: selection.model },
      ],
    })
    if (!response.result.ok) {
      const failure = response.result
      this.store.update((state) => {
        state.status = 'error'
        state.error = failure.error.message
      })
      return false
    }
    // Reload rather than hand-patch: the describe also refreshes the catalog
    // and keeps revision authoritative for the next write.
    await this.load()
    return true
  }
}
