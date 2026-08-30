/**
 * Client-side theme overrides for Control Center surfaces. The DSH settings
 * namespace is the authority; localStorage is retained only for one-time
 * migration from the first web-edition implementation.
 */

export const APPEARANCE_SETTINGS_NAMESPACE = 'control-center-appearance'
const THEME_OVERRIDES_KEY = 'cc.theme.overrides'
const MIGRATION_KEY = 'cc.theme.overrides.migrated-to-dsh'
const STYLE_ID = 'cc-theme-overrides'

export interface ThemeOverrides {
  colorPrimary: string
  fontFamily: string
  codeFontFamily: string
  customCss: string
  /** Chat message base font size (px). Cherry `chat.message.font_size`. */
  messageFontSize: number
  /** Cherry `settings.messages.wide_mode` — widen the chat column. */
  wideMode: boolean
  /** Cherry `settings.messages.use_serif_font`. */
  useSerifFont: boolean
  /** Cherry `message.message.style` — plain | bubble. */
  messageStyle: 'plain' | 'bubble'
  /** Cherry `settings.messages.show_message_outline`. */
  showMessageOutline: boolean
  /** Cherry `app.use_system_title_bar` — desktop window chrome (persisted for the desktop companion). */
  useSystemTitleBar: boolean
  /** Cherry `ui.window_style` — transparent/opaque desktop window (persisted for the desktop companion). */
  windowStyle: 'transparent' | 'opaque'
}

export const DEFAULT_THEME_OVERRIDES: ThemeOverrides = {
  colorPrimary: '#8B5CF6',
  fontFamily: '',
  codeFontFamily: '',
  customCss: '',
  messageFontSize: 14,
  wideMode: false,
  useSerifFont: false,
  messageStyle: 'plain',
  showMessageOutline: false,
  useSystemTitleBar: false,
  windowStyle: 'opaque',
}

/** Cherry allows 12-18px; clamp anything else to the range. */
export function clampMessageFontSize(value: unknown): number {
  const raw = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(raw)) return DEFAULT_THEME_OVERRIDES.messageFontSize
  return Math.min(18, Math.max(12, Math.round(raw)))
}

