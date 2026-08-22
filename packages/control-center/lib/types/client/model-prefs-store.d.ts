/**
 * Per-purpose model preferences (快捷模型 / 翻译模型 / 绘画模型) plus the
 * Cherry 重试设置: the shared store behind the 默认模型 page.
 *
 * The prefs live in the `control-center-model-prefs` settings namespace — the
 * same DSH authority every other surface reads — so a choice made here is what
 * a freshly opened translation or painting workspace preselects, instead of
 * "whatever the catalog listed first". The catalog itself comes from
 * `llm.models`, the same groups the selectors already offer.
 *
 * The retry group is Cherry `chat.retry.*`: an enable switch, max attempts,
 * backoff, and fallback routes. Saving it projects a DSH provider-owned
 * `retryPolicy` into every live provider profile (see retry-policy.ts), so the
 * official harness retry plugin enforces it on real requests — including agent
 * sessions, which control-center does not own.
 */
import type { IApiClient, ModelProviderGroup } from '@deepseek-ai/dsh-api-remotes/client';
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { SettingsSchemaOperations } from './schema-operations.ts';
export declare const MODEL_PREFS_NAMESPACE = "control-center-model-prefs";
/** One purpose's stored selection, or null while unset. */
export interface ModelPrefSelection {
    provider: string;
    model: string;
}
/** One Cherry-style fallback route (`chat.retry.fallback_model_ids`). */
export interface RetryFallbackRoute {
    provider: string;
    model: string;
}
/** The persisted retry configuration. */
export interface RetryConfig {
    enabled: boolean;
    maxAttempts: number;
    backoff: boolean;
    fallbacks: readonly RetryFallbackRoute[];
}
export interface ModelPrefsState {
    status: 'idle' | 'loading' | 'ready' | 'error';
    error: string | null;
    /**
     * Failure of the LAST WRITE, independent of load status — one failed
     * preference write must not replace the whole page with the load-failed
     * view.
     */
    writeError: string | null;
    /**
     * False when the running host does not register the preference namespace
     * (an older deployed bundle). The page then renders an honest notice and
     * keeps default/current selection working instead of failing wholesale.
     */
    available: boolean;
    writable: boolean;
    revision: number | null;
    translation: ModelPrefSelection | null;
    painting: ModelPrefSelection | null;
    quick: ModelPrefSelection | null;
    retry: RetryConfig;
    groups: readonly ModelProviderGroup[];
}
/** Read the persisted retry config, tolerating partial or older sections. */
export declare function readRetryConfig(value: unknown, schema: SettingsSchemaOperations): RetryConfig;
/** The shared controller (one per client surface). */
export declare class ModelPrefsStore {
    private readonly api;
    private readonly schema;
    readonly store: SnapshotStore<ModelPrefsState>;
    private generation;
    constructor(api: Pick<IApiClient, 'settings' | 'llm'>, schema: SettingsSchemaOperations);
    load(): Promise<void>;
    /** Persist one purpose's selection; keeps the others untouched. */
    save(kind: 'translation' | 'painting' | 'quick', selection: ModelPrefSelection): Promise<boolean>;
    /** Persist the retry configuration as one atomic section write. */
    saveRetry(config: RetryConfig): Promise<boolean>;
    /** Shared mutate-then-reload tail behind every preference write. */
    private mutate;
}
//# sourceMappingURL=model-prefs-store.d.ts.map