import type { WebSearchProviderPreset, WebSearchProviderId } from './types.ts'

/** Cherry 2.0.8 provider matrix; capability-level auth is intentional. */
export const WEB_SEARCH_PROVIDER_PRESET_MAP = {
  zhipu: {
    name: '智谱', type: 'api', description: '智谱 Web Search',
    officialWebsite: 'https://www.bigmodel.cn', apiKeyWebsite: 'https://open.bigmodel.cn/usercenter/apikeys',
    capabilities: [{ feature: 'searchKeywords', requiresApiHost: true, requiresApiKey: true, apiHost: 'https://open.bigmodel.cn/api/paas/v4/web_search' }],
  },
  tavily: {
    name: 'Tavily', type: 'api', description: 'Tavily Search API',
    officialWebsite: 'https://tavily.com', apiKeyWebsite: 'https://app.tavily.com',
    capabilities: [{ feature: 'searchKeywords', requiresApiHost: true, requiresApiKey: true, apiHost: 'https://api.tavily.com' }],
  },
  searxng: {
    name: 'SearXNG', type: 'api', description: '自托管元搜索引擎', officialWebsite: 'https://docs.searxng.org',
    capabilities: [
      { feature: 'searchKeywords', requiresApiHost: true, requiresApiKey: false, apiHost: 'http://localhost:8080' },
      { feature: 'fetchUrls', requiresApiHost: true, requiresApiKey: false, apiHost: 'http://localhost:8080' },
    ],
  },
  exa: {
    name: 'Exa', type: 'api', description: 'Exa AI Search', officialWebsite: 'https://exa.ai', apiKeyWebsite: 'https://dashboard.exa.ai/api-keys',
    capabilities: [{ feature: 'searchKeywords', requiresApiHost: true, requiresApiKey: true, apiHost: 'https://api.exa.ai' }],
  },
  'exa-mcp': {
    name: 'ExaMCP', type: 'mcp', description: '通过官方 MCP 端点使用 Exa，免密可用', officialWebsite: 'https://exa.ai',
    capabilities: [{ feature: 'searchKeywords', requiresApiHost: true, requiresApiKey: false, apiHost: 'https://mcp.exa.ai/mcp' }],
  },
  bocha: {
    name: 'Bocha', type: 'api', description: '博查 Web Search', officialWebsite: 'https://bochaai.com', apiKeyWebsite: 'https://open.bochaai.com',
    capabilities: [{ feature: 'searchKeywords', requiresApiHost: true, requiresApiKey: true, apiHost: 'https://api.bochaai.com' }],
  },
  querit: {
    name: 'Querit', type: 'api', description: 'Querit Search + Contents', officialWebsite: 'https://querit.ai',
    capabilities: [
      { feature: 'searchKeywords', requiresApiHost: true, requiresApiKey: true, apiHost: 'https://api.querit.ai' },
      { feature: 'fetchUrls', requiresApiHost: true, requiresApiKey: true, apiHost: 'https://api.querit.ai' },
    ],
  },
  fetch: {
    name: 'Fetch', type: 'api', description: '直接读取网页内容，无需密钥',
    capabilities: [{ feature: 'fetchUrls', requiresApiHost: false, requiresApiKey: false }],
  },
  jina: {
    name: 'Jina', type: 'api', description: 'Jina Search / Reader', officialWebsite: 'https://jina.ai', apiKeyWebsite: 'https://jina.ai/api-key',
    capabilities: [
      { feature: 'searchKeywords', requiresApiHost: true, requiresApiKey: false, apiHost: 'https://s.jina.ai' },
      { feature: 'fetchUrls', requiresApiHost: true, requiresApiKey: false, apiHost: 'https://r.jina.ai' },
    ],
  },
  firecrawl: {
    name: 'Firecrawl', type: 'api', description: 'Firecrawl Search + Scrape', officialWebsite: 'https://www.firecrawl.dev', apiKeyWebsite: 'https://www.firecrawl.dev/app/api-keys',
    capabilities: [
      { feature: 'searchKeywords', requiresApiHost: true, requiresApiKey: false, apiHost: 'https://api.firecrawl.dev' },
      { feature: 'fetchUrls', requiresApiHost: true, requiresApiKey: false, apiHost: 'https://api.firecrawl.dev' },
    ],
  },
} as const satisfies Record<WebSearchProviderId, Omit<WebSearchProviderPreset, 'id'>>

export const PRESETS_WEB_SEARCH_PROVIDERS: readonly WebSearchProviderPreset[] = (
  Object.keys(WEB_SEARCH_PROVIDER_PRESET_MAP) as WebSearchProviderId[]
).map(id => ({ id, ...WEB_SEARCH_PROVIDER_PRESET_MAP[id] }))
