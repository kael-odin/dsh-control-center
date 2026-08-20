import type { TranslationHistoryItem } from '../translation-types.ts';
export interface TranslationHistoryPanelProps {
    history: readonly TranslationHistoryItem[];
    total: number;
    nextCursor: string | null;
    starredOnly: boolean;
    onStarredOnlyChange: (next: boolean) => void;
    onLoadMore: () => void;
    onStar: (id: string, starred: boolean) => void;
    onDelete: (id: string) => void;
    onClearAll: () => void;
    onReuse: (item: TranslationHistoryItem) => void;
    onClose: () => void;
}
export declare function formatHistoryTime(timestamp: number): string;
export declare function languageEmoji(id: string): string;
export declare function TranslationHistoryPanel(props: TranslationHistoryPanelProps): import("react").JSX.Element;
//# sourceMappingURL=TranslationHistoryPanel.d.ts.map