import { useEffect } from 'react'
import type { ReactNode } from 'react'
import type { IApiClient, ModelProviderGroup, ModelSelection } from '@deepseek-ai/dsh-api-remotes/client'
import type { SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionListState, SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { ModelsKey } from './locales.ts'
import { assertProviderSchemasSafe } from './schema-safety.ts'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import css from './ModelsSection.module.css'

const DEFAULT_NAMESPACE = 'agent-default-model'

export interface ModelSelectionState {
  status: 'idle' | 'loading' | 'ready' | 'saving' | 'error'
  error: string | null
  defaultSelection: ModelSelection | null
  defaultRevision: number | null
  currentSessionId: SessionId | undefined
  currentAddressed: boolean
  currentSelection: ModelSelection | null
  currentRoutable: boolean | null
  groups: readonly ModelProviderGroup[]
  currentResult: 'idle' | 'both-updated' | 'current-only'
}

export class ModelSelectionStore {
  readonly store: SnapshotStore<ModelSelectionState>
  private generation = 0

  constructor(
    private readonly api: Pick<IApiClient, 'settings' | 'sessions' | 'llm'>,
    private readonly schema: SettingsSchemaOperations,
  ) {
    this.store = createSnapshotStore({
      status: 'idle', error: null, defaultSelection: null, defaultRevision: null,
      currentSessionId: undefined, currentAddressed: false, currentSelection: null, currentRoutable: null,
      groups: [], currentResult: 'idle',
    })
  }

  async load(sessionId: SessionId | undefined, addressed = false): Promise<void> {
    const generation = ++this.generation
    this.store.update((state) => {
      state.status = 'loading'
      state.error = null
      state.currentSessionId = sessionId
      state.currentAddressed = addressed
      state.currentResult = 'idle'
    })
    try {
      const [settingsResponse, modelsResponse, catalogResponse] = await Promise.all([
        this.api.settings.describe({}),
        sessionId === undefined || addressed ? Promise.resolve(undefined) : this.api.sessions.models({ sessionId }),
        sessionId === undefined || addressed ? this.api.llm.models({}) : Promise.resolve(undefined),
      ])
      if (!settingsResponse.result.ok) throw new Error(settingsResponse.result.error.message)
      if (modelsResponse !== undefined && !modelsResponse.result.ok) throw new Error(modelsResponse.result.error.message)
      if (catalogResponse !== undefined && !catalogResponse.result.ok) throw new Error(catalogResponse.result.error.message)
      assertProviderSchemasSafe(settingsResponse.result.value.namespaces)
      const namespace = settingsResponse.result.value.namespaces.find(view => view.ns === DEFAULT_NAMESPACE)
      if (namespace === undefined) throw new Error('agent-default-model settings are unavailable')
      const current = modelsResponse?.result.ok === true ? modelsResponse.result.value : undefined
      if (generation !== this.generation) return
      this.store.update((state) => {
        state.status = 'ready'
        state.defaultSelection = selectionOf(namespace.value, this.schema)
        state.defaultRevision = namespace.revision
        state.currentSelection = current?.current ?? null
        state.currentRoutable = current?.routable ?? null
        state.groups = current?.groups ?? (catalogResponse?.result.ok === true ? catalogResponse.result.value.groups : [])
      })
    } catch (error) {
      if (generation !== this.generation) return
      this.store.update((state) => {
        state.status = 'error'
        state.error = error instanceof Error ? error.message : String(error)
      })
    }
  }

  async saveDefault(selection: ModelSelection): Promise<boolean> {
    const revision = this.store.getSnapshot().defaultRevision
    if (revision === null) return false
    this.store.update((state) => { state.status = 'saving'; state.error = null })
    const response = await this.api.settings.mutate({
      ns: DEFAULT_NAMESPACE,
      expectedRevision: revision,
      ops: [
        { op: 'set', path: ['provider'], value: selection.provider },
        { op: 'set', path: ['model'], value: selection.model },
        ...(selection.reasoningEffort === undefined
          ? [{ op: 'unset' as const, path: ['reasoningEffort'] }]
          : [{ op: 'set' as const, path: ['reasoningEffort'], value: selection.reasoningEffort }]),
      ],
    })
    const result = response.result
    if (!result.ok) {
      this.store.update((state) => {
        state.status = 'error'
        state.error = result.error.message
      })
      return false
    }
    this.store.update((state) => {
      state.status = 'ready'
      state.defaultSelection = selection
      state.defaultRevision = result.value.revision
    })
    return true
  }

  async selectCurrent(selection: ModelSelection): Promise<boolean> {
    const sessionId = this.store.getSnapshot().currentSessionId
    if (sessionId === undefined || this.store.getSnapshot().currentAddressed) return false
    this.store.update((state) => { state.status = 'saving'; state.error = null; state.currentResult = 'idle' })
    const selected = await this.api.sessions.selectModel({ sessionId, ...selection })
    const selectedResult = selected.result
    if (!selectedResult.ok) {
      this.store.update((state) => { state.status = 'error'; state.error = selectedResult.error.message })
      return false
    }
    const described = await this.api.settings.describe({})
    const defaultSelection = described.result.ok
      ? selectionOf(described.result.value.namespaces.find(view => view.ns === DEFAULT_NAMESPACE)?.value, this.schema)
      : null
    const both = sameSelection(defaultSelection, selectedResult.value.selected)
    this.store.update((state) => {
      state.status = 'ready'
      state.currentSelection = selectedResult.value.selected
      state.currentRoutable = true
      state.currentResult = both ? 'both-updated' : 'current-only'
      if (described.result.ok) {
        const namespace = described.result.value.namespaces.find(view => view.ns === DEFAULT_NAMESPACE)
        state.defaultSelection = defaultSelection
        state.defaultRevision = namespace?.revision ?? state.defaultRevision
      }
    })
    return true
  }
}

function selectionOf(value: unknown, schema: SettingsSchemaOperations): ModelSelection | null {
  const provider = schema.getPath(value, ['provider'])
  const model = schema.getPath(value, ['model'])
  const reasoningEffort = schema.getPath(value, ['reasoningEffort'])
  if (typeof provider !== 'string' || typeof model !== 'string') return null
  return {
    provider,
    model,
    ...(typeof reasoningEffort === 'string' ? { reasoningEffort } : {}),
  }
}

function sameSelection(left: ModelSelection | null, right: ModelSelection): boolean {
  return left?.provider === right.provider
    && left.model === right.model
    && left.reasoningEffort === right.reasoningEffort
}

function options(groups: readonly ModelProviderGroup[]): Array<{ selection: ModelSelection; label: string }> {
  return groups.flatMap(group => group.models.map(model => ({
    selection: {
      provider: group.id,
      model: model.id,
      ...(model.reasoning?.defaultEffort === undefined ? {} : { reasoningEffort: model.reasoning.defaultEffort }),
    },
    label: `${group.name} · ${model.name}`,
  })))
}

export interface ModelSelectionPanelProps {
  controller: ModelSelectionStore
  useSnapshot: SnapshotSelectorHook<ModelSelectionState>
  useSessions: SnapshotSelectorHook<SessionListState>
  load: (sessionId: SessionId | undefined, addressed: boolean) => void
  t: (key: ModelsKey) => string
  schema: SettingsSchemaOperations
}

/** Render distinct future-session default and current-session model controls. */
export function ModelSelectionPanel(props: ModelSelectionPanelProps): ReactNode {
  const currentSessionId = props.useSessions(state => state.current)
  const currentAddressed = props.useSessions(state => state.currentAddress !== undefined)
  const state = props.useSnapshot(snapshot => snapshot)
  useEffect(() => { props.load(currentSessionId, currentAddressed) }, [currentSessionId, currentAddressed, props.load])
  const rows = options(state.groups)
  const defaultValue = state.defaultSelection === null
    ? ''
    : `${state.defaultSelection.provider}/${state.defaultSelection.model}`
  const currentValue = state.currentSelection === null
    ? ''
    : `${state.currentSelection.provider}/${state.currentSelection.model}`

  const choose = (value: string): ModelSelection | undefined => rows.find(row =>
    `${row.selection.provider}/${row.selection.model}` === value)?.selection

  return (
    <section className={css.modelSelectionPanel} aria-labelledby="control-center-model-selection-title">
      <h3 id="control-center-model-selection-title" className={css.modelSelectionTitle}>{props.t('selectionTitle')}</h3>
      {state.error === null ? null : <p className={css.error} role="alert">{state.error}</p>}
      <label className={css.field}>
        <span className={css.fieldLabel}>{props.t('defaultModel')}</span>
        <select
          className={`${css.input} ${css.selectInput}`}
          value={defaultValue}
          disabled={state.status === 'loading' || state.status === 'saving' || rows.length === 0}
          onChange={(event) => {
            const selection = choose(event.target.value)
            if (selection !== undefined) void props.controller.saveDefault(selection)
          }}
        >
          <option value="">{props.t('modelUnset')}</option>
          {rows.map(row => <option key={`${row.selection.provider}/${row.selection.model}`} value={`${row.selection.provider}/${row.selection.model}`}>{row.label}</option>)}
        </select>
        <span className={css.advancedHint}>{props.t('defaultModelHint')}</span>
      </label>
      <label className={css.field}>
        <span className={css.fieldLabel}>{props.t('currentModel')}</span>
        {currentSessionId === undefined
          ? <span className={css.advancedHint}>{props.t('currentModelNone')}</span>
          : currentAddressed
            ? <span className={css.advancedHint}>{props.t('currentModelSubagent')}</span>
            : (
            <select
              className={`${css.input} ${css.selectInput}`}
              value={currentValue}
              disabled={state.status === 'loading' || state.status === 'saving' || rows.length === 0}
              onChange={(event) => {
                const selection = choose(event.target.value)
                if (selection !== undefined) void props.controller.selectCurrent(selection)
              }}
            >
              <option value="">{props.t('modelUnset')}</option>
              {rows.map(row => <option key={`${row.selection.provider}/${row.selection.model}`} value={`${row.selection.provider}/${row.selection.model}`}>{row.label}</option>)}
            </select>
          )}
        <span className={css.advancedHint}>{props.t('currentModelHint')}</span>
      </label>
      {state.currentResult === 'both-updated' ? <p className={css.savedNotice} role="status">{props.t('currentAndDefaultUpdated')}</p> : null}
      {state.currentResult === 'current-only' ? <p className={css.notice} role="status">{props.t('currentOnlyUpdated')}</p> : null}
      {state.currentRoutable === false ? <p className={css.notice}>{props.t('modelUnroutable')}</p> : null}
    </section>
  )
}
