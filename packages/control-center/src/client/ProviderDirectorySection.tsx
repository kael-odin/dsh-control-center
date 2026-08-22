/**
 * Model Services section — the Cherry-parity two-pane provider directory.
 *
 * Left pane: the static 61-preset Cherry catalog (grouped 国内/国际/本地) plus
 * every provider the host `llm` directory already knows (pi-ai catalog routes
 * and user-declared ones, grouped 自定义), with search and a persisted
 * selection. Right pane: the selected provider's editor, seeded from the
 * preset so a fresh pick is one key away from a complete profile.
 *
 * The catalog is deliberately client-side, not registered into the host
 * directory: the harness's `llm-pi-ai` adapter already owns ~37 routes and
 * re-declares any profile written to its namespace, so a control-center
 * registration would collide with it. A preset is shown as configurable, and
 * configuring it writes the same `llm-pi-ai.providers.<id>` profile a
 * `settings.yaml` `llm-pi-ai:` section writes — the DSH preset method and this
 * surface are the same storage, so they cannot conflict. Configured state is
 * joined from `llm.providers()` and is always real.
 */

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import { CustomProviderCard } from './CustomProviderCard.tsx'
import { ProviderEditor } from './ProviderEditor.tsx'
import {
  PI_AI_SHIPPED_PRESET_IDS, PROVIDER_PRESETS, presetApiOf, type ProviderPreset,
} from './provider-presets.ts'
import { providerCopy, type ProviderIdentity } from './ModelsSection.tsx'
import type { ModelsSettingsState, ModelsSettingsStore, ProviderRow } from './store.ts'
import { protocolChoices } from './store.ts'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import type { en } from './locales.ts'
import styles from './ProviderDirectorySection.module.css'

/** The settings namespace every Cherry preset writes its profile into. */
const NS = 'llm-pi-ai'

/** localStorage key for the persisted selection (Cherry's key name). */
const LAST_SELECTED_KEY = 'settings.provider.last_selected_provider_id'

/** One left-pane entry: a Cherry preset or a host-known provider. */
interface DirectoryEntry {
  /** Provider route id. */
  provider: string
  /** Human-facing name (Cherry name for presets, the directory's otherwise). */
  displayName: string
  /** Left-pane grouping. */
  group: 'domestic' | 'international' | 'local' | 'custom'
  /** The preset behind this entry, when it is a Cherry preset. */
  preset?: ProviderPreset
  /** The host directory row for this route, when it is configured. */
  row?: ProviderRow
}

/** Injected dependencies of {@link ProviderDirectorySection}. */
export interface ProviderDirectorySectionInjected {
  controller: ModelsSettingsStore
  useSnapshot: SnapshotSelectorHook<ModelsSettingsState>
  api: Pick<IApiClient, 'settings' | 'credentials' | 'llm'>
  schema: SettingsSchemaOperations
  t: (key: keyof typeof en) => string
}

/** Props delivered by the slot outlet (partial until injected). */
export type ProviderDirectorySectionProps = Partial<ProviderDirectorySectionInjected>

/** A stable selection identity for notices and editor targets. */
interface SelectedIdentity extends ProviderIdentity {
  settingsNs: string
  settingsPath: readonly string[]
  declared?: boolean
  defaults?: { baseURL?: string; api?: string }
}

export function identityOf(entry: DirectoryEntry): SelectedIdentity {
  const row = entry.row
  return {
    provider: entry.provider,
    displayName: entry.displayName,
    settingsNs: row?.entry.settingsNs ?? NS,
    settingsPath: row !== undefined && row.entry.settingsPath.length > 0
      ? row.entry.settingsPath
      : ['providers', entry.provider],
    // Once configured the directory's answer wins; a fresh preset uses the
    // client-side heuristic (pi-ai ships its own catalog routes).
    ...row?.entry.declared !== undefined
      ? { declared: row.entry.declared }
      : entry.preset !== undefined && !PI_AI_SHIPPED_PRESET_IDS.has(entry.provider)
        ? { declared: true }
        : {},
    ...entry.preset === undefined ? {} : {
      defaults: {
        baseURL: entry.preset.baseURL,
        api: presetApiOf(entry.preset.type),
      },
    },
  }
}

/** Build the left-pane directory: the 61 presets joined with host rows, then
 * every host row whose route is not a preset (custom/pi-ai extras). */
