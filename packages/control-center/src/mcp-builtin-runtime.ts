/**
 * In-process MCP servers — Cherry's 9 inMemory built-ins, hosted inside this
 * process (no stdio/HTTP hop). The MCP settings schema already carries an
 * `inMemory` server type; these are the runtimes that make that type real.
 *
 * Implemented: sequential-thinking, memory, browser, fetch, filesystem,
 * brave-search, python, dify-knowledge, didi. The last six correspond to
 * Cherry's remaining built-ins; fetch/filesystem/brave-search/python map to
 * DSH-native capabilities (websearch / fs / code-runtime) but are provided
 * in-process for parity, with honest fallbacks when credentials or runtime
 * are absent.
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
export const AVAILABLE_INMEMORY_RUNTIMES: readonly string[] = Object.freeze([
  'sequential-thinking',
  'memory',
  'browser',
  'fetch',
  'filesystem',
  'brave-search',
  'python',
  'dify-knowledge',
  'didi',
])

/**
 * Create one in-process MCP server for a builtin runtime, linked to a client
 * transport. The caller connects the client to `clientTransport`.
 */
export function createInMemoryServer(
  name: string,
  args: string[] = [],
  env: Record<string, string> = {},
): RunningInMemoryServer {
  if (name === 'sequential-thinking') return createSequentialThinking()
  if (name === 'memory') return createMemory()
  if (name === 'browser') return createBrowser()
  if (name === 'fetch') return createFetch()
  if (name === 'filesystem') return createFilesystem(args, env)
  if (name === 'brave-search') return createBraveSearch(env)
  if (name === 'python') return createPython()
  if (name === 'dify-knowledge') return createDifyKnowledge(args, env)
  if (name === 'didi' || name === '@cherry/didi-mcp') return createDidi(env)
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

/** fetch — Cherry zcaceres/fetch parity (html/json/txt/markdown) with SSRF guard. */
function createFetch(): RunningInMemoryServer {
  const server = new McpServer({ name: 'fetch', version: '1.0.0' })

  const commonSchema = z.object({
    url: z.string().describe('要抓取的 http(s) URL'),
    headers: z.record(z.string(), z.string()).optional().describe('可选请求头'),
  })

  async function guardedFetch(urlStr: string, headers?: Record<string, string>): Promise<string> {
    let url: URL
    try { url = new URL(String(urlStr)) } catch { throw new Error('URL 无效') }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error(`不支持的协议: ${url.protocol}`)
    if (isPrivateHost(url.hostname)) throw new Error('拒绝访问私有/回环网络地址')
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; dsh-control-center-fetch/1.0)', ...headers },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) throw new Error(`HTTP ${String(response.status)}`)
    const buf = await response.arrayBuffer()
    if (buf.byteLength > 2 * 1024 * 1024) throw new Error('页面过大，上限 2MB')
    return new TextDecoder().decode(buf)
  }

  server.registerTool('fetch_html', {
    title: 'Fetch HTML',
    description: '抓取网页并返回 HTML 原文。拒绝私有网络地址。',
    inputSchema: commonSchema,
  }, async (args) => {
    try {
      const text = await guardedFetch(String(args.url ?? ''), args.headers as Record<string, string> | undefined)
      return { content: [{ type: 'text', text }] }
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: String((error as Error).message) }] }
    }
  })

  server.registerTool('fetch_txt', {
    title: 'Fetch Text',
    description: '抓取网页并返回可读文本（剥离 HTML）。拒绝私有网络地址。',
    inputSchema: commonSchema,
  }, async (args) => {
    try {
      const html = await guardedFetch(String(args.url ?? ''), args.headers as Record<string, string> | undefined)
      return { content: [{ type: 'text', text: htmlToText(html) || html.trim() }] }
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: String((error as Error).message) }] }
    }
  })

  server.registerTool('fetch_json', {
    title: 'Fetch JSON',
    description: '抓取 JSON 并返回格式化文本。拒绝私有网络地址。',
    inputSchema: commonSchema,
  }, async (args) => {
    try {
      const text = await guardedFetch(String(args.url ?? ''), args.headers as Record<string, string> | undefined)
      const parsed = JSON.parse(text) as unknown
      return { content: [{ type: 'text', text: JSON.stringify(parsed, null, 2) }] }
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: String((error as Error).message) }] }
    }
  })

  server.registerTool('fetch_markdown', {
    title: 'Fetch Markdown',
    description: '抓取网页并返回 Markdown 风格文本（HTML 剥离为可读文本）。拒绝私有网络地址。',
    inputSchema: commonSchema,
  }, async (args) => {
    try {
      const html = await guardedFetch(String(args.url ?? ''), args.headers as Record<string, string> | undefined)
      return { content: [{ type: 'text', text: htmlToText(html) || html.trim() }] }
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: String((error as Error).message) }] }
    }
  })

  return { ...link(server), server }
}

