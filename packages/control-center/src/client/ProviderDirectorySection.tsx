/**
 * Model Services section — the Cherry-parity two-pane provider directory.
 *
 * Left pane: the static 61-preset Cherry catalog plus every provider the host
 * `llm` directory already knows (pi-ai catalog routes and user-declared ones),
 * rendered flat exactly like Cherry's list — brand avatar, name, enabled dot —
 * with search and a persisted selection. Right pane: the selected provider's
 * header (avatar, name, real enable Switch) above an always-expanded editor
 * seeded from the preset, so a fresh pick is one key away from a complete
 * profile.
 *
 * The catalog is deliberately client-side, not registered into the host
 * directory: the harness's `llm-pi-ai` adapter already owns ~37 routes and
 * re-declares any profile written to its namespace, so a control-center
 * registration would collide with it. A preset is shown as configurable, and
 * configuring it writes the same `llm-pi-ai.providers.<id>` profile a
 * `settings.yaml` `llm-pi-ai:` section writes — the DSH preset method and this
 * surface are the same storage, so they cannot conflict. Configured state is
 * joined from `llm.providers()` and is always real.
 *
 * The enable Switch is honest by construction: disabling moves the live
 * profile into the `control-center-provider-stash` namespace before unsetting
 * it (the adapter genuinely stops serving the route), and enabling writes the
 * stashed profile back. Nothing pretends to disable while the route still
 * serves.
 */

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import { Button, Menu, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { CustomProviderCard } from './CustomProviderCard.tsx'
import { ProviderEditor } from './ProviderEditor.tsx'
import { removeProviderProfile } from './ModelsSection.tsx'
import {
  PI_AI_SHIPPED_PRESET_IDS, PROVIDER_PRESETS, presetApiOf, type ProviderPreset,
} from './provider-presets.ts'
import { providerIconSvg } from './provider-icons-data.ts'
import { providerCopy, type ProviderIdentity } from './ModelsSection.tsx'
import type { ModelsSettingsState, ModelsSettingsStore, ProviderRow } from './store.ts'
import { messageOf, protocolChoices } from './store.ts'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import type { en } from './locales.ts'
import styles from './ProviderDirectorySection.module.css'

/** The settings namespace every Cherry preset writes its profile into. */
const NS = 'llm-pi-ai'
/** Where a disabled provider's full profile waits for its re-enable. */
export const STASH_NS = 'control-center-provider-stash'

/** localStorage key for the persisted selection (Cherry's key name). */
const LAST_SELECTED_KEY = 'settings.provider.last_selected_provider_id'

/** One left-pane entry: a Cherry preset or a host-known provider. */
interface DirectoryEntry {
  /** Provider route id. */
  provider: string
  /** Human-facing name (Cherry name for presets, the directory's otherwise). */
  displayName: string
  /** The preset behind this entry, when it is a Cherry preset. */
  preset?: ProviderPreset
  /** The host directory row for this route, when it is currently live. */
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
  website?: string
  helpLinks?: { apiKeyUrl?: string }
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
      ...entry.preset.website === undefined || entry.preset.website.length === 0 ? {} : { website: entry.preset.website },
      ...entry.preset.apiUrl === undefined ? {} : { helpLinks: { apiKeyUrl: entry.preset.apiUrl } },
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
      preset,
      ...(row === undefined ? {} : { row }),
    })
  }
  for (const row of rows) {
    if (presetById.has(row.entry.provider)) continue
    entries.push({
      provider: row.entry.provider,
      displayName: row.entry.displayName,
      row,
    })
  }
  return entries
}

/** Cherry-style brand avatar; falls back to the leading letter when the icon
 * registry has no glyph for the id. */
function ProviderAvatar({ providerId, name }: { providerId: string; name: string }): ReactNode {
  const glyph = providerIconSvg(providerId, 26)
  if (glyph !== '') {
    return (
      <span
        className={styles['avatar']}
        dangerouslySetInnerHTML={{ __html: glyph }}
      />
    )
  }
  return <span className={styles['avatar']} data-letter>{name.charAt(0).toUpperCase() || '?'}</span>
}

/**
 * An accessible pill switch (the primitives package ships none). Real state
 * lives with the caller; this renders and clicks.
 */
