/**
 * In-process MCP servers — Cherry's 9 inMemory built-ins, hosted inside this
 * process (no stdio/HTTP hop). The MCP settings schema already carries an
 * `inMemory` server type; these are the runtimes that make that type real.
 *
 * Currently implemented: sequential-thinking (structured reasoning), memory
 * (knowledge-graph memory), browser (web page fetch → readable text, SSRF
 * guarded). The rest of Cherry's set (fetch, filesystem, brave-search,
 * python, dify-knowledge, didi) map onto DSH-native capabilities and are
 * listed but not yet provided in-process.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { z } from 'zod'

/** A running in-memory server paired with its client transport. */
export interface RunningInMemoryServer {
  server: McpServer
  clientTransport: InMemoryTransport
}

/** Runtime keys that have a real in-process implementation on the host. */
export const AVAILABLE_INMEMORY_RUNTIMES: readonly string[] = Object.freeze(['sequential-thinking', 'memory', 'browser'])

/**
 * Create one in-process MCP server for a builtin runtime, linked to a client
 * transport. The caller connects the client to `clientTransport`.
 */
export function createInMemoryServer(name: string): RunningInMemoryServer {
  if (name === 'sequential-thinking') return createSequentialThinking()
  if (name === 'memory') return createMemory()
  if (name === 'browser') return createBrowser()
  throw new Error(`未实现的内置服务器: ${name}`)
}

function link(server: McpServer): { clientTransport: InMemoryTransport } {
  const [client, serverTransport] = InMemoryTransport.createLinkedPair()
  void server.connect(serverTransport)
  return { clientTransport: client }
}

/** sequential-thinking — modelcontextprotocol/servers reference implementation. */
function createSequentialThinking(): RunningInMemoryServer {
  interface Thought {
    thought: string
    thoughtNumber: number
    totalThoughts: number
    nextThoughtNeeded: boolean
    isRevision?: boolean
    revisesThought?: number
    branchFromThought?: number
    branchId?: string
    needsMoreThoughts?: boolean
  }
  const sessions = new Map<string, Thought[]>()

  const server = new McpServer({ name: 'sequential-thinking', version: '1.0.0' })
  server.registerTool('sequentialthinking', {
    title: 'Sequential Thinking',
    description: '按顺序记录思考链，供多步推理使用。每次调用追加一条思考。',
    inputSchema: z.object({
      thought: z.string().describe('当前的思考内容'),
      thoughtNumber: z.number().int().optional().describe('当前思考编号（从 1 开始）'),
      totalThoughts: z.number().int().optional().describe('预计思考总数'),
      nextThoughtNeeded: z.boolean().describe('是否需要继续思考'),
      isRevision: z.boolean().optional().describe('是否修订之前某条思考'),
      revisesThought: z.number().int().optional().describe('被修订的思考编号'),
      branchFromThought: z.number().int().optional().describe('从此思考分叉'),
      branchId: z.string().optional().describe('分叉标识'),
      needsMoreThoughts: z.boolean().optional().describe('是否还需要更多思考'),
    }),
  }, async (args, extra) => {
    const sessionId = extra.sessionId ?? 'default'
    const list = sessions.get(sessionId) ?? []
    const thought: Thought = {
      thought: String(args.thought ?? ''),
      thoughtNumber: typeof args.thoughtNumber === 'number' ? args.thoughtNumber : list.length + 1,
      totalThoughts: typeof args.totalThoughts === 'number' ? args.totalThoughts : list.length + 1,
      nextThoughtNeeded: args.nextThoughtNeeded === true,
      ...(args.isRevision === true ? { isRevision: true } : {}),
      ...(typeof args.revisesThought === 'number' ? { revisesThought: args.revisesThought } : {}),
      ...(typeof args.branchFromThought === 'number' ? { branchFromThought: args.branchFromThought } : {}),
      ...(typeof args.branchId === 'string' ? { branchId: args.branchId } : {}),
      ...(args.needsMoreThoughts === true ? { needsMoreThoughts: true } : {}),
    }
    list.push(thought)
    sessions.set(sessionId, list)
    return { content: [{ type: 'text', text: JSON.stringify({ thoughtList: list }, null, 2) }] }
  })

  return { ...link(server), server }
}