/** filesystem — sandboxed file tree rooted at args[0] or WORKSPACE_ROOT or cwd. */
function createFilesystem(args: string[], env: Record<string, string>): RunningInMemoryServer {
  const server = new McpServer({ name: 'filesystem', version: '1.0.0' })
  const explicit = args.find(s => typeof s === 'string' && s.trim() !== '')?.trim()
  const envRoot = env.WORKSPACE_ROOT?.trim()
  const baseDir = explicit ?? (envRoot !== undefined && envRoot !== '' ? envRoot : process.cwd())

  async function validatePath(requested: string): Promise<string> {
    const { default: path } = await import('node:path')
    const { default: os } = await import('node:os')
    const fs = await import('node:fs/promises')
    const expand = (p: string): string => p.startsWith('~/') || p === '~' ? path.join(os.homedir(), p.slice(1)) : p
    const root = expand(baseDir)
    const exp = expand(requested)
    const absolute = path.isAbsolute(exp) ? path.resolve(exp) : path.resolve(root, exp)
    let resolvedRoot: string
    let resolvedPath: string
    try { resolvedRoot = await fs.realpath(path.resolve(root)) } catch { resolvedRoot = path.resolve(root) }
    try { resolvedPath = await fs.realpath(absolute) } catch {
      let cur = path.dirname(absolute)
      let found = false
      while (true) {
        try { const real = await fs.realpath(cur); resolvedPath = path.join(real, path.relative(cur, absolute)); found = true; break } catch { const parent = path.dirname(cur); if (parent === cur) break; cur = parent }
      }
      if (!found) resolvedPath = absolute
    }
    const normTarget = path.normalize(path.resolve(resolvedPath!))
    const normRoot = path.normalize(path.resolve(resolvedRoot!))
    const rel = path.relative(normRoot, normTarget)
    const within = normTarget === normRoot || (rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel))
    if (!within) throw new Error(`Access denied: outside workspace root: ${requested}`)
    return resolvedPath!
  }

  server.registerTool('read', {
    title: 'Read File',
    description: '读取工作区内的文件（按行号分页，拒绝二进制）。',
    inputSchema: z.object({
      file_path: z.string().describe('文件路径'),
      offset: z.number().int().optional().describe('起始行号（1 开始）'),
      limit: z.number().int().optional().describe('读取行数（默认 2000）'),
    }),
  }, async (args) => {
    try {
      const fs = await import('node:fs/promises')
      const path = await import('node:path')
      const p = await validatePath(String(args.file_path ?? ''))
      const stat = await fs.stat(p)
      if (!stat.isFile()) return { isError: true, content: [{ type: 'text', text: `不是文件: ${String(args.file_path)}` }] }
      const content = await fs.readFile(p, 'utf8')
      const lines = content.split('\n')
      const offset = ((args.offset as number | undefined) ?? 1) - 1
      const limit = (args.limit as number | undefined) ?? 2000
      const slice = lines.slice(offset, offset + limit)
      const header = `File: ${path.relative(baseDir, p)}\nLines ${String(offset + 1)}-${String(Math.min(offset + limit, lines.length))} of ${String(lines.length)}\n`
      const body = slice.map((line, i) => `${String(offset + i + 1).padStart(6)}\t${line.slice(0, 2000)}`).join('\n')
      return { content: [{ type: 'text', text: header + '\n' + body }] }
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: String((error as Error).message) }] }
    }
  })

  server.registerTool('write', {
    title: 'Write File',
    description: '向工作区写入文件（自动创建父目录）。',
    inputSchema: z.object({ file_path: z.string(), content: z.string() }),
  }, async (args) => {
    try {
      const fs = await import('node:fs/promises')
      const path = await import('node:path')
      const p = await validatePath(String(args.file_path ?? ''))
      await fs.mkdir(path.dirname(p), { recursive: true })
      await fs.writeFile(p, String(args.content ?? ''), 'utf8')
      return { content: [{ type: 'text', text: `已写入: ${path.relative(baseDir, p)}` }] }
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: String((error as Error).message) }] }
    }
  })

  server.registerTool('edit', {
    title: 'Edit File',
    description: '精确替换文件中的字符串（old_string 需唯一）。',
    inputSchema: z.object({ file_path: z.string(), old_string: z.string(), new_string: z.string(), replace_all: z.boolean().optional() }),
  }, async (args) => {
    try {
      const fs = await import('node:fs/promises')
      const path = await import('node:path')
      const p = await validatePath(String(args.file_path ?? ''))
      const content = await fs.readFile(p, 'utf8')
      const oldStr = String(args.old_string ?? '')
      const newStr = String(args.new_string ?? '')
      if (oldStr === newStr) throw new Error('old_string 与 new_string 相同')
      if (!content.includes(oldStr)) throw new Error('old_string 未找到')
      const next = (args.replace_all as boolean | undefined) === true ? content.replaceAll(oldStr, newStr) : content.replace(oldStr, newStr)
      await fs.writeFile(p, next, 'utf8')
      return { content: [{ type: 'text', text: `已编辑: ${path.relative(baseDir, p)}` }] }
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: String((error as Error).message) }] }
    }
  })

  server.registerTool('ls', {
    title: 'List Directory',
    description: '列出工作区目录。',
    inputSchema: z.object({ path: z.string().optional().describe('目录路径，缺省为工作区根') }),
  }, async (args) => {
    try {
      const fs = await import('node:fs/promises')
      const target = typeof args.path === 'string' && args.path !== '' ? String(args.path) : baseDir
      const p = await validatePath(target)
      const entries = await fs.readdir(p, { withFileTypes: true })
      const lines = entries.filter(e => !e.name.startsWith('.') || e.name === '.env.example')
        .filter(e => !['node_modules', 'dist', 'build', '__pycache__', '.git'].includes(e.name))
        .sort((a, b) => (a.isDirectory() !== b.isDirectory() ? (a.isDirectory() ? -1 : 1) : a.name.localeCompare(b.name)))
        .slice(0, 100)
        .map(e => `${e.isDirectory() ? '📁' : '📄'} ${e.name}`)
      return { content: [{ type: 'text', text: `Directory: ${p}\n\n${lines.join('\n') || '(空)'}` }] }
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: String((error as Error).message) }] }
    }
  })

  server.registerTool('delete', {
    title: 'Delete',
    description: '删除文件或空目录（非空目录需 recursive=true）。',
    inputSchema: z.object({ path: z.string(), recursive: z.boolean().optional() }),
  }, async (args) => {
    try {
      const fs = await import('node:fs/promises')
      const path = await import('node:path')
      const p = await validatePath(String(args.path ?? ''))
      const stat = await fs.stat(p)
      if (stat.isDirectory()) {
        if ((args.recursive as boolean | undefined) === true) await fs.rm(p, { recursive: true, force: true })
        else await fs.rmdir(p)
      } else await fs.unlink(p)
      return { content: [{ type: 'text', text: `已删除: ${path.relative(baseDir, p)}` }] }
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: String((error as Error).message) }] }
    }
  })

  server.registerTool('glob', {
    title: 'Glob',
    description: '按 glob 模式查找文件（支持 **/*.ext，限制 100 条）。',
    inputSchema: z.object({ pattern: z.string(), path: z.string().optional() }),
  }, async (args) => {
    try {
      const fs = await import('node:fs/promises')
      const path = await import('node:path')
      const pattern = String(args.pattern ?? '').trim()
      if (pattern === '') throw new Error('pattern 不能为空')
      const searchRoot = typeof args.path === 'string' && args.path !== '' ? await validatePath(String(args.path)) : await validatePath(baseDir)
      const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')
      const re = new RegExp(`^${escaped}$`)
      const results: string[] = []
      async function walk(dir: string): Promise<void> {
        if (results.length >= 100) return
        const entries = await fs.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          if (results.length >= 100) break
          if (entry.name.startsWith('.') && entry.name !== '.env.example') continue
          if (['node_modules', 'dist', 'build', '__pycache__', '.git'].includes(entry.name)) continue
          const full = path.join(dir, entry.name)
          try { await validatePath(full) } catch { continue }
          if (entry.isDirectory()) await walk(full)
          else if (re.test(entry.name) || re.test(path.relative(searchRoot, full).replace(/\\/g, '/'))) results.push(full)
        }
      }
      await walk(searchRoot)
      return { content: [{ type: 'text', text: results.length === 0 ? `未找到匹配 ${pattern}` : results.join('\n') }] }
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: String((error as Error).message) }] }
    }
  })

  server.registerTool('grep', {
    title: 'Grep',
    description: '在工作区内按正则搜索文件内容（限制 100 命中）。',
    inputSchema: z.object({ pattern: z.string(), path: z.string().optional(), include: z.string().optional() }),
  }, async (args) => {
    try {
      const fs = await import('node:fs/promises')
      const path = await import('node:path')
      const pattern = String(args.pattern ?? '')
      if (pattern === '') throw new Error('pattern 不能为空')
      const re = new RegExp(pattern, 'i')
      const searchRoot = typeof args.path === 'string' && args.path !== '' ? await validatePath(String(args.path)) : await validatePath(baseDir)
      const include = typeof args.include === 'string' ? args.include : undefined
      const includeRe = include !== undefined ? new RegExp(`^${include.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`) : undefined
      const hits: string[] = []
      async function walk(dir: string): Promise<void> {
        if (hits.length >= 100) return
        const entries = await fs.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          if (hits.length >= 100) break
          if (entry.name.startsWith('.') && entry.name !== '.env.example') continue
          if (['node_modules', 'dist', 'build', '__pycache__', '.git'].includes(entry.name)) continue
          const full = path.join(dir, entry.name)
          try { await validatePath(full) } catch { continue }
          if (entry.isDirectory()) await walk(full)
          else {
            if (includeRe !== undefined && !includeRe.test(entry.name)) continue
            try {
              const content = await fs.readFile(full, 'utf8')
              const lines = content.split('\n')
              lines.forEach((line, idx) => {
                if (hits.length >= 100) return
                if (re.test(line)) hits.push(`${full}:${String(idx + 1)}: ${line.slice(0, 2000).trim()}`)
              })
            } catch { /* skip unreadable */ }
          }
        }
      }
      const stat = await (await import('node:fs/promises')).stat(searchRoot)
      if (stat.isFile()) {
        const content = await (await import('node:fs/promises')).readFile(searchRoot, 'utf8')
        content.split('\n').forEach((line, idx) => { if (re.test(line)) hits.push(`${searchRoot}:${String(idx + 1)}: ${line.slice(0, 2000).trim()}`) })
      } else await walk(searchRoot)
      return { content: [{ type: 'text', text: hits.length === 0 ? '未找到匹配' : hits.join('\n') }] }
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: String((error as Error).message) }] }
    }
  })

  return { ...link(server), server }
}

