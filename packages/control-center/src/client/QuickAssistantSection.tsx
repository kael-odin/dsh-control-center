/**
 * Quick assistant settings — Cherry QuickAssistantSettings parity: enable
 * switch, tray/clipboard rows, model row, window preview. The desktop shell
 * registers the global quick-assist hotkey from the host-pushed prefs (v1
 * focuses the main window; the floating assistant window is planned); the
 * notices reflect the live environment.
 */
import { useEffect, useState } from 'react'
import type { AssistantRemote, DesktopRemote } from './assistant-store.ts'
import { useAssistantStore, useDesktopStatus } from './assistant-store.ts'
import { HelpTooltip } from './panel-ui.tsx'
import {
  SettingDivider, SettingGroup, SettingRow, SettingRowTitle, SettingsPageShell, SettingSwitch,
} from './SettingsPages.tsx'
import css from './QuickAssistantSection.module.css'

export interface QuickAssistantSectionInjected {
  assistant: AssistantRemote | undefined
  desktop: DesktopRemote | undefined
}

interface AgentPresetOption {
  id: string
  name: string
  trust: 'system' | 'user'
  isDefault: boolean
}

/** Loads the deployment's agent presets once for the 「使用助手」 picker. */
function useAgentPresets(assistant: AssistantRemote | undefined): AgentPresetOption[] {
  const [presets, setPresets] = useState<AgentPresetOption[]>([])
  useEffect(() => {
    if (assistant === undefined) return
    let active = true
    void assistant.listAgentPresets().then((result) => {
      if (active && result.ok) setPresets([...result.value])
    }).catch(() => {})
    return () => { active = false }
  }, [assistant])
  return presets
}

export function QuickAssistantSection({ assistant, desktop }: QuickAssistantSectionInjected) {
  const { prefs, update } = useAssistantStore(assistant, 'cc.settings.quickAssistant', 'quick')
  const status = useDesktopStatus(desktop)
  const presets = useAgentPresets(assistant)

  if (prefs === null) return <SettingsPageShell><div className={css.loading}>加载中...</div></SettingsPageShell>

  const quick = prefs.quick
  const patch = (p: Partial<typeof quick>): void => { void update({ quick: { ...quick, ...p } }) }
  const desktopLive = status !== null && status.supported
  const hotkeyLabel = (status?.quickHotkey ?? 'Ctrl+Shift+U')
    .replace('CommandOrControl', 'Ctrl')
    .replace(/\+/g, ' + ')

  return (
    <SettingsPageShell>
      {!desktopLive ? (
        <div className={css.notice}>
          快捷助手的全局唤起依赖系统级热键与悬浮窗，Web 版不可用；配置已保存，将在桌面版直接生效。
        </div>
      ) : status.quickHotkeyRegistered === true ? (
        <div className={css.liveBadge}>桌面版已就绪：全局快捷键 {hotkeyLabel} 已注册，唤起主窗口。</div>
      ) : (
        <div className={css.notice}>桌面版已连接；启用开关打开后自动注册全局快捷键（独立悬浮窗集成中）。</div>
      )}

      <SettingGroup>
        <div className={css.groupTitle}>快捷助手</div>
        <SettingDivider />
        <SettingSwitch
          label={<><span>启用快捷助手</span><HelpTooltip text="右键点击托盘图标或使用快捷键启动" /></>}
          checked={quick.enabled}
          onChange={next => { patch({ enabled: next }) }}
        />
        {quick.enabled && (
          <>
            <SettingDivider />
            <SettingSwitch
              label="点击托盘图标启动"
              checked={quick.clickTrayToShow}
              onChange={next => { patch({ clickTrayToShow: next }) }}
            />
            <SettingDivider />
            <SettingSwitch
              label="启动时读取剪贴板"
              checked={quick.readClipboardAtStartup}
              onChange={next => { patch({ readClipboardAtStartup: next }) }}
            />
          </>
        )}
      </SettingGroup>

      {quick.enabled && (
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
                  className={`${css.segItem} ${quick.modelMode === 'model' ? css.segItemActive : ''}`}
                  onClick={() => { patch({ modelMode: 'model' }) }}
                >
                  默认模型
                </button>
                <button
                  type="button"
                  className={`${css.segItem} ${quick.modelMode === 'assistant' ? css.segItemActive : ''}`}
                  onClick={() => { patch({ modelMode: 'assistant' }) }}
                >
                  使用助手
                </button>
              </div>
              {quick.modelMode === 'model' && <span className={css.modelHint}>跟随当前对话选择的模型</span>}
              {quick.modelMode === 'assistant' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={css.modelHint}>Agent 预设</span>
                  <QuickPresetPicker
                    assistant={assistant}
                    presets={presets}
                    value={quick.agentPresetId}
                    onChange={id => { patch({ agentPresetId: id }) }}
                  />
                </div>
              )}
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

/**
 * Preset picker for 「使用助手」 mode: a real dropdown over the deployment's
 * presets (host-proxied), falling back to a manual id input when the roster
 * cannot be read or is empty.
 */
function QuickPresetPicker({ assistant, presets, value, onChange }: {
  assistant: AssistantRemote | undefined
  presets: AgentPresetOption[]
  value: string
  onChange: (id: string) => void
}): JSX.Element {
  if (presets.length === 0) {
    return (
      <input
        type="text"
        className={css.agentInput}
        value={value}
        onChange={event => { onChange(event.target.value) }}
        placeholder={assistant === undefined ? '宿主不可达，手动输入预设 ID' : '预设列表为空，手动输入预设 ID'}
      />
    )
  }
  const known = presets.some(preset => preset.id === value)
  return (
    <select
      className={css.agentInput}
      value={known ? value : ''}
      onChange={event => { onChange(event.target.value) }}
    >
      <option value="" disabled>选择 Agent 预设…</option>
      {presets.map(preset => (
        <option key={preset.id} value={preset.id}>
          {preset.name}{preset.isDefault ? '（默认）' : ''}{preset.trust === 'user' ? ' · 本地' : ''}
        </option>
      ))}
      {value.length > 0 && !known && <option value={value}>{value}（当前保存值）</option>}
    </select>
  )
}
