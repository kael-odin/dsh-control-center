/**
 * Control Center Web Search Service - Host side web search configuration management.
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import type { WebSearchConfig, WebSearchProvider, WebSearchProviderOverrides, WebSearchProviderId } from './websearch/types.ts';
export interface WebSearchServiceConfig {
    logger?: Context['logger'];
}
export declare class WebSearchService extends Service {
    static inject: readonly ["settings"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private scope;
    constructor(ctx: Context, _config?: WebSearchServiceConfig);
    getConfig(): Promise<WebSearchConfig>;
    updateConfig(params: Partial<WebSearchConfig>): Promise<WebSearchConfig>;
    listProviders(): Promise<WebSearchProvider[]>;
    getProvider(params: {
        providerId: WebSearchProviderId;
    }): Promise<WebSearchProvider | null>;
    updateProviderOverride(params: {
        providerId: WebSearchProviderId;
        override: WebSearchProviderOverrides[WebSearchProviderId];
    }): Promise<WebSearchProvider>;
    checkProviderReady(params: {
        providerId: WebSearchProviderId;
        capability: 'searchKeywords' | 'fetchUrls';
    }): Promise<boolean>;
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        'control-center-websearch': WebSearchService;
    }
}
//# sourceMappingURL=websearch.d.ts.map