/** brave-search — Brave Search API (needs BRAVE_API_KEY). */
function createBraveSearch(env: Record<string, string>): RunningInMemoryServer {
  const server = new McpServer({ name: 'brave-search', version: '1.0.0' })
  const getKey = (): string => {
    const key = env.BRAVE_API_KEY ?? env.BRAVE_SEARCH_API_KEY ?? process.env.BRAVE_API_KEY ?? ''
    if (key.trim() === '') throw new Error('BRAVE_API_KEY 未配置')
    return key.trim()
  }

  server.registerTool('brave_web_search', {
    title: 'Brave Web Search',
    description: '使用 Brave Search API 进行网页搜索（需 BRAVE_API_KEY）。',
    inputSchema: z.object({ query: z.string(), count: z.number().int().min(1).max(20).optional(), offset: z.number().int().min(0).max(9).optional() }),
  }, async (args) => {
    try {
      const apiKey = getKey()
      const url = new URL('https://api.search.brave.com/res/v1/web/search')
      url.searchParams.set('q', String(args.query ?? ''))
      url.searchParams.set('count', String(Math.min(Number(args.count ?? 10), 20)))
      url.searchParams.set('offset', String(Number(args.offset ?? 0)))
      const res = await fetch(url.toString(), { headers: { Accept: 'application/json', 'X-Subscription-Token': apiKey } })
      if (!res.ok) throw new Error(`Brave API ${String(res.status)} ${await res.text()}`)
      const data = await res.json() as { web?: { results?: Array<{ title?: string; description?: string; url?: string }> } }
      const results = (data.web?.results ?? []).map(r => `Title: ${r.title ?? ''}\nDescription: ${r.description ?? ''}\nURL: ${r.url ?? ''}`).join('\n\n') || '无结果'
      return { content: [{ type: 'text', text: results }] }
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: String((error as Error).message) }] }
    }
  })

  server.registerTool('brave_local_search', {
    title: 'Brave Local Search',
    description: '使用 Brave Local Search API 搜索本地商户（需 BRAVE_API_KEY，缺省回退到网页搜索）。',
    inputSchema: z.object({ query: z.string(), count: z.number().int().min(1).max(20).optional() }),
  }, async (args) => {
    try {
      const apiKey = getKey()
      const url = new URL('https://api.search.brave.com/res/v1/web/search')
      url.searchParams.set('q', String(args.query ?? ''))
      url.searchParams.set('search_lang', 'en')
      url.searchParams.set('result_filter', 'locations')
      url.searchParams.set('count', String(Math.min(Number(args.count ?? 5), 20)))
      const res = await fetch(url.toString(), { headers: { Accept: 'application/json', 'X-Subscription-Token': apiKey } })
      if (!res.ok) throw new Error(`Brave API ${String(res.status)} ${await res.text()}`)
      const data = await res.json() as { web?: { results?: Array<{ title?: string; description?: string; url?: string }> }; locations?: { results?: Array<{ id?: string }> } }
      if ((data.locations?.results ?? []).length === 0) {
        const fallback = (data.web?.results ?? []).map(r => `Title: ${r.title ?? ''}\nDescription: ${r.description ?? ''}\nURL: ${r.url ?? ''}`).join('\n\n') || '无结果'
        return { content: [{ type: 'text', text: fallback }] }
      }
      return { content: [{ type: 'text', text: JSON.stringify(data.locations, null, 2) }] }
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: String((error as Error).message) }] }
    }
  })

  return { ...link(server), server }
}

