/** Runtime dispatch for Cherry-compatible web-search providers. */

import type { WebSearchConfig, WebSearchProvider, WebSearchProviderId, WebSearchCapability } from './types.ts'

export interface SearchHit {
  title: string
  url: string
  content: string
}

export interface WebSearchCheckResult {
  ok: boolean
  providerId: WebSearchProviderId
  capability: WebSearchCapability
  latencyMs: number
  resultCount?: number
  message: string
}

function capability(provider: WebSearchProvider, feature: WebSearchCapability) {
  return provider.capabilities.find(item => item.feature === feature)
}

function hostFor(provider: WebSearchProvider, feature: WebSearchCapability): string {
  return capability(provider, feature)?.apiHost?.trim() ?? ''
}

function keyFor(provider: WebSearchProvider): string {
  return provider.apiKeys[0]?.trim() ?? ''
}

function requireHost(provider: WebSearchProvider, feature: WebSearchCapability): string {
  const host = hostFor(provider, feature)
  if (host === '') throw new Error(`${provider.name} 未配置 API 地址`)
  return host
}

function requireKey(provider: WebSearchProvider): string {
  const key = keyFor(provider)
  if (key === '') throw new Error(`${provider.name} 未配置 API Key`)
  return key
}

function appendPath(host: string, path: string): string {
  if (path === '') return host
  return `${host.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

function basicAuth(provider: WebSearchProvider): Record<string, string> {
  const username = provider.basicAuthUsername?.trim() ?? ''
  if (username === '') return {}
  const password = provider.basicAuthPassword?.trim() ?? ''
  return { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}` }
}

async function requestJson(url: string, init: RequestInit): Promise<unknown> {
  const response = await fetch(url, init)
  if (!response.ok) {
    const detail = (await response.text()).trim().slice(0, 300)
    throw new Error(`${response.status} ${detail}`.trim())
  }
  return response.json()
}

async function requestText(url: string, init: RequestInit): Promise<string> {
  const response = await fetch(url, init)
  if (!response.ok) {
    const detail = (await response.text()).trim().slice(0, 300)
    throw new Error(`${response.status} ${detail}`.trim())
  }
  return response.text()
}

function jsonHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { 'Content-Type': 'application/json', ...extra }
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function records(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function resultList(value: unknown): SearchHit[] {
  return Array.isArray(value)
    ? value.map(item => {
        const row = records(item)
        return {
          title: asString(row.title ?? row.name),
          url: asString(row.url ?? row.link),
          content: asString(row.content ?? row.text ?? row.summary ?? row.snippet ?? row.description),
        }
      })
    : []
}

function responseHits(body: unknown, maxResults: number): SearchHit[] {
  const root = records(body)
  const data = records(root.data)
  const web = records(data.web)
  const pages = records(data.webPages)
  const candidates = root.results ?? root.search_result ?? data.result ?? web.value ?? pages.value ?? root.data
  return resultList(candidates).slice(0, maxResults)
}

function parseExaMcpText(text: string): SearchHit[] {
  const hits: SearchHit[] = []
  for (const block of text.split(/\n\s*\n/)) {
    const title = block.match(/^Title:\s*(.*)$/m)?.[1]?.trim() ?? ''
    const url = block.match(/^URL:\s*(.*)$/m)?.[1]?.trim() ?? ''
    const textStart = block.match(/^Text:\s*([\s\S]*)$/m)?.[1]?.trim() ?? ''
    if (title || url || textStart) hits.push({ title, url, content: textStart })
  }
  return hits
}

function parseExaMcpResponse(raw: string): SearchHit[] {
  const texts: string[] = []
  for (const line of raw.split('\n')) {
    const payload = line.startsWith('data: ') ? line.slice(6).trim() : line.trim()
    if (payload === '' || payload === '[DONE]') continue
    try {
      const parsed = records(JSON.parse(payload))
      const result = records(parsed.result)
      const content = Array.isArray(result.content) ? result.content : []
      for (const item of content) {
        const text = asString(records(item).text).trim()
        if (text) texts.push(text)
      }
      const direct = resultList(parsed.results)
      if (direct.length > 0) return direct
    } catch {
      // Some MCP gateways return a plain text block rather than JSON.
    }
  }
  if (texts.length === 0 && raw.includes('Title:')) texts.push(raw)
  return parseExaMcpText(texts.join('\n\n'))
}

function titleFromHtml(html: string, fallback: string): string {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() ?? fallback
}

async function fetchPlainUrl(url: string, signal?: AbortSignal): Promise<SearchHit> {
  const parsed = new URL(url)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('网页地址必须使用 http 或 https')
  const content = await requestText(url, { method: 'GET', headers: { Accept: 'text/html, text/plain, text/markdown' }, signal: signal ?? null })
  return { title: titleFromHtml(content, url), url, content }
}

async function searchExaMcp(provider: WebSearchProvider, query: string, config: WebSearchConfig, signal?: AbortSignal): Promise<SearchHit[]> {
  const host = requireHost(provider, 'searchKeywords')
  const key = keyFor(provider)
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'web_search_exa',
      arguments: { query, type: 'auto', numResults: config.maxResults, livecrawl: 'fallback' },
    },
  }
  const headers = jsonHeaders({ Accept: 'application/json, text/event-stream' })
  if (key) headers['x-api-key'] = key
  const raw = await requestText(host, { method: 'POST', headers, body: JSON.stringify(body), signal: signal ?? null })
  return parseExaMcpResponse(raw).slice(0, config.maxResults)
}