export function buildDirectory(rows: readonly ProviderRow[]): readonly DirectoryEntry[] {
  const presetById = new Map(PROVIDER_PRESETS.map(preset => [preset.id, preset]))
  const rowsByProvider = new Map(rows.map(row => [row.entry.provider, row]))
  const entries: DirectoryEntry[] = []
  for (const preset of PROVIDER_PRESETS) {
    const row = rowsByProvider.get(preset.id)
    entries.push({
      provider: preset.id,
      displayName: preset.name,
      group: preset.group,
      preset,
      ...(row === undefined ? {} : { row }),
    })
  }
  for (const row of rows) {
    if (presetById.has(row.entry.provider)) continue
    entries.push({
      provider: row.entry.provider,
      displayName: row.entry.displayName,
      group: 'custom',
      row,
    })
  }
  return entries
}

/**
 * Render the Model Services section.
 * @param props - slot-delivered injected dependencies.
 * @returns the section, or null while the shell has not injected yet.
 */
export function ProviderDirectorySection(props: ProviderDirectorySectionProps): ReactNode {
  const { controller, useSnapshot, api, schema, t } = props
  if (controller === undefined || useSnapshot === undefined || api === undefined || t === undefined || schema === undefined) return null
  return <Loaded injected={{ controller, useSnapshot, api, schema, t }} />
}