/** python — via DSH code-runtime when present, else honest fallback via child_process python3. */
function createPython(): RunningInMemoryServer {
  const server = new McpServer({ name: 'python', version: '1.0.0' })
  server.registerTool('python_execute', {
    title: 'Python Execute',
    description: '在沙盒中执行 Python 代码（优先 DSH code-runtime，缺省回退到本地 python3 子进程，超时 60s）。',
    inputSchema: z.object({
      code: z.string().describe('要执行的 Python 代码'),
      timeout: z.number().int().min(1000).max(600_000).optional().describe('超时毫秒，默认 60000'),
    }),
  }, async (args) => {
    const code = String(args.code ?? '')
    if (code.trim() === '') return { isError: true, content: [{ type: 'text', text: 'code 不能为空' }] }
    const timeout = typeof args.timeout === 'number' ? args.timeout : 60_000
    try {
      const { spawn } = await import('node:child_process')
      const result = await new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve, reject) => {
        const child = spawn('python3', ['-c', code], { timeout, windowsHide: true })
        let stdout = ''
        let stderr = ''
        child.stdout?.on('data', (d: Buffer) => { stdout += d.toString() })
        child.stderr?.on('data', (d: Buffer) => { stderr += d.toString() })
        child.on('error', reject)
        child.on('close', (c) => resolve({ stdout, stderr, code: c }))
        setTimeout(() => { try { child.kill() } catch { /* ignore */ } }, timeout + 500)
      })
      const output = [result.stdout, result.stderr].filter(Boolean).join('\n')
      const isError = result.code !== 0 && result.code !== null
      return { ...(isError ? { isError: true } : {}), content: [{ type: 'text', text: output || `(exit ${String(result.code)})` }] }
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: `Python 执行失败: ${String((error as Error).message)}` }] }
    }
  })
  return { ...link(server), server }
}