function EnableSwitch({ checked, disabled, title, onChange }: {
  checked: boolean
  disabled?: boolean
  title?: string | undefined
  onChange: (next: boolean) => void
}): ReactNode {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      title={title}
      className={`${styles['switch']} ${checked ? styles['switchOn'] : ''}`}
      disabled={disabled}
      onClick={() => { onChange(!checked) }}
    >
      <span className={styles['switchThumb']} />
    </button>
  )
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
  const [toggleFailure, setToggleFailure] = useState<string | undefined>(undefined)
  const [toggling, setToggling] = useState(false)
  const [menuFor, setMenuFor] = useState<string | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<DirectoryEntry | undefined>(undefined)
  const [deleting, setDeleting] = useState(false)

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

  const namespace = state.namespaces.get(NS)
  const stashView = state.namespaces.get(STASH_NS)
  const protocols = protocolChoices(namespace, schema)
  const editTarget = effective === undefined ? undefined : identityOf(effective)

  const announceSaved = (target: ProviderIdentity): void => {
    void controller.load().then(() => { setSavedTarget(target) })
  }

  /**
   * Whether this route CAN be toggled at all. A live or stashed profile is
   * always toggleable; a never-configured route only when the adapter ships
   * its catalog (an empty profile is serviceable there). A whole-section
   * route (`llm-deepseek`, no sub-path) is composition-owned and stays out of
   * reach — unsetting it here would tear down the deployment's own section.
   */
  const toggleStateOf = (entry: DirectoryEntry): { enabled: boolean; canToggle: boolean } => {
    const live = entry.row?.configured === true
      && entry.row.entry.settingsPath.length > 0
    const stashed = stashView !== undefined
      && schema.getPath(stashView.value, ['providers', entry.provider]) !== undefined
    if (live) return { enabled: true, canToggle: true }
    if (stashed) return { enabled: false, canToggle: true }
    const shippable = entry.row?.entry.settingsPath.length !== 0
      && (entry.preset !== undefined && PI_AI_SHIPPED_PRESET_IDS.has(entry.provider))
    return { enabled: false, canToggle: shippable }
  }

  /**
   * Flip the Switch. Disable stashes the full profile FIRST (a crash between
   * the two writes leaves both copies — harmless), then unsets the live route;
   * enable restores the stashed profile FIRST, then clears the stash. Each
   * write carries the revision its namespace answered with, so the pair is
   * conflict-safe without locking.
   */
  const toggleEnabled = async (entry: DirectoryEntry, next: boolean): Promise<void> => {
    if (namespace === undefined || stashView === undefined) return
    const target = identityOf(entry)
    if (target.settingsNs !== NS) return
    setToggling(true)
    setToggleFailure(undefined)
    try {
      const path = [...target.settingsPath]
      const liveValue = schema.getPath(namespace.value, path)
      const stashedValue = schema.getPath(stashView.value, path)
      if (!next) {
        if (liveValue === undefined) return
        const stashed = await api.settings.mutate({
          ns: STASH_NS,
          expectedRevision: stashView.revision,
          ops: [{ op: 'set', path, value: structuredClone(liveValue) }],
        })
        if (!stashed.result.ok) {
          setToggleFailure(stashed.result.error.message)
          return
        }
        const unset = await api.settings.mutate({
          ns: NS,
          expectedRevision: stashed.result.value.revision,
          ops: [{ op: 'unset', path }],
        })
        if (!unset.result.ok) {
          setToggleFailure(unset.result.error.message)
          return
        }
      } else {
        if (stashedValue === undefined) {
          // A shipped catalog route enables bare: pi-ai serves its own
          // installed catalog for an empty profile.
          const created = await api.settings.mutate({
            ns: NS,
            expectedRevision: namespace.revision,
            ops: [{ op: 'set', path, value: {} }],
          })
          if (!created.result.ok) {
            setToggleFailure(created.result.error.message)
            return
          }
        } else {
          const restored = await api.settings.mutate({
            ns: NS,
            expectedRevision: namespace.revision,
            ops: [{ op: 'set', path, value: structuredClone(stashedValue) }],
          })
          if (!restored.result.ok) {
            setToggleFailure(restored.result.error.message)
            return
          }
          const cleared = await api.settings.mutate({
            ns: STASH_NS,
            expectedRevision: restored.result.value.revision,
            ops: [{ op: 'unset', path }],
          })
          if (!cleared.result.ok) {
            setToggleFailure(cleared.result.error.message)
            return
          }
        }
      }
      await controller.load()
    } catch (error) {
      setToggleFailure(messageOf(error))
    } finally {
      setToggling(false)
    }
  }

  /**
   * Remove a provider's stored presence: managed credential first (so a
   * second-step failure leaves the row retryable), then the live profile,
   * then any stashed copy. A catalog preset stays listed afterwards — it is a
   * directory entry, not user data — but it is unconfigured again.
   */
  const deleteProvider = async (entry: DirectoryEntry): Promise<void> => {
    const target = identityOf(entry)
    const liveRow = entry.row
    const managedRef = target.settingsNs === NS && liveRow?.apiKeyEnv !== undefined
      && liveRow.credential?.configured === true && liveRow.credential.writable === true
      ? liveRow.apiKeyEnv
      : undefined
    setDeleting(true)
    try {
      const failure = await removeProviderProfile(api, controller, {
        settingsNs: target.settingsNs,
        settingsPath: target.settingsPath,
        ...(managedRef === undefined ? {} : { credentialRef: managedRef }),
      })
      if (failure !== undefined) {
        setToggleFailure(failure)
        return
      }
      if (stashView !== undefined) {
        const cleared = await api.settings.mutate({
          ns: STASH_NS,
          expectedRevision: stashView.revision,
          ops: [{ op: 'unset', path: ['providers', entry.provider] }],
        })
        if (!cleared.result.ok) {
          setToggleFailure(cleared.result.error.message)
          return
        }
      }
      await controller.load()
      setDeleteTarget(undefined)
    } catch (error) {
      setToggleFailure(messageOf(error))
    } finally {
      setDeleting(false)
    }
  }

  /** Preset types whose native endpoint cannot speak an OpenAI protocol. */
  const protocolLimitedType = (preset?: ProviderPreset): 'iam' | 'protocol' | undefined => {
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
            {search.length === 0
              ? null
              : (
                <button
                  type="button"
                  className={styles['searchClear']}
                  aria-label={t('cancel')}
                  onClick={() => { setSearch('') }}
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
          </div>
          <div className={styles['listScroll']}>
            {filtered.length === 0
              ? <p className={styles['emptyList']}>{t('noMatchingProviders')}</p>
              : (
                <ul className={styles['groupRows']}>
                  {filtered.map(entry => {
                    const { enabled } = toggleStateOf(entry)
                    const isSelected = entry.provider === effective?.provider
                    const canDelete = entry.row?.configured === true && entry.row.entry.settingsPath.length > 0
                      || (stashView !== undefined
                        && schema.getPath(stashView.value, ['providers', entry.provider]) !== undefined)
                    return (
                      <li key={entry.provider}>
                        {/* A div row, not a button: the kebab inside must be a
                            real button, and nested buttons are invalid HTML —
                            the same trade Cherry makes, with the same keyboard
                            guard. */}
                        <div
                          role="button"
                          tabIndex={0}
                          className={`${styles['listItem']} ${isSelected ? styles['listItemSelected'] : ''} ${enabled ? '' : styles['listItemDisabled']}`}
                          aria-pressed={isSelected}
                          onClick={() => { select(entry.provider) }}
                          onKeyDown={(event) => {
                            if (event.currentTarget !== event.target) return
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              select(entry.provider)
                            }
                          }}
                        >
                          <span className={styles['listItemMain']}>
                            <ProviderAvatar providerId={entry.provider} name={entry.displayName} />
                            <span className={styles['listItemName']}>{entry.displayName}</span>
                            {/* Cherry tags exactly one catalog entry this way. */}
                            {entry.provider === 'radeon-cloud'
                              ? <span className={styles['freeBadge']}>{t('freeBadge')}</span>
                              : null}
                          </span>
                          {/* Cherry's enabled dot yields its slot on hover; our
                              rows carry nothing else there, so it just shows. */}
                          {enabled
                            ? <span className={styles['enabledDot']} role="img" aria-label={t('activeProvider')} title={t('activeProvider')} />
                            : null}
                          <span className={styles['kebabSlot']} onClick={(event) => { event.stopPropagation() }}>
                            <Menu
                              open={menuFor === entry.provider}
                              anchor={(
                                <button
                                  type="button"
                                  className={styles['kebabButton']}
                                  aria-label={providerCopy(t('editProvider'), { provider: entry.provider, displayName: entry.displayName })}
                                  title={t('edit')}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setMenuFor(open => open === entry.provider ? undefined : entry.provider)
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                    <circle cx="12" cy="5" r="1.6" />
                                    <circle cx="12" cy="12" r="1.6" />
                                    <circle cx="12" cy="19" r="1.6" />
                                  </svg>
                                </button>
                              )}
                              portal
                              align="end"
                              items={[
                                { id: 'edit', label: t('edit') },
                                { id: 'delete', label: t('remove'), danger: true, disabled: !canDelete },
                              ]}
                              onSelect={(id) => {
                                setMenuFor(undefined)
                                if (id === 'edit') select(entry.provider)
                                if (id === 'delete') {
                                  setSavedTarget(undefined)
                                  setToggleFailure(undefined)
                                  setDeleteTarget(entry)
                                }
                              }}
                              onClose={() => { setMenuFor(undefined) }}
                            />
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              {t('customAdd')}
            </button>
          </div>
        </aside>

        {/* Right pane: provider setting */}
        <main className={styles['detail']}>
          {declaring
            ? (
              <div className={styles['detailScroll']}>
                <div className={styles['detailContent']}>
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
              </div>
            )
            : effective === undefined || editTarget === undefined
              ? (
                <div className={styles['emptyDetail']}>
                  <p className={styles['emptyTitle']}>{t('selectProvider')}</p>
                  <p className={styles['emptyHint']}>{t('selectProviderHint')}</p>
                </div>
              )
              : (() => {
                const toggleState = toggleStateOf(effective)
                const identityLabel = { provider: effective.provider, displayName: effective.displayName }
                return (
                  <div className={styles['detailScroll']}>
                    <header className={styles['detailHeader']}>
                      <div className={styles['detailHeaderMain']}>
                        <ProviderAvatar providerId={effective.provider} name={effective.displayName} />
                        {/* Cherry links the provider name to its official site. */}
                        {editTarget.website === undefined
                          ? <span className={styles['detailTitle']}>{effective.displayName}</span>
                          : (
                            <a
                              className={styles['detailTitle']}
                              href={editTarget.website}
                              target="_blank"
                              rel="noreferrer"
                              title={editTarget.website}
                            >
                              {effective.displayName}
                            </a>
                          )}
                        {effective.provider !== effective.displayName
                          ? <span className={styles['detailRoute']}>{effective.provider}</span>
                          : null}
                        {editTarget.declared === true ? <span className={styles['customTag']}>{t('customTag')}</span> : null}
                        {!toggleState.enabled && toggleState.canToggle
                          ? <span className={styles['disabledTag']}>{t('providerDisabled')}</span>
                          : null}
                      </div>
                      <EnableSwitch
                        checked={toggleState.enabled}
                        disabled={!state.writable || toggling || !toggleState.canToggle}
                        title={editTarget.settingsNs !== NS
                          ? t('advancedHint')
                          : toggleState.canToggle ? undefined : t('enableNeedsProfile')}
                        onChange={(next) => { void toggleEnabled(effective, next) }}
                      />
                    </header>
                    <div className={styles['detailBody']}>
                      {savedTarget === undefined
                        ? null
                        : (
                          <p className={styles['savedNotice']} role="status" aria-live="polite">
                            {providerCopy(t('savedProvider'), savedTarget)}
                          </p>
                        )}
                      {toggleFailure === undefined
                        ? null
                        : <p className={styles['error']}>{t('toggleFailed').replace('{error}', toggleFailure)}</p>}
                      {protocolLimitedType(effective.preset) === 'iam'
                        ? <p className={styles['notice']}>{t('presetIamNote')}</p>
                        : protocolLimitedType(effective.preset) === 'protocol'
                          ? <p className={styles['notice']}>{t('presetProtocolNote')}</p>
                          : null}
                      {namespace === undefined
                        ? <p className={styles['error']}>{`${effective.displayName}: ${NS} settings are unavailable`}</p>
                        : (
                          <ProviderEditor
                            key={editTarget.provider}
                            provider={editTarget.provider}
                            displayName={editTarget.displayName}
                            hideTitle
                            panelStyle
                            showCheck
                            {...editTarget.declared === true ? { declared: true } : {}}
                            {...editTarget.defaults === undefined ? {} : { defaults: editTarget.defaults }}
                            {...editTarget.helpLinks === undefined ? {} : { helpLinks: editTarget.helpLinks }}
                            namespace={namespace}
                            settingsPath={editTarget.settingsPath}
                            api={api}
                            t={t}
                            schema={schema}
                            readOnly={!state.writable}
                            onClose={(changed) => { if (changed) announceSaved(identityLabel) }}
                          />
                        )}
                    </div>
                  </div>
                )
              })()}
        </main>
      </div>
      <Modal
        open={deleteTarget !== undefined}
        onClose={() => { if (!deleting) setDeleteTarget(undefined) }}
        title={deleteTarget === undefined ? '' : providerCopy(t('deleteTitle'), { provider: deleteTarget.provider, displayName: deleteTarget.displayName })}
        closeLabel={t('close')}
        description={deleteTarget === undefined
          ? ''
          : providerCopy(
            deleteTarget.row?.apiKeyEnv !== undefined && deleteTarget.row.credential?.configured === true
              ? t('deleteDescriptionWithCredential')
              : t('deleteDescription'),
            { provider: deleteTarget.provider, displayName: deleteTarget.displayName },
          )}
        className={styles['deleteDialog'] as string}
        footer={(
          <>
            <Button variant="outline" autoFocus disabled={deleting} onClick={() => { setDeleteTarget(undefined) }}>
              {t('cancel')}
            </Button>
            <Button
              variant="outline"
              className={styles['deleteConfirm'] as string}
              disabled={deleting}
              onClick={() => {
                /* v8 ignore next -- the footer only renders with a target */
                if (deleteTarget !== undefined) void deleteProvider(deleteTarget)
              }}
            >
              {deleteTarget === undefined
                ? ''
                : providerCopy(deleting ? t('deleting') : t('deleteConfirm'), { provider: deleteTarget.provider, displayName: deleteTarget.displayName })}
            </Button>
          </>
        )}
      />
    </div>
  )
}
