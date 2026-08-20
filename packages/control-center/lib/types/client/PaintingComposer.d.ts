import { type ModelOption } from './ModelSelector.tsx';
export interface PaintingAttachment {
    name: string;
    dataUrl: string;
}
export interface PaintingParams {
    background: 'auto' | 'transparent' | 'opaque';
    count: number;
    quality: 'auto' | 'low' | 'medium' | 'high';
    size: 'auto' | '1024x1024' | '1536x1024' | '1024x1536';
}
export interface PaintingPromptEntry {
    id: string;
    title: string;
    content: string;
}
export interface PaintingComposerProps {
    models: ReadonlyArray<ModelOption>;
    selectedModel: string;
    onModelChange: (value: string) => void;
    prompt: string;
    onPromptChange: (value: string) => void;
    attachments: readonly PaintingAttachment[];
    onAddAttachment: (file: File) => void;
    onRemoveAttachment: (index: number) => void;
    params: PaintingParams;
    onParamsChange: (patch: Partial<PaintingParams>) => void;
    prompts: readonly PaintingPromptEntry[];
    onAddPrompt: (title: string, content: string) => void;
    onDeletePrompt: (id: string) => void;
    running: boolean;
    canSend: boolean;
    onSend: () => void;
    onPause: () => void;
}
export declare function loadPaintingPrompts(): PaintingPromptEntry[];
export declare function savePaintingPrompts(prompts: readonly PaintingPromptEntry[]): void;
export declare const DEFAULT_PAINTING_PARAMS: PaintingParams;
export declare function paramsSummary(params: PaintingParams): string;
export declare function PaintingComposer(props: PaintingComposerProps): import("react").JSX.Element;
//# sourceMappingURL=PaintingComposer.d.ts.map