export async function searchViaProvider(
  provider: WebSearchProvider,
  query: string,
  config: WebSearchConfig,
  signal?: AbortSignal,
): Promise<SearchHit[]> {
  const normalized = query.trim()
  if (normalized === '') throw new Error('搜索关键词不能为空')
  if (provider.id === 'exa-mcp') return searchExaMcp(provider, normalized, config, signal)

  switch (provider.id) {
    case 'tavily': {
      const key = requireKey(provider)
      const body = { query: normalized, max_results: config.maxResults, ...(config.excludeDomains.length > 0 ? { exclude_domains: config.excludeDomains } : {}) }
      const value = await requestJson(appendPath(requireHost(provider, 'searchKeywords'), '/search'), {
        method: 'POST', headers: jsonHeaders({ Authorization: `Bearer ${key}` }), body: JSON.stringify(body), signal: signal ?? null,
      })
      return responseHits(value, config.maxResults)
    }
    case 'exa': {
      const key = requireKey(provider)
      const value = await requestJson(appendPath(requireHost(provider, 'searchKeywords'), '/search'), {
        method: 'POST', headers: jsonHeaders({ 'x-api-key': key }), body: JSON.stringify({ query: normalized, numResults: config.maxResults, contents: { text: true } }), signal: signal ?? null,
      })
      return responseHits(value, config.maxResults)
    }
    case 'zhipu': {
      const key = requireKey(provider)
      const value = await requestJson(requireHost(provider, 'searchKeywords'), {
        method: 'POST', headers: jsonHeaders({ Authorization: `Bearer ${key}` }), body: JSON.stringify({ search_query: normalized, search_engine: 'search_std', search_intent: false }), signal: signal ?? null,
      })
      return responseHits(value, config.maxResults)
    }
    case 'bocha': {
      const key = requireKey(provider)
      const value = await requestJson(appendPath(requireHost(provider, 'searchKeywords'), '/v1/web-search'), {
        method: 'POST', headers: jsonHeaders({ Authorization: `Bearer ${key}` }), body: JSON.stringify({ query: normalized, count: config.maxResults, exclude: config.excludeDomains.join(','), summary: true }), signal: signal ?? null,
      })
      const root = records(value)
      return responseHits(records(root.data).webPages, config.maxResults)
    }
    case 'searxng': {
      const url = new URL(appendPath(requireHost(provider, 'searchKeywords'), '/search'))
      url.searchParams.set('q', normalized)
      url.searchParams.set('format', 'json')
      const engines = provider.engines?.map(item => item.trim()).filter(Boolean) ?? []
      if (engines.length > 0) url.searchParams.set('engines', engines.join(','))
      const value = await requestJson(url.toString(), { method: 'GET', headers: basicAuth(provider), signal: signal ?? null })
      return responseHits(value, config.maxResults)
    }
    case 'querit': {
      const key = requireKey(provider)
      const value = await requestJson(appendPath(requireHost(provider, 'searchKeywords'), '/v1/search'), {
        method: 'POST', headers: jsonHeaders({ Authorization: `Bearer ${key}` }), body: JSON.stringify({ query: normalized, count: config.maxResults, ...(config.excludeDomains.length > 0 ? { filters: { sites: { exclude: config.excludeDomains } } } : {}) }), signal: signal ?? null,
      })
      const root = records(value)
      return responseHits(records(root.results).result, config.maxResults)
    }
    case 'jina': {
      const host = requireHost(provider, 'searchKeywords')
      const headers: Record<string, string> = { Accept: 'application/json' }
      const key = keyFor(provider)
      if (key) headers.Authorization = `Bearer ${key}`
      const value = await requestJson(appendPath(host, encodeURIComponent(normalized)), { method: 'GET', headers, signal: signal ?? null })
      const root = records(value)
      return responseHits(root.data ?? root.results, config.maxResults)
    }
    case 'firecrawl': {
      const host = requireHost(provider, 'searchKeywords')
      const headers: Record<string, string> = {}
      const key = keyFor(provider)
      if (key) headers.Authorization = `Bearer ${key}`
      const value = await requestJson(appendPath(host, '/v2/search'), {
        method: 'POST', headers: jsonHeaders(headers), body: JSON.stringify({ query: normalized, limit: config.maxResults, scrapeOptions: { formats: ['markdown'] } }), signal: signal ?? null,
      })
      return responseHits(value, config.maxResults)
    }
    case 'fetch':
      throw new Error('Fetch 仅支持网页读取，不支持关键词搜索')
    default:
      throw new Error(`暂不支持 ${provider.name} 的关键词搜索`)
  }
}

