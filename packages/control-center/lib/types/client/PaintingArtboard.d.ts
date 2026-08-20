import type { PaintingImageRef } from '../painting-types.ts';
export interface PaintingArtboardProps {
    prompt: string;
    images: readonly PaintingImageRef[];
    sizeLabel: string;
    generating: boolean;
    progress: number;
}
export declare function PaintingArtboard({ prompt, images, sizeLabel, generating, progress }: PaintingArtboardProps): import("react").JSX.Element;
//# sourceMappingURL=PaintingArtboard.d.ts.map