/**
 * Per-purpose model preferences (翻译模型 / 绘画模型): the shared store behind
 * the 默认模型 page and the workspaces that honor them.
 *
 * The prefs live in the `control-center-model-prefs` settings namespace — the
 * same DSH authority every other surface reads — so a choice made here is what
 * a freshly opened translation or painting workspace preselects, instead of
 * "whatever the catalog listed first". The catalog itself comes from
 * `llm.models`, the same groups the selectors already offer.
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
export interface ModelPrefsState {
    status: 'idle' | 'loading' | 'ready' | 'error';
    error: string | null;
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
    groups: readonly ModelProviderGroup[];
}
/** The shared controller (one per client surface). */
export declare class ModelPrefsStore {
    private readonly api;
    private readonly schema;
    readonly store: SnapshotStore<ModelPrefsState>;
    private generation;
    constructor(api: Pick<IApiClient, 'settings' | 'llm'>, schema: SettingsSchemaOperations);
    load(): Promise<void>;
    /** Persist one purpose's selection; keeps the other untouched. */
    save(kind: 'translation' | 'painting', selection: ModelPrefSelection): Promise<boolean>;
}
//# sourceMappingURL=model-prefs-store.d.ts.map