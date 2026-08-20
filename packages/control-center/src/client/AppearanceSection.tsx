/**
 * Appearance settings — Cherry AppearanceSettings parity (web-feasible rows):
 * theme mode (real DSH theme switch), theme color (real overrides), fonts,
 * custom CSS. Desktop-only rows (zoom/context menu/transparent window) are
 * noted honestly.
 */
import { useEffect, useState } from 'react'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { IApiClient } from '@deepseek-ai/dsh-client-connection/client'
import {
  applyThemeOverrides, loadThemeOverrides, saveThemeOverrides, THEME_COLOR_PRESETS, type ThemeOverrides,
} from './theme-overrides.ts'
import { HelpTooltip } from './panel-ui.tsx'
import {
  SettingDivider, SettingGroup, SettingRow, SettingRowTitle, SettingsPageShell,
} from './SettingsPages.tsx'
import css from './AppearanceSection.module.css'

export interface AppearanceSectionInjected {
  api: IApiClient
}

export type AppearanceSectionProps = PropsRuntime<'settings.section'> & InjectFace<AppearanceSectionInjected>

type ThemeMode = 'light' | 'dark' | 'system'

const THEME_NS = 'ui-theme'

const FONT_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
  { label: '默认', value: '' },
  { label: '系统 UI', value: 'system-ui, sans-serif' },
  { label: 'PingFang SC', value: '"PingFang SC", "Hiragino Sans GB", sans-serif' },
  { label: 'Microsoft YaHei', value: '"Microsoft YaHei", "微软雅黑", sans-serif' },
  { label: 'Source Han Sans', value: '"Source Han Sans SC", "思源黑体", sans-serif' },
  { label: 'Inter', value: 'Inter, -apple-system, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  { label: 'Cascadia Code', value: '"Cascadia Code", monospace' },
  { label: 'Fira Code', value: '"Fira Code", monospace' },
]

