/**
 * Appearance settings — Cherry AppearanceSettings parity (web-feasible rows):
 * theme mode (real DSH theme switch), theme color (real overrides), fonts,
 * custom CSS. Desktop-only rows (zoom/context menu/transparent window) are
 * noted honestly.
 */
import { useEffect, useRef, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { LocaleRuntime, LocaleSnapshot } from '@deepseek-ai/dsh-client-locale/client'
import {
  applyThemeOverrides, clampMessageFontSize, DEFAULT_THEME_OVERRIDES, hasLegacyThemeOverrides, loadThemeOverrides, markThemeOverridesMigrated, THEME_COLOR_PRESETS, APPEARANCE_SETTINGS_NAMESPACE, type ThemeOverrides,
} from './theme-overrides.ts'
import { isDesktopEnv } from './desktop-capabilities.ts'
import type {} from '../desktop-types.ts'
import { HelpTooltip } from './panel-ui.tsx'
import {
  SettingDivider, SettingGroup, SettingRow, SettingRowTitle, SettingsPageShell, SettingSwitch,
} from './SettingsPages.tsx'
import css from './AppearanceSection.module.css'

export interface AppearanceSectionInjected {
  api: ClientRemote
  locale?: LocaleRuntime
  getDesktop: () => NonNullable<ClientRemote['controlCenterDesktop']>
  hooks: { desktopReady: HostObservable<boolean> }
}

export type AppearanceSectionProps = PropsRuntime<'settings.section'> & InjectFace<AppearanceSectionInjected>

type ThemeMode = 'light' | 'dark' | 'system'

/**
 * Desktop-only row value: once the desktop service confirms a reachable native
 * bridge, show a real "已连接 (Electron vX)" signal; in a desktop shell without
 * a reachable bridge show "桌面（桥接未连接）"; in a browser tab stay honest with
 * "需要桌面版".
 * @param bridgeText - electron/notification status text when bridge confirmed.
 * @param bridgeSupported - true only when the desktop service check() succeeded.
 */
function desktopRowValue(bridgeText: string, bridgeSupported: boolean): string {
  if (isDesktopEnv() && bridgeSupported && bridgeText !== '') return `已连接 (${bridgeText})`
  if (isDesktopEnv() && bridgeSupported) return '桌面（已就绪）'
  if (isDesktopEnv()) return '桌面（桥接未连接）'
  return '需要桌面版'
}

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

export function AppearanceSection({ api, locale, getDesktop, useDesktopReady }: AppearanceSectionProps) {
  const [overrides, setOverrides] = useState<ThemeOverrides>(loadThemeOverrides)
  const fallbackLocale: LocaleSnapshot = { active: 'zh', locales: [{ id: 'zh', label: '中文' }], revision: 0 }
  const [localeSnapshot, setLocaleSnapshot] = useState<LocaleSnapshot>(() => locale?.getSnapshot() ?? fallbackLocale)
  const [themeMode, setThemeMode] = useState<ThemeMode>('system')
  const [hexDraft, setHexDraft] = useState(overrides.colorPrimary)
  const [fontDraft, setFontDraft] = useState(overrides.fontFamily)
  const [codeFontDraft, setCodeFontDraft] = useState(overrides.codeFontFamily)
  const [cssDraft, setCssDraft] = useState(overrides.customCss)
  const [messageFontSize, setMessageFontSize] = useState(overrides.messageFontSize)
  // Real desktop-bridge status: desktopReady means the controlCenterDesktop
  // remote is mounted; bridgeSupported means its check() confirmed a reachable
  // native bridge (the shell's Electron service).
  const desktopReady = useDesktopReady(value => value)
  const [zoom, setZoom] = useState(1)
  const [zoomBusy, setZoomBusy] = useState(false)
  const [fontOptions, setFontOptions] = useState(FONT_OPTIONS)
  const [fontLoading, setFontLoading] = useState(false)
  const [bridgeText, setBridgeText] = useState('')
  const [bridgeSupported, setBridgeSupported] = useState(false)
  const [appearanceReady, setAppearanceReady] = useState(false)
  const [appearanceSaving, setAppearanceSaving] = useState(false)
  const [appearanceError, setAppearanceError] = useState('')
  const overridesRef = useRef(overrides)
  const revisionRef = useRef<number | null>(null)
  const writeQueueRef = useRef(Promise.resolve())

  useEffect(() => {
    if (locale === undefined) return
    const unsubscribe = locale.subscribe(() => { setLocaleSnapshot(locale.getSnapshot()) })
    return unsubscribe
  }, [locale])

  // Probe the desktop service once its remote is mounted; the
  // controlCenterDesktop service reports whether the shell's native bridge is
  // genuinely reachable (web profiles honestly return unsupported).
  useEffect(() => {
    if (!desktopReady) return
    let active = true
    setFontLoading(true)
    void getDesktop().fonts().then(result => {
      if (!active) return
      if (result.ok && result.value.ok && result.value.fonts !== undefined && result.value.fonts.length > 0) {
        setFontOptions([{ label: '默认', value: '' }, ...result.value.fonts.map((font: string) => ({ label: font, value: font }))])
      }
    }).finally(() => { if (active) setFontLoading(false) })
    return () => { active = false }
  }, [desktopReady])

  useEffect(() => {
    if (!desktopReady) return
    let active = true
    void getDesktop().check().then(result => {
      if (!active) return
      if (result.ok && result.value.supported) {
        setBridgeSupported(true)
        setBridgeText(result.value.electron ? `Electron ${result.value.electron}` : '')
      } else {
        setBridgeSupported(false)
        setBridgeText('')
      }
    }).catch(() => { if (active) { setBridgeSupported(false); setBridgeText('') } })
    return () => { active = false }
  }, [desktopReady])

  // Read the current theme mode from the DSH theme namespace.
  useEffect(() => {
    let active = true
    void api.settings.describe().then(response => {
      if (!active || !response.ok) return
      const themeNs = response.value.namespaces.find(ns => ns.ns === THEME_NS)
      const preference = (themeNs?.value as { preference?: string } | undefined)?.preference
      if (preference === 'light' || preference === 'dark' || preference === 'system') setThemeMode(preference)
    }).catch(() => {})
    return () => { active = false }
  }, [api])

  const changeZoom = (delta: number, reset = false): void => {
    if (zoomBusy || revisionRef.current === null) return
    const previous = zoom
    setZoomBusy(true)
    void getDesktop().adjustZoom(delta, reset).then(result => {
      if (!result.ok || !result.value.ok || result.value.zoom === undefined) {
        throw new Error(result.ok ? result.value.error ?? '缩放设置失败' : result.error.message)
      }
      setZoom(result.value.zoom)
      return api.settings.mutate(APPEARANCE_SETTINGS_NAMESPACE, [{ op: 'set', path: ['desktopZoom'], value: result.value.zoom }], revisionRef.current!).then(response => {
        if (!response.ok) throw new Error(response.error.message)
        revisionRef.current = response.value.revision
      })
    }).catch(error => {
      setZoom(previous)
      setAppearanceError(String((error as Error).message || '缩放设置保存失败，请重试。'))
      if (bridgeSupported) void getDesktop().adjustZoom(0, true).then(() => getDesktop().adjustZoom(previous - 1, false))
    }).finally(() => { setZoomBusy(false) })
  }

  // Load the authoritative DSH appearance namespace. Legacy browser values are
  // migrated only when the namespace is still at its schema defaults.
  useEffect(() => {
    let active = true
    void api.settings.describe().then(response => {
      if (!active) return
      if (!response.ok) {
        setAppearanceError('外观设置加载失败，请重试。')
        return
      }
      const namespace = response.value.namespaces.find(view => view.ns === APPEARANCE_SETTINGS_NAMESPACE)
      if (namespace === undefined) {
        setAppearanceError('外观设置不可用，请重试。')
        return
      }
      const stored = namespace.value as Partial<ThemeOverrides> & { desktopZoom?: unknown }
      const storedZoom = typeof stored.desktopZoom === 'number' && stored.desktopZoom >= 0.5 && stored.desktopZoom <= 2 ? stored.desktopZoom : 1
      const hasStoredValues = typeof stored.colorPrimary === 'string' && stored.colorPrimary !== DEFAULT_THEME_OVERRIDES.colorPrimary
        || stored.fontFamily !== '' || stored.codeFontFamily !== '' || stored.customCss !== ''
      const legacy = loadThemeOverrides()
      const next = !hasStoredValues && hasLegacyThemeOverrides() ? legacy : {
        colorPrimary: typeof stored.colorPrimary === 'string' ? stored.colorPrimary : DEFAULT_THEME_OVERRIDES.colorPrimary,
        fontFamily: typeof stored.fontFamily === 'string' ? stored.fontFamily : '',
        codeFontFamily: typeof stored.codeFontFamily === 'string' ? stored.codeFontFamily : '',
        customCss: typeof stored.customCss === 'string' ? stored.customCss : '',
        messageFontSize: clampMessageFontSize(stored.messageFontSize),
        wideMode: stored.wideMode === true,
        useSerifFont: stored.useSerifFont === true,
        messageStyle: stored.messageStyle === 'bubble' ? 'bubble' as const : 'plain' as const,
        showMessageOutline: stored.showMessageOutline === true,
        useSystemTitleBar: stored.useSystemTitleBar === true,
        windowStyle: stored.windowStyle === 'transparent' ? 'transparent' as const : 'opaque' as const,
      }
      overridesRef.current = next
      revisionRef.current = namespace.revision
      setOverrides(next)
      setHexDraft(next.colorPrimary)
      setFontDraft(next.fontFamily)
      setCodeFontDraft(next.codeFontFamily)
      setCssDraft(next.customCss)
      setMessageFontSize(next.messageFontSize)
      setZoom(storedZoom)
      if (desktopReady && isDesktopEnv()) {
        void getDesktop().adjustZoom(0, true).then(() => getDesktop().adjustZoom(storedZoom - 1, false))
      }
      applyThemeOverrides(next)
      setAppearanceReady(true)
      setAppearanceError('')
      if (!hasStoredValues && hasLegacyThemeOverrides()) {
        writeQueueRef.current = writeQueueRef.current.then(async () => {
          const migrated = await api.settings.mutate(APPEARANCE_SETTINGS_NAMESPACE, [ { op: 'set', path: ['colorPrimary'], value: next.colorPrimary }, { op: 'set', path: ['fontFamily'], value: next.fontFamily }, { op: 'set', path: ['codeFontFamily'], value: next.codeFontFamily }, { op: 'set', path: ['customCss'], value: next.customCss }, ], namespace.revision)
          if (migrated.ok) {
            revisionRef.current = migrated.value.revision
            markThemeOverridesMigrated()
          }
        }).catch(() => { setAppearanceError('旧版外观设置迁移失败，请重试。') })
      }
    }).catch(() => { if (active) setAppearanceError('外观设置加载失败，请重试。') })
    return () => { active = false }
  }, [api, desktopReady])

  const updateOverrides = (patch: Partial<ThemeOverrides>): void => {
    if (!appearanceReady || appearanceSaving || revisionRef.current === null) return
    const previous = overridesRef.current
    const next = { ...previous, ...patch }
    overridesRef.current = next
    setOverrides(next)
    applyThemeOverrides(next)
    setAppearanceSaving(true)
    setAppearanceError('')
    const ops = Object.entries(patch).map(([key, value]) => ({
      op: 'set' as const,
      path: [key],
      value,
    }))
    writeQueueRef.current = writeQueueRef.current.then(async () => {
      const response = await api.settings.mutate(APPEARANCE_SETTINGS_NAMESPACE, ops, revisionRef.current!)
      if (!response.ok) throw new Error(response.error.message)
      revisionRef.current = response.value.revision
    }).catch(error => {
      overridesRef.current = previous
      setOverrides(previous)
      setHexDraft(previous.colorPrimary)
      setFontDraft(previous.fontFamily)
      setCodeFontDraft(previous.codeFontFamily)
      setCssDraft(previous.customCss)
      applyThemeOverrides(previous)
      setAppearanceError(String((error as Error).message || '外观设置保存失败，请重试。'))
    }).finally(() => { setAppearanceSaving(false) })
  }

  const setMode = (mode: ThemeMode): void => {
    setThemeMode(mode)
    void api.settings.mutate(THEME_NS, [{ op: 'set', path: ['preference'], value: mode }], undefined).then(() => { applyThemeOverrides(overridesRef.current) }).catch(() => {})
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
              disabled={!appearanceReady || appearanceSaving}
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
                disabled={!appearanceReady || appearanceSaving}
                onClick={() => { setColor(color) }}
              />
            ))}
            <label className={css.nativePicker} title="自定义颜色">
              <input
                type="color"
                value={overrides.colorPrimary}
                disabled={!appearanceReady || appearanceSaving}
                onChange={event => { setColor(event.target.value) }}
              />
              <span className={css.nativeSwatch} style={{ background: overrides.colorPrimary }} />
            </label>
            <input
              className={css.hexInput}
              value={hexDraft}
              disabled={!appearanceReady || appearanceSaving}
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
          <select
            className={css.fontSelect}
            value={localeSnapshot.active}
            onChange={event => { locale?.setLocale(event.target.value) }}
            aria-label="语言"
          >
            {localeSnapshot.locales.map(option => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>缩放 <span className={css.desktopTag}>桌面</span></SettingRowTitle>
          <div className={css.zoomControls}>
            <button type="button" disabled={!bridgeSupported || zoomBusy || zoom <= 0.5} onClick={() => { changeZoom(-0.1) }} aria-label="缩小">−</button>
            <span className={css.staticValue}>{Math.round(zoom * 100)}%</span>
            <button type="button" disabled={!bridgeSupported || zoomBusy || zoom >= 2} onClick={() => { changeZoom(0.1) }} aria-label="放大">＋</button>
            {zoom !== 1 && <button type="button" disabled={!bridgeSupported || zoomBusy} onClick={() => { changeZoom(0, true) }} aria-label="重置缩放">↺</button>}
          </div>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>透明窗口 <span className={css.desktopTag}>桌面</span></SettingRowTitle>
          <span className={css.staticValue}>{desktopRowValue(bridgeText, bridgeSupported)}</span>
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
            disabled={!appearanceReady || appearanceSaving || fontLoading}
            onChange={event => { setFontDraft(event.target.value); updateOverrides({ fontFamily: event.target.value }) }}
          >
            {fontOptions.map(option => (
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
            disabled={!appearanceReady || appearanceSaving || fontLoading}
            onChange={event => { setCodeFontDraft(event.target.value); updateOverrides({ codeFontFamily: event.target.value }) }}
          >
            {fontOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>消息字体大小 <HelpTooltip text="作用于聊天消息正文（12–18px，Cherry chat.message.font_size）" /></SettingRowTitle>
          <div className={css.zoomControls}>
            <button type="button" disabled={!appearanceReady || appearanceSaving || messageFontSize <= 12} onClick={() => { const next = clampMessageFontSize(messageFontSize - 1); setMessageFontSize(next); updateOverrides({ messageFontSize: next }) }} aria-label="缩小字号">−</button>
            <span className={css.staticValue}>{messageFontSize}px</span>
            <button type="button" disabled={!appearanceReady || appearanceSaving || messageFontSize >= 18} onClick={() => { const next = clampMessageFontSize(messageFontSize + 1); setMessageFontSize(next); updateOverrides({ messageFontSize: next }) }} aria-label="放大字号">＋</button>
            {messageFontSize !== 14 && <button type="button" disabled={!appearanceReady || appearanceSaving} onClick={() => { setMessageFontSize(14); updateOverrides({ messageFontSize: 14 }) }} aria-label="重置字号">↺</button>}
          </div>
        </SettingRow>
        <SettingDivider />
        <SettingSwitch
          label={<><span>宽屏模式</span><HelpTooltip text="放宽聊天消息列的宽度（Cherry settings.messages.wide_mode）" /></>}
          checked={overrides.wideMode}
          disabled={!appearanceReady || appearanceSaving}
          onChange={next => { updateOverrides({ wideMode: next }) }}
        />
        <SettingDivider />
        <SettingSwitch
          label={<><span>使用衬线字体</span><HelpTooltip text="聊天消息正文使用衬线字体（Cherry settings.messages.use_serif_font）" /></>}
          checked={overrides.useSerifFont}
          disabled={!appearanceReady || appearanceSaving}
          onChange={next => { updateOverrides({ useSerifFont: next }) }}
        />
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>消息样式 <HelpTooltip text="气泡样式为每条消息添加底色与圆角（Cherry message.message.style）" /></SettingRowTitle>
          <div className={css.segmented}>
            <button type="button" className={`${css.seg} ${overrides.messageStyle === 'plain' ? css.segActive : ''}`} disabled={!appearanceReady || appearanceSaving}
              onClick={() => { updateOverrides({ messageStyle: 'plain' }) }}>平铺</button>
            <button type="button" className={`${css.seg} ${overrides.messageStyle === 'bubble' ? css.segActive : ''}`} disabled={!appearanceReady || appearanceSaving}
              onClick={() => { updateOverrides({ messageStyle: 'bubble' }) }}>气泡</button>
          </div>
        </SettingRow>
        <SettingDivider />
        <SettingSwitch
          label={<><span>显示消息轮廓</span><HelpTooltip text="为每条消息添加细边框（Cherry settings.messages.show_message_outline）" /></>}
          checked={overrides.showMessageOutline}
          disabled={!appearanceReady || appearanceSaving}
          onChange={next => { updateOverrides({ showMessageOutline: next }) }}
        />
      </SettingGroup>

      <SettingGroup>
        <div className={css.groupHeader}>窗口 <HelpTooltip text="桌面窗口外观偏好，保存后随桌面版生效（Cherry ui.window_style / app.use_system_title_bar）" /></div>
        <SettingRow>
          <SettingRowTitle>
            窗口样式
            <span className={css.desktopTag}>桌面</span>
          </SettingRowTitle>
          <div className={css.segmented}>
            <button type="button" className={`${css.seg} ${overrides.windowStyle === 'opaque' ? css.segActive : ''}`} disabled={!appearanceReady || appearanceSaving}
              onClick={() => { updateOverrides({ windowStyle: 'opaque' }) }}>不透明</button>
            <button type="button" className={`${css.seg} ${overrides.windowStyle === 'transparent' ? css.segActive : ''}`} disabled={!appearanceReady || appearanceSaving}
              onClick={() => { updateOverrides({ windowStyle: 'transparent' }) }}>透明</button>
          </div>
        </SettingRow>
        <SettingDivider />
        <SettingSwitch
          label={<><span>使用系统标题栏</span><HelpTooltip text="使用操作系统原生标题栏替代应用内标题栏（桌面版重启后生效）" /></>}
          checked={overrides.useSystemTitleBar}
          disabled={!appearanceReady || appearanceSaving}
          onChange={next => { updateOverrides({ useSystemTitleBar: next }) }}
        />
      </SettingGroup>

      <SettingGroup>
        <div className={css.groupHeader}>自定义 CSS <HelpTooltip text="作用于控制中心各工作区与设置界面（.cc-surface 作用域）" /></div>
        <textarea
          className={css.cssEditor}
          value={cssDraft}
          disabled={!appearanceReady || appearanceSaving}
          onChange={event => { setCssDraft(event.target.value) }}
          onBlur={commitCss}
          placeholder={'/* 这里写自定义 CSS */'}
          spellCheck={false}
        />
      </SettingGroup>
      {appearanceError === '' ? null : <p role="alert" className="cc-error">{appearanceError}</p>}
    </SettingsPageShell>
  )
}
