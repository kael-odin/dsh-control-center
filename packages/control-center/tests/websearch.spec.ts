import { Context, Service } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WebSearchService } from '../src/websearch.ts'
import type { WebSearchConfig } from '../src/websearch/types.ts'

/** A stand-in `tools` service so `ctx.get('tools')` resolves in a bare context. */
class FakeToolsService extends Service {
  override readonly register: (definition: unknown) => () => void = vi.fn(() => () => {})

  constructor(ctx: Context) {
    super(ctx, 'tools')
  }
}

describe('WebSearchService web_search tool', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  function setup(config: Partial<WebSearchConfig>) {
    const stored = new Map<string, unknown>([['value', { ...baseConfig(), ...config }]])
    const ctx = new Context()
    ;(ctx as unknown as { settings: unknown }).settings = {
      get: () => stored.get('value'),
      update: async (ns: string, value: object) => { stored.set('value', value) },
      register: () => {
        const scope: unknown = { get: () => stored.get('value'), update: async () => ({}) }
        return scope
      },
    } as never
    const tools = new FakeToolsService(ctx)
    const service = new WebSearchService(ctx)
    return { service, tools }
  }

  function baseConfig(): WebSearchConfig {
    return {
      defaultSearchKeywordsProvider: 'exa-mcp',
      defaultFetchUrlsProvider: 'jina',
      providerOverrides: {},
      maxResults: 5,
      excludeDomains: [],
      compression: { method: 'none' },
      clientToolsPreferred: true,
    } as WebSearchConfig
  }

  it('registers keyword search and URL fetch agent tools', () => {
    const { tools } = setup({})
    const registered = (tools.register as ReturnType<typeof vi.fn>).mock.calls.map(call => call[0] as { name: string })
    expect(registered.map(tool => tool.name)).toEqual(['web_search', 'web_fetch'])
  })

  it('tavily dispatch: Bearer auth + normalized hits', async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => new Response(JSON.stringify({
      results: [{ title: 'T', url: 'https://a.example', content: 'C' }],
    }), { status: 200 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const { tools } = setup({
      defaultSearchKeywordsProvider: 'tavily',
      providerOverrides: { tavily: { apiKeys: ['tvly-key'] } } as WebSearchConfig['providerOverrides'],
    })
    const tool = (tools.register as ReturnType<typeof vi.fn>).mock.calls[0]![0] as { execute: (args: { query: string }) => Promise<{ provider: string; hits: Array<{ title: string }> }> }
    const result = await tool.execute({ query: 'dsh harness' })
    expect(result.provider).toBe('tavily')
    expect(result.hits[0]!.title).toBe('T')
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(String(url)).toBe('https://api.tavily.com/search')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tvly-key')
  })

  it('exa dispatch: x-api-key header', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      results: [{ title: 'E', url: 'https://b.example', text: 'X' }],
    }), { status: 200 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const { tools } = setup({
      defaultSearchKeywordsProvider: 'exa',
      providerOverrides: { exa: { apiKeys: ['exa-key'] } } as WebSearchConfig['providerOverrides'],
    })
    const tool = (tools.register as ReturnType<typeof vi.fn>).mock.calls[0]![0] as { execute: (args: { query: string }) => Promise<{ provider: string; hits: Array<{ url: string }> }> }
    const result = await tool.execute({ query: 'q' })
    expect(result.provider).toBe('exa')
    expect(result.hits[0]!.url).toBe('https://b.example')
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('exa-key')
  })

  it('ExaMCP uses the hosted keyless endpoint', async () => {
    const fetchMock = vi.fn(async (_url: string | URL, _init?: RequestInit) => new Response(
      'data: {"result":{"content":[{"type":"text","text":"Title: Example\\nURL: https://example.com\\nText: Body"}]}}\n\n',
      { status: 200 },
    ))
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const { tools } = setup({})
    const tool = (tools.register as ReturnType<typeof vi.fn>).mock.calls[0]![0] as { execute: (args: { query: string }) => Promise<{ provider: string; hits: Array<{ url: string }> }> }
    const result = await tool.execute({ query: 'q' })
    expect(result.provider).toBe('exa-mcp')
    expect(result.hits[0]!.url).toBe('https://example.com')
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(String(url)).toBe('https://mcp.exa.ai/mcp')
    expect((init.headers as Record<string, string>)['x-api-key']).toBeUndefined()
  })

  it('web_fetch reads a URL without a key through Fetch', async () => {
    const fetchMock = vi.fn(async () => new Response('<title>Page</title><p>Body</p>', { status: 200 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const { tools } = setup({ defaultFetchUrlsProvider: 'fetch' })
    const tool = (tools.register as ReturnType<typeof vi.fn>).mock.calls[1]![0] as { execute: (args: { url: string }) => Promise<{ provider: string; hits: Array<{ content: string }> }> }
    const result = await tool.execute({ url: 'https://example.com' })
    expect(result.provider).toBe('fetch')
    expect(result.hits[0]!.content).toContain('Body')
  })

  it('REST providers still fail clearly when a required key is missing', async () => {
    const { tools } = setup({ defaultSearchKeywordsProvider: 'exa' })
    const tool = (tools.register as ReturnType<typeof vi.fn>).mock.calls[0]![0] as { execute: (args: { query: string }) => Promise<unknown> }
    await expect(tool.execute({ query: 'q' })).rejects.toThrow(/尚未就绪|API Key/)
  })
})
