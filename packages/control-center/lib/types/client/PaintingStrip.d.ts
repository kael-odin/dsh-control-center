import type { PaintingHistoryItem } from '../painting-types.ts';
export interface PaintingStripProps {
    history: readonly PaintingHistoryItem[];
    selectedId: string | null;
    generating: boolean;
    hasMore: boolean;
    onNew: () => void;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onLoadMore: () => void;
    onClose: () => void;
}
export declare function PaintingStrip({ history, selectedId, generating, hasMore, onNew, onSelect, onDelete, onLoadMore, onClose }: PaintingStripProps): import("react").JSX.Element;
//# sourceMappingURL=PaintingStrip.d.ts.map