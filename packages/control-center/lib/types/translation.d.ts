import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import type { TranslationHistoryId, TranslationHistoryItem, TranslationHistoryPage, TranslationJobView, TranslationLanguage, TranslationLanguagesView, TranslationModelSelection, TranslationRequest, TranslationStartResult } from './translation-types.ts';
export interface TranslationServiceConfig {
    logger?: Context['logger'];
}
/** Cherry 重试设置 facts one job honors (the 默认模型 page persists them). */
export type TranslationRetryPolicy = import('./retry-config.ts').HostRetryPolicy;
declare module '@deepseek-ai/cordis' {
    interface Context {
        controlCenterTranslation: TranslationService;
    }
}
/**
 * One-shot translation jobs and persistent in-process history over DSH LLM routes.
 */
export declare class TranslationService extends Service {
    static inject: readonly ["llm", "settings"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private readonly llm;
    private readonly jobs;
    private readonly history;
    private readonly customLanguages;
    private scope;
    private promptOverride;
    private accepting;
    constructor(ctx: Context, _config?: TranslationServiceConfig);
    start(request: TranslationRequest): TranslationStartResult;
    get(jobId: string): TranslationJobView;
    cancel(jobId: string): TranslationJobView;
    /** Total persisted history entries (for usage analytics). */
    countHistory(): number;
    listHistory(cursor: string | null, limit: number): TranslationHistoryPage;
    deleteHistory(id: TranslationHistoryId): {
        absent: true;
    };
    starHistory(id: TranslationHistoryId, starred: boolean): TranslationHistoryItem;
    clearHistory(): {
        cleared: number;
    };
    getPrompt(): string;
    setPrompt(prompt: string): Promise<{
        saved: true;
    }>;
    /** One-shot language detection via the selected model (LLM detection method). */
    detectLanguage(text: string, selection: TranslationModelSelection): Promise<{
        language: string | null;
    }>;
    languages(): TranslationLanguagesView;
    putLanguage(id: string, label: string): TranslationLanguage;
    deleteLanguage(id: string): {
        absent: true;
    };
    /**
     * The Cherry 重试设置 from the shared model-prefs namespace, read live so a
     * settings edit reaches the next job without a restart.
     */
    private retryPolicy;
    private run;
    /**
     * Run one route through its full attempt budget. `'failed'` means every
     * attempt failed and the caller may continue with its next fallback; any
     * other outcome is final for the job.
     */
    private runRoute;
    /** Persist one completed job into the in-process history. */
    private recordHistory;
}
export default TranslationService;
//# sourceMappingURL=translation.d.ts.map