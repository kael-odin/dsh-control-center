/**
 * Control Center Web Search Service - Host side web search configuration management.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { settingsNamespace, type SettingsScope } from '@deepseek-ai/dsh-settings'
import Schema from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ContentBlock } from '@deepseek-ai/dsh-llm/types'
import type {
  WebSearchConfig,
  WebSearchProvider,
  WebSearchProviderOverrides,
  WebSearchProviderId
} from './websearch/types.ts'
import { resolveProviders, isWebSearchProviderReady } from './websearch/utils.ts'

const WEBSEARCH_NAMESPACE = settingsNamespace('control-center-websearch')

/** Default keyword-search API hosts (Cherry presets; per-provider override wins). */
const PROVIDER_DEFAULT_HOSTS: Partial<Record<WebSearchProviderId, string>> = {
  zhipu: 'https://open.bigmodel.cn/api/paas/v4/web_search',
  tavily: 'https://api.tavily.com',
  searxng: 'http://localhost:8080',
  exa: 'https://api.exa.ai',
  bocha: 'https://api.bochaai.com',
}

/** One normalized search result. */
interface SearchHit {
  title: string
  url: string
  content: string
}

/** Call one wire search provider; shapes mirror Cherry's provider implementations. */
async function searchViaProvider(
  provider: WebSearchProviderId,
  host: string,
  apiKey: string,
  query: string,
  maxResults: number,
  excludeDomains: readonly string[],
): Promise<SearchHit[]> {
  const jsonHeaders = (authHeader: Record<string, string> = {}): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...authHeader,
  })
  switch (provider) {
    case 'tavily': {
      const response = await fetch(`${host.replace(/\/+$/, '')}/search`, {
        method: 'POST',
        headers: jsonHeaders(apiKey === '' ? {} : { Authorization: `Bearer ${apiKey}` }),
        body: JSON.stringify({ query, max_results: maxResults, ...(excludeDomains.length > 0 ? { exclude_domains: excludeDomains } : {}) }),
      })
      if (!response.ok) throw new Error(`Tavily 搜索失败 (${response.status})`)
      const body = await response.json() as { results?: Array<{ title?: unknown; url?: unknown; content?: unknown }> }
      return (body.results ?? []).map(r => ({ title: String(r.title ?? ''), url: String(r.url ?? ''), content: String(r.content ?? '') }))
    }
    case 'exa': {
      const response = await fetch(`${host.replace(/\/+$/, '')}/search`, {
        method: 'POST',
        headers: jsonHeaders(apiKey === '' ? {} : { 'x-api-key': apiKey }),
        body: JSON.stringify({ query, numResults: maxResults, contents: { text: true } }),
      })
      if (!response.ok) throw new Error(`Exa 搜索失败 (${response.status})`)
      const body = await response.json() as { results?: Array<{ title?: unknown; url?: unknown; text?: unknown }> }
      return (body.results ?? []).map(r => ({ title: String(r.title ?? ''), url: String(r.url ?? ''), content: String(r.text ?? '') }))
    }
    case 'zhipu': {
      const response = await fetch(host.replace(/\/+$/, ''), {
        method: 'POST',
        headers: jsonHeaders(apiKey === '' ? {} : { Authorization: `Bearer ${apiKey}` }),
        body: JSON.stringify({ search_query: query }),
      })
      if (!response.ok) throw new Error(`智谱搜索失败 (${response.status})`)
      const body = await response.json() as { search_result?: Array<{ title?: unknown; url?: unknown; content?: unknown }> }
      return (body.search_result ?? []).slice(0, maxResults).map(r => ({ title: String(r.title ?? ''), url: String(r.url ?? ''), content: String(r.content ?? '') }))
    }
    case 'bocha': {
      const response = await fetch(`${host.replace(/\/+$/, '')}/v1/web-search`, {
        method: 'POST',
        headers: jsonHeaders(apiKey === '' ? {} : { Authorization: `Bearer ${apiKey}` }),
        body: JSON.stringify({ query, count: maxResults, summary: true }),
      })
      if (!response.ok) throw new Error(`Bocha 搜索失败 (${response.status})`)
      const body = await response.json() as { results?: Array<{ name?: unknown; url?: unknown; summary?: unknown }> }
      return (body.results ?? []).map(r => ({ title: String(r.name ?? ''), url: String(r.url ?? ''), content: String(r.summary ?? '') }))
    }
    case 'searxng': {
      const url = new URL(`${host.replace(/\/+$/, '')}/search`)
      url.searchParams.set('q', query)
      url.searchParams.set('format', 'json')
      const response = await fetch(url)
      if (!response.ok) throw new Error(`SearXNG 搜索失败 (${response.status})`)
      const body = await response.json() as { results?: Array<{ title?: unknown; url?: unknown; content?: unknown }> }
      return (body.results ?? []).slice(0, maxResults).map(r => ({ title: String(r.title ?? ''), url: String(r.url ?? ''), content: String(r.content ?? '') }))
    }
    default:
      throw new Error(`该搜索提供方暂不支持 agent 调用：${provider}。请在 设置 → 网络搜索 中将「搜索提供方」切换为 Tavily / Exa / 智谱 / Bocha / SearXNG 之一并填入 API Key`)
  }
}

