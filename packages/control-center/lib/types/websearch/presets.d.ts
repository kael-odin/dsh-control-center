import type { WebSearchProviderPreset } from './types.ts';
/** Cherry 2.0.8 provider matrix; capability-level auth is intentional. */
export declare const WEB_SEARCH_PROVIDER_PRESET_MAP: {
    readonly zhipu: {
        readonly name: "智谱";
        readonly type: "api";
        readonly description: "智谱 Web Search";
        readonly officialWebsite: "https://www.bigmodel.cn";
        readonly apiKeyWebsite: "https://open.bigmodel.cn/usercenter/apikeys";
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
        readonly description: "Tavily Search API";
        readonly officialWebsite: "https://tavily.com";
        readonly apiKeyWebsite: "https://app.tavily.com";
        readonly capabilities: [{
            readonly feature: "searchKeywords";
            readonly requiresApiHost: true;
            readonly requiresApiKey: true;
            readonly apiHost: "https://api.tavily.com";
        }];
    };
    readonly searxng: {
        readonly name: "SearXNG";
        readonly type: "api";
        readonly description: "自托管元搜索引擎";
        readonly officialWebsite: "https://docs.searxng.org";
        readonly capabilities: [{
            readonly feature: "searchKeywords";
            readonly requiresApiHost: true;
            readonly requiresApiKey: false;
            readonly apiHost: "http://localhost:8080";
        }, {
            readonly feature: "fetchUrls";
            readonly requiresApiHost: true;
            readonly requiresApiKey: false;
            readonly apiHost: "http://localhost:8080";
        }];
    };
    readonly exa: {
        readonly name: "Exa";
        readonly type: "api";
        readonly description: "Exa AI Search";
        readonly officialWebsite: "https://exa.ai";
        readonly apiKeyWebsite: "https://dashboard.exa.ai/api-keys";
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
        readonly description: "通过官方 MCP 端点使用 Exa，免密可用";
        readonly officialWebsite: "https://exa.ai";
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
        readonly description: "博查 Web Search";
        readonly officialWebsite: "https://bochaai.com";
        readonly apiKeyWebsite: "https://open.bochaai.com";
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
        readonly description: "Querit Search + Contents";
        readonly officialWebsite: "https://querit.ai";
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
        readonly name: "Fetch";
        readonly type: "api";
        readonly description: "直接读取网页内容，无需密钥";
        readonly capabilities: [{
            readonly feature: "fetchUrls";
            readonly requiresApiHost: false;
            readonly requiresApiKey: false;
        }];
    };
    readonly jina: {
        readonly name: "Jina";
        readonly type: "api";
        readonly description: "Jina Search / Reader";
        readonly officialWebsite: "https://jina.ai";
        readonly apiKeyWebsite: "https://jina.ai/api-key";
        readonly capabilities: [{
            readonly feature: "searchKeywords";
            readonly requiresApiHost: true;
            readonly requiresApiKey: false;
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
        readonly description: "Firecrawl Search + Scrape";
        readonly officialWebsite: "https://www.firecrawl.dev";
        readonly apiKeyWebsite: "https://www.firecrawl.dev/app/api-keys";
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