export async function fetchViaProvider(
  provider: WebSearchProvider,
  url: string,
  _config: WebSearchConfig,
  signal?: AbortSignal,
): Promise<SearchHit[]> {
  const normalized = url.trim()
  if (normalized === '') throw new Error('网页地址不能为空')
  if (provider.id === 'fetch') return [await fetchPlainUrl(normalized, signal)]

  switch (provider.id) {
    case 'jina': {
      const host = requireHost(provider, 'fetchUrls')
      const headers: Record<string, string> = { Accept: 'application/json', 'X-Retain-Images': 'none' }
      const key = keyFor(provider)
      if (key) headers.Authorization = `Bearer ${key}`
      const value = await requestJson(appendPath(host, normalized), { method: 'GET', headers, signal: signal ?? null })
      const root = records(value)
      const data = records(root.data ?? root)
      return [{ title: asString(data.title) || normalized, url: asString(data.url) || normalized, content: asString(data.content ?? data.text) }]
    }
    case 'querit': {
      const key = requireKey(provider)
      const value = await requestJson(appendPath(requireHost(provider, 'fetchUrls'), '/v1/contents'), {
        method: 'POST', headers: jsonHeaders({ Authorization: `Bearer ${key}` }), body: JSON.stringify({ urls: [normalized], format: 'markdown', extrasMeta: true }), signal: signal ?? null,
      })
      const resultValues = records(value).results
      const page = records(Array.isArray(resultValues) ? resultValues[0] : undefined)
      return [{ title: asString(records(page.extrasMeta).title) || normalized, url: asString(page.url) || normalized, content: asString(page.content) }]
    }
    case 'firecrawl': {
      const host = requireHost(provider, 'fetchUrls')
      const headers: Record<string, string> = {}
      const key = keyFor(provider)
      if (key) headers.Authorization = `Bearer ${key}`
      const value = await requestJson(appendPath(host, '/v2/scrape'), {
        method: 'POST', headers: jsonHeaders(headers), body: JSON.stringify({ url: normalized, formats: ['markdown'] }), signal: signal ?? null,
      })
      const data = records(records(value).data)
      const metadata = records(data.metadata)
      return [{ title: asString(metadata.title) || normalized, url: asString(metadata.sourceURL) || normalized, content: asString(data.markdown) }]
    }
    case 'searxng':
      return [await fetchPlainUrl(normalized, signal)]
    default:
      throw new Error(`${provider.name} 暂不支持网页读取`)
  }
}

export async function checkProvider(
  provider: WebSearchProvider,
  capability: WebSearchCapability,
  config: WebSearchConfig,
): Promise<WebSearchCheckResult> {
  const started = Date.now()
  try {
    const hits = capability === 'searchKeywords'
      ? await searchViaProvider(provider, 'Cherry Studio', { ...config, maxResults: 1 })
      : await fetchViaProvider(provider, 'https://example.com', { ...config, maxResults: 1 })
    return {
      ok: true,
      providerId: provider.id,
      capability,
      latencyMs: Date.now() - started,
      resultCount: hits.length,
      message: `连接成功，返回 ${hits.length} 条结果`,
    }
  } catch (error) {
    return {
      ok: false,
      providerId: provider.id,
      capability,
      latencyMs: Date.now() - started,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}
