/**
 * Control Center Web Search Service - Host side web search configuration management.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { settingsNamespace, type SettingsScope } from '@deepseek-ai/dsh-settings'
import Schema from '@deepseek-ai/schemastery'
import type {
  WebSearchConfig,
  WebSearchProvider,
  WebSearchProviderOverrides,
  WebSearchProviderId
} from './websearch/types.ts'
import { resolveProviders, isWebSearchProviderReady } from './websearch/utils.ts'

const WEBSEARCH_NAMESPACE = settingsNamespace('control-center-websearch')

export interface WebSearchServiceConfig {
  logger?: Context['logger']
}

export class WebSearchService extends Service {
  static inject = ['settings'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterWebSearch')
  private scope: SettingsScope<WebSearchConfig>

  constructor(ctx: Context, _config?: WebSearchServiceConfig) {
    super(ctx, 'controlCenterWebSearch')
    this.scope = ctx.settings.register(WEBSEARCH_NAMESPACE, Schema.object({
      defaultSearchKeywordsProvider: Schema.union(['zhipu', 'tavily', 'searxng', 'exa', 'exa-mcp', 'bocha', 'querit', 'jina', 'firecrawl'] as const).default('exa-mcp'),
      defaultFetchUrlsProvider: Schema.union(['querit', 'fetch', 'jina', 'firecrawl'] as const).default('jina'),
      providerOverrides: Schema.dict(Schema.object({
        apiKeys: Schema.array(Schema.string().role('secret')),
        capabilities: Schema.object({
          searchKeywords: Schema.object({ apiHost: Schema.string() }),
          fetchUrls: Schema.object({ apiHost: Schema.string() })
        }),
        engines: Schema.array(Schema.string()),
        basicAuthUsername: Schema.string(),
        basicAuthPassword: Schema.string().role('secret')
      })).default({}),
      maxResults: Schema.number().min(1).max(50).default(5),
      excludeDomains: Schema.array(Schema.string()).default([]),
      compression: Schema.object({
        method: Schema.union(['none', 'cutoff'] as const).default('cutoff'),
        cutoffLimit: Schema.number().min(100).max(10000).default(2000)
      }).default({ method: 'cutoff', cutoffLimit: 2000 }),
      clientToolsPreferred: Schema.boolean().default(true)
    }), {
      base: {
        defaultSearchKeywordsProvider: 'exa-mcp',
        defaultFetchUrlsProvider: 'jina',
        providerOverrides: {},
        maxResults: 5,
        excludeDomains: [],
        compression: { method: 'cutoff', cutoffLimit: 2000 },
        clientToolsPreferred: true
      }
    })
  }

  async getConfig(): Promise<WebSearchConfig> {
    return this.scope.get()
  }

  async updateConfig(params: Partial<WebSearchConfig>): Promise<WebSearchConfig> {
    const current = this.scope.get()
    const updated = { ...current, ...params }
    await this.scope.update(params)
    return updated
  }

  async listProviders(): Promise<WebSearchProvider[]> {
    const config = this.scope.get()
    return resolveProviders(config.providerOverrides)
  }

  async getProvider(params: { providerId: WebSearchProviderId }): Promise<WebSearchProvider | null> {
    const providers = await this.listProviders()
    return providers.find(p => p.id === params.providerId) || null
  }

  async updateProviderOverride(params: {
    providerId: WebSearchProviderId
    override: WebSearchProviderOverrides[WebSearchProviderId]
  }): Promise<WebSearchProvider> {
    const config = this.scope.get()
    const updated = {
      ...config,
      providerOverrides: {
        ...config.providerOverrides,
        [params.providerId]: params.override
      }
    }
    await this.scope.update({ providerOverrides: updated.providerOverrides })

    const providers = resolveProviders(updated.providerOverrides)
    const provider = providers.find(p => p.id === params.providerId)
    if (!provider) {
      throw new Error(`Provider ${params.providerId} not found after update`)
    }
    return provider
  }

  async checkProviderReady(params: {
    providerId: WebSearchProviderId
    capability: 'searchKeywords' | 'fetchUrls'
  }): Promise<boolean> {
    const provider = await this.getProvider({ providerId: params.providerId })
    return isWebSearchProviderReady(provider, params.capability)
  }
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    'controlCenterWebSearch': WebSearchService
  }
}
