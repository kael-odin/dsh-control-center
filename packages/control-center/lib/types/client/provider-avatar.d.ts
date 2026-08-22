/**
 * Cherry ProviderAvatar parity (components/ProviderAvatar.tsx +
 * iconDisplayConfig.ts): the brand glyph sits in a rounded container and is
 * scaled per Cherry's 'provider-list' display config — the default renders at
 * 120% and clips to the container; seven "contained" brands render at 5/7
 * with a 5px radius. Providers without a system glyph fall back to the first
 * character on a color generated from that character (Cherry's
 * generateColorFromChar LCG), with black/white contrast text.
 */
import type { ReactNode } from 'react';
export interface ProviderAvatarProps {
    /** Stable provider id (icon registry key or alias). */
    providerId: string;
    /** Human-facing name for the letter fallback. */
    name: string;
    /** Box size in px; the glyph scales relative to it. Default 26 (list rows). */
    size?: number;
    /**
     * Cherry's display-context scaling. `'provider-list'` renders the glyph at
     * 120% (clipped) or 5/7 + radius for the contained brands; any other value
     * leaves the glyph at 100% — matching how Cherry only applies a config when
     * a context is passed.
     */
    displayContext?: 'provider-list' | undefined;
    className?: string | undefined;
}
/** One provider brand avatar, rendered exactly like Cherry's list/header use. */
export declare function ProviderAvatar({ providerId, name, size, displayContext, className }: ProviderAvatarProps): ReactNode;
//# sourceMappingURL=provider-avatar.d.ts.map