/** Host-side Cherry-compatible web-search settings and agent tools. */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { settingsNamespace, type SettingsScope } from '@deepseek-ai/dsh-settings'
import Schema from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ContentBlock } from '@deepseek-ai/dsh-llm/types'
import type {
  WebSearchCapability,
  WebSearchConfig,
  WebSearchProvider,
  WebSearchProviderOverrides,
  WebSearchProviderId,
} from './websearch/types.ts'
import { resolveProviders, isWebSearchProviderReady } from './websearch/utils.ts'
import { checkProvider, fetchViaProvider, searchViaProvider } from './websearch/runtime.ts'

const WEBSEARCH_NAMESPACE = settingsNamespace('control-center-websearch')

type ProviderOverride = NonNullable<WebSearchProviderOverrides[WebSearchProviderId]>
type WebSearchToolResult = {
  query: string
  provider: WebSearchProviderId
  hits: Array<{ title: string; url: string; content: string }>
}

function mergeOverride(current: ProviderOverride | undefined, patch: ProviderOverride): ProviderOverride {
  return {
    ...current,
    ...patch,
    ...(patch.capabilities === undefined ? {} : {
      capabilities: { ...current?.capabilities, ...patch.capabilities },
    }),
  }
}

function truncateHits(hits: WebSearchToolResult['hits'], cutoff: number | undefined): WebSearchToolResult['hits'] {
  return hits.map(hit => ({ ...hit, content: cutoff === undefined ? hit.content : hit.content.slice(0, cutoff) }))
}

