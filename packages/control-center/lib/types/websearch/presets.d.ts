import type { WebSearchProviderPreset } from './types';
export declare const WEB_SEARCH_PROVIDER_PRESET_MAP: {
    readonly zhipu: {
        readonly name: "Zhipu";
        readonly type: "api";
        readonly capabilities: [{
            readonly feature: "searchKeywords";
            readonly requiresApiHost: true;
            readonly requiresApiKey: true;
            readonly apiHost: "https://open.bigmodel.cn/api/paas/v4/web_search";
        }];
    };
    readonly tavily: {
        readonly name: "Tavily";
        readonly type: "api";
        readonly capabilities: [{
            readonly feature: "searchKeywords";
            readonly requiresApiHost: true;
            readonly requiresApiKey: true;
            readonly apiHost: "https://api.tavily.com";
        }];
    };
    readonly searxng: {
        readonly name: "Searxng";
        readonly type: "api";
        readonly capabilities: [{
            readonly feature: "searchKeywords";
            readonly requiresApiHost: true;
            readonly requiresApiKey: false;
            readonly apiHost: "http://localhost:8080";
        }];
    };
    readonly exa: {
        readonly name: "Exa";
        readonly type: "api";
        readonly capabilities: [{
            readonly feature: "searchKeywords";
            readonly requiresApiHost: true;
            readonly requiresApiKey: true;
            readonly apiHost: "https://api.exa.ai";
        }];
    };
    readonly 'exa-mcp': {
        readonly name: "ExaMCP";
        readonly type: "mcp";
        readonly capabilities: [{
            readonly feature: "searchKeywords";
            readonly requiresApiHost: true;
            readonly requiresApiKey: false;
            readonly apiHost: "https://mcp.exa.ai/mcp";
        }];
    };
    readonly bocha: {
        readonly name: "Bocha";
        readonly type: "api";
        readonly capabilities: [{
            readonly feature: "searchKeywords";
            readonly requiresApiHost: true;
            readonly requiresApiKey: true;
            readonly apiHost: "https://api.bochaai.com";
        }];
    };
    readonly querit: {
        readonly name: "Querit";
        readonly type: "api";
        readonly capabilities: [{
            readonly feature: "searchKeywords";
            readonly requiresApiHost: true;
            readonly requiresApiKey: true;
            readonly apiHost: "https://api.querit.ai";
        }, {
            readonly feature: "fetchUrls";
            readonly requiresApiHost: true;
            readonly requiresApiKey: true;
            readonly apiHost: "https://api.querit.ai";
        }];
    };
    readonly fetch: {
        readonly name: "fetch";
        readonly type: "api";
        readonly capabilities: [{
            readonly feature: "fetchUrls";
            readonly requiresApiHost: false;
            readonly requiresApiKey: false;
        }];
    };
    readonly jina: {
        readonly name: "Jina";
        readonly type: "api";
        readonly capabilities: [{
            readonly feature: "searchKeywords";
            readonly requiresApiHost: true;
            readonly requiresApiKey: true;
            readonly apiHost: "https://s.jina.ai";
        }, {
            readonly feature: "fetchUrls";
            readonly requiresApiHost: true;
            readonly requiresApiKey: false;
            readonly apiHost: "https://r.jina.ai";
        }];
    };
    readonly firecrawl: {
        readonly name: "Firecrawl";
        readonly type: "api";
        readonly capabilities: [{
            readonly feature: "searchKeywords";
            readonly requiresApiHost: true;
            readonly requiresApiKey: false;
            readonly apiHost: "https://api.firecrawl.dev";
        }, {
            readonly feature: "fetchUrls";
            readonly requiresApiHost: true;
            readonly requiresApiKey: false;
            readonly apiHost: "https://api.firecrawl.dev";
        }];
    };
};
export declare const PRESETS_WEB_SEARCH_PROVIDERS: readonly WebSearchProviderPreset[];
//# sourceMappingURL=presets.d.ts.map