/**
 * 模型 (Default Models) section — Cherry ModelSettings parity.
 *
 * Provider editing lives in 模型服务, exactly as Cherry splits
 * ProviderSettings and ModelSettings into two pages. This page owns
 * per-purpose model selection over the host authority:
 * - 默认模型 / 当前会话模型 via the shared ModelSelectionPanel;
 * - 翻译模型 / 绘画模型 preferences persisted to `control-center-model-prefs`
 *   and honored by the workspaces as their initial selection instead of
 *   "whatever the catalog listed first".
 */

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import type { ModelProviderGroup } from '@deepseek-ai/dsh-api-remotes/client'
import type { ModelSelectionPanelProps } from './ModelSelectionPanel.tsx'
import { ModelSelectionPanel } from './ModelSelectionPanel.tsx'
import type { ModelPrefsState, ModelPrefSelection } from './model-prefs-store.ts'
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
function PrefField({ label, hint, selection, groups, disabled, onSave, t }: {
  label: string
  hint: string
  selection: ModelPrefSelection | null
  groups: readonly ModelProviderGroup[]
  disabled: boolean
  onSave: (selection: ModelPrefSelection) => void
  t: (key: keyof typeof en) => string
}): ReactNode {
  const rows = optionsOf(groups)
  const current = selection === null ? '' : `${selection.provider}/${selection.model}`
  return (
    <label className={styles['field']}>
      <span className={styles['fieldLabel']}>{label}</span>
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
      <span className={styles['advancedHint']}>{hint}</span>
    </label>
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

function Loaded({ injected }: { injected: ModelsSectionInjected }): ReactNode {
  const { controller, t, prefsController } = injected
  const state = injected.useSnapshot(snapshot => snapshot)
  const prefs = injected.usePrefsSnapshot(snapshot => snapshot)
  const [savedKind, setSavedKind] = useState<'translation' | 'painting' | undefined>(undefined)

  useEffect(() => {
    if (prefs.status === 'idle') void prefsController.load()
    if (state.status === 'idle') void controller.load()
  }, [prefs.status, prefsController, state.status, controller])

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
              {t(savedKind === 'translation' ? 'prefSavedTranslation' : 'prefSavedPainting')}
            </p>
          )
          : null}
        <PrefField
          label={t('prefTranslation')}
          hint={t('prefHint')}
          selection={prefs.translation}
          groups={prefs.groups}
          disabled={prefs.status !== 'ready' || !prefs.available}
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
          disabled={prefs.status !== 'ready' || !prefs.available}
          t={t}
          onSave={(selection) => {
            setSavedKind(undefined)
            void prefsController.save('painting', selection).then((ok) => {
              setSavedKind(ok ? 'painting' : undefined)
            })
          }}
        />
      </section>
    </div>
  )
}
