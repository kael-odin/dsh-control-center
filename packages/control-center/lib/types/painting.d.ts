import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import type { PaintingCatalogView, PaintingHistoryId, PaintingHistoryPage, PaintingJobView, PaintingRequest, PaintingStartResult } from './painting-types.ts';
/** Real implicit HTTPS proxy intended for internal fetch calls; kept for parity. */
export declare const PAINTING_FETCH_TIMEOUT_MS = 90000;
/** Real async image-generation jobs and durable gallery over DSH providers, credentials, and attachments. */
export declare class PaintingService extends Service {
    static inject: string[];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private readonly jobs;
    private readonly history;
    private accepting;
    constructor(ctx: Context);
    catalog(): Promise<PaintingCatalogView>;
    start(request: PaintingRequest): PaintingStartResult;
    get(jobId: string): PaintingJobView;
    cancel(jobId: string): PaintingJobView;
    listHistory(cursor: string | null, limit: number): PaintingHistoryPage;
    deleteHistory(id: PaintingHistoryId): {
        absent: true;
    };
    private run;
}
export default PaintingService;
//# sourceMappingURL=painting.d.ts.map