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
}
export declare const DEFAULT_THEME_OVERRIDES: ThemeOverrides;
export declare const THEME_COLOR_PRESETS: readonly string[];
export declare function loadThemeOverrides(): ThemeOverrides;
export declare function hasLegacyThemeOverrides(): boolean;
export declare function markThemeOverridesMigrated(): void;
export declare function saveThemeOverrides(overrides: ThemeOverrides): void;
/** Inject (or refresh) the override style element. */
export declare function applyThemeOverrides(overrides: ThemeOverrides): void;
//# sourceMappingURL=theme-overrides.d.ts.map