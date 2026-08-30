/**
 * API gateway runtime — Cherry ApiGatewaySettings parity, real this time.
 *
 * A local loopback HTTP service that exposes the Control Center's configured
 * models through OpenAI- and Anthropic-compatible endpoints:
 *
 *   POST /v1/chat/completions   (OpenAI; stream and non-stream)
 *   POST /v1/messages           (Anthropic; stream and non-stream)
 *   GET  /v1/models             (OpenAI model list)
 *
 * Auth: `Authorization: Bearer <apiKey>` against the key persisted in the
 * `control-center-gateway` settings namespace (the same one the settings page
 * edits). Routing: the request `model` field is `provider/model`; when absent
 * or unknown, the host's agent-default-model route answers.
 *
 * The server binds 127.0.0.1 only — this gateway is for local apps, never a
 * network-exposed proxy.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import type { Server } from 'node:http'
import { createServer } from 'node:http'
import type { LlmRuntime } from '@deepseek-ai/dsh-llm'
import { createUserMessage } from '@deepseek-ai/dsh-llm'

const GATEWAY_NAMESPACE = settingsNamespace('control-center-gateway')

export interface GatewayConfig {
  port: number
  apiKey: string
}

export interface GatewayStatus {
  running: boolean
  port: number
  url: string | null
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAiRequest {
  model?: string
  messages?: ChatMessage[]
  stream?: boolean
}

interface AnthropicRequest {
  model?: string
  system?: string
  messages?: Array<{ role: 'user' | 'assistant'; content: unknown }>
  stream?: boolean
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    controlCenterGateway: GatewayService
  }
}

export class GatewayService extends Service {
  static inject = ['settings', 'llm'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterGateway')

  private readonly llm: LlmRuntime | undefined
  private server: Server | undefined
  private boundPort: number | undefined

  constructor(ctx: Context) {
    super(ctx, 'controlCenterGateway')
    try { this.llm = ctx.get('llm') as LlmRuntime } catch { this.llm = undefined }
    ctx.effect(() => () => {
      try { this.server?.close() } catch { /* best effort */ }
    }, 'control-center.gateway: close server')
  }

  private config(): GatewayConfig {
    try {
      const value = this.ctx.settings.get(GATEWAY_NAMESPACE) as Partial<GatewayConfig>
      return {
        // 0 = pick a free port (tests); the UI range-checks 1–65535.
        port: typeof value?.port === 'number' && value.port >= 0 ? value.port : 23333,
        apiKey: typeof value?.apiKey === 'string' ? value.apiKey : '',
      }
    } catch {
      return { port: 23333, apiKey: '' }
    }
  }

  async status(): Promise<GatewayStatus> {
    const config = this.config()
    return {
      running: this.server !== undefined,
      port: this.boundPort ?? config.port,
      url: this.server !== undefined ? `http://127.0.0.1:${String(this.boundPort ?? config.port)}/v1` : null,
    }
  }

  async start(): Promise<{ ok: true; value: GatewayStatus } | { ok: false; error: string }> {
    if (this.server !== undefined) return { ok: true, value: await this.status() }
    const config = this.config()
    if (config.apiKey === '') return { ok: false, error: '请先生成 API 密钥' }
    if (this.llm === undefined) return { ok: false, error: '宿主 LLM 运行时未挂载' }

    const server = createServer((req, res) => { void this.dispatch(req, res) })
    try {
      await new Promise<void>((resolve, reject) => {
        const onError = (err: Error): void => { reject(err) }
        server.once('error', onError)
        server.listen(config.port, '127.0.0.1', () => {
          server.off('error', onError)
          resolve()
        })
      })
    } catch (error) {
      return { ok: false, error: `端口监听失败：${error instanceof Error ? error.message : String(error)}` }
    }

    this.server = server
    // port 0 binds a random port — read the real one back from the OS.
    const address = server.address()
    this.boundPort = typeof address === 'object' && address !== null ? address.port : config.port
    this.ctx.logger.info('gateway started', { port: this.boundPort })
    return { ok: true, value: await this.status() }
  }

  async stop(): Promise<{ ok: true; value: GatewayStatus }> {
    const server = this.server
    this.server = undefined
    this.boundPort = undefined
    if (server !== undefined) {
      await new Promise<void>((resolve) => { server.close(() => { resolve() }) })
    }
    return { ok: true, value: await this.status() }
  }

  // ─── request handling ────────────────────────────────────────────────────

  private async dispatch(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse): Promise<void> {
    try {
      const config = this.config()
      // API documentation page — no auth required (loopback-only). Served at
      // both /docs and /v1/docs: the settings page links status.url + '/docs'
      // and status.url already carries the /v1 suffix.
      if (req.method === 'GET' && (req.url === '/docs' || req.url === '/v1/docs')) {
        this.respondHtml(res, 200, gatewayDocsHtml(config))
        return
      }
      const auth = req.headers.authorization ?? ''
      if (auth !== `Bearer ${config.apiKey}`) {
        this.respondJson(res, 401, { error: { message: 'Invalid API key', type: 'auth_error' } })
        return
      }
      if (req.method === 'GET' && req.url === '/v1/models') {
        await this.handleModels(res)
        return
      }
      if (req.method !== 'POST') {
        this.respondJson(res, 405, { error: { message: 'Method not allowed', type: 'invalid_request_error' } })
        return
      }
      const body = await this.readBody(req)
      if (req.url === '/v1/chat/completions') {
        await this.handleOpenAi(body, res)
        return
      }
      if (req.url === '/v1/messages') {
        await this.handleAnthropic(body, res)
        return
      }
      this.respondJson(res, 404, { error: { message: `Unknown path ${req.url ?? ''}`, type: 'invalid_request_error' } })
    } catch (error) {
      this.respondJson(res, 500, {
        error: { message: error instanceof Error ? error.message : String(error), type: 'gateway_error' },
      })
    }
  }

  /** `model` is `provider/model`; fall back to the host default route. */
  private async resolveRoute(model: string | undefined): Promise<{ provider: string; model: string }> {
    if (model !== undefined && model.includes('/')) {
      const [provider, ...rest] = model.split('/')
      if (provider !== undefined && provider.length > 0 && rest.join('/').length > 0) {
        return { provider, model: rest.join('/') }
      }
    }
    const described = this.ctx.settings.describe() as unknown as Array<{ ns?: unknown; value?: unknown }>
    const found = described.find(entry => String(entry.ns) === 'agent-default-model')
    const value = found?.value as Record<string, unknown> | undefined
    const provider = typeof value?.provider === 'string' ? value.provider : ''
    const fallbackModel = typeof value?.model === 'string' ? value.model : ''
    if (provider.length > 0 && fallbackModel.length > 0) return { provider, model: fallbackModel }
    throw new Error(`无法解析模型路由: ${model ?? '(未指定)'}，且未配置默认模型`)
  }

  private async runTurn(route: { provider: string; model: string }, messages: ChatMessage[], signal: AbortSignal): Promise<string> {
    const prepared = await this.llm!.prepareCall({ provider: route.provider, model: route.model })
    const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n')
    const chat = messages
      .filter(m => m.role !== 'system')
      .map(m => createUserMessage({ source: { kind: 'user' }, content: [{ type: 'text', text: m.content }] }))
    let reply = ''
    for await (const chunk of prepared.stream({
      ...prepared.config,
      ...(system.length > 0 ? { system } : {}),
      messages: chat,
      signal,
    })) {
      if (chunk.type === 'text-delta') reply += chunk.text
      if (chunk.type === 'finish' && chunk.reason.kind === 'error') {
        throw new Error(chunk.reason.failure.message)
      }
    }
    return reply
  }

  private async streamTurn(route: { provider: string; model: string }, messages: ChatMessage[], signal: AbortSignal): Promise<AsyncIterable<string>> {
    const prepared = await this.llm!.prepareCall({ provider: route.provider, model: route.model })
    const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n')
    const chat = messages
      .filter(m => m.role !== 'system')
      .map(m => createUserMessage({ source: { kind: 'user' }, content: [{ type: 'text', text: m.content }] }))
    const stream = prepared.stream({
      ...prepared.config,
      ...(system.length > 0 ? { system } : {}),
      messages: chat,
      signal,
    })
    return (async function* () {
      for await (const chunk of stream) {
        if (chunk.type === 'text-delta') yield chunk.text
        if (chunk.type === 'finish' && chunk.reason.kind === 'error') {
          throw new Error(chunk.reason.failure.message)
        }
      }
    })()
  }

  private async handleOpenAi(body: string, res: import('node:http').ServerResponse): Promise<void> {
    const request = JSON.parse(body) as OpenAiRequest
    const route = await this.resolveRoute(request.model)
    const messages = (request.messages ?? []).map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    }))
    const id = `chatcmpl-${Date.now().toString(36)}`
    if (request.stream === true) {
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      })
      try {
        for await (const delta of await this.streamTurn(route, messages, req_signal(res))) {
          res.write(`data: ${JSON.stringify({
            id, object: 'chat.completion.chunk',
            choices: [{ index: 0, delta: { content: delta }, finish_reason: null }],
          })}\n\n`)
        }
        res.write(`data: ${JSON.stringify({
          id, object: 'chat.completion.chunk',
          choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
        })}\n\ndata: [DONE]\n\n`)
        res.end()
      } catch (error) {
        res.write(`data: ${JSON.stringify({ error: { message: error instanceof Error ? error.message : String(error) } })}\n\n`)
        res.end()
      }
      return
    }
    const reply = await this.runTurn(route, messages, req_signal(res))
    this.respondJson(res, 200, {
      id, object: 'chat.completion',
      choices: [{ index: 0, message: { role: 'assistant', content: reply }, finish_reason: 'stop' }],
    })
  }

  private async handleAnthropic(body: string, res: import('node:http').ServerResponse): Promise<void> {
    const request = JSON.parse(body) as AnthropicRequest
    const route = await this.resolveRoute(request.model)
    const messages: ChatMessage[] = (request.messages ?? []).map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    }))
    if (typeof request.system === 'string') messages.unshift({ role: 'system', content: request.system })
    const id = `msg_${Date.now().toString(36)}`
    if (request.stream === true) {
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      })
      try {
        res.write(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id, type: 'message' } })}\n\n`)
        for await (const delta of await this.streamTurn(route, messages, req_signal(res))) {
          res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: delta } })}\n\n`)
        }
        res.write(`event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`)
        res.end()
      } catch (error) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: { message: error instanceof Error ? error.message : String(error) } })}\n\n`)
        res.end()
      }
      return
    }
    const reply = await this.runTurn(route, messages, req_signal(res))
    this.respondJson(res, 200, {
      id, type: 'message', role: 'assistant',
      content: [{ type: 'text', text: reply }],
      stop_reason: 'end_turn',
    })
  }

  private async handleModels(res: import('node:http').ServerResponse): Promise<void> {
    const described = this.ctx.settings.describe() as unknown as Array<{ ns?: unknown; value?: unknown }>
    const providers = described.filter(entry => String(entry.ns).startsWith('control-center-providers'))
    const models: Array<{ id: string; object: string }> = []
    for (const entry of providers) {
      const value = entry.value as { providers?: Record<string, { models?: unknown[] }> } | undefined
      for (const [provider, profile] of Object.entries(value?.providers ?? {})) {
        for (const model of profile.models ?? []) {
          const id = typeof model === 'string' ? model : String((model as { id?: string })?.id ?? '')
          if (id !== '') models.push({ id: `${provider}/${id}`, object: 'model' })
        }
      }
    }
    this.respondJson(res, 200, { object: 'list', data: models })
  }

  // ─── small helpers ───────────────────────────────────────────────────────

  private readBody(req: import('node:http').IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = ''
      req.on('data', (chunk: Buffer) => {
        body += String(chunk)
        if (body.length > 16 * 1024 * 1024) { reject(new Error('请求体过大')); req.destroy() }
      })
      req.on('end', () => { resolve(body) })
      req.on('error', reject)
    })
  }

  private respondJson(res: import('node:http').ServerResponse, code: number, payload: unknown): void {
    res.writeHead(code, { 'content-type': 'application/json' })
    res.end(JSON.stringify(payload))
  }

  private respondHtml(res: import('node:http').ServerResponse, code: number, html: string): void {
    res.writeHead(code, { 'content-type': 'text/html; charset=utf-8' })
    res.end(html)
  }
}

/** Abort the model call when the client connection closes. */
function req_signal(res: import('node:http').ServerResponse): AbortSignal {
  const controller = new AbortController()
  res.on('close', () => { controller.abort() })
  return controller.signal
}

/** Minimal HTML escape for values interpolated into the /docs page. */
function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** API documentation page served at GET /docs (loopback-only, no auth). */
function gatewayDocsHtml(config: GatewayConfig): string {
  const base = `http://127.0.0.1:${String(config.port)}/v1`
  const key = config.apiKey.length > 0 ? config.apiKey : '（未设置）'
  const shellKey = config.apiKey.length > 0 ? config.apiKey : '<your-api-key>'
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DSH Control Center API Gateway</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 860px; margin: 0 auto; padding: 24px; line-height: 1.6; }
  h1 { border-bottom: 2px solid #00b96b; padding-bottom: 8px; }
  h2 { margin-top: 28px; }
  code, pre { background: rgba(127,127,127,.12); border-radius: 6px; }
  code { padding: 2px 5px; font-size: .92em; }
  pre { padding: 12px; overflow-x: auto; }
  .warn { background: rgba(255,165,0,.14); border-left: 4px solid orange; padding: 10px 12px; border-radius: 6px; }
  table { border-collapse: collapse; width: 100%; margin-top: 8px; }
  th, td { border: 1px solid rgba(127,127,127,.35); padding: 8px 10px; text-align: left; font-size: .95em; }
  th { background: rgba(127,127,127,.1); }
</style>
</head>
<body>
<h1>DSH Control Center — API Gateway</h1>
<p>本地回环 HTTP 服务，把控制中心配置的模型暴露成 OpenAI / Anthropic 兼容端点。仅监听 <code>127.0.0.1</code>，不会暴露到网络。</p>
<div class="warn">⚠️ 安全提示：此服务仅供本机本地应用使用，请勿将 <code>${base}</code> 与 API Key 共享给他人。</div>

<h2>连接信息</h2>
<table>
  <tr><th>Base URL</th><td><code>${base}</code></td></tr>
  <tr><th>鉴权</th><td><code>Authorization: Bearer ${esc(key)}</code></td></tr>
</table>

<h2>模型路由约定</h2>
<p>请求体中的 <code>model</code> 字段格式为 <code>provider/model</code>（例如 <code>deepseek/deepseek-chat</code>）。当 <code>model</code> 缺失或格式不识别时，回退到宿主默认模型路由。</p>

<h2>端点</h2>
<table>
  <tr><th>方法</th><th>路径</th><th>说明</th></tr>
  <tr><td>GET</td><td><code>/v1/models</code></td><td>列出可用模型（provider/model 列表）</td></tr>
  <tr><td>POST</td><td><code>/v1/chat/completions</code></td><td>OpenAI 兼容对话（支持流式 SSE 与非流式）</td></tr>
  <tr><td>POST</td><td><code>/v1/messages</code></td><td>Anthropic 兼容对话（支持流式 SSE 与非流式）</td></tr>
</table>

<h2>示例（curl）</h2>
<pre># 列出模型
curl ${base}/models \\
  -H "Authorization: Bearer ${shellKey}"

# OpenAI 兼容（非流式）
curl ${base}/chat/completions \\
  -H "Authorization: Bearer ${shellKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"deepseek/deepseek-chat","messages":[{"role":"user","content":"你好"}]}'

# OpenAI 兼容（流式）
curl -N ${base}/chat/completions \\
  -H "Authorization: Bearer ${shellKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"deepseek/deepseek-chat","messages":[{"role":"user","content":"你好"}],"stream":true}'

# Anthropic 兼容
curl ${base}/messages \\
  -H "Authorization: Bearer ${shellKey}" \\
  -H "Content-Type: application/json" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{"model":"deepseek/deepseek-chat","max_tokens":512,"messages":[{"role":"user","content":"你好"}]}'</pre>
</body>
</html>`
}
