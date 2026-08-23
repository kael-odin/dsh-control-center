/**
 * API key list drawer — Cherry ProviderApiKeyListDrawer parity: a bordered
 * list of labeled key slots, each with edit / delete icon buttons and an
 * enable switch, an add draft row (Enter saves, Escape cancels), and the
 * "N / M enabled" footer summary. Raw values never reach the renderer, so
 * rows show label plus configured state instead of Cherry's masked key.
 */
import type { ReactNode } from 'react';
import { ApiKeysController } from './api-keys-store.ts';
import type { en } from './locales.ts';
export interface ApiKeyListDrawerProps {
    open: boolean;
    onClose: () => void;
    /** A fresh controller per open, built from the editor's live faces. */
    buildController: () => ApiKeysController | undefined;
    t: (key: keyof typeof en) => string;
}
/** The drawer: loads slot state, renders the bordered list + actions. */
export declare function ApiKeyListDrawer({ open, onClose, buildController, t }: ApiKeyListDrawerProps): ReactNode;
//# sourceMappingURL=ApiKeyListDrawer.d.ts.map