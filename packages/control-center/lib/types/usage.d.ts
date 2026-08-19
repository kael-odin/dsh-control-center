/**
 * Usage Analytics Host service: aggregates Control Center service counts
 * into one overview (session-level analytics stay client-side, where the
 * DSH session store lives).
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
export interface UsageOverview {
    providers: number;
    enabledModels: number;
    totalModels: number;
    repos: number;
    skills: number;
    mcpServers: number;
    mcpActive: number;
    translationHistory: number;
    knowledgeBases: number;
    knowledgeSources: number;
    collectedAt: string;
}
export declare class UsageService extends Service {
    static inject: readonly ["settings"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    constructor(ctx: Context, _config?: {
        logger?: Context['logger'];
    });
    getOverview(): Promise<UsageOverview>;
    [Symbol.dispose](): void;
}
//# sourceMappingURL=usage.d.ts.map