function normalizeHex(input: string): string | null {
  let value = input.trim()
  if (value === '') return null
  if (!value.startsWith('#')) value = `#${value}`
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    value = `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) return null
  return value.toUpperCase()
}

function ThemePreview({ mode, active }: { mode: ThemeMode; active: boolean }) {
  const dark = mode === 'dark'
  const split = mode === 'system'
  const bar = (dark: boolean) => ({ background: dark ? '#26282b' : '#f5f5f5' })
  const content = (dark: boolean) => ({ background: dark ? '#1a1b1d' : '#ffffff' })
  const accent = { background: 'var(--primary, #00b96b)' }
  return (
    <div className={`${css.themePreview} ${active ? css.themePreviewActive : ''}`}>
      <div className={css.previewFrame} style={split ? { display: 'flex' } : undefined}>
        {split ? (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', ...bar(false) }}>
              <div style={{ height: 6, margin: 4, borderRadius: 2, width: '60%', ...accent }} />
              <div style={{ flex: 1, margin: '0 4px 4px', borderRadius: 2, ...content(false) }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', ...bar(true) }}>
              <div style={{ height: 6, margin: 4, borderRadius: 2, width: '60%', ...accent }} />
              <div style={{ flex: 1, margin: '0 4px 4px', borderRadius: 2, ...content(true) }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ height: 8, borderRadius: 2, marginBottom: 4, width: '70%', ...bar(dark) }} />
            <div style={{ flex: 1, borderRadius: 3, ...content(dark) }} />
          </>
        )}
      </div>
    </div>
  )
}

export function AppearanceSection({ api }: AppearanceSectionProps) {
  const [overrides, setOverrides] = useState<ThemeOverrides>(loadThemeOverrides)
  const [themeMode, setThemeMode] = useState<ThemeMode>('system')
  const [hexDraft, setHexDraft] = useState(overrides.colorPrimary)
  const [fontDraft, setFontDraft] = useState(overrides.fontFamily)
  const [codeFontDraft, setCodeFontDraft] = useState(overrides.codeFontFamily)
  const [cssDraft, setCssDraft] = useState(overrides.customCss)

  // Read the current theme preference once (best effort; revision-gated).
  useEffect(() => {
    let active = true
    void api.settings.describe({}).then(response => {
      if (!active || !response.result.ok) return
      const namespaces = response.result.value.namespaces
      const themeNs = namespaces.find(ns => ns.ns === THEME_NS)
      if (themeNs === undefined) return
      const preference = (themeNs.value as { preference?: string } | undefined)?.preference
      if (preference === 'light' || preference === 'dark' || preference === 'system') {
        setThemeMode(preference)
      }
    }).catch(() => {})
    return () => { active = false }
  }, [api])

  const updateOverrides = (patch: Partial<ThemeOverrides>): void => {
    setOverrides(current => {
      const next = { ...current, ...patch }
      saveThemeOverrides(next)
      return next
    })
  }

  const setMode = (mode: ThemeMode): void => {
    setThemeMode(mode)
    void api.settings.mutate({
      ns: THEME_NS,
      ops: [{ op: 'set', path: ['preference'], value: mode }],
    }).then(() => { applyThemeOverrides(overrides) }).catch(() => {})
  }

  const setColor = (color: string): void => {
    updateOverrides({ colorPrimary: color })
    setHexDraft(color)
  }

  const commitHex = (): void => {
    const normalized = normalizeHex(hexDraft)
    if (normalized !== null) {
      updateOverrides({ colorPrimary: normalized })
      setHexDraft(normalized)
    } else {
      setHexDraft(overrides.colorPrimary)
    }
  }

  const commitCss = (): void => {
    updateOverrides({ customCss: cssDraft })
  }

  return (
    <SettingsPageShell>
      <SettingGroup>
        <div className={css.groupHeader}>主题</div>
        <SettingDivider />
        <div className={css.themeGrid}>
          {([['light', '浅色'], ['dark', '深色'], ['system', '系统']] as const).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              className={css.themeOption}
              aria-pressed={themeMode === mode}
              onClick={() => { setMode(mode) }}
            >
              <ThemePreview mode={mode} active={themeMode === mode} />
              <span className={css.themeLabel}>
                {mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '🖥️'} {label}
              </span>
            </button>
          ))}
        </div>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>主题颜色</SettingRowTitle>
          <div className={css.colorRow}>
            {THEME_COLOR_PRESETS.map(color => (
              <button
                key={color}
                type="button"
                className={`${css.swatch} ${overrides.colorPrimary.toLowerCase() === color.toLowerCase() ? css.swatchActive : ''}`}
                style={{ background: color }}
                aria-pressed={overrides.colorPrimary.toLowerCase() === color.toLowerCase()}
                onClick={() => { setColor(color) }}
              />
            ))}
            <label className={css.nativePicker} title="自定义颜色">
              <input
                type="color"
                value={overrides.colorPrimary}
                onChange={event => { setColor(event.target.value) }}
              />
              <span className={css.nativeSwatch} style={{ background: overrides.colorPrimary }} />
            </label>
            <input
              className={css.hexInput}
              value={hexDraft}
              onChange={event => { setHexDraft(event.target.value) }}
              onBlur={commitHex}
              onKeyDown={event => { if (event.key === 'Enter') commitHex() }}
              spellCheck={false}
            />
          </div>
        </SettingRow>
      </SettingGroup>

      <SettingGroup>
        <div className={css.groupHeader}>显示</div>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>语言</SettingRowTitle>
          <span className={css.staticValue}>中文（简体）</span>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>缩放 / 右键菜单样式 / 透明窗口</SettingRowTitle>
          <span className={css.staticValue}>需要桌面版</span>
        </SettingRow>
      </SettingGroup>

      <SettingGroup>
        <div className={css.groupHeader}>字体设置</div>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>全局字体</SettingRowTitle>
          <select
            className={css.fontSelect}
            value={fontDraft}
            onChange={event => { setFontDraft(event.target.value); updateOverrides({ fontFamily: event.target.value }) }}
          >
            {FONT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>代码字体</SettingRowTitle>
          <select
            className={css.fontSelect}
            value={codeFontDraft}
            onChange={event => { setCodeFontDraft(event.target.value); updateOverrides({ codeFontFamily: event.target.value }) }}
          >
            {FONT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </SettingRow>
      </SettingGroup>

      <SettingGroup>
        <div className={css.groupHeader}>自定义 CSS <HelpTooltip text="作用于控制中心各工作区与设置界面（.cc-surface 作用域）" /></div>
        <textarea
          className={css.cssEditor}
          value={cssDraft}
          onChange={event => { setCssDraft(event.target.value) }}
          onBlur={commitCss}
          placeholder={'/* 这里写自定义 CSS */'}
          spellCheck={false}
        />
      </SettingGroup>
    </SettingsPageShell>
  )
}
