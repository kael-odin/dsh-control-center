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
}

export const DEFAULT_THEME_OVERRIDES: ThemeOverrides = {
  colorPrimary: '#00b96b',
  fontFamily: '',
  codeFontFamily: '',
  customCss: '',
  messageFontSize: 14,
}

/** Cherry allows 12-18px; clamp anything else to the range. */
export function clampMessageFontSize(value: unknown): number {
  const raw = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(raw)) return DEFAULT_THEME_OVERRIDES.messageFontSize
  return Math.min(18, Math.max(12, Math.round(raw)))
}

export const THEME_COLOR_PRESETS: readonly string[] = ['#00b96b', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6']

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
  css.push(`.cc-surface { --cs-brand-500: ${overrides.colorPrimary}; --cs-brand-600: color-mix(in srgb, ${overrides.colorPrimary} 88%, #000); --primary: ${overrides.colorPrimary}; }`)
  if (overrides.fontFamily !== '') {
    css.push(`.cc-surface { font-family: ${overrides.fontFamily}, var(--cs-font-family-body), -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif; }`)
  }
  if (overrides.codeFontFamily !== '') {
    css.push(`.cc-surface code, .cc-surface pre, .cc-surface .langCode { font-family: ${overrides.codeFontFamily}, ui-monospace, Consolas, monospace; }`)
  }
  // Chat message base font size. DSH message DOM uses CSS modules, but the
  // chat-flow container carries a stable `data-chat-flow` attribute; set the
  // size there so descendants inherit it (Cherry `chat.message.font_size`).
  if (clampMessageFontSize(overrides.messageFontSize) !== DEFAULT_THEME_OVERRIDES.messageFontSize) {
    css.push(`[data-chat-flow] { font-size: ${clampMessageFontSize(overrides.messageFontSize)}px; }`)
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
