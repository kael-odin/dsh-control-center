/**
 * Parsers behind the 添加 MCP 服务器 dialog's 快速导入 box (Cherry's
 * QuickCreate flow): paste an `npx` command line, a JSON server definition
 * (bare or wrapped in a `mcpServers` object), or a plain URL, and the fields
 * prefill. Nothing here writes — parsing only proposes; the user still
 * submits the form.
 */

export type McpTransportType = 'stdio' | 'sse' | 'streamableHttp'

export interface ParsedServerSpec {
  name?: string | undefined
  type: McpTransportType
  command?: string | undefined
  args?: string[] | undefined
  env?: Record<string, string> | undefined
  baseUrl?: string | undefined
}

export type ParseResult =
  | { ok: true; spec: ParsedServerSpec }
  | { ok: false; error: string }

/**
 * Parse a pasted multi-server config (JSON array of server definitions, or a
 * `mcpServers` keyed object) into an install list — Cherry protocol install
 * wizard parity. Returns `ok: false` when the text is not a batch config.
 */
export function parseProtocolServers(text: string): { ok: true; servers: ParsedServerSpec[] } | { ok: false; error: string } {
  const trimmed = text.trim()
  if (trimmed.length === 0) return { ok: false, error: '内容为空' }
  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return { ok: false, error: '不是 JSON 配置' }
  }
  const entries: Array<[string, unknown]> = []
  if (Array.isArray(parsed)) {
    parsed.forEach((item, index) => { if (item !== null && typeof item === 'object') entries.push([String((item as { name?: unknown }).name ?? `server-${index + 1}`), item]) })
  } else if (parsed !== null && typeof parsed === 'object' && 'mcpServers' in parsed) {
    const map = (parsed as { mcpServers: unknown }).mcpServers
    if (map !== null && typeof map === 'object') {
      for (const [key, value] of Object.entries(map as Record<string, unknown>)) {
        if (value !== null && typeof value === 'object') entries.push([key, value])
      }
    }
  } else {
    return { ok: false, error: '不是批量配置（应为服务器数组或 mcpServers 对象）' }
  }
  if (entries.length === 0) return { ok: false, error: '未解析到任何服务器' }
  const servers: ParsedServerSpec[] = entries
    .map(([name, raw]) => parseServerJson(name, raw))
    .filter((server): server is ParsedServerSpec => server !== null)
  if (servers.length === 0) return { ok: false, error: '批量配置中的服务器均无法解析' }
  return { ok: true, servers }
}