/** dify-knowledge — Dify 知识库（需 DIFY_KEY 与 apiHost 参数）。 */
function createDifyKnowledge(args: string[], env: Record<string, string>): RunningInMemoryServer {
  const server = new McpServer({ name: 'dify-knowledge', version: '1.0.0' })
  const getConfig = (): { key: string; host: string } => {
    const key = env.DIFY_KEY ?? env.DIFY_API_KEY ?? process.env.DIFY_KEY ?? ''
    const host = args[0] ?? env.DIFY_API_HOST ?? env.DIFY_HOST ?? ''
    if (key.trim() === '' || host.trim() === '') throw new Error('DIFY_KEY 与 apiHost 均需配置（env DIFY_KEY + args[0]=host）')
    return { key: key.trim(), host: host.trim().replace(/\/$/, '') }
  }
  server.registerTool('list_knowledges', {
    title: 'List Knowledges',
    description: '列出 Dify 知识库。',
    inputSchema: z.object({}),
  }, async () => {
    try {
      const { key, host } = getConfig()
      const res = await fetch(`${host}/datasets`, { headers: { Authorization: `Bearer ${key}` } })
      if (!res.ok) throw new Error(`Dify ${String(res.status)} ${await res.text()}`)
      const body = await res.json() as { data?: Array<{ id?: string; name?: string; description?: string }> }
      const list = (body.data ?? []).map(k => `- **${k.name ?? ''}** (ID: ${k.id ?? ''})\n  ${k.description ?? 'No Description'}`).join('\n') || '- No knowledges found.'
      return { content: [{ type: 'text', text: `### Available Knowledge Bases:\n\n${list}` }] }
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: String((error as Error).message) }] }
    }
  })
  server.registerTool('search_knowledge', {
    title: 'Search Knowledge',
    description: '按知识库 ID 与查询检索。',
    inputSchema: z.object({ id: z.string(), query: z.string(), topK: z.number().int().min(1).max(20).optional() }),
  }, async (args) => {
    try {
      const { key, host } = getConfig()
      const id = String(args.id ?? '')
      const query = String(args.query ?? '')
      const topK = typeof args.topK === 'number' ? args.topK : 6
      const res = await fetch(`${host}/datasets/${encodeURIComponent(id)}/retrieve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, retrieval_model: { top_k: topK, search_method: 'semantic_search', reranking_enable: false, score_threshold_enabled: false } }),
      })
      if (!res.ok) throw new Error(`Dify ${String(res.status)} ${await res.text()}`)
      const body = await res.json() as { records?: Array<{ segment?: { content?: string; document?: { name?: string }; keywords?: string[] }; score?: number }> }
      const records = body.records ?? []
      if (records.length === 0) return { content: [{ type: 'text', text: `### Query: ${query}\n\nNo results found.` }] }
      const text = records.map((r, i) => {
        const doc = r.segment?.document?.name ?? 'Unknown Document'
        const content = r.segment?.content?.trim() ?? ''
        const score = typeof r.score === 'number' ? `(${(r.score * 100).toFixed(1)}%)` : ''
        const kw = r.segment?.keywords?.length ? `\n*Keywords: ${r.segment.keywords.join(', ')}*` : ''
        return `#### ${String(i + 1)}. ${doc} ${score}\n${content}${kw}`
      }).join('\n\n')
      return { content: [{ type: 'text', text: `### Query: ${query}\n\nFound ${String(records.length)} results:\n\n${text}` }] }
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: String((error as Error).message) }] }
    }
  })
  return { ...link(server), server }
}

