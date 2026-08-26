/**
 * One 通用 preference block contributed to the native General settings page —
 * Cherry GeneralSettings parity for desktop behavior and context management,
 * plus an honest platform note for proxy settings.
 *
 * The native General page renders every `settings.general.item` row; this
 * component owns its own copy, store, and write path through the injected
 * `generalController`.
 */

import { useEffect, useRef, useState } from 'react'
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

interface ContextDraft {
  maxMessages: string
  threshold: string
  compressionProvider: string
  compressionModel: string
}

function contextDraftFrom(prefs: GeneralPrefs): ContextDraft {
  return {
    maxMessages: prefs.contextMaxMessages === null ? '' : String(prefs.contextMaxMessages),
    threshold: String(prefs.contextToolOutputThreshold),
    compressionProvider: prefs.contextCompressionProvider,
    compressionModel: prefs.contextCompressionModel,
  }
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
  const prefs = state.prefs
  const [contextDraft, setContextDraft] = useState<ContextDraft>(() => contextDraftFrom(prefs))
  const initialContextPrefs = useRef(prefs)

  useEffect(() => {
    if (state.status === 'idle') void controller.load()
  }, [state.status, controller])

  useEffect(() => {
    const previous = initialContextPrefs.current
    const changed = previous.contextMaxMessages !== prefs.contextMaxMessages
      || previous.contextToolOutputThreshold !== prefs.contextToolOutputThreshold
      || previous.contextCompressionProvider !== prefs.contextCompressionProvider
      || previous.contextCompressionModel !== prefs.contextCompressionModel
    initialContextPrefs.current = prefs
    if (changed) setContextDraft(contextDraftFrom(prefs))
  }, [
    prefs.contextMaxMessages,
    prefs.contextToolOutputThreshold,
    prefs.contextCompressionProvider,
    prefs.contextCompressionModel,
  ])

  if (state.status === 'error') {
    /* v8 ignore next -- an error status always carries text */
    return <p className={css['error']}>{`${t('loadFailed')}: ${state.error ?? ''}`}</p>
  }

  const setPref = (key: keyof GeneralPrefs, value: boolean): void => {
    void controller.save(key, value)
  }
  const disabled = state.status !== 'ready' || !state.available || !state.writable

  const saveMaxMessages = (rawValue: string): void => {
    const raw = rawValue.trim()
    if (raw === '') {
      void controller.save('contextMaxMessages', null)
      return
    }
    const value = Number(raw)
    if (!Number.isSafeInteger(value) || value < 1) {
      setContextDraft(current => ({
        ...current,
        maxMessages: prefs.contextMaxMessages === null ? '' : String(prefs.contextMaxMessages),
      }))
      return
    }
    setContextDraft(current => ({ ...current, maxMessages: String(value) }))
    void controller.save('contextMaxMessages', value)
  }

  const saveThreshold = (rawValue: string): void => {
    const value = Number(rawValue.trim())
    if (!Number.isSafeInteger(value) || value < 2_000) {
      setContextDraft(current => ({ ...current, threshold: String(prefs.contextToolOutputThreshold) }))
      return
    }
    setContextDraft(current => ({ ...current, threshold: String(value) }))
    void controller.save('contextToolOutputThreshold', value)
  }

  const saveCompressionProvider = (rawValue: string): void => {
    const value = rawValue.trim()
    setContextDraft(current => ({ ...current, compressionProvider: value }))
    void controller.save('contextCompressionProvider', value)
  }

  const saveCompressionModel = (rawValue: string): void => {
    const value = rawValue.trim()
    setContextDraft(current => ({ ...current, compressionModel: value }))
    void controller.save('contextCompressionModel', value)
  }

  const blurOnEnter = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

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
        title={t('generalDesktopOnly')}
        body="代理偏好保存在 control-center-general 命名空间，桌面壳读取后应用到出站请求；Web 版仅保存。"
      />
      <div className={css['prefRow']}>
        <label className={css['prefRowTitle']} htmlFor="cc-proxy-mode">
          <span>{t('generalProxyMode')}</span>
        </label>
        <div className={css['prefRowControl']}>
          <select
            id="cc-proxy-mode"
            className={css['prefInput']}
            value={prefs.proxyMode}
            disabled={disabled}
            onChange={event => { void controller.save('proxyMode', event.target.value as GeneralPrefs['proxyMode']) }}
          >
            <option value="off">{t('generalProxyOff')}</option>
            <option value="system">{t('generalProxySystem')}</option>
            <option value="static">{t('generalProxyStatic')}</option>
          </select>
        </div>
      </div>
      {prefs.proxyMode === 'static' && (
        <>
          <div className={css['prefRow']}>
            <label className={css['prefRowTitle']} htmlFor="cc-proxy-url">
              <span>{t('generalProxyUrl')}</span>
              <span className={css['prefRowHint']}>{t('generalProxyUrlHint')}</span>
            </label>
            <div className={css['prefRowControl']}>
              <input
                id="cc-proxy-url"
                className={css['prefInput']}
                type="text"
                maxLength={300}
                placeholder="http://127.0.0.1:7890"
                defaultValue={prefs.proxyUrl}
                disabled={disabled}
                onBlur={event => {
                  const next = event.target.value.trim()
                  if (next !== prefs.proxyUrl) void controller.save('proxyUrl', next)
                }}
                onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }}
              />
            </div>
          </div>
          <div className={css['prefRow']}>
            <label className={css['prefRowTitle']} htmlFor="cc-proxy-bypass">
              <span>{t('generalProxyBypass')}</span>
              <span className={css['prefRowHint']}>{t('generalProxyBypassHint')}</span>
            </label>
            <div className={css['prefRowControl']}>
              <input
                id="cc-proxy-bypass"
                className={css['prefInput']}
                type="text"
                maxLength={500}
                placeholder="localhost, 192.168.*"
                defaultValue={prefs.proxyBypass}
                disabled={disabled}
                onBlur={event => {
                  const next = event.target.value.trim()
                  if (next !== prefs.proxyBypass) void controller.save('proxyBypass', next)
                }}
                onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }}
              />
            </div>
          </div>
        </>
      )}
      <PrefRow
        title={t('generalAllowPrivateNetwork')}
        hint={t('generalAllowPrivateNetworkHint')}
        checked={prefs.allowPrivateNetwork}
        disabled={disabled}
        label={t('generalAllowPrivateNetwork')}
        onChange={(next) => { setPref('allowPrivateNetwork', next) }}
      />
      <div className={css['divider']} />
      <div className={css['groupTitle']}>{t('generalContext')}</div>
      <Note
        title={t('generalContextNativeTitle')}
        body={t('generalContextNativeBody')}
      />
      <PrefRow
        title={t('generalContextEnabled')}
        checked={prefs.contextEnabled}
        disabled={disabled}
        label={t('generalContextEnabled')}
        onChange={(next) => { setPref('contextEnabled', next) }}
      />
      <div className={css['prefRow']}>
        <label className={css['prefRowTitle']} htmlFor="cc-context-max-messages">
          <span>{t('generalContextMaxMessages')}</span>
          <span className={css['prefRowHint']}>{t('generalContextMaxMessagesHint')}</span>
        </label>
        <div className={css['prefRowControl']}>
          <input
            id="cc-context-max-messages"
            className={`${css['prefInput']} ${css['prefNumber']}`}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={contextDraft.maxMessages}
            disabled={disabled || !prefs.contextEnabled}
            onChange={event => { setContextDraft(current => ({ ...current, maxMessages: event.target.value })) }}
            onBlur={event => { saveMaxMessages(event.target.value) }}
            onKeyDown={blurOnEnter}
          />
        </div>
      </div>
      <div className={css['prefRow']}>
        <label className={css['prefRowTitle']} htmlFor="cc-context-tool-threshold">
          <span>{t('generalContextThreshold')}</span>
          <span className={css['prefRowHint']}>{t('generalContextThresholdHint')}</span>
        </label>
        <div className={css['prefRowControl']}>
          <input
            id="cc-context-tool-threshold"
            className={`${css['prefInput']} ${css['prefNumber']}`}
            type="number"
            inputMode="numeric"
            min={2_000}
            step={1_000}
            value={contextDraft.threshold}
            disabled={disabled || !prefs.contextEnabled}
            onChange={event => { setContextDraft(current => ({ ...current, threshold: event.target.value })) }}
            onBlur={event => { saveThreshold(event.target.value) }}
            onKeyDown={blurOnEnter}
          />
        </div>
      </div>
      <PrefRow
        title={t('generalContextAutoCompress')}
        checked={prefs.contextAutoCompress}
        disabled={disabled || !prefs.contextEnabled}
        label={t('generalContextAutoCompress')}
        onChange={(next) => { setPref('contextAutoCompress', next) }}
      />
      <div className={css['prefRow']}>
        <label className={css['prefRowTitle']} htmlFor="cc-context-compression-provider">
          <span>{t('generalContextCompressionProvider')}</span>
          <span className={css['prefRowHint']}>{t('generalContextFollowModel')}</span>
        </label>
        <div className={css['prefRowControl']}>
          <input
            id="cc-context-compression-provider"
            className={css['prefInput']}
            type="text"
            maxLength={160}
            value={contextDraft.compressionProvider}
            disabled={disabled || !prefs.contextEnabled || !prefs.contextAutoCompress}
            onChange={event => { setContextDraft(current => ({ ...current, compressionProvider: event.target.value })) }}
            onBlur={event => { saveCompressionProvider(event.target.value) }}
            onKeyDown={blurOnEnter}
          />
        </div>
      </div>
      <div className={css['prefRow']}>
        <label className={css['prefRowTitle']} htmlFor="cc-context-compression-model">
          <span>{t('generalContextCompressionModel')}</span>
          <span className={css['prefRowHint']}>{t('generalContextFollowModel')}</span>
        </label>
        <div className={css['prefRowControl']}>
          <input
            id="cc-context-compression-model"
            className={css['prefInput']}
            type="text"
            maxLength={200}
            value={contextDraft.compressionModel}
            disabled={disabled || !prefs.contextEnabled || !prefs.contextAutoCompress}
            onChange={event => { setContextDraft(current => ({ ...current, compressionModel: event.target.value })) }}
            onBlur={event => { saveCompressionModel(event.target.value) }}
            onKeyDown={blurOnEnter}
          />
        </div>
      </div>
      {state.writeError === null ? null : <p className={css['error']} role="alert">{state.writeError}</p>}
    </div>
  )
}
