/** Web-search types aligned with Cherry's capability-level provider model. */
export type WebSearchCapability = 'searchKeywords' | 'fetchUrls';
export interface WebSearchProviderCapabilityPreset {
    feature: WebSearchCapability;
    requiresApiHost: boolean;
    requiresApiKey: boolean;
    apiHost?: string;
}
export interface WebSearchProviderPreset {
    id: WebSearchProviderId;
    name: string;
    type: 'api' | 'mcp';
    capabilities: WebSearchProviderCapabilityPreset[];
    description?: string;
    officialWebsite?: string;
    apiKeyWebsite?: string;
}
export type WebSearchProviderId = 'zhipu' | 'tavily' | 'searxng' | 'exa' | 'exa-mcp' | 'bocha' | 'querit' | 'fetch' | 'jina' | 'firecrawl';
export interface WebSearchProviderCapability {
    feature: WebSearchCapability;
    apiHost?: string;
    requiresApiHost?: boolean;
    requiresApiKey?: boolean;
    auth?: {
        type: 'basic';
    };
}
export interface WebSearchProvider {
    id: WebSearchProviderId;
    name: string;
    description?: string;
    type?: 'api' | 'mcp';
    capabilities: WebSearchProviderCapability[];
    apiKeys: string[];
    engines?: string[];
    basicAuthUsername?: string;
    basicAuthPassword?: string;
    officialWebsite?: string;
    apiKeyWebsite?: string;
    /** Compatibility field: true when at least one capability needs a key. */
    requiresApiKey?: boolean;
}
type CapabilityOverride = {
    apiHost?: string;
};
type ProviderOverrideBase = {
    apiKeys?: string[];
    capabilities?: Partial<Record<WebSearchCapability, CapabilityOverride>>;
};
export type WebSearchProviderOverrides = {
    [K in WebSearchProviderId]?: ProviderOverrideBase & {
        engines?: string[];
        basicAuthUsername?: string;
        basicAuthPassword?: string;
    };
};
export interface WebSearchConfig {
    defaultSearchKeywordsProvider: WebSearchProviderId;
    defaultFetchUrlsProvider: WebSearchProviderId;
    providerOverrides: WebSearchProviderOverrides;
    maxResults: number;
    excludeDomains: string[];
    compression: {
        method: 'none' | 'cutoff';
        cutoffLimit: number;
    };
    clientToolsPreferred: boolean;
}
export {};
//# sourceMappingURL=types.d.ts.map