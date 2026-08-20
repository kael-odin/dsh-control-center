/**
 * Client-side theme overrides for the Control Center surfaces: brand color,
 * fonts, and custom CSS, persisted in localStorage and injected as a style
 * element (web edition cannot reach the harness theme token pipeline, so the
 * overrides are scoped to `.cc-surface` like the rest of the token layer).
 */
export interface ThemeOverrides {
    /** Brand/primary color (hex, e.g. #00b96b). */
    colorPrimary: string;
    /** Global UI font family; '' = default. */
    fontFamily: string;
    /** Code font family; '' = default. */
    codeFontFamily: string;
    /** Custom CSS injected verbatim into the style element. */
    customCss: string;
}
export declare const DEFAULT_THEME_OVERRIDES: ThemeOverrides;
export declare const THEME_COLOR_PRESETS: readonly string[];
export declare function loadThemeOverrides(): ThemeOverrides;
export declare function saveThemeOverrides(overrides: ThemeOverrides): void;
/** Inject (or refresh) the override style element. */
export declare function applyThemeOverrides(overrides: ThemeOverrides): void;
//# sourceMappingURL=theme-overrides.d.ts.map