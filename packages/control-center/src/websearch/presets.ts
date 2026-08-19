import type { WebSearchProviderPreset, WebSearchProviderId } from './types'

export const WEB_SEARCH_PROVIDER_PRESET_MAP = {
  zhipu: {
    name: 'Zhipu',
    type: 'api',
    capabilities: [
      {
        feature: 'searchKeywords',
        requiresApiHost: true,
        requiresApiKey: true,
        apiHost: 'https://open.bigmodel.cn/api/paas/v4/web_search'
      }
    ]
  },
  tavily: {
    name: 'Tavily',
    type: 'api',
    capabilities: [
      { feature: 'searchKeywords', requiresApiHost: true, requiresApiKey: true, apiHost: 'https://api.tavily.com' }
    ]
  },
  searxng: {
    name: 'Searxng',
    type: 'api',
    capabilities: [
      { feature: 'searchKeywords', requiresApiHost: true, requiresApiKey: false, apiHost: 'http://localhost:8080' }
    ]
  },
  exa: {
    name: 'Exa',
    type: 'api',
    capabilities: [
      { feature: 'searchKeywords', requiresApiHost: true, requiresApiKey: true, apiHost: 'https://api.exa.ai' }
    ]
  },
  'exa-mcp': {
    name: 'ExaMCP',
    type: 'mcp',
    capabilities: [
      {
        feature: 'searchKeywords',
        requiresApiHost: true,
        requiresApiKey: false,
        apiHost: 'https://mcp.exa.ai/mcp'
      }
    ]
  },
  bocha: {
    name: 'Bocha',
    type: 'api',
    capabilities: [
      { feature: 'searchKeywords', requiresApiHost: true, requiresApiKey: true, apiHost: 'https://api.bochaai.com' }
    ]
  },
  querit: {
    name: 'Querit',
    type: 'api',
    capabilities: [
      { feature: 'searchKeywords', requiresApiHost: true, requiresApiKey: true, apiHost: 'https://api.querit.ai' },
      { feature: 'fetchUrls', requiresApiHost: true, requiresApiKey: true, apiHost: 'https://api.querit.ai' }
    ]
  },
  fetch: {
    name: 'fetch',
    type: 'api',
    capabilities: [{ feature: 'fetchUrls', requiresApiHost: false, requiresApiKey: false }]
  },
  jina: {
    name: 'Jina',
    type: 'api',
    capabilities: [
      { feature: 'searchKeywords', requiresApiHost: true, requiresApiKey: true, apiHost: 'https://s.jina.ai' },
      { feature: 'fetchUrls', requiresApiHost: true, requiresApiKey: false, apiHost: 'https://r.jina.ai' }
    ]
  },
  firecrawl: {
    name: 'Firecrawl',
    type: 'api',
    capabilities: [
      {
        feature: 'searchKeywords',
        requiresApiHost: true,
        requiresApiKey: false,
        apiHost: 'https://api.firecrawl.dev'
      },
      {
        feature: 'fetchUrls',
        requiresApiHost: true,
        requiresApiKey: false,
        apiHost: 'https://api.firecrawl.dev'
      }
    ]
  }
} as const satisfies Record<WebSearchProviderId, Omit<WebSearchProviderPreset, 'id'>>

export const PRESETS_WEB_SEARCH_PROVIDERS: readonly WebSearchProviderPreset[] = (
  Object.keys(WEB_SEARCH_PROVIDER_PRESET_MAP) as WebSearchProviderId[]
).map((id) => ({
  id,
  ...WEB_SEARCH_PROVIDER_PRESET_MAP[id]
}))
