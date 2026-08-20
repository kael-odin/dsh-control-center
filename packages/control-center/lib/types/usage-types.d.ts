/**
 * Usage Analytics types (shared between Host and Client).
 */
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
/** What kind of call produced a usage record. */
export type UsageKind = 'translation' | 'painting' | 'embedding';
/** One recorded AI request (LLM call, image generation, embedding batch). */
export interface UsageRecord {
    id: string;
    provider: string;
    model: string;
    kind: UsageKind;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    latencyMs: number;
    createdAt: number;
}
export interface UsageTimelinePoint {
    dateKey: string;
    requests: number;
    tokens: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
}
export interface UsageStatsGroup {
    key: string;
    requests: number;
    tokens: number;
    inputTokens: number;
    outputTokens: number;
}
export interface UsageStats {
    groups: UsageStatsGroup[];
    totalRequests: number;
    totalTokens: number;
    totalInputTokens: number;
    totalOutputTokens: number;
}
export interface UsageEntriesPage {
    items: UsageRecord[];
    nextCursor?: string;
}
export interface UsageRange {
    /** Local-day start (ms). */
    from: number;
    /** Local-day end (ms). */
    to: number;
}
export interface UsageTimelineRequest extends UsageRange {
    groupBy?: 'day' | 'week' | 'month';
}
export interface UsageStatsRequest extends UsageRange {
    groupBy?: 'provider' | 'model' | 'kind';
    limit?: number;
}
export interface UsageEntriesRequest extends UsageRange {
    cursor?: string | null;
    limit?: number;
    sortBy?: 'createdAt' | 'tokens' | 'inputTokens' | 'outputTokens';
}
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespaceMap {
        controlCenterUsage: {
            getOverview(): Promise<{
                ok: true;
                value: UsageOverview;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            timeline(request: UsageTimelineRequest): Promise<{
                ok: true;
                value: UsageTimelinePoint[];
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            stats(request: UsageStatsRequest): Promise<{
                ok: true;
                value: UsageStats;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            entries(request: UsageEntriesRequest): Promise<{
                ok: true;
                value: UsageEntriesPage;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
        };
    }
}
//# sourceMappingURL=usage-types.d.ts.map