export interface ShortcutEntry {
    id: string;
    label: string;
    group: 'general' | 'topic' | 'chat' | 'assistant';
    defaultBinding: string;
    editable: boolean;
    /** True when this binding can actually fire inside the web app. */
    applicable: boolean;
    onTrigger?: () => void;
}
export declare const SHORTCUT_GROUPS: ReadonlyArray<{
    id: ShortcutEntry['group'];
    label: string;
}>;
export declare const DEFAULT_SHORTCUTS: readonly ShortcutEntry[];
export declare function bindingLabel(binding: string): string[];
export declare function ShortcutSection(): import("react").JSX.Element;
//# sourceMappingURL=ShortcutSection.d.ts.map