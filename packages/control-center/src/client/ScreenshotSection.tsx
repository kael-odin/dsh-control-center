/**
 * Screenshot settings — Cherry ScreenshotSettings parity: enable, shortcut
 * row (links to the shortcuts page), OCR switch + local-model status.
 * The desktop shell registers the capture hotkey from the host-pushed prefs;
 * notices reflect the live environment (web cannot capture, desktop reports
 * its registration state).
 */
import type { AssistantRemote, DesktopRemote } from './assistant-store.ts'
import { useAssistantStore, useDesktopStatus } from './assistant-store.ts'
import {
  SettingDivider, SettingGroup, SettingRow, SettingsPageShell, SettingSwitch,
} from './SettingsPages.tsx'
import css from './ScreenshotSection.module.css'

export interface ScreenshotSectionInjected {
  assistant: AssistantRemote | undefined
  desktop: DesktopRemote | undefined
}

export function ScreenshotSection({ assistant, desktop }: ScreenshotSectionInjected) {
  const { prefs, update } = useAssistantStore(assistant, 'cc.settings.screenshot', 'screenshot')
  const status = useDesktopStatus(desktop)

  if (prefs === null) return <SettingsPageShell><div className={css.loading}>加载中...</div></SettingsPageShell>

  const screenshot = prefs.screenshot
  const desktopLive = status !== null && status.supported
  const hotkeyLabel = (status?.screenshotHotkey ?? 'Ctrl+Shift+A')
    .replace('CommandOrControl', 'Ctrl')
    .replace(/\+/g, ' + ')

  const openShortcuts = (): void => {
    window.dispatchEvent(new CustomEvent('cc:open-settings-section', { detail: 'shortcuts' }))
  }

  const openLocalModels = (): void => {
    window.dispatchEvent(new CustomEvent('cc:open-settings-section', { detail: 'local-models' }))
  }

  return (
    <SettingsPageShell>
      {!desktopLive ? (
        <div className={css.notice}>
          屏幕截图需要桌面截屏能力，Web 版不可用；配置已保存，将在桌面版直接生效。
        </div>
      ) : status.screenshotHotkeyRegistered === true ? (
        <div className={css.liveBadge}>桌面版已就绪：全局截图快捷键 {hotkeyLabel} 已注册。</div>
      ) : (
        <div className={css.notice}>桌面版已连接；启用开关打开后自动注册全局截图快捷键。</div>
      )}

      <SettingGroup>
        <div className={css.groupTitle}>截图</div>
        <SettingDivider />
        <SettingSwitch
          label="启用截图"
          checked={screenshot.enabled}
          onChange={next => { void update({ screenshot: { ...screenshot, enabled: next } }) }}
          description="通过全局快捷键捕获屏幕，然后框选区域、标注，并复制或保存结果。"
        />
        <SettingDivider />
        <SettingRow>
          <div className={css.shortcutLabel}>
            <div className={css.shortcutTitle}>快捷键</div>
            <div className={css.shortcutDesc}>截图由全局快捷键触发。</div>
          </div>
          <div className={css.shortcutRight}>
            <span className={css.shortcutBadge}>{hotkeyLabel}</span>
            <button type="button" className={css.linkBtn} onClick={openShortcuts}>设置快捷键</button>
          </div>
        </SettingRow>
      </SettingGroup>

      <SettingGroup>
        <div className={css.groupTitle}>文字识别</div>
        <SettingDivider />
        <SettingSwitch
          label="自动识别文字"
          checked={screenshot.autoOcr}
          onChange={next => { void update({ screenshot: { ...screenshot, autoOcr: next } }) }}
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
