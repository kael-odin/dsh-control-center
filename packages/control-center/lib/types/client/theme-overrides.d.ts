/**
 * Client-side theme overrides for Control Center surfaces. The DSH settings
 * namespace is the authority; localStorage is retained only for one-time
 * migration from the first web-edition implementation.
 */
export declare const APPEARANCE_SETTINGS_NAMESPACE = "control-center-appearance";
export interface ThemeOverrides {
    colorPrimary: string;
    fontFamily: string;
    codeFontFamily: string;
    customCss: string;
    /** Chat message base font size (px). Cherry `chat.message.font_size`. */
    messageFontSize: number;
    /** Cherry `settings.messages.wide_mode` — widen the chat column. */
    wideMode: boolean;
    /** Cherry `settings.messages.use_serif_font`. */
    useSerifFont: boolean;
    /** Cherry `message.message.style` — plain | bubble. */
    messageStyle: 'plain' | 'bubble';
    /** Cherry `settings.messages.show_message_outline`. */
    showMessageOutline: boolean;
    /** Cherry `app.use_system_title_bar` — desktop window chrome (persisted for the desktop companion). */
    useSystemTitleBar: boolean;
    /** Cherry `ui.window_style` — transparent/opaque desktop window (persisted for the desktop companion). */
    windowStyle: 'transparent' | 'opaque';
}
export declare const DEFAULT_THEME_OVERRIDES: ThemeOverrides;
/** Cherry allows 12-18px; clamp anything else to the range. */
export declare function clampMessageFontSize(value: unknown): number;
export declare const THEME_COLOR_PRESETS: readonly string[];
export declare function loadThemeOverrides(): ThemeOverrides;
export declare function hasLegacyThemeOverrides(): boolean;
export declare function markThemeOverridesMigrated(): void;
export declare function saveThemeOverrides(overrides: ThemeOverrides): void;
/** Inject (or refresh) the override style element. */
export declare function applyThemeOverrides(overrides: ThemeOverrides): void;
//# sourceMappingURL=theme-overrides.d.ts.map