/**
 * Screenshot settings — Cherry ScreenshotSettings parity: enable, shortcut
 * row (links to the shortcuts page), OCR switch + local-model status. Web
 * edition cannot capture the screen (noted honestly).
 */
import { useEffect, useState } from 'react'
import {
  SettingDivider, SettingGroup, SettingRow, SettingsPageShell, SettingSwitch,
} from './SettingsPages.tsx'
import css from './ScreenshotSection.module.css'

const SCREENSHOT_KEY = 'cc.settings.screenshot'

interface ScreenshotPrefs {
  enabled: boolean
  autoOcr: boolean
}

function loadPrefs(): ScreenshotPrefs {
  try {
    const raw = localStorage.getItem(SCREENSHOT_KEY)
    if (raw === null) return { enabled: false, autoOcr: true }
    const parsed = JSON.parse(raw) as Partial<ScreenshotPrefs>
    return { enabled: parsed.enabled ?? false, autoOcr: parsed.autoOcr ?? true }
  } catch {
    return { enabled: false, autoOcr: true }
  }
}

export function ScreenshotSection() {
  const [prefs, setPrefs] = useState<ScreenshotPrefs>(loadPrefs)

  useEffect(() => {
    try { localStorage.setItem(SCREENSHOT_KEY, JSON.stringify(prefs)) } catch { /* best effort */ }
  }, [prefs])

  const update = (patch: Partial<ScreenshotPrefs>): void => {
    setPrefs(current => ({ ...current, ...patch }))
  }

  const openShortcuts = (): void => {
    window.dispatchEvent(new CustomEvent('cc:open-settings-section', { detail: 'shortcuts' }))
  }

  const openLocalModels = (): void => {
    window.dispatchEvent(new CustomEvent('cc:open-settings-section', { detail: 'local-models' }))
  }

  return (
    <SettingsPageShell>
      <div className={css.notice}>
        屏幕截图需要桌面截屏能力，Web 版不可用；以下配置将随桌面版直接生效。
      </div>

      <SettingGroup>
        <div className={css.groupTitle}>截图</div>
        <SettingDivider />
        <SettingSwitch
          label="启用截图"
          checked={prefs.enabled}
          onChange={next => { update({ enabled: next }) }}
          description="通过全局快捷键捕获屏幕，然后框选区域、标注，并复制或保存结果。"
        />
        <SettingDivider />
        <SettingRow>
          <div className={css.shortcutLabel}>
            <div className={css.shortcutTitle}>快捷键</div>
            <div className={css.shortcutDesc}>截图由全局快捷键触发。</div>
          </div>
          <div className={css.shortcutRight}>
            <span className={css.shortcutBadge}>Ctrl + Shift + A</span>
            <button type="button" className={css.linkBtn} onClick={openShortcuts}>设置快捷键</button>
          </div>
        </SettingRow>
      </SettingGroup>

      <SettingGroup>
        <div className={css.groupTitle}>文字识别</div>
        <SettingDivider />
        <SettingSwitch
          label="自动识别文字"
          checked={prefs.autoOcr}
          onChange={next => { update({ autoOcr: next }) }}
          description="识别捕获画面中的文字，使其可以被选中和复制。"
        />
        <div className={css.ocrStatus}>
          文字识别需要本地 OCR 模型。
          <button type="button" className={css.linkBtn} onClick={openLocalModels}>管理本地模型</button>
        </div>
      </SettingGroup>
    </SettingsPageShell>
  )
}