/** memory — knowledge-graph memory server (entities / relations / observations). */
function createMemory(): RunningInMemoryServer {
  interface Entity { name: string; entityType: string; observations: string[] }
  interface Relation { from: string; to: string; relationType: string }
  const entities = new Map<string, Entity>()
  const relations: Relation[] = []

  const server = new McpServer({ name: 'memory', version: '1.0.0' })
  server.registerTool('create_entities', {
    title: 'Create Entities',
    description: '创建知识图谱实体。',
    inputSchema: z.object({
      entities: z.array(z.object({
        name: z.string(), entityType: z.string(), observations: z.array(z.string()),
      })),
    }),
  }, async (args: { entities?: Array<{ name?: unknown; entityType?: unknown; observations?: unknown }> }) => {
    const created: Array<{ name: string }> = []
    for (const raw of args.entities ?? []) {
      const name = String(raw.name ?? '')
      if (name === '') continue
      entities.set(name, {
        name,
        entityType: String(raw.entityType ?? ''),
        observations: Array.isArray(raw.observations) ? raw.observations.map(String) : [],
      })
      created.push({ name })
    }
    return { content: [{ type: 'text', text: JSON.stringify(created) }] }
  })

  server.registerTool('create_relations', {
    title: 'Create Relations',
    description: '在两个实体之间创建关系。',
    inputSchema: z.object({
      relations: z.array(z.object({
        from: z.string(), to: z.string(), relationType: z.string(),
      })),
    }),
  }, async (args: { relations?: Array<{ from?: unknown; to?: unknown; relationType?: unknown }> }) => {
    const created: Array<{ from: string; to: string; relationType: string }> = []
    for (const raw of args.relations ?? []) {
      const relation = { from: String(raw.from ?? ''), to: String(raw.to ?? ''), relationType: String(raw.relationType ?? '') }
      relations.push(relation)
      created.push(relation)
    }
    return { content: [{ type: 'text', text: JSON.stringify(created) }] }
  })

  server.registerTool('add_observations', {
    title: 'Add Observations',
    description: '向已有实体追加观察。',
    inputSchema: z.object({
      observations: z.array(z.object({
        entityName: z.string(), contents: z.array(z.string()),
      })),
    }),
  }, async (args: { observations?: Array<{ entityName?: unknown; contents?: unknown }> }) => {
    const added: Array<{ entityName: string; addedObservations: string[] }> = []
    for (const raw of args.observations ?? []) {
      const name = String(raw.entityName ?? '')
      const entity = entities.get(name)
      const contents = Array.isArray(raw.contents) ? raw.contents.map(String) : []
      if (entity === undefined) return { isError: true, content: [{ type: 'text', text: `实体不存在: ${name}` }] }
      entity.observations.push(...contents)
      added.push({ entityName: name, addedObservations: contents })
    }
    return { content: [{ type: 'text', text: JSON.stringify(added) }] }
  })

  server.registerTool('read_graph', {
    title: 'Read Graph',
    description: '读取整个知识图谱（实体与关系）。',
    inputSchema: z.object({}),
  }, async () => {
    const graph = {
      entities: [...entities.values()],
      relations,
    }
    return { content: [{ type: 'text', text: JSON.stringify(graph, null, 2) }] }
  })

  server.registerTool('search_nodes', {
    title: 'Search Nodes',
    description: '按名称模糊搜索实体。',
    inputSchema: z.object({ query: z.string().describe('搜索关键词') }),
  }, async (args: { query?: unknown }) => {
    const query = String(args.query ?? '').toLowerCase()
    const matches = [...entities.values()].filter(e =>
      e.name.toLowerCase().includes(query) || e.entityType.toLowerCase().includes(query) || e.observations.some(o => o.toLowerCase().includes(query)))
    return { content: [{ type: 'text', text: JSON.stringify(matches.map(e => ({ name: e.name, entityType: e.entityType, observations: e.observations.slice(-10) }))) }] }
  })

  return { ...link(server), server }
}

