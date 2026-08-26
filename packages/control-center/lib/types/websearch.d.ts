/** Host-side Cherry-compatible web-search settings and agent tools. */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import type { WebSearchCapability, WebSearchConfig, WebSearchProvider, WebSearchProviderOverrides, WebSearchProviderId } from './websearch/types.ts';
import { checkProvider } from './websearch/runtime.ts';
type ProviderOverride = NonNullable<WebSearchProviderOverrides[WebSearchProviderId]>;
export interface WebSearchServiceConfig {
    logger?: Context['logger'];
}
export declare class WebSearchService extends Service {
    static inject: readonly ["settings"];
    static optional: readonly ["tools"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private scope;
    constructor(ctx: Context, _config?: WebSearchServiceConfig);
    getConfig(): Promise<WebSearchConfig>;
    private registerTools;
    updateConfig(params: Partial<WebSearchConfig>): Promise<WebSearchConfig>;
    listProviders(): Promise<WebSearchProvider[]>;
    getProvider(params: {
        providerId: WebSearchProviderId;
    }): Promise<WebSearchProvider | null>;
    updateProviderOverride(params: {
        providerId: WebSearchProviderId;
        override: ProviderOverride;
    }): Promise<WebSearchProvider>;
    checkProviderReady(params: {
        providerId: WebSearchProviderId;
        capability: WebSearchCapability;
    }): Promise<boolean>;
    checkProvider(params: {
        providerId: WebSearchProviderId;
        capability: WebSearchCapability;
    }): Promise<Awaited<ReturnType<typeof checkProvider>>>;
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        controlCenterWebSearch: WebSearchService;
    }
}
export {};
//# sourceMappingURL=websearch.d.ts.map