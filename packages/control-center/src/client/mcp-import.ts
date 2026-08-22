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
