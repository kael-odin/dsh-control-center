/**
 * The model list of one pi-ai provider profile, plus the action that asks the
 * provider what it serves.
 *
 * The list is the profile's `models` array as the card holds it: an empty list
 * means "serve this route's built-in catalog", and any entry replaces that
 * catalog, so a row is only ever added deliberately. Fetching asks the endpoint
 * **the form currently shows** — including a key typed but not yet saved — so
 * adding a provider is one pass instead of save-then-return; the reply is
 * candidates the user picks from, never configuration written behind them.
 *
 * A provider that cannot be interrogated (an unreachable endpoint, a protocol
 * with no readable listing) is not a dead end: the failure is shown next to the
 * rows the user can still fill in by hand.
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { DiscoveredModelView, IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { formatCapacity, parseCapacity } from './DeepSeekModelsEditor.tsx'
import type { DeepSeekModelDraft } from './DeepSeekModelsEditor.tsx'
import { ProviderAvatar } from './provider-avatar.tsx'
import { messageOf } from './store.ts'
import type { en } from './locales.ts'
import styles from './ModelsSection.module.css'

/**
 * One configured model row. Structurally open, exactly like the DeepSeek
 * catalog editor's rows: a profile field this card does not edit — one a future
 * schema adds, or one hand-written in `settings.yaml` — has to survive being
 * edited here rather than being dropped by a rebuild.
 */
export type ModelDraft = DeepSeekModelDraft

/** A row's text field, or the empty string when unset or not a string. */
function textOf(model: ModelDraft, key: string): string {
  const value = model[key]
  return typeof value === 'string' ? value : ''
}

/** A row's numeric field, or `undefined` when unset or not a number. */
function numberOf(model: ModelDraft, key: string): number | undefined {
  const value = model[key]
  return typeof value === 'number' ? value : undefined
}

/** What an interrogation needs, taken from the live form. */
export interface ProbeTarget {
  /** Settings namespace whose adapter family answers. */
  settingsNs: string
  /**
   * Route being edited, when the card edits one. An adapter that already
   * describes it answers from its own registry, so such a card can ask without
   * an endpoint at all.
   */
  provider?: string
  /** Endpoint as the form currently shows it. */
  baseURL?: string
  /** Wire protocol the form names, when it names one. */
  api?: string
  /** Key typed into the form and not yet stored, when there is one. */
  apiKey?: string
}

/** Props of {@link ModelListEditor}. */
export interface ModelListEditorProps {
  /** The rows as currently drafted. */
  models: readonly ModelDraft[]
  /** Whether the user layer currently owns the whole array; absent on a create. */
  overridden?: boolean
  /** Replace the drafted rows. */
  onChange: (models: ModelDraft[]) => void
  /** Remove the user-owned array and return to inheritance; absent on a create. */
  onReset?: () => void
  /** Endpoint facts for the fetch action. */
  probe: ProbeTarget
  /**
   * Copy key naming why the fetch action is unavailable, or `undefined` when
   * it is. The card owns this because the key it would send is judged there:
   * asking with a key the form has already refused spends a round trip to be
   * told what the field already says.
   */
  probeBlocked?: keyof typeof en | undefined
  /** Wire face the fetch action calls. */
  api: Pick<IApiClient, 'llm'>
  /** Provider docs/models URL for Cherry's FileText header link; absent = no link. */
  docsUrl?: string | undefined
  /** Section copy. */
  t: (key: keyof typeof en) => string
  /** Disable every control (read-only deployment or a pending write). */
  disabled: boolean
  /**
   * The host's current default model selection; the row matching it under
   * this provider shows the filled default marker.
   */
  defaultModel?: { provider?: unknown; model?: unknown }
  /** Mark a row as the default model for future sessions. */
  onSetDefault?: (modelId: string) => void
  /**
   * The provider's full served-catalog candidates (`llm.models` for this
   * route): entries missing from the profile array render as disabled rows
   * that an eye-click re-enables. Presence in the profile array IS the
   * enabled state — pi-ai serves exactly what the array lists (or its whole
   * catalog when the array is absent).
   */
  catalogModels?: readonly { id: string; name?: string }[]
}

