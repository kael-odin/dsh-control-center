/** Runtime dispatch for Cherry-compatible web-search providers. */
import type { WebSearchConfig, WebSearchProvider, WebSearchProviderId, WebSearchCapability } from './types.ts';
export interface SearchHit {
    title: string;
    url: string;
    content: string;
}
export interface WebSearchCheckResult {
    ok: boolean;
    providerId: WebSearchProviderId;
    capability: WebSearchCapability;
    latencyMs: number;
    resultCount?: number;
    message: string;
}
export declare function searchViaProvider(provider: WebSearchProvider, query: string, config: WebSearchConfig, signal?: AbortSignal): Promise<SearchHit[]>;
export declare function fetchViaProvider(provider: WebSearchProvider, url: string, _config: WebSearchConfig, signal?: AbortSignal): Promise<SearchHit[]>;
export declare function checkProvider(provider: WebSearchProvider, capability: WebSearchCapability, config: WebSearchConfig): Promise<WebSearchCheckResult>;
//# sourceMappingURL=runtime.d.ts.map