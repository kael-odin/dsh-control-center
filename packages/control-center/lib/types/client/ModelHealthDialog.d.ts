/**
 * Cherry's model health-check dialog, mapped onto the real host capability:
 * each enabled model gets one tiny streamed completion through
 * controlCenterModelCheck — the same adapter registry and credential path a
 * production request takes. Statuses run sequentially (a provider rate limit
 * should surface as a failure on the model that caused it, not a storm), with
 * per-row re-check and a run-all.
 */
import type { ReactNode } from 'react';
import type { en } from './locales.ts';
export interface ModelHealthDialogProps {
    open: boolean;
    /** The route under test. */
    provider: string;
    /** The profile's served models (the rows to check). */
    models: readonly string[];
    /** The host check call; undefined when the remote is not mounted yet. */
    getCheck: () => {
        check(provider: string, model: string): Promise<{
            ok: true;
            value: {
                ok: boolean;
                latencyMs?: number | undefined;
                reply?: string | undefined;
                error?: string | undefined;
            };
        } | {
            ok: false;
            error: {
                code: string;
                message: string;
                details: object;
            };
        }>;
    } | undefined;
    t: (key: keyof typeof en) => string;
    onClose: () => void;
}
/**
 * Render the health-check dialog for one provider's models.
 * @param props - open state, route, models, wire face, and copy.
 * @returns the dialog, or null while closed.
 */
export declare function ModelHealthDialog(props: ModelHealthDialogProps): ReactNode;
//# sourceMappingURL=ModelHealthDialog.d.ts.map