function Loaded({ injected }: { injected: ProviderDirectorySectionInjected }): ReactNode {
  const { controller, api, t, schema } = injected
  const state = injected.useSnapshot(snapshot => snapshot)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | undefined>(() => {
    try {
      return window.localStorage.getItem(LAST_SELECTED_KEY) ?? undefined
    } catch {
      return undefined
    }
  })
  const [declaring, setDeclaring] = useState(false)
  const [savedTarget, setSavedTarget] = useState<ProviderIdentity | undefined>(undefined)

  if (state.status === 'idle') void controller.load()
  if (state.status === 'error') {
    /* v8 ignore next -- an error status always carries text */
    const errorText = state.error ?? ''
    return (
      <div className={styles['error']}>
        <p>{`${t('loadFailed')}: ${errorText}`}</p>
        <button type="button" className={styles['secondaryButton']} onClick={() => { void controller.load() }}>
          {t('retry')}
        </button>
      </div>
    )
  }

  const directory = useMemo(() => buildDirectory(state.rows), [state.rows])
  const filtered = useMemo(() => {
    if (search.trim().length === 0) return directory
    const keywords = search.toLowerCase().split(/\s+/).filter(Boolean)
    return directory.filter(entry => keywords.every(kw =>
      entry.provider.toLowerCase().includes(kw) || entry.displayName.toLowerCase().includes(kw)))
  }, [directory, search])

  const selected = selectedId === undefined ? undefined : directory.find(entry => entry.provider === selectedId)
  // A selection that no longer exists (renamed or removed) falls back to the
  // first entry rather than leaving the right pane empty.
  const effective = selected ?? filtered[0]

  const select = (provider: string): void => {
    setSelectedId(provider)
    setSavedTarget(undefined)
    try {
      window.localStorage.setItem(LAST_SELECTED_KEY, provider)
    } catch {
      // Persisting the selection is a nicety; a storage failure changes nothing.
    }
  }

  const groups: ReadonlyArray<{ id: DirectoryEntry['group']; label: string; entries: readonly DirectoryEntry[] }> = [
    { id: 'domestic' as const, label: t('groupDomestic'), entries: filtered.filter(e => e.group === 'domestic') },
    { id: 'international' as const, label: t('groupInternational'), entries: filtered.filter(e => e.group === 'international') },
    { id: 'local' as const, label: t('groupLocal'), entries: filtered.filter(e => e.group === 'local') },
    { id: 'custom' as const, label: t('groupCustom'), entries: filtered.filter(e => e.group === 'custom') },
  ].filter(group => group.entries.length > 0)

  const namespace = state.namespaces.get(NS)
  const protocols = protocolChoices(state.namespaces.get(NS), schema)
  const editTarget = effective === undefined ? undefined : identityOf(effective)

  const announceSaved = (target: ProviderIdentity): void => {
    void controller.load().then(() => { setSavedTarget(target) })
  }

  /** Preset types whose native endpoint cannot speak an OpenAI protocol. */
  const protocolLimitedType = (preset?: { type: string }): 'iam' | 'protocol' | undefined => {
    if (preset === undefined) return undefined
    if (preset.type === 'google' || preset.type === 'azure') return 'iam'
    if (preset.type === 'ollama') return 'protocol'
    return undefined
  }

  return (
    <div className={styles['section']}>
      <p className={styles['intro']}>{t('directoryIntro')}</p>
      <div className={styles['split']}>
        {/* Left pane: provider list */}
        <aside className={styles['list']}>
          <div className={styles['listHeader']}>
            <input
              className={styles['searchInput']}
              type="text"
              value={search}
              placeholder={t('searchProviders')}
              aria-label={t('searchProviders')}
              onChange={(event) => { setSearch(event.target.value) }}
            />
          </div>
          <div className={styles['listScroll']}>
            {filtered.length === 0
              ? <p className={styles['emptyList']}>{t('noMatchingProviders')}</p>
              : groups.map(group => (
                <section key={group.id} className={styles['group']}>
                  <h3 className={styles['groupTitle']}>{group.label}</h3>
                  <ul className={styles['groupRows']}>
                    {group.entries.map(entry => {
                      const configured = entry.row?.configured === true
                      const active = entry.row?.entry.active === true
                      const credentialConfigured = entry.row?.credential?.configured === true
                      return (
                        <li key={entry.provider}>
                          <button
                            type="button"
                            className={`${styles['listItem']} ${entry.provider === effective?.provider ? styles['listItemSelected'] : ''}`}
                            aria-pressed={entry.provider === effective?.provider}
                            onClick={() => { select(entry.provider) }}
                          >
                            <span className={styles['listItemName']}>{entry.displayName}</span>
                            {configured
                              ? (
                                <span
                                  className={`${styles['dot']} ${credentialConfigured ? styles['dotConfigured'] : styles['dotMissing']}`}
                                  role="img"
                                  aria-label={credentialConfigured ? t('credentialConfigured') : t('credentialMissing')}
                                  title={credentialConfigured ? t('credentialConfigured') : t('credentialMissing')}
                                />
                              )
                              : active
                                ? <span className={styles['dotActive']} role="img" aria-label={t('activeProvider')} title={t('activeProvider')} />
                                : null}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
          </div>
          <div className={styles['listFooter']}>
            <button
              type="button"
              className={styles['addCustomButton']}
              disabled={!state.writable}
              onClick={() => {
                setDeclaring(true)
                setSavedTarget(undefined)
              }}
            >
              {t('customAdd')}
            </button>
          </div>
        </aside>

        {/* Right pane: provider setting */}
        <main className={styles['detail']}>
          {declaring
            ? (
              <div className={styles['editorWrap']}>
                <CustomProviderCard
                  taken={state.rows.map(row => row.entry.provider)}
                  protocols={protocols}
                  /* v8 ignore next -- the card only opens from a button that requires the namespace */
                  revision={state.namespaces.get(NS)?.revision ?? 0}
                  api={api}
                  t={t}
                  readOnly={!state.writable}
                  onClose={(changed) => {
                    setDeclaring(false)
                    if (changed) void controller.load()
                  }}
                />
              </div>
            )
            : effective === undefined || editTarget === undefined
              ? (
                <div className={styles['emptyDetail']}>
                  <p className={styles['emptyTitle']}>{t('selectProvider')}</p>
                  <p className={styles['emptyHint']}>{t('selectProviderHint')}</p>
                </div>
              )
              : (
                <div className={styles['detailScroll']}>
                  <div className={styles['detailContent']}>
                    {savedTarget === undefined
                      ? null
                      : (
                        <p className={styles['savedNotice']} role="status" aria-live="polite">
                          {providerCopy(t('savedProvider'), savedTarget)}
                        </p>
                      )}
                    <header className={styles['detailHeader']}>
                      <div className={styles['detailHeaderMain']}>
                        <span className={styles['detailTitle']}>{effective.displayName}</span>
                        {effective.provider !== effective.displayName
                          ? <span className={styles['detailRoute']}>{effective.provider}</span>
                          : null}
                        {editTarget.declared === true ? <span className={styles['customTag']}>{t('customTag')}</span> : null}
                        {effective.row?.entry.active === true
                          ? <span className={styles['activeTag']}>{t('activeProvider')}</span>
                          : null}
                      </div>
                    </header>
                    {protocolLimitedType(effective.preset) === 'iam'
                      ? <p className={styles['notice']}>{t('presetIamNote')}</p>
                      : protocolLimitedType(effective.preset) === 'protocol'
                        ? <p className={styles['notice']}>{t('presetProtocolNote')}</p>
                        : null}
                    {namespace === undefined
                      ? <p className={styles['error']}>{`${effective.displayName}: ${NS} settings are unavailable`}</p>
                      : (
                        <div className={styles['editorWrap']}>
                          <ProviderEditor
                            key={editTarget.provider}
                            provider={editTarget.provider}
                            displayName={editTarget.displayName}
                            hideTitle
                            {...editTarget.declared === true ? { declared: true } : {}}
                            {...editTarget.defaults === undefined ? {} : { defaults: editTarget.defaults }}
                            namespace={namespace}
                            settingsPath={editTarget.settingsPath}
                            api={api}
                            t={t}
                            schema={schema}
                            readOnly={!state.writable}
                            onClose={(changed) => { if (changed) announceSaved(editTarget) }}
                          />
                        </div>
                      )}
                  </div>
                </div>
              )}
        </main>
      </div>
    </div>
  )
}
