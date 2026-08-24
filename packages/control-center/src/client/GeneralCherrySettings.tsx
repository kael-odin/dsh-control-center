/**
 * One 通用 preference block contributed to the native General settings page —
 * Cherry GeneralSettings parity for the parts DSH can honor (启动行为 / 托盘),
 * plus honest platform notes for 代理 / 上下文管理.
 *
 * The native General page renders every `settings.general.item` row; this
 * component owns its own copy, store, and write path through the injected
 * `generalController`.
 */

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import { Switch } from './panel-ui.tsx'
import type { GeneralPrefs, GeneralSettingsStore, GeneralState } from './general-store.ts'
import type { en } from './locales.ts'
import css from './GeneralSection.module.css'

export interface GeneralCherrySettingsInjected {
  controller: GeneralSettingsStore
  useSnapshot: SnapshotSelectorHook<GeneralState>
  t: (key: keyof typeof en) => string
}

export type GeneralCherrySettingsProps = Partial<GeneralCherrySettingsInjected>

/** One Cherry-style preference row: title left, switch right. */
function PrefRow({ title, hint, checked, disabled, label, onChange }: {
  title: string
  hint?: string | undefined
  checked: boolean
  disabled: boolean
  label: string
  onChange: (next: boolean) => void
}): ReactNode {
  return (
    <div className={css['prefRow']}>
      <div className={css['prefRowTitle']}>
        <span>{title}</span>
        {hint === undefined ? null : <span className={css['prefRowHint']}>{hint}</span>}
      </div>
      <div className={css['prefRowControl']}>
        <Switch checked={checked} disabled={disabled} label={label} onChange={onChange} />
      </div>
    </div>
  )
}

/** One honest platform card (no fake switch). */
function Note({ title, body }: { title: string; body: string }): ReactNode {
  return (
    <div className={css['note']}>
      <div className={css['noteTitle']}>{title}</div>
      <div className={css['noteBody']}>{body}</div>
    </div>
  )
}

export function GeneralCherrySettings(props: GeneralCherrySettingsProps): ReactNode {
  const { controller, useSnapshot, t } = props
  if (controller === undefined || useSnapshot === undefined || t === undefined) return null
  return <Loaded controller={controller} useSnapshot={useSnapshot} t={t} />
}

function Loaded({ controller, useSnapshot, t }: {
  controller: GeneralSettingsStore
  useSnapshot: SnapshotSelectorHook<GeneralState>
  t: (key: keyof typeof en) => string
}): ReactNode {
  const state = useSnapshot(snapshot => snapshot)

  useEffect(() => {
    if (state.status === 'idle') void controller.load()
  }, [state.status, controller])

  if (state.status === 'error') {
    /* v8 ignore next -- an error status always carries text */
    return <p className={css['error']}>{`${t('loadFailed')}: ${state.error ?? ''}`}</p>
  }

  const setPref = (key: keyof GeneralPrefs, value: boolean): void => {
    void controller.save(key, value)
  }
  const disabled = state.status !== 'ready' || !state.available || !state.writable
  const prefs = state.prefs

  return (
    <div className={css['groupBody']}>
      <div className={css['groupTitle']}>{t('generalLaunch')}</div>
      <PrefRow
        title={t('generalLaunchOnBoot')}
        hint={t('generalDesktopOnly')}
        checked={prefs.launchOnBoot}
        disabled={disabled}
        label={t('generalLaunchOnBoot')}
        onChange={(next) => { setPref('launchOnBoot', next) }}
      />
      <PrefRow
        title={t('generalTrayEnabled')}
        hint={t('generalDesktopOnly')}
        checked={prefs.trayEnabled}
        disabled={disabled}
        label={t('generalTrayEnabled')}
        onChange={(next) => { setPref('trayEnabled', next) }}
      />
      <PrefRow
        title={t('generalTrayOnClose')}
        hint={t('generalDesktopOnly')}
        checked={prefs.trayOnClose}
        disabled={disabled}
        label={t('generalTrayOnClose')}
        onChange={(next) => { setPref('trayOnClose', next) }}
      />
      <PrefRow
        title={t('generalTrayOnLaunch')}
        hint={t('generalDesktopOnly')}
        checked={prefs.trayOnLaunch}
        disabled={disabled}
        label={t('generalTrayOnLaunch')}
        onChange={(next) => { setPref('trayOnLaunch', next) }}
      />
      <PrefRow
        title={t('generalPreventSleep')}
        hint={t('generalDesktopOnly')}
        checked={prefs.preventSleepWhenBusy}
        disabled={disabled}
        label={t('generalPreventSleep')}
        onChange={(next) => { setPref('preventSleepWhenBusy', next) }}
      />
      <PrefRow
        title={t('generalDeveloperMode')}
        hint={t('generalDeveloperHint')}
        checked={prefs.developerMode}
        disabled={disabled}
        label={t('generalDeveloperMode')}
        onChange={(next) => { setPref('developerMode', next) }}
      />
      <div className={css['divider']} />
      <div className={css['groupTitle']}>{t('generalProxy')}</div>
      <Note
        title={t('generalProxyUnsupportedTitle')}
        body={t('generalProxyUnsupportedBody')}
      />
      <div className={css['divider']} />
      <div className={css['groupTitle']}>{t('generalContext')}</div>
      <Note
        title={t('generalContextNativeTitle')}
        body={t('generalContextNativeBody')}
      />
    </div>
  )
}
