import type { TranslationLanguage } from '../translation-types.ts';
export interface TranslationSettingsState {
    markdown: boolean;
    autoCopy: boolean;
    scrollSync: boolean;
    detectMethod: 'auto' | 'algo' | 'llm';
    bidirectional: boolean;
    pairSource: string;
    pairTarget: string;
}
export interface TranslationSettingsPanelProps {
    languages: readonly TranslationLanguage[];
    customLanguages: readonly TranslationLanguage[];
    settings: TranslationSettingsState;
    onChange: (patch: Partial<TranslationSettingsState>) => void;
    prompt: string;
    onSavePrompt: (prompt: string) => void;
    onResetPrompt: () => void;
    onAddLanguage: (id: string, label: string) => Promise<boolean>;
    onEditLanguage: (id: string, label: string) => Promise<boolean>;
    onDeleteLanguage: (id: string) => void;
    onClose: () => void;
}
export declare function TranslationSettingsPanel(props: TranslationSettingsPanelProps): import("react").JSX.Element;
//# sourceMappingURL=TranslationSettingsPanel.d.ts.map