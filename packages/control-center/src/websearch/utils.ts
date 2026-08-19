/**
 * Web Search provider utilities - resolver and readiness checks.
 */

import type {
  WebSearchProvider,
  WebSearchProviderOverrides,
  WebSearchCapability
} from './types.ts'

const PRESET_PROVIDERS: Omit<WebSearchProvider, 'apiKeys' | 'engines' | 'basicAuthUsername' | 'basicAuthPassword'>[] = [
  {
    id: 'zhipu',
    name: 'ZhipuAI',
    description: 'ZhipuAI web search',
    capabilities: [{ feature: 'searchKeywords', apiHost: 'https://open.bigmodel.cn/api/paas/v4' }],
    officialWebsite: 'https://www.zhipuai.cn',
    apiKeyWebsite: 'https://open.bigmodel.cn/usercenter/apikeys'
  },
  {
    id: 'tavily',
    name: 'Tavily',
    description: 'Tavily search API',
    capabilities: [{ feature: 'searchKeywords', apiHost: 'https://api.tavily.com' }],
    officialWebsite: 'https://tavily.com',
    apiKeyWebsite: 'https://app.tavily.com'
  },
  {
    id: 'searxng',
    name: 'SearXNG',
    description: 'Self-hosted meta search engine',
    capabilities: [
      { feature: 'searchKeywords', apiHost: 'http://localhost:8080' },
      { feature: 'fetchUrls', apiHost: 'http://localhost:8080' }
    ],
    officialWebsite: 'https://docs.searxng.org'
  },
  {
    id: 'exa',
    name: 'Exa',
    description: 'Exa search for AI',
    capabilities: [{ feature: 'searchKeywords', apiHost: 'https://api.exa.ai' }],
    officialWebsite: 'https://exa.ai',
    apiKeyWebsite: 'https://dashboard.exa.ai/api-keys'
  },
  {
    id: 'exa-mcp',
    name: 'Exa (MCP)',
    description: 'Exa search via MCP protocol',
    capabilities: [{ feature: 'searchKeywords', apiHost: 'https://api.exa.ai' }],
    officialWebsite: 'https://exa.ai',
    apiKeyWebsite: 'https://dashboard.exa.ai/api-keys'
  },
  {
    id: 'bocha',
    name: 'Bocha',
    description: 'Bocha search API',
    capabilities: [{ feature: 'searchKeywords', apiHost: 'https://api.bochaai.com' }],
    officialWebsite: 'https://www.bochaai.com',
    apiKeyWebsite: 'https://www.bochaai.com/integration'
  },
  {
    id: 'querit',
    name: 'Querit',
    description: 'Querit search and fetch',
    capabilities: [
      { feature: 'searchKeywords', apiHost: 'https://api.querit.ai' },
      { feature: 'fetchUrls', apiHost: 'https://api.querit.ai' }
    ],
    officialWebsite: 'https://querit.ai'
  },
  {
    id: 'fetch',
    name: 'Fetch',
    description: 'Simple HTTP fetch',
    capabilities: [{ feature: 'fetchUrls' }]
  },
  {
    id: 'jina',
    name: 'Jina Reader',
    description: 'Jina AI Reader API',
    capabilities: [{ feature: 'fetchUrls', apiHost: 'https://r.jina.ai' }],
    officialWebsite: 'https://jina.ai/reader',
    apiKeyWebsite: 'https://jina.ai/reader/#apiform'
  },
  {
    id: 'firecrawl',
    name: 'Firecrawl',
    description: 'Firecrawl web scraping',
    capabilities: [
      { feature: 'searchKeywords', apiHost: 'https://api.firecrawl.dev' },
      { feature: 'fetchUrls', apiHost: 'https://api.firecrawl.dev' }
    ],
    officialWebsite: 'https://www.firecrawl.dev',
    apiKeyWebsite: 'https://www.firecrawl.dev/app/api-keys'
  }
]

export function resolveProviders(overrides: WebSearchProviderOverrides): WebSearchProvider[] {
  return PRESET_PROVIDERS.map(preset => {
    const override = overrides[preset.id]
    const apiKeys = (override?.apiKeys ?? []).map(s => s.trim()).filter(Boolean)

    return {
      ...preset,
      apiKeys,
      capabilities: preset.capabilities.map(capability => {
        const capabilityOverride = override?.capabilities?.[capability.feature]
        return {
          ...capability,
          ...('apiHost' in capability && capabilityOverride?.apiHost !== undefined
            ? { apiHost: capabilityOverride.apiHost.trim() }
            : {})
        }
      }),
      engines: (override?.engines ?? []).map(s => s.trim()).filter(Boolean),
      basicAuthUsername: (override?.basicAuthUsername ?? '').trim(),
      basicAuthPassword: (override?.basicAuthPassword ?? '').trim()
    }
  })
}

export function isWebSearchProviderReady(
  provider: WebSearchProvider | null,
  capability: WebSearchCapability
): boolean {
  if (!provider) return false

  const providerCapability = provider.capabilities.find(c => c.feature === capability)
  if (!providerCapability) return false

  // Fetch provider doesn't need API keys
  if (provider.id === 'fetch') return true

  // SearXNG and Querit need apiHost configured
  if (provider.id === 'searxng' || provider.id === 'querit') {
    return !!providerCapability.apiHost && providerCapability.apiHost.length > 0
  }

  // All others need at least one API key
  return provider.apiKeys.length > 0
}