/** Resolve the active provider's host + first key (override wins over preset). */
function resolveActiveProvider(config: WebSearchConfig, providerId: WebSearchProviderId): { host: string; apiKey: string } {
  const override = (config.providerOverrides as Record<string, { apiKeys?: unknown[]; capabilities?: { searchKeywords?: { apiHost?: unknown } } }> | undefined)?.[providerId]
  const keys = Array.isArray(override?.apiKeys) ? override.apiKeys : []
  const overrideHost = typeof override?.capabilities?.searchKeywords?.apiHost === 'string' ? override.capabilities.searchKeywords.apiHost : undefined
  return {
    host: overrideHost ?? PROVIDER_DEFAULT_HOSTS[providerId] ?? '',
    apiKey: keys.length > 0 ? String(keys[0]) : '',
  }
}

export interface WebSearchServiceConfig {
  logger?: Context['logger']
}

export class WebSearchService extends Service {
  static inject = ['settings'] as const
  static optional = ['tools'] as const

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
    this.registerTool()
  }

  async getConfig(): Promise<WebSearchConfig> {
    return this.scope.get()
  }

  /** Register the `web_search` agent tool — the configured keyword-search
   * provider becomes a capability the DSH agent can invoke in sessions. */
  private registerTool(): void {
    const tools = this.ctx.get('tools', false)
    if (tools === undefined) return
    const disposer = tools.register(defineTool({
      name: 'web_search',
      description: '网络搜索当前配置的搜索提供方（Tavily/Exa/智谱/Bocha/SearXNG）。返回带标题、链接和摘要的结果列表；查询新闻、资料、文档或任何需要联网的信息时使用。',
      parameters: {
        query: { type: 'string', required: true, description: '搜索关键词' },
        max_results: { type: 'integer', description: '返回结果数上限（默认取设置值）' },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            query: { type: 'string', required: true },
            provider: { type: 'string', required: true },
            hits: {
              type: 'array',
              required: true,
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  title: { type: 'string', required: true },
                  url: { type: 'string', required: true },
                  content: { type: 'string', required: true },
                },
              },
            },
          },
        },
        render: (_args, value): ContentBlock[] => {
          const hits = value.hits as Array<{ title: string; url: string; content: string }>
          const lines = hits.map((hit, index) => (
            `[${index + 1}] ${hit.title}\n${hit.url}\n${hit.content.slice(0, 300)}`
          ))
          return [{ type: 'text', text: lines.length === 0 ? '没有搜索结果。' : lines.join('\n\n') }]
        },
      },
      execute: async (args: { query: string; max_results?: number }) => {
        const config = this.scope.get()
        const provider = config.defaultSearchKeywordsProvider
        const { host, apiKey } = resolveActiveProvider(config, provider)
        if (host === '') throw new Error(`搜索提供方 ${provider} 未配置 API 地址`)
        const maxResults = args.max_results ?? config.maxResults
        const hits = await searchViaProvider(provider, host, apiKey, args.query, maxResults, config.excludeDomains)
        const cutoff = config.compression.method === 'cutoff' ? config.compression.cutoffLimit : undefined
        return {
          query: args.query,
          provider,
          hits: hits.map(hit => ({ ...hit, content: cutoff !== undefined ? hit.content.slice(0, cutoff) : hit.content })),
        }
      },
    }))
    this.ctx.effect(() => () => { disposer() })
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