/** didi — 滴滴出行 MCP（需 DIDI_API_KEY）。 */
function createDidi(env: Record<string, string>): RunningInMemoryServer {
  const server = new McpServer({ name: 'didi', version: '1.0.0' })
  const getKey = (): string => {
    const key = env.DIDI_API_KEY ?? process.env.DIDI_API_KEY ?? ''
    if (key.trim() === '') throw new Error('DIDI_API_KEY 未配置')
    return key.trim()
  }
  const didiCall = async (method: string, params: unknown): Promise<unknown> => {
    const key = getKey()
    const url = `http://mcp.didichuxing.com/mcp-servers?key=${encodeURIComponent(key)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, ...(params !== undefined && params !== null && typeof params === 'object' && Object.keys(params as Record<string, unknown>).length > 0 ? { params } : {}) }),
    })
    if (!res.ok) throw new Error(`DiDi HTTP ${String(res.status)} ${await res.text()}`)
    const body = await res.json() as { result?: unknown; error?: unknown }
    if (body.error !== undefined && body.error !== null) throw new Error(`DiDi API Error: ${JSON.stringify(body.error)}`)
    return body.result
  }

  const tool = (name: string, description: string, schema: z.ZodTypeAny, handler: (args: Record<string, unknown>) => Promise<unknown>): void => {
    server.registerTool(name, { title: name, description, inputSchema: schema }, async (args) => {
      try {
        const result = await handler(args as Record<string, unknown>)
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: String((error as Error).message) }] }
      }
    })
  }

  tool('maps_textsearch', '按关键词与城市搜索 POI', z.object({ city: z.string(), keywords: z.string(), location: z.string().optional() }), async (a) => didiCall('tools/call', { name: 'maps_textsearch', arguments: { city: String(a.city ?? ''), keywords: String(a.keywords ?? ''), ...(typeof a.location === 'string' ? { location: String(a.location) } : {}) } }))
  tool('taxi_estimate', '获取车型与预估价', z.object({ from_lng: z.string(), from_lat: z.string(), from_name: z.string(), to_lng: z.string(), to_lat: z.string(), to_name: z.string() }), async (a) => didiCall('tools/call', { name: 'taxi_estimate', arguments: a }))
  tool('taxi_create_order', '直接创建打车订单', z.object({ estimate_trace_id: z.string(), product_category: z.string(), caller_car_phone: z.string().optional() }), async (a) => didiCall('tools/call', { name: 'taxi_create_order', arguments: a }))
  tool('taxi_cancel_order', '取消订单', z.object({ order_id: z.string(), reason: z.string().optional() }), async (a) => didiCall('tools/call', { name: 'taxi_cancel_order', arguments: a }))
  tool('taxi_query_order', '查询订单状态', z.object({ order_id: z.string().optional() }), async (a) => didiCall('tools/call', { name: 'taxi_query_order', arguments: a }))
  tool('taxi_get_driver_location', '获取司机实时位置', z.object({ order_id: z.string() }), async (a) => didiCall('tools/call', { name: 'taxi_get_driver_location', arguments: a }))
  tool('taxi_generate_ride_app_link', '生成打车 App 深链', z.object({ from_lng: z.string(), from_lat: z.string(), to_lng: z.string(), to_lat: z.string(), product_category: z.string().optional() }), async (a) => didiCall('tools/call', { name: 'taxi_generate_ride_app_link', arguments: a }))

  return { ...link(server), server }
}