export const THEME_COLOR_PRESETS: readonly string[] = ['#00b96b', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6']

/**
 * Pick black or white for text sitting on `hex`, mirroring Cherry's
 * `getForegroundColor` (src/renderer/utils/style.ts): WCAG 2.0 relative
 * luminance with Cherry's 0.179 threshold.
 *
 * The token layer cannot do this — `--primary-foreground` is a fixed value per
 * theme, so a user-chosen light primary (amber, or Cherry's own default green)
 * ends up with near-white text at ~2.6:1 contrast. Deriving it here keeps every
 * `.cc-btn-primary` / `var(--primary-foreground)` seat legible for any colour
 * the user picks.
 */
export function getForegroundColor(hex: string): string {
  const normalized = hex.trim().replace(/^#/, '')
  const full = normalized.length === 3 ? normalized.replace(/./g, char => char + char) : normalized
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return '#FFFFFF'
  const channel = (offset: number): number => parseInt(full.slice(offset, offset + 2), 16) / 255
  const normalize = (value: number): number => (value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4))
  const luminance = 0.2126 * normalize(channel(0)) + 0.7152 * normalize(channel(2)) + 0.0722 * normalize(channel(4))
  return luminance > 0.179 ? '#000000' : '#FFFFFF'
}

export function loadThemeOverrides(): ThemeOverrides {
  try {
    const raw = localStorage.getItem(THEME_OVERRIDES_KEY)
    if (raw === null) return { ...DEFAULT_THEME_OVERRIDES }
    const parsed = JSON.parse(raw) as Partial<ThemeOverrides>
    return {
      colorPrimary: typeof parsed.colorPrimary === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(parsed.colorPrimary) ? parsed.colorPrimary : DEFAULT_THEME_OVERRIDES.colorPrimary,
      fontFamily: typeof parsed.fontFamily === 'string' ? parsed.fontFamily : '',
      codeFontFamily: typeof parsed.codeFontFamily === 'string' ? parsed.codeFontFamily : '',
      customCss: typeof parsed.customCss === 'string' ? parsed.customCss : '',
      messageFontSize: clampMessageFontSize(parsed.messageFontSize),
      wideMode: parsed.wideMode === true,
      useSerifFont: parsed.useSerifFont === true,
      messageStyle: parsed.messageStyle === 'bubble' ? 'bubble' : 'plain',
      showMessageOutline: parsed.showMessageOutline === true,
      useSystemTitleBar: parsed.useSystemTitleBar === true,
      windowStyle: parsed.windowStyle === 'transparent' ? 'transparent' : 'opaque',
    }
  } catch {
    return { ...DEFAULT_THEME_OVERRIDES }
  }
}

export function hasLegacyThemeOverrides(): boolean {
  try { return localStorage.getItem(THEME_OVERRIDES_KEY) !== null && localStorage.getItem(MIGRATION_KEY) !== '1' } catch { return false }
}

export function markThemeOverridesMigrated(): void {
  try {
    localStorage.setItem(MIGRATION_KEY, '1')
    localStorage.removeItem(THEME_OVERRIDES_KEY)
  } catch { /* best effort */ }
}

export function saveThemeOverrides(overrides: ThemeOverrides): void {
  applyThemeOverrides(overrides)
}

/** Inject (or refresh) the override style element. */
export function applyThemeOverrides(overrides: ThemeOverrides): void {
  const css: string[] = []
  // Drive the brand ramp, the on-primary text colour and the focus ring from
  // the one colour the user picked. `--cs-primary-foreground` has to move with
  // it (Cherry derives the same value in useUserTheme), and `--cs-ring` is
  // re-stated so the dark theme stops falling back to its hardcoded green.
  const onPrimary = getForegroundColor(overrides.colorPrimary)
  const themed = `--cs-brand-500: ${overrides.colorPrimary};`
    + ` --cs-brand-600: color-mix(in srgb, ${overrides.colorPrimary} 88%, #000);`
    + ` --primary: ${overrides.colorPrimary};`
    + ` --cs-primary-foreground: ${onPrimary};`
    + ` --primary-foreground: ${onPrimary};`
    + ` --cs-ring: color-mix(in srgb, ${overrides.colorPrimary} 40%, transparent);`
  css.push(`.cc-surface { ${themed} }`)
  // The dark block in cherry-tokens.css is `body[data-ds-dark-theme]
  // .cc-surface` — higher specificity than a bare `.cc-surface` — and it
  // re-declares both `--cs-primary-foreground` and `--cs-ring`. Restate the
  // themed values at matching specificity or they silently lose in dark mode.
  css.push(`body[data-ds-dark-theme] .cc-surface { ${themed} }`)
  if (overrides.fontFamily !== '') {
    css.push(`.cc-surface { font-family: ${overrides.fontFamily}, var(--cs-font-family-body), -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif; }`)
  }
  if (overrides.codeFontFamily !== '') {
    css.push(`.cc-surface code, .cc-surface pre, .cc-surface .langCode { font-family: ${overrides.codeFontFamily}, ui-monospace, Consolas, monospace; }`)
  }
  // Chat message base font size. DSH message DOM uses CSS modules, but the
  // chat-flow column carries a stable `data-chat-flow` attribute; set the
  // size there so descendants inherit it (Cherry `chat.message.font_size`).
  if (clampMessageFontSize(overrides.messageFontSize) !== DEFAULT_THEME_OVERRIDES.messageFontSize) {
    css.push(`[data-chat-flow] { font-size: ${clampMessageFontSize(overrides.messageFontSize)}px; }`)
  }
  // Cherry `settings.messages.wide_mode` — relax the chat column's max width.
  if (overrides.wideMode) {
    css.push(`[data-chat-flow] { max-width: 1200px; }`)
  }
  // Cherry `settings.messages.use_serif_font`.
  if (overrides.useSerifFont) {
    css.push(`[data-chat-flow] { font-family: Georgia, 'Times New Roman', serif; }`)
  }
  // Cherry `message.message.style` — bubble surfaces each node via the stable
  // `data-chat-flow-kind` attribute that the DSH message seats carry.
  if (overrides.messageStyle === 'bubble') {
    css.push(`[data-chat-flow] [data-chat-flow-kind] { background: color-mix(in srgb, var(--cs-brand-500, #00b96b) 8%, transparent); border-radius: 12px; padding: 8px 12px; margin: 4px 0; }`)
  }
  // Cherry `settings.messages.show_message_outline`.
  if (overrides.showMessageOutline) {
    css.push(`[data-chat-flow] [data-chat-flow-kind] { outline: 1px solid color-mix(in srgb, var(--cs-brand-500, #00b96b) 35%, transparent); border-radius: 8px; }`)
  }
  if (overrides.customCss.trim() !== '') css.push(overrides.customCss)
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (style === null) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = css.join('\n')
}