function renderHits(value: WebSearchToolResult): ContentBlock[] {
  const lines = value.hits.map((hit, index) => `[${index + 1}] ${hit.title}\n${hit.url}\n${hit.content.slice(0, 300)}`)
  return [{ type: 'text', text: lines.length === 0 ? '没有搜索结果。' : lines.join('\n\n') }]
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
      defaultFetchUrlsProvider: Schema.union(['searxng', 'querit', 'fetch', 'jina', 'firecrawl'] as const).default('jina'),
      providerOverrides: Schema.dict(Schema.object({
        apiKeys: Schema.array(Schema.string().role('secret')),
        capabilities: Schema.object({
          searchKeywords: Schema.object({ apiHost: Schema.string() }),
          fetchUrls: Schema.object({ apiHost: Schema.string() }),
        }),
        engines: Schema.array(Schema.string()),
        basicAuthUsername: Schema.string(),
        basicAuthPassword: Schema.string().role('secret'),
      })).default({}),
      maxResults: Schema.number().min(1).max(50).default(5),
      excludeDomains: Schema.array(Schema.string()).default([]),
      compression: Schema.object({
        method: Schema.union(['none', 'cutoff'] as const).default('cutoff'),
        cutoffLimit: Schema.number().min(100).max(10000).default(2000),
      }).default({ method: 'cutoff', cutoffLimit: 2000 }),
      clientToolsPreferred: Schema.boolean().default(true),
    }), {
      base: {
        defaultSearchKeywordsProvider: 'exa-mcp',
        defaultFetchUrlsProvider: 'jina',
        providerOverrides: {},
        maxResults: 5,
        excludeDomains: [],
        compression: { method: 'cutoff', cutoffLimit: 2000 },
        clientToolsPreferred: true,
      },
    })
    this.registerTools()
  }

  async getConfig(): Promise<WebSearchConfig> {
    return this.scope.get()
  }

  private registerTools(): void {
    const tools = this.ctx.get('tools', false)
    if (tools === undefined) return
    const searchDisposer = tools.register(defineTool({
      name: 'web_search',
      description: '搜索互联网。使用设置中选择的搜索提供方，返回标题、链接和摘要；需要最新信息、新闻、资料或文档时使用。',
      parameters: {
        query: { type: 'string', required: true, description: '搜索关键词' },
        max_results: { type: 'integer', description: '返回结果数上限' },
      },
      output: {
        schema: {
          type: 'object', additionalProperties: false,
          properties: {
            query: { type: 'string', required: true }, provider: { type: 'string', required: true },
            hits: { type: 'array', required: true, items: { type: 'object', additionalProperties: false, properties: {
              title: { type: 'string', required: true }, url: { type: 'string', required: true }, content: { type: 'string', required: true },
            } } },
          },
        },
        render: (_args, value) => renderHits(value as WebSearchToolResult),
      },
      timeoutMs: 30000,
      execute: async (args: { query: string; max_results?: number }, exec?) => {
        const config = this.scope.get()
        const providerId = config.defaultSearchKeywordsProvider
        const provider = resolveProviders(config.providerOverrides).find(item => item.id === providerId) ?? null
        if (!isWebSearchProviderReady(provider, 'searchKeywords')) {
          throw new Error(`搜索提供方 ${providerId} 尚未就绪，请在设置 → 网络搜索中配置 API 地址或 API Key`)
        }
        const requestConfig = { ...config, maxResults: args.max_results ?? config.maxResults }
        const hits = await searchViaProvider(provider!, args.query, requestConfig, exec?.signal)
        const cutoff = config.compression.method === 'cutoff' ? config.compression.cutoffLimit : undefined
        return { query: args.query, provider: providerId, hits: truncateHits(hits, cutoff) }
      },
    }))
    const fetchDisposer = tools.register(defineTool({
      name: 'web_fetch',
      description: '读取指定网页并提取正文。需要阅读搜索结果页面、文档或 URL 内容时使用。',
      parameters: { url: { type: 'string', required: true, description: '要读取的 http/https URL' } },
      output: {
        schema: {
          type: 'object', additionalProperties: false,
          properties: {
            query: { type: 'string', required: true }, provider: { type: 'string', required: true },
            hits: { type: 'array', required: true, items: { type: 'object', additionalProperties: false, properties: {
              title: { type: 'string', required: true }, url: { type: 'string', required: true }, content: { type: 'string', required: true },
            } } },
          },
        },
        render: (_args, value) => renderHits(value as WebSearchToolResult),
      },
      timeoutMs: 30000,
      execute: async (args: { url: string }, exec) => {
        const config = this.scope.get()
        const providerId = config.defaultFetchUrlsProvider
        const provider = resolveProviders(config.providerOverrides).find(item => item.id === providerId) ?? null
        if (!isWebSearchProviderReady(provider, 'fetchUrls')) {
          throw new Error(`网页读取提供方 ${providerId} 尚未就绪，请在设置 → 网络搜索中配置 API 地址或 API Key`)
        }
        const hits = await fetchViaProvider(provider!, args.url, config, exec?.signal)
        const cutoff = config.compression.method === 'cutoff' ? config.compression.cutoffLimit : undefined
        return { query: args.url, provider: providerId, hits: truncateHits(hits, cutoff) }
      },
    }))
    this.ctx.effect(() => () => { searchDisposer(); fetchDisposer() })
  }

  async updateConfig(params: Partial<WebSearchConfig>): Promise<WebSearchConfig> {
    await this.scope.update(params)
    return this.scope.get()
  }

  async listProviders(): Promise<WebSearchProvider[]> {
    return resolveProviders(this.scope.get().providerOverrides)
  }

  async getProvider(params: { providerId: WebSearchProviderId }): Promise<WebSearchProvider | null> {
    return (await this.listProviders()).find(provider => provider.id === params.providerId) ?? null
  }

  async updateProviderOverride(params: {
    providerId: WebSearchProviderId
    override: ProviderOverride
  }): Promise<WebSearchProvider> {
    const current = this.scope.get()
    const merged = mergeOverride(current.providerOverrides[params.providerId], params.override)
    await this.scope.update({ providerOverrides: { ...current.providerOverrides, [params.providerId]: merged } })
    const provider = (await this.listProviders()).find(item => item.id === params.providerId)
    if (provider === undefined) throw new Error(`Provider ${params.providerId} not found after update`)
    return provider
  }

  async checkProviderReady(params: { providerId: WebSearchProviderId; capability: WebSearchCapability }): Promise<boolean> {
    const provider = await this.getProvider({ providerId: params.providerId })
    return isWebSearchProviderReady(provider, params.capability)
  }

  async checkProvider(params: { providerId: WebSearchProviderId; capability: WebSearchCapability }): Promise<Awaited<ReturnType<typeof checkProvider>>> {
    const provider = await this.getProvider({ providerId: params.providerId })
    if (provider === null) {
      return { ok: false, providerId: params.providerId, capability: params.capability, latencyMs: 0, message: '提供方不存在' }
    }
    return checkProvider(provider, params.capability, this.scope.get())
  }
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    controlCenterWebSearch: WebSearchService
  }
}
