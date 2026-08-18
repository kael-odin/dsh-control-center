import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import type { TranslationHistoryId, TranslationHistoryPage, TranslationJobView, TranslationLanguage, TranslationLanguagesView, TranslationRequest, TranslationStartResult } from './translation-types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        controlCenterTranslation: TranslationService;
    }
}
/**
 * One-shot translation jobs and persistent in-process history over DSH LLM routes.
 */
export declare class TranslationService extends Service {
    static inject: string[];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private readonly llm;
    private readonly jobs;
    private readonly history;
    private readonly customLanguages;
    private accepting;
    constructor(ctx: Context);
    start(request: TranslationRequest): TranslationStartResult;
    get(jobId: string): TranslationJobView;
    cancel(jobId: string): TranslationJobView;
    listHistory(cursor: string | null, limit: number): TranslationHistoryPage;
    deleteHistory(id: TranslationHistoryId): {
        absent: true;
    };
    languages(): TranslationLanguagesView;
    putLanguage(id: string, label: string): TranslationLanguage;
    deleteLanguage(id: string): {
        absent: true;
    };
    private run;
}
export default TranslationService;
//# sourceMappingURL=translation.d.ts.map