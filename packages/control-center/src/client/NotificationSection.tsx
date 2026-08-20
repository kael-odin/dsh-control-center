/**
 * Notification settings — Cherry NotificationSettings parity: four switches
 * persisted as local preference rows. Web edition has no system notification
 * pipeline, so the rows are honest preference records for the desktop build.
 */
import { useEffect, useState } from 'react'
import css from './SettingsPages.module.css'
import { HelpTooltip } from './panel-ui.tsx'
import { SettingDivider, SettingGroup, SettingsPageShell, SettingSwitch, SettingTitle } from './SettingsPages.tsx'

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

export function NotificationSection() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs)

  useEffect(() => {
    try { localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(prefs)) } catch { /* best effort */ }
  }, [prefs])

  const set = (key: keyof NotificationPrefs) => (next: boolean): void => {
    setPrefs(current => ({ ...current, [key]: next }))
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
      </SettingGroup>
      <div className={css.noticeText}>Web 版暂无系统通知管道；以上偏好将随桌面版直接生效。</div>
    </SettingsPageShell>
  )
}
