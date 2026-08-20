/**
 * Notification settings — Cherry NotificationSettings parity: four switches
 * persisted as local preference rows. Web edition has no system notification
 * pipeline, so the rows are honest preference records for the desktop build.
 */
import { useEffect, useState, type CSSProperties } from 'react'
import css from './SettingsPages.module.css'
import { HelpTooltip } from './panel-ui.tsx'
import { SettingDivider, SettingGroup, SettingsPageShell, SettingSwitch, SettingTitle, SettingRow, SettingRowTitle } from './SettingsPages.tsx'
import { hasNativeBridge, desktopNativeApi } from './desktop-capabilities.ts'

const NOTIFICATION_KEY = 'cc.settings.notification'

interface NotificationPrefs {
  assistant: boolean
  backup: boolean
  knowledge: boolean
  update: boolean
}

function loadPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(NOTIFICATION_KEY)
    if (raw === null) return { assistant: false, backup: false, knowledge: false, update: false }
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>
    return {
      assistant: parsed.assistant ?? false,
      backup: parsed.backup ?? false,
      knowledge: parsed.knowledge ?? false,
      update: parsed.update ?? false,
    }
  } catch {
    return { assistant: false, backup: false, knowledge: false, update: false }
  }
}

const btnStyle: CSSProperties = {
  padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border)',
  background: 'var(--background-subtle)', color: 'var(--foreground)',
  fontSize: '13px', cursor: 'pointer',
}

export function NotificationSection() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs)
  const [testNotice, setTestNotice] = useState<string>('')
  const bridgeUp = hasNativeBridge()

  useEffect(() => {
    try { localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(prefs)) } catch { /* best effort */ }
  }, [prefs])

  const set = (key: keyof NotificationPrefs) => (next: boolean): void => {
    setPrefs(current => ({ ...current, [key]: next }))
  }

  const sendTestNotice = (): void => {
    setTestNotice('发送中…')
    void desktopNativeApi.notify('DSH Control Center', '系统通知测试成功（桌面桥）。')
      .then(result => {
        setTestNotice(result.ok
          ? (result.supported === false
            ? '已发送：但当前系统不支持系统通知'
            : '已发送 ✅')
          : `发送失败：${result.error ?? '未知错误'}`)
      })
      .catch(err => { setTestNotice(`发送失败：${String((err as Error)?.message ?? err)}`) })
  }

  return (
    <SettingsPageShell>
      <SettingGroup>
        <SettingTitle>通知</SettingTitle>
        <SettingDivider />
        <SettingSwitch
          label={<><span>对话完成通知</span><HelpTooltip text="仅控制后台系统通知，应用内通知始终开启。" /></>}
          checked={prefs.assistant}
          onChange={set('assistant')}
        />
        <SettingDivider />
        <SettingSwitch label="备份" checked={prefs.backup} onChange={set('backup')} />
        <SettingDivider />
        <SettingSwitch label="知识库" checked={prefs.knowledge} onChange={set('knowledge')} />
        <SettingDivider />
        <SettingSwitch label="应用更新" checked={prefs.update} onChange={set('update')} />
        {bridgeUp && (
          <>
            <SettingDivider />
            <SettingRow>
              <SettingRowTitle>桌面通知测试</SettingRowTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button type="button" style={btnStyle} onClick={sendTestNotice}>
                  发送测试通知
                </button>
                {testNotice !== '' && <span className="cc-notice" style={{ fontSize: 12, color: 'var(--foreground-tertiary)' }}>{testNotice}</span>}
              </div>
            </SettingRow>
          </>
        )}
      </SettingGroup>
      <div className={css.noticeText}>
        {bridgeUp ? '桌面桥已连接：开启的开关将通过系统通知管道发送。' : 'Web 版暂无系统通知管道；以上偏好将随桌面版直接生效。'}
      </div>
    </SettingsPageShell>
  )
}