/** One keyed server definition → draft spec. `null` when unusable. */
function parseServerJson(name: string, raw: unknown): ParsedServerSpec | null {
  if (raw === null || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const url = typeof record.url === 'string' ? record.url : typeof record.baseUrl === 'string' ? record.baseUrl : undefined
  const command = typeof record.command === 'string' ? record.command : undefined
  const args = Array.isArray(record.args) ? record.args.map(String) : undefined
  const env: Record<string, string> | undefined =
    record.env !== null && typeof record.env === 'object' && !Array.isArray(record.env)
      ? Object.fromEntries(Object.entries(record.env as Record<string, unknown>).map(([k, v]) => [k, String(v)]))
      : undefined
  const spec: ParsedServerSpec = {
    name: typeof record.name === 'string' ? record.name : name,
    type: url !== undefined ? (record.type === 'sse' ? 'sse' : 'streamableHttp') : 'stdio',
  }
  if (url !== undefined) spec.baseUrl = url
  if (command !== undefined) spec.command = command
  if (args !== undefined && args.length > 0) spec.args = args
  if (env !== undefined && Object.keys(env).length > 0) spec.env = env
  if (url === undefined && command === undefined) return null
  return spec
}

/** Split a command line respecting single/double quotes (no shell exec). */
function splitCommandLine(text: string): string[] {
  const tokens: string[] = []
  let current = ''
  let quote: '"' | "'" | undefined
  for (const ch of text) {
    if (quote !== undefined) {
      if (ch === quote) quote = undefined
      else current += ch
      continue
    }
    if (ch === '"' || ch === "'") { quote = ch; continue }
    if (ch === ' ' || ch === '\t') {
      if (current.length > 0) tokens.push(current)
      current = ''
      continue
    }
    current += ch
  }
  if (current.length > 0) tokens.push(current)
  return tokens
}

function inferName(spec: { command?: string | undefined; args?: string[] | undefined; baseUrl?: string | undefined }): string | undefined {
  const arg = spec.args?.find(token => !token.startsWith('-'))
  if (arg !== undefined) {
    const tail = arg.split('/').pop() ?? arg
    return tail.replace(/^@/, '').replace(/[^A-Za-z0-9._-].*$/, '') || undefined
  }
  if (spec.baseUrl !== undefined) {
    try { return new URL(spec.baseUrl).hostname } catch { return undefined }
  }
  return undefined
}

/**
 * Parse one pasted snippet into a server draft.
 * @param text - raw clipboard text: npx line, JSON def, mcpServers wrapper,
 *   or a URL.
 * @returns a parsed draft, or a human-readable refusal.
 */
export function parseServerSpec(text: string): ParseResult {
  const trimmed = text.trim()
  if (trimmed.length === 0) return { ok: false, error: '内容为空' }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      return { ok: true, spec: { type: 'streamableHttp', baseUrl: url.toString(), name: url.hostname } }
    } catch {
      return { ok: false, error: 'URL 无法解析' }
    }
  }

  if (trimmed.startsWith('{')) {
    let json: unknown
    try { json = JSON.parse(trimmed) } catch { return { ok: false, error: 'JSON 解析失败' } }
    let name: string | undefined
    let def: unknown = json
    if (typeof json === 'object' && json !== null) {
      const servers = (json as Record<string, unknown>).mcpServers
      if (typeof servers === 'object' && servers !== null && !Array.isArray(servers)) {
        const entries = Object.entries(servers as Record<string, unknown>)
        if (entries.length === 0) return { ok: false, error: 'mcpServers 为空' }
        ;[name, def] = entries[0]!
      }
    }
    if (typeof def !== 'object' || def === null) return { ok: false, error: 'JSON 不是服务器定义' }
    const record = def as Record<string, unknown>
    const baseUrl = typeof record.baseUrl === 'string'
      ? record.baseUrl
      : typeof record.url === 'string' ? record.url : undefined
    const env = typeof record.env === 'object' && record.env !== null && !Array.isArray(record.env)
      ? Object.fromEntries(
          Object.entries(record.env as Record<string, unknown>)
            .flatMap(([k, v]): Array<[string, string]> => typeof v === 'string' ? [[k, v]] : []),
        )
      : undefined
    const args = Array.isArray(record.args)
      ? record.args.filter((v): v is string => typeof v === 'string')
      : undefined
    const rawType = typeof record.type === 'string' ? record.type.toLowerCase() : undefined
    const type: McpTransportType = rawType === 'sse' || rawType === 'ws'
      ? 'sse'
      : rawType === 'http' || rawType === 'streamable-http' || rawType === 'streamable_http'
        ? 'streamableHttp'
        : typeof record.command === 'string' ? 'stdio' : baseUrl !== undefined ? 'streamableHttp' : 'stdio'
    const spec: ParsedServerSpec = {
      ...(typeof record.name === 'string' && record.name.length > 0 ? { name: record.name } : {}),
      type,
      ...(typeof record.command === 'string' ? { command: record.command } : {}),
      ...(args !== undefined && args.length > 0 ? { args } : {}),
      ...(env !== undefined && Object.keys(env).length > 0 ? { env } : {}),
      ...(baseUrl !== undefined ? { baseUrl } : {}),
    }
    const finalName = name ?? spec.name ?? (spec.command !== undefined || spec.baseUrl !== undefined ? inferName(spec) : undefined)
    return {
      ok: true,
      spec: {
        ...spec,
        name: finalName,
      },
    }
  }

  if (/^npx(\s|$)/i.test(trimmed)) {
    const tokens = splitCommandLine(trimmed)
    // tokens[0] === 'npx'; drop the common yes-flags, keep the rest in order.
    const rest = tokens.slice(1).filter(token => token !== '-y' && token !== '--yes')
    const spec: ParsedServerSpec = { type: 'stdio', command: tokens[0]!, args: rest }
    return { ok: true, spec: { ...spec, name: inferName(spec) } }
  }

  return { ok: false, error: '无法识别的格式：支持 npx 命令、JSON 定义或 URL' }
}