/** Private / loopback ranges — the browser tool refuses to fetch them (SSRF). */
function isPrivateHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) return true
  // IPv6 loopback / link-local / unique-local.
  if (hostname.includes(':')) {
    const lower = hostname.toLowerCase()
    return lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe8')
      || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')
  }
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname)
  if (match !== null) {
    const [a, b] = [Number(match[1]), Number(match[2])]
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 169 && b === 254) return true
  }
  return false
}

/** Strip tags and decode the few entities that survive a plain-text read. */
function htmlToText(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // Block-level boundaries become line breaks so paragraphs survive.
    .replace(/<\/(p|div|section|article|h[1-6]|li|tr|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
  const text = withoutScripts.replace(/<[^>]+>/g, '')
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** browser — web page fetch rendered to readable text (Cherry browser parity). */
function createBrowser(): RunningInMemoryServer {
  const MAX_BYTES = 2 * 1024 * 1024

  const server = new McpServer({ name: 'browser', version: '1.0.0' })
  server.registerTool('fetch_page', {
    title: 'Fetch Page',
    description: '抓取一个网页并返回可读文本（标题 + 正文，HTML 已剥离）。拒绝私有网络地址。',
    inputSchema: z.object({
      url: z.string().describe('要抓取的 http(s) URL'),
      maxChars: z.number().int().min(500).max(50_000).optional().describe('返回文本的最大字符数（默认 8000）'),
    }),
  }, async (args) => {
    let url: URL
    try {
      url = new URL(String(args.url ?? ''))
    } catch {
      return { isError: true, content: [{ type: 'text', text: 'URL 无效' }] }
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { isError: true, content: [{ type: 'text', text: `不支持的协议: ${url.protocol}` }] }
    }
    if (isPrivateHost(url.hostname)) {
      return { isError: true, content: [{ type: 'text', text: '拒绝访问私有/回环网络地址' }] }
    }
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 15_000)
      let response: Response
      try {
        response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; dsh-control-center-browser/1.0)' },
          signal: controller.signal,
          redirect: 'follow',
        })
      } finally {
        clearTimeout(timer)
      }
      if (!response.ok) {
        return { content: [{ type: 'text', text: `抓取失败：HTTP ${String(response.status)}` }] }
      }
      const contentType = response.headers.get('content-type') ?? ''
      const buffer = await response.arrayBuffer()
      if (buffer.byteLength > MAX_BYTES) {
        return { isError: true, content: [{ type: 'text', text: `页面过大（${String(Math.round(buffer.byteLength / 1024))}KB），上限 2048KB` }] }
      }
      const body = new TextDecoder().decode(buffer)
      const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(body)?.[1]?.trim() ?? ''
      const isHtml = contentType.includes('html') || /^\s*<(!doctype|html)/i.test(body)
      const fullText = isHtml ? htmlToText(body) : body.trim()
      if (fullText.length === 0) {
        return { content: [{ type: 'text', text: '页面无可提取文本' }] }
      }
      const maxChars = typeof args.maxChars === 'number' ? args.maxChars : 8_000
      const clipped = fullText.length > maxChars
        ? `${fullText.slice(0, maxChars)}\n\n[已截断，全文 ${String(fullText.length)} 字符]`
        : fullText
      const header = title.length > 0 ? `# ${title}\n\n` : ''
      return { content: [{ type: 'text', text: `${header}${clipped}` }] }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { isError: true, content: [{ type: 'text', text: `抓取失败：${message}` }] }
    }
  })

  return { ...link(server), server }
}
