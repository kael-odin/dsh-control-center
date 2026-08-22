/**
 * 模型 (Default Models) section — Cherry ModelSettings parity.
 *
 * Provider editing lives in 模型服务, exactly as Cherry splits
 * ProviderSettings and ModelSettings into two pages. This page owns
 * per-purpose model selection over the host authority, in Cherry's row order:
 * - 默认模型 / 当前会话模型 via the shared ModelSelectionPanel;
 * - 快捷模型 preference plus its settings drawer (话题命名);
 * - 翻译模型 / 绘画模型 preferences persisted to `control-center-model-prefs`
 *   and honored by the workspaces as their initial selection instead of
 *   "whatever the catalog listed first";
 * - 重试设置 projected onto every live provider profile as a real DSH
 *   `retryPolicy`, so the harness retry plugin enforces it on actual requests.
 */

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import type { ModelProviderGroup } from '@deepseek-ai/dsh-api-remotes/client'
import { Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { Switch } from './panel-ui.tsx'
import type { ModelSelectionPanelProps } from './ModelSelectionPanel.tsx'
import { ModelSelectionPanel } from './ModelSelectionPanel.tsx'
import type { ModelPrefsState, ModelPrefSelection, RetryConfig, RetryFallbackRoute } from './model-prefs-store.ts'
import { groupByNamespace, retryPolicyOps, type RetryPolicyTarget } from './retry-policy.ts'
import type { en } from './locales.ts'
import styles from './ModelsSection.module.css'

/** Shared provider identity (also consumed by the 模型服务 page). */
export interface ProviderIdentity {
  /** Stable provider route id. */
  provider: string
  /** Human-facing provider name. */
  displayName: string
}

/** Stable visible and accessible identity for one provider target. */
export function providerTargetLabel(target: ProviderIdentity): string {
  return target.provider === target.displayName
    ? target.provider
    : `${target.displayName} (${target.provider})`
}

/** Replace the one provider placeholder in localized destructive-action copy. */
export function providerCopy(template: string, target: ProviderIdentity): string {
  return template.replace('{provider}', () => providerTargetLabel(target))
}

/**
 * Remove one user-added provider and its page-managed credential. Credential
 * removal comes first so a second-step failure leaves the provider row visible
 * and the whole operation safely retryable; both unsets are idempotent. The
 * settings removal names the profile rather than rebuilding its whole
 * namespace from a partial view. (Shared with the 模型服务 page.)
 */
export async function removeProviderProfile(
  api: Pick<IApiClient, 'settings' | 'credentials'>,
  controller: { load(): Promise<void> },
  target: { settingsNs: string; settingsPath: readonly string[]; credentialRef?: string },
): Promise<string | undefined> {
  try {
    if (target.credentialRef !== undefined) {
      const credential = await api.credentials.unset({ ref: target.credentialRef })
      if (!credential.result.ok) return credential.result.error.message
    }
    const response = await api.settings.mutate({
      ns: target.settingsNs,
      ops: [{ op: 'unset', path: [...target.settingsPath] }],
    })
    if (!response.result.ok) return response.result.error.message
  } catch (error) {
    // The transport rejected rather than answering; the caller must be able to
    // retry the idempotent operation instead of the row silently staying.
    return error instanceof Error ? error.message : String(error)
  }
  await controller.load()
  return undefined
}

/** Injected dependencies of {@link ModelsSection}. */
export interface ModelsSectionInjected {
  /** The default/current model controller. */
  controller: import('./store.ts').ModelsSettingsStore
  useSnapshot: SnapshotSelectorHook<import('./store.ts').ModelsSettingsState>
  /** Per-purpose preference controller. */
  prefsController: import('./model-prefs-store.ts').ModelPrefsStore
  usePrefsSnapshot: SnapshotSelectorHook<ModelPrefsState>
  api: Pick<IApiClient, 'settings' | 'credentials' | 'llm'>
  /** Default/current model selection props. */
  modelSelection: ModelSelectionPanelProps
  schema: import('./schema-operations.ts').SettingsSchemaOperations
  t: (key: keyof typeof en) => string
}

/** Props delivered by the slot outlet (partial until injected). */
export type ModelsSectionProps = Partial<ModelsSectionInjected>

function optionsOf(groups: readonly ModelProviderGroup[]): Array<{ value: string; label: string; selection: ModelPrefSelection }> {
  return groups.flatMap(group => group.models.map(model => ({
    value: `${group.id}/${model.id}`,
    label: `${group.name} · ${model.name}`,
    selection: { provider: group.id, model: model.id },
  })))
}

/** One per-purpose selector block. */
function PrefField({ label, hint, selection, groups, disabled, onSave, action, t }: {
  label: string
  hint: string
  selection: ModelPrefSelection | null
  groups: readonly ModelProviderGroup[]
  disabled: boolean
  onSave: (selection: ModelPrefSelection) => void
  action?: ReactNode
  t: (key: keyof typeof en) => string
}): ReactNode {
  const rows = optionsOf(groups)
  const current = selection === null ? '' : `${selection.provider}/${selection.model}`
  return (
    <div className={styles['field']}>
      <span className={styles['fieldLabel']}>{label}</span>
      <span className={`${styles['fieldRow']} ${action === undefined ? '' : styles['fieldRowWithAction']}`}>
        <select
          className={`${styles['input']} ${styles['selectInput']}`}
          value={current}
          disabled={disabled || rows.length === 0}
          onChange={(event) => {
            const match = rows.find(row => row.value === event.target.value)
            if (match !== undefined) onSave(match.selection)
          }}
        >
          <option value="">{selection === null ? t('prefUnset') : t('prefFollow')}</option>
          {rows.map(row => <option key={row.value} value={row.value}>{row.label}</option>)}
        </select>
        {action}
      </span>
      <span className={styles['advancedHint']}>{hint}</span>
    </div>
  )
}

/** The 话题命名 drawer behind the quick-model settings button. DSH names
 * sessions natively; this states exactly what is built in and what stays a
 * deployment-level choice, rather than offering switches that would do
 * nothing. */
function TopicNamingDialog({ open, onClose, t }: { open: boolean; onClose: () => void; t: (key: keyof typeof en) => string }): ReactNode {
  return (
    <Modal open={open} onClose={onClose} title={t('quickSettings')} closeLabel={t('close')}>
      <div className={styles['topicNamingCard']}>
        <h4 className={styles['topicNamingHeading']}>{t('topicNamingNativeTitle')}</h4>
        <p className={styles['topicNamingBody']}>{t('topicNamingNativeBody')}</p>
        <p className={styles['topicNamingNote']}>{t('topicNamingCustomNote')}</p>
      </div>
    </Modal>
  )
}

/** Clamp one typed attempt count into Cherry's 1–10 range (an empty field
 * yields Number('') === 0, so clamp instead of reject). */
function clampAttempts(value: string): number {
  return Math.min(10, Math.max(1, Math.trunc(Number(value)) || 1))
}

/** One selectable route row inside the fallback list. */
interface FallbackOption {
  readonly selection: RetryFallbackRoute
  readonly label: string
}

function fallbackOptions(groups: readonly ModelProviderGroup[]): readonly FallbackOption[] {
  return groups.flatMap(group => group.models.map(model => ({
    selection: { provider: group.id, model: model.id },
    label: `${group.name} · ${model.name}`,
  })))
}

function sameRoute(left: RetryFallbackRoute, right: RetryFallbackRoute): boolean {
  return left.provider === right.provider && left.model === right.model
}

/** The Cherry 重试设置 group: switch, attempts, backoff, fallback routes. */
function RetryGroup({ config, disabled, groups, onChange, t }: {
  config: RetryConfig
  disabled: boolean
  groups: readonly ModelProviderGroup[]
  onChange: (next: RetryConfig) => void
  t: (key: keyof typeof en) => string
}): ReactNode {
  const options = useMemo(() => fallbackOptions(groups), [groups])
  const selectedCount = config.fallbacks.length
  const toggleFallback = (option: FallbackOption, checked: boolean): void => {
    const next = checked
      ? [...config.fallbacks.filter(route => !sameRoute(route, option.selection)), option.selection]
      : config.fallbacks.filter(route => !sameRoute(route, option.selection))
    onChange({ ...config, fallbacks: next })
  }
  return (
    <div className={styles['retryGroup']}>
      <label className={styles['retryRow']}>
        <span className={styles['fieldLabel']}>{t('retryEnable')}</span>
        <Switch
          checked={config.enabled}
          disabled={disabled}
          label={t('retryEnable')}
          onChange={enabled => onChange({ ...config, enabled })}
        />
      </label>
      <p className={styles['advancedHint']}>{t('retryHint')}</p>
      {config.enabled && (
        <>
          <label className={styles['field']}>
            <span className={styles['fieldLabel']}>{t('retryMaxAttempts')}</span>
            <input
              type="number"
              min={1}
              max={10}
              step={1}
              className={`${styles['input']} ${styles['attemptsInput']}`}
              aria-label={t('retryMaxAttempts')}
              value={config.maxAttempts}
              disabled={disabled}
              onChange={event => onChange({ ...config, maxAttempts: clampAttempts(event.target.value) })}
            />
          </label>
          <label className={styles['retryRow']}>
            <span className={styles['fieldLabel']}>{t('retryBackoff')}</span>
            <Switch
              checked={config.backoff}
              disabled={disabled}
              label={t('retryBackoff')}
              onChange={backoff => onChange({ ...config, backoff })}
            />
          </label>
          <p className={styles['advancedHint']}>{t('retryBackoffHint')}</p>
          <details className={styles['fallbackDetails']}>
            <summary className={styles['fallbackSummary']}>
              <span>{t('retryFallbacks')}</span>
              <span className={styles['fallbackCount']}>
                {selectedCount === 0 ? t('retryFallbacksEmpty') : t('retryFallbacksCount').replace('{count}', String(selectedCount))}
              </span>
            </summary>
            <div className={styles['fallbackList']}>
              {options.map(option => (
                <label key={`${option.selection.provider}/${option.selection.model}`} className={styles['fallbackItem']}>
                  <input
                    type="checkbox"
                    checked={config.fallbacks.some(route => sameRoute(route, option.selection))}
                    disabled={disabled}
                    onChange={event => toggleFallback(option, event.target.checked)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <p className={styles['advancedHint']}>{t('retryFallbacksHint')} {t('retryFallbacksSessionNote')}</p>
          </details>
        </>
      )}
    </div>
  )
}

/**
 * Render the 模型 section.
 * @param props - slot-delivered injected dependencies.
 * @returns the section, or null while the shell has not injected yet.
 */
export function ModelsSection(props: ModelsSectionProps): ReactNode {
  const { controller, useSnapshot, prefsController, usePrefsSnapshot, api, t, schema, modelSelection } = props
  if (controller === undefined || useSnapshot === undefined || prefsController === undefined
    || usePrefsSnapshot === undefined || api === undefined || t === undefined || schema === undefined
    || modelSelection === undefined) return null
  return <Loaded injected={{ controller, useSnapshot, prefsController, usePrefsSnapshot, api, t, schema, modelSelection }} />
}

/** Live provider profiles a retry policy can be written into. */
function retryTargets(rows: ReadonlyArray<{ entry: { settingsNs: string; settingsPath: readonly string[] } }>): readonly RetryPolicyTarget[] {
  return rows
    .filter(row => row.entry.settingsNs === 'llm-pi-ai' || row.entry.settingsNs === 'llm-deepseek')
    .map(row => ({ ns: row.entry.settingsNs, path: row.entry.settingsPath }))
}

/** Ids of stashed (disabled) provider profiles, so re-enables restore a current policy. */
function stashIds(namespaces: ReadonlyMap<string, { value: unknown }>): readonly string[] {
  const view = namespaces.get('control-center-provider-stash')
  if (view === undefined || typeof view.value !== 'object' || view.value === null) return []
  const providers = (view.value as { providers?: unknown }).providers
  if (typeof providers !== 'object' || providers === null) return []
  return Object.keys(providers)
}

function Loaded({ injected }: { injected: ModelsSectionInjected }): ReactNode {
  const { controller, t, prefsController, api } = injected
  const state = injected.useSnapshot(snapshot => snapshot)
  const prefs = injected.usePrefsSnapshot(snapshot => snapshot)
  const [savedKind, setSavedKind] = useState<'translation' | 'painting' | 'quick' | undefined>(undefined)
  const [quickDialogOpen, setQuickDialogOpen] = useState(false)
  // The last retry apply outcome: how many live profiles received the policy,
  // or the error text. Cleared on the next change.
  const [retryOutcome, setRetryOutcome] = useState<{ ok: true; count: number } | { ok: false; error: string } | undefined>(undefined)

  useEffect(() => {
    if (prefs.status === 'idle') void prefsController.load()
    if (state.status === 'idle') void controller.load()
  }, [prefs.status, prefsController, state.status, controller])

  const persistRetry = (next: RetryConfig): void => {
    setRetryOutcome(undefined)
    void prefsController.saveRetry(next).then(async (ok) => {
      if (!ok) {
        setRetryOutcome({ ok: false, error: prefs.writeError ?? '' })
        return
      }
      const targets = retryTargets(state.rows)
      const ids = stashIds(state.namespaces)
      const payloads = groupByNamespace(retryPolicyOps(next, targets, ids))
      let applied = 0
      try {
        for (const payload of payloads) {
          const response = await api.settings.mutate({ ns: payload.ns, ops: payload.ops })
          if (!response.result.ok) throw new Error(response.result.error.message)
          applied += payload.ops.length
        }
        setRetryOutcome({ ok: true, count: targets.length + ids.length })
      } catch (error) {
        setRetryOutcome({
          ok: false,
          error: `${applied > 0 ? `${applied} ` : ''}${error instanceof Error ? error.message : String(error)}`,
        })
      }
    })
  }

  if (prefs.status === 'error') {
    /* v8 ignore next -- an error status always carries text */
    return (
      <div className={styles['section']}>
        <p className={styles['error']}>{`${t('loadFailed')}: ${prefs.error ?? ''}`}</p>
        <button type="button" className={styles['secondaryButton']} onClick={() => { void prefsController.load() }}>
          {t('retry')}
        </button>
      </div>
    )
  }

  const prefsDisabled = prefs.status !== 'ready' || !prefs.available

  return (
    <div className={styles['section']}>
      {!prefs.writable && prefs.status === 'ready'
        ? <p className={styles['notice']}>{t('readOnly')}</p>
        : null}
      <ModelSelectionPanel {...injected.modelSelection} />

      {!prefs.available && prefs.status === 'ready'
        ? (
          <p className={styles['notice']}>
            {'当前部署的 Control Center host 未启用工作区偏好存储；默认模型与当前会话模型不受影响。更新插件后可用。'}
          </p>
        )
        : null}
      <section aria-label={t('prefTitle')} className={styles['prefsPanel']}>
        <h3 className={styles['modelSelectionTitle']}>{t('prefTitle')}</h3>
        {savedKind !== undefined
          ? (
            <p className={styles['savedNotice']} role="status">
              {savedKind === 'quick'
                ? t('prefQuickModel')
                : t(savedKind === 'translation' ? 'prefSavedTranslation' : 'prefSavedPainting')}
            </p>
          )
          : null}
        {prefs.writeError !== null
          ? <p className={styles['error']} role="alert">{prefs.writeError}</p>
          : null}
        <PrefField
          label={t('prefQuickModel')}
          hint={t('prefQuickHint')}
          selection={prefs.quick}
          groups={prefs.groups}
          disabled={prefsDisabled}
          t={t}
          action={
            <button
              type="button"
              className={styles['gearButton']}
              aria-label={t('quickSettings')}
              onClick={() => { setQuickDialogOpen(true) }}
            >
              ⚙
            </button>
          }
          onSave={(selection) => {
            setSavedKind(undefined)
            void prefsController.save('quick', selection).then((ok) => {
              setSavedKind(ok ? 'quick' : undefined)
            })
          }}
        />
        <PrefField
          label={t('prefTranslation')}
          hint={t('prefHint')}
          selection={prefs.translation}
          groups={prefs.groups}
          disabled={prefsDisabled}
          t={t}
          onSave={(selection) => {
            setSavedKind(undefined)
            void prefsController.save('translation', selection).then((ok) => {
              setSavedKind(ok ? 'translation' : undefined)
            })
          }}
        />
        <PrefField
          label={t('prefPainting')}
          hint={t('prefHint')}
          selection={prefs.painting}
          groups={prefs.groups}
          disabled={prefsDisabled}
          t={t}
          onSave={(selection) => {
            setSavedKind(undefined)
            void prefsController.save('painting', selection).then((ok) => {
              setSavedKind(ok ? 'painting' : undefined)
            })
          }}
        />
        <RetryGroup
          config={prefs.retry}
          disabled={prefsDisabled}
          groups={prefs.groups}
          onChange={persistRetry}
          t={t}
        />
        {retryOutcome?.ok === true
          ? <p className={styles['savedNotice']} role="status">{t('retrySaved').replace('{count}', String(retryOutcome.count))}</p>
          : null}
        {retryOutcome !== undefined && retryOutcome.ok === false
          ? <p className={styles['error']} role="alert">{`${t('retrySaveFailed')}: ${retryOutcome.error}`}</p>
          : null}
        {prefs.retry.enabled && !retryOutcome?.ok && prefs.status === 'ready'
          ? <p className={styles['advancedHint']}>{t('retryNewProvidersHint')}</p>
          : null}
      </section>
      <TopicNamingDialog open={quickDialogOpen} onClose={() => { setQuickDialogOpen(false) }} t={t} />
    </div>
  )
}