/** Disclosure chevron; rotates to point down while its row is open. */
function IconChevron({ open }: { open: boolean }): ReactNode {
  return (
    <svg
      width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden
      style={{ transform: open ? 'rotate(90deg)' : undefined, transition: 'transform 120ms ease' }}
    >
      <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Removal glyph for one model row (Cherry's minus affordance). */
function IconMinus(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M5 12h14" />
    </svg>
  )
}

/** Toolbar glyphs. */
function IconSearch(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function IconRefresh(): ReactNode {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  )
}

function IconPlus(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

/** Per-model serving toggle (Cherry's eye affordance). */
function IconEyeOpen(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeClosed(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}

/** Default-model marker (Cherry's paintbrush affordance). */
function IconBrush(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m14.622 17.897-10.68-2.913" />
      <path d="M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .354l.949 2.587a2 2 0 0 1-.094 1.791l-1.514 2.623a.5.5 0 0 1-.282.243l-10.68 2.913a.5.5 0 0 1-.62-.62l2.913-10.68a.5.5 0 0 1 .243-.282l2.623-1.514a2 2 0 0 1 1.791-.094l2.587.949a.5.5 0 0 0 .354 0z" />
    </svg>
  )
}

/** The two token counts edited as K/M-suffixed text behind a row's disclosure. */
type CapacityField = 'contextWindow' | 'maxTokens'

/**
 * What an empty capacity field is worth, shown as its placeholder so a row left
 * blank does not read as a model with no capacity at all.
 *
 * The magnitudes are the adapter's own route-level fallbacks (`llm-pi-ai`'s
 * `defaultContextWindow` and `defaultMaxTokens`), spelled the way a person
 * would say them. They are a hint, not a mirror: this page counts `K` as 1000,
 * so typing `256K` stores 256000 while leaving the field blank keeps the
 * adapter's 262144. A deployment that overrides those defaults is not
 * reflected here — nothing on this page can read them.
 */
const CAPACITY_HINT: Readonly<Record<CapacityField, string>> = {
  contextWindow: '256K',
  maxTokens: '32K',
}

/**
 * Spell a stored count for a field that may be unset. The spelling itself is
 * {@link formatCapacity}, shared with the DeepSeek catalog editor so both
 * surfaces read and write one K/M vocabulary.
 * @param value - stored capacity, or `undefined` for an unset field.
 * @returns the field text, empty when unset.
 */
function capacitySpelling(value: number | undefined): string {
  return value === undefined ? '' : formatCapacity(value)
}

/** Adopt a candidate, keeping whatever capacities the provider disclosed. */
function adopt(candidate: DiscoveredModelView): ModelDraft {
  return {
    id: candidate.id,
    ...candidate.name === undefined ? {} : { name: candidate.name },
    ...candidate.contextWindow === undefined ? {} : { contextWindow: candidate.contextWindow },
    ...candidate.maxTokens === undefined ? {} : { maxTokens: candidate.maxTokens },
  }
}

/** The bucket an id with no derivable family lands in (sorts last). */
export const UNGROUPED_MODEL_GROUP_KEY = '__ungrouped__'

/**
 * Cherry's group derivation: a slash-prefixed id uses its provider segment
 * (`openai/gpt-4o` → `openai`); a flat id uses the family before the first
 * dash (`deepseek-v4-pro` → `deepseek`). An id that yields no family (a bare
 * `glm`) lands in the trailing ungrouped bucket.
 * @param id - the model id as configured.
 * @returns the group name, or `undefined` for the ungrouped bucket.
 */
export function modelGroupName(id: string): string | undefined {
  const trimmed = id.trim()
  const parts = trimmed.split('/')
  if (parts.length > 1) return parts[0]?.trim() || undefined
  const family = trimmed.split('-')[0]?.trim()
  return family !== undefined && family !== '' && family !== trimmed ? family : undefined
}

/**
 * Render the model list with its fetch action.
 * @param props - the drafted rows, probe target, wire face, and copy.
 * @returns the model-list editor.
 */
export function ModelListEditor(props: ModelListEditorProps): ReactNode {
  const { models, onChange, probe, api, t, disabled } = props
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | undefined>(undefined)
  const [candidates, setCandidates] = useState<readonly DiscoveredModelView[] | undefined>(undefined)
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set())
  // Rows carry an id and a name; capacities are the exception, so they stay
  // folded until asked for rather than crowding every row with four inputs.
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set())
  // Capacities are edited as text, so a field's keystrokes are held here rather
  // than re-derived from the parsed count on every change — that would rewrite
  // `1000` to `1K` mid-word. Unreadable text is kept past blur so the refusal
  // names a row the user can still see, which is why this is one entry PER
  // FIELD: a single buffer would be displaced by editing any other field, and
  // the abandoned one would render its stored NaN as the literal `NaN`.
  const [editing, setEditing] = useState<ReadonlyMap<string, string>>(new Map())
  // The model filter stays open while text is in it, exactly like Cherry's
  // expanding search; rows render filtered but every edit names its ORIGINAL
  // index, so a narrowed view never rewrites the wrong row.
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  // Per-group collapse; a group not in the set is expanded. While the search
  // is active every group force-expands so matches stay visible.
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(new Set())
  const [allCollapsed, setAllCollapsed] = useState(false)

  /** Buffer key for one capacity field; the row half moves when rows do. */
  const bufferKey = (index: number, field: CapacityField): string => `${String(index)}:${field}`

  const editCapacity = (index: number, field: CapacityField, text: string): void => {
    setEditing(current => new Map(current).set(bufferKey(index, field), text))
    patch(index, { [field]: parseCapacity(text) })
  }

  /** What a capacity field shows: the buffer while typing, else the stored count. */
  const capacityText = (model: ModelDraft, index: number, field: CapacityField): string =>
    editing.get(bufferKey(index, field)) ?? capacitySpelling(numberOf(model, field))

  /** Drop one row's entries and shift the rows after it down, in one pass. */
  const reindexOnRemove = (
    current: ReadonlyMap<string, string>,
    index: number,
  ): Map<string, string> => {
    const next = new Map<string, string>()
    for (const [key, value] of current) {
      const at = Number(key.slice(0, key.indexOf(':')))
      if (at === index) continue
      // Only the row number moves; the field half of the key is untouched.
      next.set(at > index ? key.replace(/^\d+/, String(at - 1)) : key, value)
    }
    return next
  }

  const toggleExpanded = (index: number): void => {
    setExpanded((current) => {
      const next = new Set(current)
      if (!next.delete(index)) next.add(index)
      return next
    })
  }

  const patch = (index: number, next: Record<string, string | number | undefined>): void => {
    onChange(models.map((model, at) => {
      if (at !== index) return model
      // Rebuilt rather than spread over: an emptied optional field has to leave
      // the profile, not be stored as a value its schema would reject.
      // Spread first so a field this card does not edit survives; an emptied
      // optional field is then dropped rather than stored as a value its
      // schema would reject.
      const cleared = new Set(
        Object.entries(next).filter(([, value]) => value === undefined || value === '').map(([key]) => key),
      )
      return Object.fromEntries(
        Object.entries({ ...model, ...next }).filter(([key]) => !cleared.has(key)),
      )
    }))
  }

  const fetchModels = async (): Promise<void> => {
    setBusy(true)
    setFailure(undefined)
    try {
      const response = await api.llm.discoverModels({
        settingsNs: probe.settingsNs,
        ...probe.provider === undefined ? {} : { provider: probe.provider },
        ...probe.baseURL === undefined || probe.baseURL.length === 0 ? {} : { baseURL: probe.baseURL },
        ...probe.api === undefined ? {} : { api: probe.api },
        ...probe.apiKey === undefined ? {} : { apiKey: probe.apiKey },
      })
      if (!response.result.ok) {
        setFailure(response.result.error.message)
        return
      }
      const found = response.result.value.models
      if (found.length === 0) {
        setFailure(t('fetchEmpty'))
        return
      }
      // Everything already configured starts unchecked, so adopting a
      // selection never silently rewrites a capacity the user corrected.
      const known = new Set(models.map(model => textOf(model, 'id')))
      setCandidates(found)
      setPicked(new Set(found.filter(model => !known.has(model.id)).map(model => model.id)))
    } catch (error) {
      // The transport rejected rather than answering; without this the button
      // would stay busy with nothing shown.
      setFailure(messageOf(error))
    } finally {
      setBusy(false)
    }
  }

  const closePicker = (): void => {
    setCandidates(undefined)
    setPicked(new Set())
  }

  const adoptPicked = (): void => {
    /* v8 ignore next -- the dialog only renders with candidates loaded */
    if (candidates === undefined) return
    const byId = new Map(models.map(model => [textOf(model, 'id'), model]))
    for (const candidate of candidates) {
      if (!picked.has(candidate.id)) continue
      // A row the user already tuned wins over the provider's own numbers.
      // Keyed by id, so a half-typed row whose id is still empty is not a
      // match and the candidate joins as its own row — correct, since a row
      // without an id is not yet a model and the create/apply gates refuse it.
      byId.set(candidate.id, byId.get(candidate.id) ?? adopt(candidate))
    }
    onChange([...byId.values()])
    closePicker()
  }

  const removeAt = (index: number): void => {
    onChange(models.filter((_model, at) => at !== index))
    // Both stores are keyed by position, so every row after this one shifts
    // down and would otherwise inherit its neighbour's state — a different
    // row's capacities popping open, or its half-typed text appearing in
    // another row's field.
    setExpanded((current) => {
      const next = new Set<number>()
      for (const at of current) {
        if (at < index) next.add(at)
        else if (at > index) next.add(at - 1)
      }
      return next
    })
    setEditing(current => reindexOnRemove(current, index))
  }

  const toggle = (id: string): void => {
    setPicked((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  // A route the adapter already describes answers without an endpoint; only a
  // draft with neither has nothing to ask about.
  const askable = probe.provider !== undefined || (probe.baseURL !== undefined && probe.baseURL.length > 0)
  const keyword = searchText.trim().toLowerCase()
  const visibleRows = models
    .map((model, index) => ({ model, index }))
    .filter(({ model }) => keyword.length === 0
      || textOf(model, 'id').toLowerCase().includes(keyword)
      || textOf(model, 'name').toLowerCase().includes(keyword))

  /**
   * Group rows via {@link modelGroupName}, alphabetically, ungrouped last.
   */
  const grouped = (() => {
    const buckets = new Map<string, Array<{ model: ModelDraft; index: number }>>()
    for (const row of visibleRows) {
      const key = modelGroupName(textOf(row.model, 'id')) ?? UNGROUPED_MODEL_GROUP_KEY
      if (!buckets.has(key)) buckets.set(key, [])
      buckets.get(key)!.push(row)
    }
    return [...buckets.entries()].sort((left, right) =>
      left[0] === UNGROUPED_MODEL_GROUP_KEY
        ? 1
        : right[0] === UNGROUPED_MODEL_GROUP_KEY
          ? -1
          : left[0].localeCompare(right[0]))
  })()

  return (
    <section className={styles['modelCatalog']} aria-label={t('models')}>
      <div className={styles['modelListHead']}>
        <div className={styles['modelCatalogHeading']}>
          <span className={styles['modelCatalogTitle']}>{t('models')}</span>
          {/* Cherry shows the count beside the section title once rows exist. */}
          {models.length > 0 ? <span className={styles['modelCountBadge']}>{models.length}</span> : null}
          {props.overridden === undefined
            ? null
            : (
              <span className={styles['modelCatalogMeta']}>
                {props.overridden ? t('modelsCustomized') : t('modelsInherited')}
              </span>
            )}
        </div>
        <div className={styles['modelToolbarActions']}>
          {props.docsUrl === undefined
            ? null
            : (
              <a
                className={styles['iconButton']}
                href={props.docsUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={t('modelsDocs')}
                title={t('modelsDocs')}
              >
                {/* Cherry's FileText docs glyph. */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
                  <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                </svg>
              </a>
            )}
          {props.overridden === true && props.onReset !== undefined
            ? (
              <button
                type="button"
                className={styles['linkButton']}
                disabled={disabled}
                onClick={props.onReset}
              >
                {t('resetModels')}
              </button>
            )
            : null}
          {models.length > 4
            ? (
              <button
                type="button"
                className={styles['iconButton']}
                aria-label={t('searchModels')}
                aria-expanded={searchOpen}
                title={t('searchModels')}
                onClick={() => {
                  setSearchOpen(open => !open)
                  if (searchOpen) setSearchText('')
                }}
              >
                <IconSearch />
              </button>
            )
            : null}
          {grouped.length > 1
            ? (
              <button
                type="button"
                className={styles['iconButton']}
                aria-label={t(allCollapsed ? 'expandAll' : 'collapseAll')}
                aria-expanded={!allCollapsed}
                title={t(allCollapsed ? 'expandAll' : 'collapseAll')}
                onClick={() => {
                  setAllCollapsed(collapsed => !collapsed)
                  setCollapsedGroups(new Set())
                }}
              >
                {/* Cherry's chevrons-up-down glyph. */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m7 15 5 5 5-5" />
                  <path d="m7 9 5-5 5 5" />
                </svg>
              </button>
            )
            : null}
          <button
            type="button"
            className={styles['fetchButton']}
            disabled={disabled || busy || !askable || props.probeBlocked !== undefined}
            title={props.probeBlocked !== undefined
              ? t(props.probeBlocked)
              : askable ? undefined : t('fetchNeedsBaseUrl')}
            onClick={() => { void fetchModels() }}
          >
            <IconRefresh />
            {busy ? t('fetching') : t('fetchModels')}
          </button>
          <button
            type="button"
            className={styles['iconButton']}
            aria-label={t('addModel')}
            title={t('addModel')}
            disabled={disabled}
            onClick={() => {
              onChange([...models, { id: '' }])
              setExpanded(current => new Set([...current, models.length]))
            }}
          >
            <IconPlus />
          </button>
        </div>
      </div>
      {searchOpen && models.length > 4
        ? (
          <input
            className={`${styles['input']} ${styles['modelSearchInput']}`}
            type="text"
            value={searchText}
            placeholder={t('searchModels')}
            aria-label={t('searchModels')}
            onChange={(event) => { setSearchText(event.target.value) }}
          />
        )
        : null}
      {models.length === 0 ? <p className={styles['modelEmpty']}>{t('modelsEmpty')}</p> : null}
      {(() => {
        const renderRow = ({ model, index }: { model: ModelDraft; index: number }): ReactNode => {
          const rowId = textOf(model, 'id')
          const isDefaultRow = props.defaultModel?.provider === probe.provider
            && props.defaultModel?.model === rowId
          return (
          <div key={index} className={styles['modelEntry']}>
            <div className={styles['modelRow']}>
              {/* Cherry model rows carry the provider brand in a 26px bordered circle. */}
              {probe.provider === undefined
                ? (
                  <span className={styles['modelAvatar']} aria-hidden>
                    {(textOf(model, 'name') || rowId).charAt(0).toUpperCase() || '?'}
                  </span>
                )
                : <ProviderAvatar providerId={probe.provider} name={probe.provider} size={26} className={styles['modelAvatarBrand']} />}
              <input
                className={styles['modelIdInput']}
                type="text"
                value={textOf(model, 'id')}
                placeholder={t('modelId')}
                aria-label={`${t('modelId')} ${index + 1}`}
                disabled={disabled}
                onChange={(event) => { patch(index, { id: event.target.value }) }}
              />
              <button
                type="button"
                className={styles['iconButton']}
                aria-label={`${t('disableModel')} ${index + 1}`}
                title={t('disableModel')}
                disabled={disabled}
                onClick={() => { removeAt(index) }}
              >
                <IconEyeOpen />
              </button>
              {props.onSetDefault !== undefined && textOf(model, 'id').length > 0
                ? (
                  <button
                    type="button"
                    className={`${styles['iconButton']} ${isDefaultRow ? styles['defaultMarker'] : ''}`}
                    aria-label={`${t('setAsDefault')} ${index + 1}`}
                    aria-pressed={isDefaultRow}
                    title={t('setAsDefault')}
                    onClick={() => { props.onSetDefault?.(textOf(model, 'id')) }}
                  >
                    <IconBrush />
                  </button>
                )
                : null}
              <button
                type="button"
                className={styles['iconButton']}
                aria-label={`${t('modelAdvanced')} ${index + 1}`}
                aria-expanded={expanded.has(index)}
                title={t('modelAdvanced')}
                onClick={() => { toggleExpanded(index) }}
              >
                <IconChevron open={expanded.has(index)} />
              </button>
              <button
                type="button"
                className={`${styles['iconButton']} ${styles['iconButtonDanger']}`}
                aria-label={`${t('removeModel')} ${index + 1}`}
                title={t('removeModel')}
                disabled={disabled}
                onClick={() => { removeAt(index) }}
              >
                <IconMinus />
              </button>
            </div>
            {expanded.has(index)
              ? (
                <div className={styles['modelAdvanced']}>
                  <label className={styles['modelField']}>
                    <span className={styles['modelFieldLabel']}>{t('modelName')}</span>
                    <input
                      className={styles['input']}
                      type="text"
                      value={textOf(model, 'name')}
                      placeholder={t('modelNamePlaceholder')}
                      aria-label={`${t('modelName')} ${index + 1}`}
                      disabled={disabled}
                      onChange={(event) => { patch(index, { name: event.target.value === '' ? undefined : event.target.value }) }}
                    />
                  </label>
                  <label className={styles['modelField']}>
                    <span className={styles['modelFieldLabel']}>{t('modelContextWindow')}</span>
                    <input
                      className={styles['input']}
                      type="text"
                      inputMode="numeric"
                      value={capacityText(model, index, 'contextWindow')}
                      placeholder={CAPACITY_HINT.contextWindow}
                      aria-label={`${t('modelContextWindow')} ${index + 1}`}
                      disabled={disabled}
                      onChange={(event) => { editCapacity(index, 'contextWindow', event.target.value) }}
                    />
                  </label>
                  <label className={styles['modelField']}>
                    <span className={styles['modelFieldLabel']}>{t('modelMaxTokens')}</span>
                    <input
                      className={styles['input']}
                      type="text"
                      inputMode="numeric"
                      value={capacityText(model, index, 'maxTokens')}
                      placeholder={CAPACITY_HINT.maxTokens}
                      aria-label={`${t('modelMaxTokens')} ${index + 1}`}
                      disabled={disabled}
                      onChange={(event) => { editCapacity(index, 'maxTokens', event.target.value) }}
                    />
                  </label>
                </div>
              )
              : null}
          </div>
          )
        }
        const searching = keyword.length > 0
        // A lone unnamed bucket stays flat — a three-model catalog needs no
        // collapsible chrome. Named groups always get their header.
        const showHeaders = !(grouped.length === 1 && grouped[0]![0] === UNGROUPED_MODEL_GROUP_KEY)
        return grouped.map(([key, rows]) => {
          const collapsed = !searching && (allCollapsed || collapsedGroups.has(key))
          const label = key === UNGROUPED_MODEL_GROUP_KEY ? t('modelGroupUngrouped') : key
          if (!showHeaders) return <div key={key} className={styles['modelGroupBody']}>{rows.map(renderRow)}</div>
          return (
            <div key={key} className={styles['modelGroup']}>
              <button
                type="button"
                className={styles['modelGroupHeader']}
                aria-expanded={!collapsed}
                onClick={() => {
                  setAllCollapsed(false)
                  setCollapsedGroups((current) => {
                    const next = new Set(current)
                    if (!next.delete(key)) next.add(key)
                    return next
                  })
                }}
              >
                <IconChevron open={!collapsed} />
                <span className={styles['modelGroupTitle']}>{label}</span>
                <span className={styles['modelGroupCount']}>{rows.length}</span>
              </button>
              {collapsed
                ? null
                : <div className={styles['modelGroupBody']}>{rows.map(renderRow)}</div>}
            </div>
          )
        })
      })()}
      {props.catalogModels === undefined || props.catalogModels.length === 0
        ? null
        : (() => {
          const known = new Set(models.map(model => textOf(model, 'id')).filter(id => id.length > 0))
          const offCatalog = props.catalogModels.filter(candidate => !known.has(candidate.id))
          if (offCatalog.length === 0) return null
          return (
            <div className={styles['modelGroup']}>
              <div className={styles['modelGroupHeader']} aria-hidden>
                <IconEyeClosed />
                <span className={styles['modelGroupTitle']}>{t('modelsDisabled')}</span>
                <span className={styles['modelCountBadge']}>{offCatalog.length}</span>
              </div>
              <div className={styles['modelGroupBody']}>
                {offCatalog.map(candidate => (
                  <div key={candidate.id} className={styles['modelEntry']}>
                    <div className={`${styles['modelRow']} ${styles['modelRowDisabled']}`}>
                      <span className={styles['modelAvatar']} aria-hidden>
                        {(candidate.name ?? candidate.id).charAt(0).toUpperCase() || '?'}
                      </span>
                      <span className={styles['modelDisabledId']}>{candidate.id}</span>
                      <button
                        type="button"
                        className={styles['iconButton']}
                        aria-label={`${t('enableModel')} ${candidate.id}`}
                        title={t('enableModel')}
                        disabled={props.disabled}
                        onClick={() => {
                          onChange([...models, {
                            id: candidate.id,
                            ...(candidate.name === undefined ? {} : { name: candidate.name }),
                          }])
                        }}
                      >
                        <IconEyeClosed />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      {failure !== undefined ? <p className={styles['error']}>{failure}</p> : null}
      <Modal
        open={candidates !== undefined}
        onClose={closePicker}
        title={t('fetchTitle')}
        closeLabel={t('close')}
        description={t('fetchDescription')}
        className={styles['fetchDialog'] as string}
        footer={(
          <>
            <Button variant="outline" onClick={closePicker}>{t('cancel')}</Button>
            <Button variant="outline" onClick={adoptPicked}>{t('fetchAdopt')}</Button>
          </>
        )}
      >
        <ul className={styles['candidateList']}>
          {(candidates ?? []).map(candidate => (
            <li key={candidate.id} className={styles['candidate']}>
              <label className={styles['candidateLabel']}>
                <input
                  type="checkbox"
                  checked={picked.has(candidate.id)}
                  onChange={() => { toggle(candidate.id) }}
                />
                {/* The id alone: it is the string adoption writes, and the
                    capacities the endpoint reported are adopted with it and
                    editable in the row that appears. */}
                <span className={styles['candidateId']}>{candidate.id}</span>
              </label>
            </li>
          ))}
        </ul>
      </Modal>
    </section>
  )
}
