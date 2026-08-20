/**
 * Usage Analytics Host service: aggregates Control Center service counts
 * into one overview (session-level analytics stay client-side, where the
 * DSH session store lives).
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import type { UsageEntriesPage, UsageEntriesRequest, UsageRecord, UsageStats, UsageStatsRequest, UsageTimelinePoint, UsageTimelineRequest } from './usage-types.ts';
export interface UsageServiceConfig {
    logger?: Context['logger'];
    /** Override the DSH home (tests). */
    dshHome?: string;
}
export interface UsageOverview {
    providers: number;
    enabledModels: number;
    totalModels: number;
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
    private readonly store;
    constructor(ctx: Context, config?: UsageServiceConfig);
    /** Record one AI call (invoked by translation/painting/knowledge services). */
    record(input: Omit<UsageRecord, 'id' | 'createdAt'>): UsageRecord;
    timeline(request: UsageTimelineRequest): UsageTimelinePoint[];
    stats(request: UsageStatsRequest): UsageStats;
    entries(request: UsageEntriesRequest): UsageEntriesPage;
    getOverview(): Promise<UsageOverview>;
    [Symbol.dispose](): void;
}
//# sourceMappingURL=usage.d.ts.map