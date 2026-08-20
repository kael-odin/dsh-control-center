/**
 * Quick assistant settings — Cherry QuickAssistantSettings parity: enable
 * switch, tray/clipboard rows, model row, window preview. Web edition cannot
 * host the floating window (noted honestly); preferences persist for desktop.
 */
import { useEffect, useState } from 'react'
import { HelpTooltip } from './panel-ui.tsx'
import {
  SettingDivider, SettingGroup, SettingRow, SettingRowTitle, SettingsPageShell, SettingSwitch,
} from './SettingsPages.tsx'
import css from './QuickAssistantSection.module.css'

const QUICK_KEY = 'cc.settings.quickAssistant'

interface QuickPrefs {
  enabled: boolean
  clickTrayToShow: boolean
  readClipboardAtStartup: boolean
  modelMode: 'assistant' | 'model'
}

function loadPrefs(): QuickPrefs {
  try {
    const raw = localStorage.getItem(QUICK_KEY)
    if (raw === null) return { enabled: false, clickTrayToShow: false, readClipboardAtStartup: true, modelMode: 'model' }
    const parsed = JSON.parse(raw) as Partial<QuickPrefs>
    return {
      enabled: parsed.enabled ?? false,
      clickTrayToShow: parsed.clickTrayToShow ?? false,
      readClipboardAtStartup: parsed.readClipboardAtStartup ?? true,
      modelMode: parsed.modelMode ?? 'model',
    }
  } catch {
    return { enabled: false, clickTrayToShow: false, readClipboardAtStartup: true, modelMode: 'model' }
  }
}

export function QuickAssistantSection() {
  const [prefs, setPrefs] = useState<QuickPrefs>(loadPrefs)

  useEffect(() => {
    try { localStorage.setItem(QUICK_KEY, JSON.stringify(prefs)) } catch { /* best effort */ }
  }, [prefs])

  const update = (patch: Partial<QuickPrefs>): void => {
    setPrefs(current => ({ ...current, ...patch }))
  }

  return (
    <SettingsPageShell>
      <div className={css.notice}>
        快捷助手的全局唤起依赖系统级热键与悬浮窗，Web 版不可用；以下配置将随桌面版直接生效。
      </div>

      <SettingGroup>
        <div className={css.groupTitle}>快捷助手</div>
        <SettingDivider />
        <SettingSwitch
          label={<><span>启用快捷助手</span><HelpTooltip text="右键点击托盘图标或使用快捷键启动" /></>}
          checked={prefs.enabled}
          onChange={next => { update({ enabled: next }) }}
        />
        {prefs.enabled && (
          <>
            <SettingDivider />
            <SettingSwitch
              label="点击托盘图标启动"
              checked={prefs.clickTrayToShow}
              onChange={next => { update({ clickTrayToShow: next }) }}
            />
            <SettingDivider />
            <SettingSwitch
              label="启动时读取剪贴板"
              checked={prefs.readClipboardAtStartup}
              onChange={next => { update({ readClipboardAtStartup: next }) }}
            />
          </>
        )}
      </SettingGroup>

      {prefs.enabled && (
        <SettingGroup>
          <SettingRow>
            <SettingRowTitle>
              快捷助手模型
              <HelpTooltip text="使用助手：会同时使用助手的系统提示词和模型参数" />
            </SettingRowTitle>
            <div className={css.modelRow}>
              <div className={css.segmented}>
                <button
                  type="button"
                  className={`${css.segItem} ${prefs.modelMode === 'model' ? css.segItemActive : ''}`}
                  onClick={() => { update({ modelMode: 'model' }) }}
                >
                  默认模型
                </button>
                <button
                  type="button"
                  className={`${css.segItem} ${prefs.modelMode === 'assistant' ? css.segItemActive : ''}`}
                  onClick={() => { update({ modelMode: 'assistant' }) }}
                >
                  使用助手
                </button>
              </div>
              {prefs.modelMode === 'model' && <span className={css.modelHint}>跟随当前对话选择的模型</span>}
            </div>
          </SettingRow>
        </SettingGroup>
      )}

      <SettingGroup>
        <div className={css.groupTitle}>窗口预览</div>
        <SettingDivider />
        <div className={css.previewWindow}>
          <div className={css.previewBar}>
            <span className={css.previewLogo}>✨</span>
            <span className={css.previewPlaceholder}>输入消息，或从下方选择一个功能…</span>
          </div>
          <div className={css.previewFooter}>
            <span className={css.previewChip}>翻译</span>
            <span className={css.previewChip}>解释</span>
            <span className={css.previewChip}>总结</span>
          </div>
        </div>
      </SettingGroup>
    </SettingsPageShell>
  )
}
