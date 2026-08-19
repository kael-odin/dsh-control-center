/**
 * Web Search types - based on Cherry Studio's web search architecture.
 */

export type WebSearchCapability = 'searchKeywords' | 'fetchUrls'

export interface WebSearchProviderCapabilityPreset {
  feature: WebSearchCapability
  requiresApiHost: boolean
  requiresApiKey: boolean
  apiHost?: string
}

export interface WebSearchProviderPreset {
  id: WebSearchProviderId
  name: string
  type: 'api' | 'mcp'
  capabilities: WebSearchProviderCapabilityPreset[]
}

export type WebSearchProviderId =
  | 'zhipu'
  | 'tavily'
  | 'searxng'
  | 'exa'
  | 'exa-mcp'
  | 'bocha'
  | 'querit'
  | 'fetch'
  | 'jina'
  | 'firecrawl'

export interface WebSearchProviderCapability {
  feature: WebSearchCapability
  apiHost?: string
  auth?: {
    type: 'basic'
  }
}

export interface WebSearchProvider {
  id: WebSearchProviderId
  name: string
  description?: string
  capabilities: WebSearchProviderCapability[]
  apiKeys: string[]
  engines?: string[]
  basicAuthUsername?: string
  basicAuthPassword?: string
  officialWebsite?: string
  apiKeyWebsite?: string
  requiresApiKey?: boolean
}

export interface WebSearchProviderOverrides {
  zhipu?: {
    apiKeys?: string[]
    capabilities?: {
      searchKeywords?: { apiHost?: string }
    }
  }
  tavily?: {
    apiKeys?: string[]
    capabilities?: {
      searchKeywords?: { apiHost?: string }
    }
  }
  searxng?: {
    capabilities?: {
      searchKeywords?: { apiHost?: string }
      fetchUrls?: { apiHost?: string }
    }
    engines?: string[]
    basicAuthUsername?: string
    basicAuthPassword?: string
  }
  exa?: {
    apiKeys?: string[]
    capabilities?: {
      searchKeywords?: { apiHost?: string }
    }
  }
  'exa-mcp'?: {
    apiKeys?: string[]
    capabilities?: {
      searchKeywords?: { apiHost?: string }
    }
  }
  bocha?: {
    apiKeys?: string[]
    capabilities?: {
      searchKeywords?: { apiHost?: string }
    }
  }
  querit?: {
    capabilities?: {
      searchKeywords?: { apiHost?: string }
      fetchUrls?: { apiHost?: string }
    }
  }
  fetch?: {
    capabilities?: {
      fetchUrls?: { apiHost?: string }
    }
  }
  jina?: {
    apiKeys?: string[]
    capabilities?: {
      fetchUrls?: { apiHost?: string }
    }
  }
  firecrawl?: {
    apiKeys?: string[]
    capabilities?: {
      searchKeywords?: { apiHost?: string }
      fetchUrls?: { apiHost?: string }
    }
  }
}

export interface WebSearchConfig {
  defaultSearchKeywordsProvider: WebSearchProviderId
  defaultFetchUrlsProvider: WebSearchProviderId
  providerOverrides: WebSearchProviderOverrides
  maxResults: number
  excludeDomains: string[]
  compression: {
    method: 'none' | 'cutoff'
    cutoffLimit: number
  }
  clientToolsPreferred: boolean
}
