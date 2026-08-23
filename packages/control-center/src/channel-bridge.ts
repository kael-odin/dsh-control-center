/**
 * Channel bridge — the host-process service that watches `control-center-channels`
 * and drives live connections for active instances.
 *
 * Four platforms run real protocols today:
 * - Telegram long-polling (getUpdates) — pure fetch.
 * - Discord gateway over WebSocket (heartbeat / identify / MESSAGE_CREATE,
 *   REST sends against api/v10).
 * - Slack Socket Mode (apps.connections.open → WebSocket envelopes with
 *   mandatory 3s acks, chat.postMessage sends).
 * - QQ official bot platform (getAppAccessToken → /gateway WebSocket with
 *   sharded identify, passive replies bound to the inbound msg_id).
 *
 * Feishu (Lark SDK long-connection protocol) and WeChat (reverse-engineered
 * iLink protocol) stay honest errors until their protocol ports land.
 *
 * Every platform shares one reply pipeline: allowlist → default model route
 * (Cherry 重试设置 honored: attempts + fallback routes) → LlmRuntime stream →
 * platform sender. A connected channel proves the credentials work; per-channel
 * status and a log ring feed the UI's 状态点 and 日志 dialog.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { installSettingsSection } from '@deepseek-ai/dsh-settings'
import { bindTypertRemote, Remote } from '@deepseek-ai/dsh-typert-protocol'
import { createUserMessage, type LlmRuntime } from '@deepseek-ai/dsh-llm'
import { readHostRetryPolicy } from './retry-config.ts'

export const CHANNELS_BRIDGE_NAMESPACE = settingsNamespace('control-center-channels')

/** Wire shape of one channel instance as stored by the 频道 page. */
interface ChannelRecord {
  id: string
  type: string
  name: string
  isActive?: boolean
  config?: Record<string, unknown>
}

interface ChannelsSection {
  instances?: unknown[] | null
}

const ChannelsSchema: z<ChannelsSection> = z.object({
  instances: z.array(z.any()).default([]),
})

/** Per-instance runtime status exposed over the wire. */
export interface ChannelBridgeStatus {
  channelId: string
  name: string
  type: string
  /** running only appears while an instance is active in settings. */
  state: 'disconnected' | 'starting' | 'connected' | 'error'
  detail?: string | undefined
  updatedAt: number
}

interface Runtime {
  controller: AbortController
  log: string[]
  /** Clears platform timers (heartbeats); idempotent, called on every exit path. */
  cleanup?: () => void
}

const LOG_LIMIT = 200
const POLL_TIMEOUT_S = 25
const RETRY_MS = 5_000

// ─── Platform protocol constants ─────────────────────────────────────────────

/** Discord Gateway opcodes (subset we act on). */
const OP_DISPATCH = 0
const OP_HEARTBEAT = 1
const OP_IDENTIFY = 2
const OP_HELLO = 10

const DISCORD_API_BASE = 'https://discord.com/api/v10'
const DISCORD_MAX_LENGTH = 2_000
/** GUILDS | GUILD_MESSAGES | DIRECT_MESSAGES | MESSAGE_CONTENT — the bot needs
 * the message-content intent toggled in the developer portal to read text. */
const DISCORD_INTENTS = (1 << 0) | (1 << 9) | (1 << 12) | (1 << 15)

const SLACK_API_BASE = 'https://slack.com/api'

/** QQ official-bot intents: PUBLIC_GUILD_MESSAGES | GROUP_AND_C2C | DIRECT_MESSAGE. */
const QQ_INTENTS = (1 << 30) | (1 << 25) | (1 << 12)
const QQ_API_BASE = 'https://api.sgroup.qq.com'
const QQ_MAX_LENGTH = 2_000
/** Passive replies must reference the inbound msg_id within its window; each
 * msg_id accepts at most five replies before further sends are rejected. */
const QQ_PASSIVE_REPLY_TTL_MS = 300_000
const QQ_MAX_PASSIVE_REPLIES = 5

interface GatewayPayload {
  op: number
  d?: unknown
  s?: number
  t?: string
}

/** One inbound QQ message remembered so replies can ride its passive window. */
interface QqPassiveRecord {
  receivedAt: number
  seq: number
}

// ─── Feishu: Lark long-connection WebSocket (protobuf frames) ────────────────

const FEISHU_API_BASE = 'https://open.feishu.cn'
/** One inbound event's text cap before the reply pipeline sees it. */
const FEISHU_MAX_LENGTH = 3_000

/**
 * pbbp2 wire frames (the Lark long-connection protocol) are protobuf messages
 * with a tiny fixed schema:
 *
 *   message Header { string key = 1; string value = 2 }
 *   message Frame {
 *     uint64 SeqID = 1;  uint64 LogID = 2;  int32 service = 3;  int32 method = 4;
 *     repeated Header headers = 5;  string payloadEncoding = 6;
 *     string payloadType = 7;  bytes payload = 8;  string LogIDNew = 9;
 *   }
 *
 * method: 0 = control (ping/pong), 1 = data (events). Encoded frames are
 * sent as raw binary WebSocket messages.
 */
interface LarkFrame {
  SeqID?: number
  LogID?: number
  service?: number
  method?: number
  headers?: Array<{ key: string; value: string }>
  payload?: Uint8Array
}

export type { LarkFrame }

/** Minimal protobuf writer for the Frame/Header schema. */
export function encodeLarkFrame(frame: LarkFrame): Uint8Array<ArrayBuffer> {
  const chunks: number[][] = []
  const pushVarint = (value: number): void => {
    let v = value >>> 0
    while (v >= 0x80) {
      chunks.push([(v & 0x7f) | 0x80])
      v >>>= 7
    }
    chunks.push([v])
  }
  const pushTag = (field: number, wireType: number): void => pushVarint((field << 3) | wireType)
  const pushBytes = (tag: number, data: Uint8Array): void => {
    pushTag(tag, 2)
    pushVarint(data.length)
    chunks.push([...data])
  }
  if (frame.SeqID !== undefined) { pushTag(1, 0); pushVarint(frame.SeqID) }
  if (frame.LogID !== undefined) { pushTag(2, 0); pushVarint(frame.LogID) }
  if (frame.service !== undefined) { pushTag(3, 0); pushVarint(frame.service >>> 0) }
  if (frame.method !== undefined) { pushTag(4, 0); pushVarint(frame.method >>> 0) }
  if (frame.headers !== undefined) {
    for (const header of frame.headers) {
      const inner: number[][] = []
      const tagString = (field: number, value: string): void => {
        const bytes = new TextEncoder().encode(value)
        inner.push([(field << 3) | 2])
        let v = bytes.length
        while (v >= 0x80) { inner.push([(v & 0x7f) | 0x80]); v >>>= 7 }
        inner.push([v])
        inner.push([...bytes])
      }
      tagString(1, header.key)
      tagString(2, header.value)
      const headerBytes = new Uint8Array(inner.flat())
      pushBytes(5, headerBytes)
    }
  }
  if (frame.payload !== undefined) pushBytes(8, frame.payload)
  const flat = chunks.flat()
  const result = new Uint8Array(flat.length)
  result.set(flat)
  return result
}

/** Minimal protobuf reader for the Frame/Header schema. */
export function decodeLarkFrame(buffer: Uint8Array): LarkFrame {
  const frame: LarkFrame = {}
  const headers: Array<{ key: string; value: string }> = []
  let pos = 0
  const readVarint = (): number => {
    let result = 0
    let shift = 0
    while (pos < buffer.length) {
      const byte = buffer[pos++]!
      result |= (byte & 0x7f) << shift
      if ((byte & 0x80) === 0) break
      shift += 7
      if (shift > 35) break
    }
    return result >>> 0
  }
  while (pos < buffer.length) {
    const tag = readVarint()
    const field = tag >>> 3
    const wireType = tag & 7
    if (wireType === 0) {
      const value = readVarint()
      if (field === 1) frame.SeqID = value
      else if (field === 2) frame.LogID = value
      else if (field === 3) frame.service = value
      else if (field === 4) frame.method = value
    } else if (wireType === 2) {
      const length = readVarint()
      const end = Math.min(pos + length, buffer.length)
      const slice = buffer.slice(pos, end)
      pos = end
      if (field === 5) {
        // Nested Header message: key=1, value=2.
        let innerPos = 0
        let key = ''
        let value = ''
        while (innerPos < slice.length) {
          const innerTag = (() => {
            let result = 0
            let shift = 0
            while (innerPos < slice.length) {
              const byte = slice[innerPos++]!
              result |= (byte & 0x7f) << shift
              if ((byte & 0x80) === 0) break
              shift += 7
            }
            return result >>> 0
          })()
          const innerField = innerTag >>> 3
          if ((innerTag & 7) === 0) {
            let result = 0
            let shift = 0
            while (innerPos < slice.length) {
              const byte = slice[innerPos++]!
              result |= (byte & 0x7f) << shift
              if ((byte & 0x80) === 0) break
              shift += 7
            }
            if (innerField === 1) key = String(result)
            else if (innerField === 2) value = String(result)
          } else if ((innerTag & 7) === 2) {
            const len = (() => {
              let result = 0
              let shift = 0
              while (innerPos < slice.length) {
                const byte = slice[innerPos++]!
                result |= (byte & 0x7f) << shift
                if ((byte & 0x80) === 0) break
                shift += 7
              }
              return result
            })()
            const text = new TextDecoder().decode(slice.slice(innerPos, innerPos + len))
            innerPos += len
            if (innerField === 1) key = text
            else if (innerField === 2) value = text
          }
        }
        headers.push({ key, value })
      } else if (field === 8) {
        frame.payload = slice
      }
    } else {
      break
    }
  }
  if (headers.length > 0) frame.headers = headers
  return frame
}

/** Resolve after `ms`, settling early when the signal aborts. */
function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0 || signal?.aborted === true) return Promise.resolve()
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = (): void => {
      clearTimeout(timer)
      resolve()
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
/** Idle between polls when the server answers instantly with no updates —
 * without it a fast endpoint spins the loop as pure microtasks and starves
 * every timer on the process. */
const POLL_IDLE_MS = 1_000

function markChannelBridgeRemoteMethods(service: ChannelBridgeService): void {
  const initializers: Array<(this: ChannelBridgeService) => void> = []
  for (const [method, exportName] of [
    ['status', 'status'],
    ['getLog', 'getLog'],
  ] as const) {
    const implementation = Reflect.get(ChannelBridgeService.prototype, method) as (this: ChannelBridgeService, ...args: never[]) => unknown
    const decorator = Remote(exportName)
    decorator(implementation, {
      kind: 'method', name: method, static: false, private: false,
      access: { has: value => method in value, get: value => Reflect.get(value, method) as never },
      addInitializer: initializer => { initializers.push(initializer) },
      metadata: undefined,
    })
  }
  for (const initialize of initializers) initialize.call(service)
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    controlCenterChannelBridge: ChannelBridgeService
  }
}

/**
 * Drives one long-lived connection per active channel instance.
 */
export class ChannelBridgeService extends Service {
  static inject = ['settings', 'llm'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterChannelBridge')

  private readonly llm: LlmRuntime | undefined

  private readonly statuses = new Map<string, ChannelBridgeStatus & { name: string; type: string }>()
  private readonly runtimes = new Map<string, Runtime>()
  private readonly names = new Map<string, string>()
  private source: (() => ChannelsSection) | undefined

  constructor(ctx: Context) {
    super(ctx, 'controlCenterChannelBridge')
    try { this.llm = ctx.get('llm') as LlmRuntime } catch { this.llm = undefined }
    markChannelBridgeRemoteMethods(this)
    ctx.effect(() => () => {
      for (const runtime of this.runtimes.values()) {
        runtime.controller.abort()
        runtime.cleanup?.()
      }
      this.runtimes.clear()
    }, 'control-center.channel-bridge: abort loops')
    installSettingsSection(ctx, CHANNELS_BRIDGE_NAMESPACE, ChannelsSchema, { instances: [] }, {
      setSource: (current) => { this.source = current },
      onChange: () => { try { this.reconcile() } catch (error) { this.ctx.logger.warn(error) } },
    })
  }

  /** The instances array from the current settings source. */
  private readInstances(): ChannelRecord[] {
    if (this.source === undefined) return []
    const value = this.source().instances
    if (!Array.isArray(value)) return []
    return value.filter((entry): entry is ChannelRecord =>
      typeof entry === 'object' && entry !== null
      && typeof (entry as ChannelRecord).id === 'string'
      && typeof (entry as ChannelRecord).type === 'string')
  }

  private reconcile(): void {
    const records = this.readInstances()
    const wanted = new Set<string>()
    for (const record of records) {
      this.names.set(record.id, record.name)
      if (record.isActive !== true) continue
      wanted.add(record.id)
      if (this.runtimes.has(record.id)) continue
      switch (record.type) {
        case 'telegram':
          this.startTelegram(record)
          break
        case 'discord':
          this.startDiscord(record)
          break
        case 'slack':
          this.startSlack(record)
          break
        case 'qq':
          this.startQq(record)
          break
        case 'feishu':
          this.startFeishu(record)
          break
        default: {
          // WeChat needs the reverse-engineered iLink protocol port — stay
          // honest instead of pretending.
          const existing = this.statuses.get(record.id)
          if (existing === undefined || existing.state !== 'error') {
            this.setStatus(record.id, 'error', `平台「${record.type}」的实时桥接尚未实现（已支持 Telegram / Discord / Slack / QQ）`)
          }
        }
      }
    }
    // Stop loops whose instance disappeared or was disabled.
    for (const [id, runtime] of [...this.runtimes]) {
      if (!wanted.has(id)) {
        runtime.controller.abort()
        runtime.cleanup?.()
        this.runtimes.delete(id)
        this.setStatus(id, 'disconnected')
      }
    }
  }

  private setStatus(id: string, state: ChannelBridgeStatus['state'], detail?: string): void {
    const known = this.statuses.get(id)
    this.statuses.set(id, {
      channelId: id,
      name: this.names.get(id) ?? known?.name ?? id,
      type: known?.type ?? '',
      state,
      ...(detail === undefined ? {} : { detail }),
      updatedAt: Date.now(),
    })
  }

  private appendLog(id: string, line: string): void {
    const runtime = this.runtimes.get(id)
    if (runtime === undefined) return
    const stamp = new Date().toISOString()
    runtime.log.push(`[${stamp}] ${line}`)
    if (runtime.log.length > LOG_LIMIT) runtime.log.splice(0, runtime.log.length - LOG_LIMIT)
  }

  /**
   * Telegram long-polling loop: getUpdates with a 25s server hold, restart
   * with backoff on failure, stop only through the AbortController.
   */
  private startTelegram(record: ChannelRecord): void {
    const token = typeof record.config?.bot_token === 'string' ? record.config.bot_token : ''
    if (token.length === 0) {
      this.names.set(record.id, record.name)
      this.setStatus(record.id, 'error', '缺少 Bot Token')
      return
    }
    const controller = new AbortController()
    const runtime: Runtime = { controller, log: [] }
    this.runtimes.set(record.id, runtime)
    this.setStatus(record.id, 'starting')
    void this.pollTelegram(record.id, record.name, token, record.config ?? {}, controller.signal)
  }

  private async pollTelegram(id: string, name: string, token: string, config: Record<string, unknown>, signal: AbortSignal): Promise<void> {
    let offset = 0
    const sleep = (ms: number): Promise<void> => new Promise(resolve => {
      const timer = setTimeout(resolve, ms)
      signal.addEventListener('abort', () => { clearTimeout(timer); resolve() }, { once: true })
    })
    this.appendLog(id, `频道「${name}」开始长轮询（Telegram getUpdates）`)
    while (!signal.aborted) {
      try {
        this.setStatus(id, this.statuses.get(id)?.state === 'connected' ? 'connected' : 'starting')
        const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?timeout=${POLL_TIMEOUT_S}&offset=${offset}`, {
          headers: { accept: 'application/json' },
          signal,
        })
        const body = await response.json() as { ok?: boolean; description?: string; result?: Array<{ update_id?: number; message?: { text?: unknown; chat?: { id?: unknown } } }> }
        if (body.ok !== true) {
          this.setStatus(id, 'error', body.description ?? `HTTP ${String(response.status)}`)
          this.appendLog(id, `错误：${body.description ?? String(response.status)}`)
          await sleep(RETRY_MS)
          continue
        }
        this.setStatus(id, 'connected', undefined)
        const updates = body.result ?? []
        for (const update of updates) {
          if (typeof update.update_id === 'number') offset = update.update_id + 1
          const chatId = typeof update.message?.chat?.id === 'number' ? update.message.chat.id : null
          const text = typeof update.message?.text === 'string' ? update.message.text : ''
          this.appendLog(id, text.length > 0 ? `收到消息：${text.slice(0, 80)}` : '收到更新')
          if (text.length > 0 && chatId !== null) {
            if (!this.isAllowed(config, [String(chatId)])) {
              this.appendLog(id, `忽略非允许会话 ${String(chatId)} 的消息`)
            } else {
              await this.generateAndDeliver(id, text, async reply => {
                await this.sendTelegramMessage(token, chatId, reply)
              })
            }
          }
        }
        // Always idle one macrotask per cycle: an endpoint that answers
        // instantly must not turn this loop into a pure-microtask spin that
        // starves every timer on the process.
        await sleep(POLL_IDLE_MS)
      } catch (error) {
        if (signal.aborted) break
        const message = error instanceof Error ? error.message : String(error)
        this.setStatus(id, 'error', message)
        this.appendLog(id, `轮询失败：${message}`)
        await sleep(RETRY_MS)
      }
    }
    this.appendLog(id, '轮询已停止')
    this.setStatus(id, 'disconnected')
  }

  /**
   * Cherry-style allowlist: an empty list allows everyone. Accepts either
   * config key style (allowed_chat_ids / allowed_channel_ids) and checks every
   * candidate id the platform offers for one inbound message.
   */
  private isAllowed(config: Record<string, unknown>, candidates: string[]): boolean {
    const allowed = [
      ...(Array.isArray(config.allowed_chat_ids) ? config.allowed_chat_ids : []),
      ...(Array.isArray(config.allowed_channel_ids) ? config.allowed_channel_ids : []),
    ].map(entry => String(entry))
    if (allowed.length === 0) return true
    return candidates.some(candidate => allowed.includes(candidate))
  }

  /**
   * Shared reply pipeline behind every platform: resolve the host's default
   * model, honor the Cherry 重试设置 (attempts + fallback routes), stream a
   * reply through the LlmRuntime, then hand it to the platform's sender. Any
   * failure is a log line — the connection loop must survive a bad model or a
   * refused send.
   */
  private async generateAndDeliver(
    id: string,
    text: string,
    deliver: (reply: string) => Promise<void>,
  ): Promise<void> {
    const route = this.defaultModelRoute()
    if (route === null || this.llm === undefined) {
      this.appendLog(id, '未解析默认模型（agent-default-model），跳过回复')
      return
    }

    try {
      // Cherry 重试设置 honored here too: retries after the first request,
      // then fallback routes — so a flaky provider does not drop messages.
      const policy = readHostRetryPolicy(this.ctx.settings)
      const routes = [
        route,
        ...policy.fallbacks.filter(candidate => candidate.provider !== route.provider || candidate.model !== route.model),
      ]
      const totalAttempts = policy.enabled ? policy.maxAttempts + 1 : 1
      let reply: string | null = null
      let failureText = '回复失败'
      search: for (const candidate of routes) {
        for (let attempt = 0; attempt < totalAttempts; attempt++) {
          if (this.signalFor(id).aborted) return
          if (attempt > 0) {
            const delayMs = policy.backoff ? Math.min(500 * 2 ** (attempt - 1), 10_000) : 0
            await abortableSleep(delayMs)
          }
          try {
            this.appendLog(
              id,
              attempt === 0
                ? `生成回复（${candidate.provider}/${candidate.model}）…`
                : `重试（第 ${String(attempt + 1)} 次尝试，${candidate.provider}/${candidate.model}）…`,
            )
            reply = await this.generateReply(id, text, candidate)
            break search
          } catch (error) {
            reply = null
            failureText = error instanceof Error ? error.message : String(error)
          }
        }
      }
      if (reply === null) {
        this.appendLog(id, `回复失败：${failureText}`)
        return
      }
      await deliver(reply)
      this.appendLog(id, `已回复：${reply.slice(0, 80)}`)
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error)
      this.appendLog(id, `回复失败：${messageText}`)
    }
  }

  /** One generation attempt over one route; throws on terminal error finish. */
  private async generateReply(id: string, text: string, route: { provider: string; model: string }): Promise<string> {
    const prepared = await this.llm!.prepareCall({ provider: route.provider, model: route.model })
    const message = createUserMessage({ source: { kind: 'user' }, content: [{ type: 'text', text }] })
    let reply = ''
    for await (const chunk of prepared.stream({
      ...prepared.config,
      messages: [message],
      system: 'You are a helpful assistant replying inside a messaging channel. Be concise.',
      signal: this.signalFor(id),
    })) {
      if (chunk.type === 'text-delta') reply += chunk.text
      if (chunk.type === 'finish' && chunk.reason.kind === 'error') {
        throw new Error(chunk.reason.failure.message)
      }
    }
    return reply.trim().length > 0 ? reply.trim() : '(空回复)'
  }

  /** Abort signal of the channel's active loop, so replies die with it. */
  private signalFor(id: string): AbortSignal {
    return this.runtimes.get(id)?.controller.signal ?? new AbortController().signal
  }

  /**
   * The host default-model route from agent-default-model; null when unset
   * or when the settings service is unavailable.
   */
  private defaultModelRoute(): { provider: string; model: string } | null {
    try {
      const described = this.ctx.settings.describe() as unknown as Array<{ ns?: unknown; value?: unknown }>
      const found = described.find(entry => String(entry.ns) === 'agent-default-model')
      const value = found?.value
      if (typeof value !== 'object' || value === null) return null
      const record = value as Record<string, unknown>
      const provider = typeof record.provider === 'string' ? record.provider : ''
      const model = typeof record.model === 'string' ? record.model : ''
      if (provider.length === 0 || model.length === 0) return null
      return { provider, model }
    } catch {
      return null
    }
  }

  private async sendTelegramMessage(token: string, chatId: number, text: string): Promise<void> {
    // Telegram caps one message at 4096 chars; split on the boundary.
    for (let start = 0; start <= text.length; start += 4000) {
      const chunk = text.slice(start, start + 4000)
      if (chunk.length === 0 && start > 0) break
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: chunk }),
      })
      const body = await response.json() as { ok?: boolean; description?: string }
      if (body.ok !== true) throw new Error(body.description ?? `sendMessage 失败（HTTP ${String(response.status)}）`)
    }
  }

  // ─── Discord: gateway WebSocket + REST sends ────────────────────────────────

  private startDiscord(record: ChannelRecord): void {
    const token = typeof record.config?.bot_token === 'string' ? record.config.bot_token : ''
    if (token.length === 0) {
      this.names.set(record.id, record.name)
      this.setStatus(record.id, 'error', '缺少 Bot Token')
      return
    }
    const controller = new AbortController()
    this.runtimes.set(record.id, { controller, log: [] })
    this.setStatus(record.id, 'starting')
    void this.runDiscordGateway(record.id, record.name, token, record.config ?? {}, controller.signal)
  }

  /**
   * Discord gateway loop: resolve a gateway URL, open the socket, heartbeat +
   * identify, dispatch MESSAGE_CREATE through the shared reply pipeline. The
   * socket is re-established with backoff after any close — resume sessions
   * are deliberately skipped; a fresh identify re-syncs from live events.
   */
  private async runDiscordGateway(id: string, name: string, token: string, config: Record<string, unknown>, signal: AbortSignal): Promise<void> {
    this.appendLog(id, `频道「${name}」连接 Discord Gateway`)
    while (!signal.aborted) {
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null
      let lastSeq: number | null = null
      try {
        const response = await fetch(`${DISCORD_API_BASE}/gateway/bot`, {
          headers: { Authorization: `Bot ${token}`, accept: 'application/json' },
          signal,
        })
        if (!response.ok) {
          // Drain the body: undici keeps an unconsumed response attached to the
          // connection pool, and the next request would hang waiting for a slot.
          await response.body?.cancel().catch(() => undefined)
          throw new Error(`获取 Gateway 地址失败（HTTP ${String(response.status)}）`)
        }
        const body = await response.json() as { url?: string }
        if (typeof body.url !== 'string') throw new Error('Gateway 响应缺少 url')
        this.appendLog(id, '网关地址已解析，建立 WebSocket…')
        await this.runGatewaySocket(id, body.url, {
          signal,
          onHello: (ws) => {
            // Jittered first beat then steady interval, per Discord docs.
            heartbeatTimer = setInterval(() => {
              try { ws.send(JSON.stringify({ op: OP_HEARTBEAT, d: lastSeq })) } catch { /* closing */ }
            }, 25_000)
            ws.send(JSON.stringify({
              op: OP_IDENTIFY,
              d: {
                token,
                intents: DISCORD_INTENTS,
                properties: { os: process.platform, browser: 'dsh-control-center', device: 'dsh-control-center' },
              },
            }))
          },
          onPayload: payload => {
            if (typeof payload.s === 'number') lastSeq = payload.s
            if (payload.op === OP_DISPATCH && payload.t === 'MESSAGE_CREATE') {
              this.handleDiscordMessageCreate(id, token, config, payload.d)
            }
            return payload.op === 7 || payload.op === 9 ? 'reconnect' : 'continue'
          },
          onClose: () => {
            if (heartbeatTimer !== null) clearInterval(heartbeatTimer)
            heartbeatTimer = null
          },
        })
      } catch (error) {
        if (signal.aborted) break
        const messageText = error instanceof Error ? error.message : String(error)
        this.setStatus(id, 'error', messageText)
        this.appendLog(id, `连接失败：${messageText}`)
        await abortableSleep(RETRY_MS, signal)
        continue
      }
      if (signal.aborted) break
      this.setStatus(id, 'disconnected')
      await abortableSleep(RETRY_MS, signal)
    }
    this.appendLog(id, 'Discord 连接循环已停止')
  }

  /** Dispatch one Discord MESSAGE_CREATE through allowlist → reply pipeline. */
  private handleDiscordMessageCreate(id: string, token: string, config: Record<string, unknown>, dataRaw: unknown): void {
    const message = dataRaw as { author?: { bot?: boolean }; channel_id?: string; content?: string }
    if (message.author?.bot === true || message.channel_id === undefined) return
    if (!this.isAllowed(config, [message.channel_id])) {
      this.appendLog(id, `忽略非允许频道 ${message.channel_id} 的消息`)
      return
    }
    const text = (message.content ?? '').replace(/<@!?\d+>/g, '').trim()
    if (text.length === 0) return
    const channelId = message.channel_id
    this.appendLog(id, `收到消息：${text.slice(0, 80)}`)
    void this.generateAndDeliver(id, text, async reply => {
      await this.sendDiscordMessage(token, channelId, reply)
    })
  }

  private async sendDiscordMessage(token: string, channelId: string, text: string): Promise<void> {
    for (let start = 0; start <= text.length; start += DISCORD_MAX_LENGTH - 100) {
      const chunk = text.slice(start, start + DISCORD_MAX_LENGTH - 100)
      if (chunk.length === 0 && start > 0) break
      const response = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${token}`,
          'content-type': 'application/json',
          'User-Agent': 'DiscordBot (https://github.com/kael-odin/dsh-control-center)',
        },
        body: JSON.stringify({ content: chunk }),
      })
      if (!response.ok) {
        await response.body?.cancel().catch(() => undefined)
        throw new Error(`发送失败（HTTP ${String(response.status)}）`)
      }
    }
  }

  // ─── Slack: Socket Mode + chat.postMessage ─────────────────────────────────

  private startSlack(record: ChannelRecord): void {
    const botToken = typeof record.config?.bot_token === 'string' ? record.config.bot_token : ''
    const appToken = typeof record.config?.app_token === 'string' ? record.config.app_token : ''
    if (botToken.length === 0 || appToken.length === 0) {
      this.names.set(record.id, record.name)
      this.setStatus(record.id, 'error', '缺少 Bot Token（xoxb-）或 App-Level Token（xapp-）')
      return
    }
    const controller = new AbortController()
    this.runtimes.set(record.id, { controller, log: [] })
    this.setStatus(record.id, 'starting')
    void this.runSlackSocketMode(record.id, record.name, botToken, appToken, record.config ?? {}, controller.signal)
  }

  /**
   * Slack Socket Mode loop: apps.connections.open mints a fresh wss URL each
   * attempt; envelopes must be acked within 3s or Slack resends them. Message
   * events flow through the same allowlist → reply pipeline as every platform.
   */
  private async runSlackSocketMode(
    id: string,
    name: string,
    botToken: string,
    appToken: string,
    config: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<void> {
    this.appendLog(id, `频道「${name}」连接 Slack Socket Mode`)
    while (!signal.aborted) {
      try {
        const response = await fetch(`${SLACK_API_BASE}/apps.connections.open`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${appToken}` },
          signal,
        })
        if (!response.ok) {
          await response.body?.cancel().catch(() => undefined)
          throw new Error(`Socket Mode 连接失败（HTTP ${String(response.status)}）`)
        }
        const body = await response.json() as { ok?: boolean; url?: string; error?: string }
        if (body.ok !== true || typeof body.url !== 'string') {
          throw new Error(body.error ?? 'apps.connections.open 未返回 url')
        }
        this.appendLog(id, 'Socket Mode URL 已解析，建立 WebSocket…')
        await this.runGatewaySocket(id, body.url, {
          signal,
          onHello: () => {
            this.setStatus(id, 'connected')
            this.appendLog(id, 'Slack Socket Mode 已连接（hello）')
          },
          onPayload: payload => {
            const envelope = payload as unknown as { type?: string; envelope_id?: string }
            switch (envelope.type) {
              case 'hello':
                this.setStatus(id, 'connected')
                break
              case 'disconnect':
                return 'reconnect'
              case 'events_api': {
                if (envelope.envelope_id !== undefined && this.wsFor(id) !== undefined) {
                  try { this.wsFor(id)!.send(JSON.stringify({ envelope_id: envelope.envelope_id })) } catch { /* closing */ }
                }
                const event = (payload as unknown as { payload?: { event?: unknown } }).payload?.event
                if (event !== undefined) this.handleSlackEvent(id, botToken, config, event)
                break
              }
              default:
                // Slash-command and interactivity envelopes are acked above only
                // when they carry an envelope_id; other types need no action.
                break
            }
            return 'continue'
          },
        })
      } catch (error) {
        if (signal.aborted) break
        const messageText = error instanceof Error ? error.message : String(error)
        this.setStatus(id, 'error', messageText)
        this.appendLog(id, `连接失败：${messageText}`)
        await abortableSleep(RETRY_MS, signal)
        continue
      }
      if (signal.aborted) break
      this.setStatus(id, 'disconnected')
      await abortableSleep(RETRY_MS, signal)
    }
    this.appendLog(id, 'Slack 连接循环已停止')
  }

  /** Dispatch one Slack message event through allowlist → reply pipeline. */
  private handleSlackEvent(id: string, botToken: string, config: Record<string, unknown>, eventRaw: unknown): void {
    const event = eventRaw as {
      type?: string
      subtype?: string
      user?: string
      channel?: string
      text?: string
    }
    if (event.type !== 'message' || event.channel === undefined) return
    // Subtypes cover edits/deletes/bot_message; file_share still carries text.
    if (event.subtype !== undefined && event.subtype !== 'file_share') return
    // Ignore anything authored by a bot (ours included).
    if (event.user === undefined || event.user.length === 0) return
    if (!this.isAllowed(config, [event.channel])) {
      this.appendLog(id, `忽略非允许频道 ${event.channel} 的消息`)
      return
    }
    const text = (event.text ?? '').replace(/<@[A-Z0-9]+>/g, '').trim()
    if (text.length === 0) return
    const channel = event.channel
    this.appendLog(id, `收到消息：${text.slice(0, 80)}`)
    void this.generateAndDeliver(id, text, async reply => {
      await this.sendSlackMessage(botToken, channel, reply)
    })
  }

  private async sendSlackMessage(botToken: string, channel: string, text: string): Promise<void> {
    const response = await fetch(`${SLACK_API_BASE}/chat.postMessage`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${botToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ channel, text }),
    })
    const body = await response.json() as { ok?: boolean; error?: string }
    if (body.ok !== true) throw new Error(body.error ?? `chat.postMessage 失败（HTTP ${String(response.status)}）`)
  }

  // ─── QQ: access token + gateway WebSocket + passive replies ────────────────

  private qqTokenCache: { accessToken: string; expiresAt: number } | null = null

  private async qqAccessToken(appId: string, clientSecret: string): Promise<string> {
    if (this.qqTokenCache !== null && Date.now() < this.qqTokenCache.expiresAt - 60_000) {
      return this.qqTokenCache.accessToken
    }
    const response = await fetch('https://bots.qq.com/app/getAppAccessToken', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ appId, clientSecret }),
    })
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined)
      throw new Error(`获取 access token 失败（HTTP ${String(response.status)}）`)
    }
    const data = await response.json() as { access_token?: string; expires_in?: number }
    if (typeof data.access_token !== 'string' || data.access_token.length === 0) {
      throw new Error(`access token 响应无效：${JSON.stringify(data)}`)
    }
    this.qqTokenCache = { accessToken: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 7200) * 1000 }
    return this.qqTokenCache.accessToken
  }

  private startQq(record: ChannelRecord): void {
    const appId = typeof record.config?.app_id === 'string' ? record.config.app_id : ''
    const clientSecret = typeof record.config?.client_secret === 'string' ? record.config.client_secret : ''
    if (appId.length === 0 || clientSecret.length === 0) {
      this.names.set(record.id, record.name)
      this.setStatus(record.id, 'error', '缺少 AppID 或 ClientSecret')
      return
    }
    const controller = new AbortController()
    this.runtimes.set(record.id, { controller, log: [] })
    this.setStatus(record.id, 'starting')
    void this.runQqGateway(record.id, record.name, appId, clientSecret, record.config ?? {}, controller.signal)
  }

  /**
   * QQ official-bot gateway loop. Passive replies reference the inbound
   * msg_id inside its TTL window (max five per msg_id); once lapsed the send
   * degrades to an active push, which group chats deliver only when the
   * owner enabled 主动发言.
   */
  private async runQqGateway(
    id: string,
    name: string,
    appId: string,
    clientSecret: string,
    config: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<void> {
    this.appendLog(id, `频道「${name}」连接 QQ 开放平台网关`)
    while (!signal.aborted) {
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null
      let lastSeq: number | null = null
      try {
        const accessToken = await this.qqAccessToken(appId, clientSecret)
        const gatewayResponse = await fetch(`${QQ_API_BASE}/gateway`, {
          headers: { Authorization: `QQBot ${accessToken}`, 'X-Union-Appid': appId },
          signal,
        })
        if (!gatewayResponse.ok) {
          await gatewayResponse.body?.cancel().catch(() => undefined)
          throw new Error(`获取 Gateway 失败（HTTP ${String(gatewayResponse.status)}）`)
        }
        const gatewayBody = await gatewayResponse.json() as { url?: string }
        if (typeof gatewayBody.url !== 'string') throw new Error('Gateway 响应缺少 url')
        this.appendLog(id, '网关地址已解析，建立 WebSocket…')
        const passiveReplies = new Map<string, QqPassiveRecord>()
        await this.runGatewaySocket(id, gatewayBody.url, {
          signal,
          onHello: ws => {
            heartbeatTimer = setInterval(() => {
              try { ws.send(JSON.stringify({ op: OP_HEARTBEAT, d: lastSeq })) } catch { /* closing */ }
            }, 25_000)
            void this.qqAccessToken(appId, clientSecret).then(accessToken => {
              ws.send(JSON.stringify({
                op: OP_IDENTIFY,
                d: { token: `QQBot ${accessToken}`, intents: QQ_INTENTS, shard: [0, 1] },
              }))
            }).catch(error => {
              this.appendLog(id, `identify 失败：${error instanceof Error ? error.message : String(error)}`)
            })
          },
          onPayload: payload => {
            if (typeof payload.s === 'number') lastSeq = payload.s
            if (payload.op === OP_DISPATCH) {
              this.handleQqDispatch(id, appId, clientSecret, config, passiveReplies, payload.t, payload.d)
            }
            return payload.op === 7 || payload.op === 9 ? 'reconnect' : 'continue'
          },
          onClose: () => {
            if (heartbeatTimer !== null) clearInterval(heartbeatTimer)
            heartbeatTimer = null
          },
        })
      } catch (error) {
        if (signal.aborted) break
        const messageText = error instanceof Error ? error.message : String(error)
        this.setStatus(id, 'error', messageText)
        this.appendLog(id, `连接失败：${messageText}`)
        await abortableSleep(RETRY_MS, signal)
        continue
      }
      if (signal.aborted) break
      this.setStatus(id, 'disconnected')
      await abortableSleep(RETRY_MS, signal)
    }
    this.appendLog(id, 'QQ 连接循环已停止')
  }

  /** Route one QQ dispatch event to its chat-type handler. */
  private handleQqDispatch(
    id: string,
    appId: string,
    clientSecret: string,
    config: Record<string, unknown>,
    passiveReplies: Map<string, QqPassiveRecord>,
    eventType: string | undefined,
    dataRaw: unknown,
  ): void {
    const message = dataRaw as {
      id?: string
      content?: string
      author?: { user_openid?: string; bot?: boolean }
      group_openid?: string
      channel_id?: string
    }
    let chatKey: string | undefined
    let candidates: string[] = []
    if (eventType === 'C2C_MESSAGE_CREATE' && typeof message.author?.user_openid === 'string') {
      chatKey = `c2c:${message.author.user_openid}`
      candidates = [message.author.user_openid]
    } else if (eventType === 'GROUP_AT_MESSAGE_CREATE' && typeof message.group_openid === 'string') {
      chatKey = `group:${message.group_openid}`
      candidates = [message.group_openid]
    } else if ((eventType === 'AT_MESSAGE_CREATE' || eventType === 'DIRECT_MESSAGE_CREATE') && typeof message.channel_id === 'string') {
      chatKey = `channel:${message.channel_id}`
      candidates = [message.channel_id]
    }
    if (chatKey === undefined) return
    if (message.author?.bot === true) return
    if (!this.isAllowed(config, candidates)) {
      this.appendLog(id, `忽略非允许会话 ${chatKey} 的消息`)
      return
    }
    const text = (message.content ?? '').replace(/<@![^>]*>\s*/g, '').trim()
    if (text.length === 0) return
    const msgId = typeof message.id === 'string' ? message.id : undefined
    if (msgId !== undefined) {
      passiveReplies.set(`${chatKey}:${msgId}`, { receivedAt: Date.now(), seq: 0 })
      // Prune stale entries so the map cannot grow without bound.
      for (const [key, entry] of [...passiveReplies]) {
        if (Date.now() - entry.receivedAt > QQ_PASSIVE_REPLY_TTL_MS) passiveReplies.delete(key)
      }
    }
    this.appendLog(id, `收到消息：${text.slice(0, 80)}`)
    void this.generateAndDeliver(id, text, async reply => {
      await this.sendQqMessage(appId, clientSecret, chatKey, reply, msgId, passiveReplies)
    })
  }

  private async sendQqMessage(
    appId: string,
    clientSecret: string,
    chatKey: string,
    text: string,
    inboundMsgId: string | undefined,
    passiveReplies: Map<string, QqPassiveRecord>,
  ): Promise<void> {
    const accessToken = await this.qqAccessToken(appId, clientSecret)
    for (let start = 0; start <= text.length; start += QQ_MAX_LENGTH - 100) {
      const chunk = text.slice(start, start + QQ_MAX_LENGTH - 100)
      if (chunk.length === 0 && start > 0) break
      const [type, target] = chatKey.split(':')
      if (type === undefined || target === undefined) throw new Error(`未知会话类型：${chatKey}`)
      let endpoint: string
      const body: Record<string, unknown> = { markdown: { content: chunk }, msg_type: 2 }
      switch (type) {
        case 'c2c':
          endpoint = `${QQ_API_BASE}/v2/users/${target}/messages`
          break
        case 'group':
          endpoint = `${QQ_API_BASE}/v2/groups/${target}/messages`
          break
        case 'channel':
          endpoint = `${QQ_API_BASE}/channels/${target}/messages`
          break
        default:
          throw new Error(`未知会话类型：${chatKey}`)
      }
      if (inboundMsgId !== undefined) {
        const key = `${chatKey}:${inboundMsgId}`
        const entry = passiveReplies.get(key)
        const withinWindow = entry !== undefined && Date.now() - entry.receivedAt <= QQ_PASSIVE_REPLY_TTL_MS
        if (withinWindow && entry.seq < QQ_MAX_PASSIVE_REPLIES) {
          entry.seq += 1
          body.msg_id = inboundMsgId
          if (type === 'c2c' || type === 'group') body.msg_seq = entry.seq
        }
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `QQBot ${accessToken}`,
          'X-Union-Appid': appId,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`QQ 发送失败（HTTP ${String(response.status)}）：${errorText.slice(0, 200)}`)
      }
    }
  }

  // ─── Feishu: Lark long-connection WebSocket + im/v1 sends ──────────────────

  private feishuTokenCache: { accessToken: string; expiresAt: number } | null = null
  private feishuBotOpenId: string | null = null

  private async feishuTenantToken(appId: string, appSecret: string): Promise<string> {
    if (this.feishuTokenCache !== null && Date.now() < this.feishuTokenCache.expiresAt - 60_000) {
      return this.feishuTokenCache.accessToken
    }
    const response = await fetch(`${FEISHU_API_BASE}/open-apis/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    })
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined)
      throw new Error(`获取 tenant_access_token 失败（HTTP ${String(response.status)}）`)
    }
    const data = await response.json() as { code?: number; tenant_access_token?: string; expire?: number; msg?: string }
    if (data.code !== 0 || typeof data.tenant_access_token !== 'string') {
      throw new Error(`tenant_access_token 响应无效：${data.msg ?? JSON.stringify(data).slice(0, 120)}`)
    }
    this.feishuTokenCache = { accessToken: data.tenant_access_token, expiresAt: Date.now() + (data.expire ?? 7200) * 1000 }
    return this.feishuTokenCache.accessToken
  }

  private startFeishu(record: ChannelRecord): void {
    const appId = typeof record.config?.app_id === 'string' ? record.config.app_id : ''
    const appSecret = typeof record.config?.app_secret === 'string' ? record.config.app_secret : ''
    if (appId.length === 0 || appSecret.length === 0) {
      this.names.set(record.id, record.name)
      this.setStatus(record.id, 'error', '缺少 AppID 或 AppSecret')
      return
    }
    this.feishuCredentials.set(record.id, { appId, appSecret })
    const controller = new AbortController()
    this.runtimes.set(record.id, { controller, log: [] })
    this.setStatus(record.id, 'starting')
    void this.runFeishuLoop(record.id, record.name, appId, appSecret, record.config ?? {}, controller.signal)
  }

  /**
   * Feishu Lark long-connection loop: mint a tenant token, discover the wss
   * endpoint, then speak the protobuf ping/pong + event protocol. Inbound
   * event frames are ACKed with an echoed frame (Feishu redelivers otherwise)
   * and routed through the shared reply pipeline.
   */
  private async runFeishuLoop(
    id: string,
    name: string,
    appId: string,
    appSecret: string,
    config: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<void> {
    this.appendLog(id, `频道「${name}」连接飞书长连接`)
    while (!signal.aborted) {
      let pingTimer: ReturnType<typeof setTimeout> | null = null
      let pingIntervalMs = 25_000
      try {
        const token = await this.feishuTenantToken(appId, appSecret)
        if (this.feishuBotOpenId === null) {
          try {
            const botInfo = await fetch(`${FEISHU_API_BASE}/open-apis/bot/v3/info`, {
              headers: { Authorization: `Bearer ${token}` },
              signal,
            })
            if (botInfo.ok) {
              const body = await botInfo.json() as { code?: number; bot?: { open_id?: string } }
              if (body.code === 0 && typeof body.bot?.open_id === 'string') {
                this.feishuBotOpenId = body.bot.open_id
              }
            }
          } catch { /* bot identity is best-effort for mention matching */ }
        }
        const endpointResponse = await fetch(`${FEISHU_API_BASE}/callback/ws/endpoint`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', locale: 'zh' },
          body: JSON.stringify({ AppID: appId, AppSecret: appSecret }),
          signal,
        })
        if (!endpointResponse.ok) {
          await endpointResponse.body?.cancel().catch(() => undefined)
          throw new Error(`获取长连接端点失败（HTTP ${String(endpointResponse.status)}）`)
        }
        const endpointData = await endpointResponse.json() as { code?: number; data?: { URL?: string; ClientConfig?: { PingInterval?: number } } }
        const url = endpointData.data?.URL
        if (endpointData.code !== 0 || typeof url !== 'string' || url.length === 0) {
          throw new Error(`长连接端点响应无效（code=${String(endpointData.code)}）`)
        }
        if (typeof endpointData.data?.ClientConfig?.PingInterval === 'number') {
          pingIntervalMs = Math.max(5_000, endpointData.data.ClientConfig.PingInterval * 1000)
        }
        const serviceId = Number(new URL(url).searchParams.get('service_id') ?? '0')
        this.appendLog(id, '长连接端点已解析，建立 WebSocket…')

        await new Promise<void>((resolvePromise) => {
          let settled = false
          const settle = (): void => {
            if (settled) return
            settled = true
            if (pingTimer !== null) clearTimeout(pingTimer)
            pingTimer = null
            resolvePromise()
          }
          if (signal.aborted === true) { settle(); return }
          const ws = new WebSocket(url)
          signal.addEventListener('abort', () => { try { ws.close() } catch { /* already closed */ } }, { once: true })

          const ping = (): void => {
            if (ws.readyState !== WebSocket.OPEN) return
            try {
              ws.send(encodeLarkFrame({ SeqID: 0, LogID: 0, service: serviceId, method: 0, headers: [{ key: 'type', value: 'ping' }] }))
            } catch { /* closing */ }
            pingTimer = setTimeout(ping, pingIntervalMs)
          }

          ws.addEventListener('open', () => {
            this.setStatus(id, 'connected')
            this.appendLog(id, '飞书长连接已连接')
            ping()
          })
          ws.addEventListener('message', (event: MessageEvent) => {
            void (async () => {
              const data = event.data
              // Normalize to a plain Uint8Array over an ArrayBuffer so the
              // protobuf decoder and ws.send both accept it.
              const raw: ArrayBuffer = typeof data === 'string'
                ? new TextEncoder().encode(data).buffer
                : data instanceof ArrayBuffer ? data
                : data instanceof Blob ? await data.arrayBuffer()
                : data instanceof Uint8Array ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
                : new ArrayBuffer(0)
              const bytes = new Uint8Array(raw)
              const frame = decodeLarkFrame(bytes)
              if (frame.method === 0) {
                // control: pong payload carries updated keepalive config
                const type = frame.headers?.find(h => h.key === 'type')?.value
                if (type === 'pong' && frame.payload !== undefined) {
                  try {
                    const parsed = JSON.parse(new TextDecoder().decode(frame.payload)) as { PingInterval?: number }
                    if (typeof parsed.PingInterval === 'number') {
                      pingIntervalMs = Math.max(5_000, parsed.PingInterval * 1000)
                    }
                  } catch { /* keep current interval */ }
                }
                return
              }
              if (frame.method !== 1) return
              const headers = new Map((frame.headers ?? []).map(h => [h.key, h.value]))
              if (headers.get('type') !== 'event') return
              // Acknowledge (echo frame with biz_rt) so Feishu does not redeliver.
              const ackFrame: LarkFrame = {
                method: 1,
                headers: [...(frame.headers ?? []), { key: 'biz_rt', value: '0' }],
                payload: new TextEncoder().encode(JSON.stringify({ code: 200 })),
              }
              if (frame.SeqID !== undefined) ackFrame.SeqID = frame.SeqID
              if (frame.LogID !== undefined) ackFrame.LogID = frame.LogID
              if (frame.service !== undefined) ackFrame.service = frame.service
              try {
                ws.send(encodeLarkFrame(ackFrame))
              } catch { /* closing */ }
              if (frame.payload === undefined) return
              try {
                const envelope = JSON.parse(new TextDecoder().decode(frame.payload)) as {
                  header?: { event_type?: string }
                  event?: unknown
                }
                if (envelope.header?.event_type === 'im.message.receive_v1' && envelope.event !== undefined) {
                  this.handleFeishuEvent(id, config, envelope.event)
                }
              } catch (error) {
                this.appendLog(id, `事件解析失败：${error instanceof Error ? error.message : String(error)}`)
              }
            })().catch(error => {
              this.appendLog(id, `事件处理失败：${error instanceof Error ? error.message : String(error)}`)
            })
          })
          ws.addEventListener('close', settle)
          ws.addEventListener('error', () => { try { ws.close() } catch { /* already closing */ } })
        })
      } catch (error) {
        if (signal.aborted) break
        const messageText = error instanceof Error ? error.message : String(error)
        this.setStatus(id, 'error', messageText)
        this.appendLog(id, `连接失败：${messageText}`)
        await abortableSleep(RETRY_MS, signal)
        continue
      }
      if (signal.aborted) break
      this.setStatus(id, 'disconnected')
      await abortableSleep(RETRY_MS, signal)
    }
    this.appendLog(id, '飞书连接循环已停止')
  }

  /**
   * One Feishu im.message.receive_v1 event: allowlist the chat, require a
   * mention of the bot in group chats (parity with cherry's requireMention),
   * strip mention tokens, then ride the shared reply pipeline.
   */
  private handleFeishuEvent(id: string, config: Record<string, unknown>, eventRaw: unknown): void {
    const event = eventRaw as {
      sender?: { sender_id?: { open_id?: string } }
      message?: {
        message_id?: string
        chat_id?: string
        chat_type?: string
        message_type?: string
        content?: string
        mentions?: Array<{ id?: { open_id?: string }; key?: string }>
      }
    }
    const message = event.message
    if (message?.chat_id === undefined) return
    if (message.message_type !== 'text' && message.message_type !== 'post') return
    if (!this.isAllowed(config, [message.chat_id])) {
      this.appendLog(id, `忽略非允许会话 ${message.chat_id} 的消息`)
      return
    }
    // Group chats only answer when the bot is mentioned (cherry requireMention).
    if (message.chat_type === 'group' || message.chat_type === 'p2p') {
      const mentioned = (message.mentions ?? []).some(mention => mention.id?.open_id === this.feishuBotOpenId)
      const mentionAll = (message.mentions ?? []).some(mention => mention.key === 'ALL' || mention.id?.open_id === 'all')
      const isSelf = event.sender?.sender_id?.open_id !== undefined
        && this.feishuBotOpenId !== null
        && event.sender.sender_id.open_id === this.feishuBotOpenId
      if (isSelf) return
      if (message.chat_type === 'group' && !mentioned && !mentionAll) return
    }
    let text = ''
    if (message.message_type === 'text') {
      try {
        const parsed = JSON.parse(message.content ?? '{}') as { text?: string }
        text = parsed.text ?? ''
      } catch { text = message.content ?? '' }
    } else if (message.message_type === 'post') {
      // Rich text: collect plain-text runs, preserving order.
      try {
        const parsed = JSON.parse(message.content ?? '{}') as {
          content?: Array<Array<{ tag?: string; text?: string }>>
        }
        text = (parsed.content ?? []).flatMap(paragraph =>
          (paragraph ?? []).filter(part => part?.tag === 'text' && typeof part.text === 'string').map(part => part.text!),
        ).join('')
      } catch { /* unreadable rich text */ }
    }
    // Strip the @-mention token that Feishu includes in the text.
    text = text.replace(/@_user_\d+/g, '').replace(/@(?!_)[^\s@]+/g, '').trim()
    if (text.length === 0) return
    const chatId = message.chat_id
    const messageId = message.message_id
    this.appendLog(id, `收到消息：${text.slice(0, 80)}`)
    const credentials = this.feishuCredentials.get(id)
    if (credentials === undefined) return
    void this.generateAndDeliver(id, text, async reply => {
      await this.sendFeishuMessage(credentials.appId, credentials.appSecret, chatId, reply, messageId)
    })
  }

  /** app_id/app_secret of live feishu runtimes (used by the deliver closure). */
  private feishuCredentials = new Map<string, { appId: string; appSecret: string }>()

  private async sendFeishuMessage(
    appId: string,
    appSecret: string,
    chatId: string,
    text: string,
    messageId: string | undefined,
  ): Promise<void> {
    const token = await this.feishuTenantToken(appId, appSecret)
    for (let start = 0; start <= text.length; start += FEISHU_MAX_LENGTH - 100) {
      const chunk = text.slice(start, start + FEISHU_MAX_LENGTH - 100)
      if (chunk.length === 0 && start > 0) break
      const response = await fetch(`${FEISHU_API_BASE}/open-apis/im/v1/messages?receive_id_type=chat_id`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          receive_id: chatId,
          msg_type: 'text',
          content: JSON.stringify({ text: chunk }),
          ...(messageId === undefined ? {} : { uuid: messageId }),
        }),
      })
      if (!response.ok) {
        await response.body?.cancel().catch(() => undefined)
        throw new Error(`发送失败（HTTP ${String(response.status)}）`)
      }
      const body = await response.json() as { code?: number; msg?: string }
      if (body.code !== 0) throw new Error(`发送失败：${body.msg ?? `code=${String(body.code)}`}`)
    }
  }

  /**
   * Shared WebSocket session for the gateway-style platforms (Discord/Slack/QQ):
   * opens one socket on Node's built-in WebSocket, hands every parsed payload
   * to `onPayload` (whose 'reconnect' verdict closes and re-establishes), and
   * calls `onHello` when the platform hello arrives. Resolves when the socket
   * closes or the signal aborts; callers loop with backoff.
   */
  private async runGatewaySocket(
    id: string,
    url: string,
    hooks: {
      signal: AbortSignal
      onHello: (ws: WebSocket) => void
      onPayload: (payload: GatewayPayload) => 'continue' | 'reconnect'
      onClose?: () => void
    },
  ): Promise<void> {
    const { signal } = hooks
    await new Promise<void>((resolve) => {
      let settled = false
      const settle = (): void => {
        if (settled) return
        settled = true
        hooks.onClose?.()
        this.sockets.delete(id)
        resolve()
      }
      if (signal.aborted === true) {
        settle()
        return
      }
      const ws = new WebSocket(url)
      this.sockets.set(id, ws)
      signal.addEventListener('abort', () => { try { ws.close() } catch { /* already closed */ } }, { once: true })
      ws.addEventListener('open', () => {
        // Discord/QQ say hello with an opcode-10 payload; Slack sends a JSON
        // envelope of type 'hello' — both funnel into the same callback below.
      })
      ws.addEventListener('message', (event: MessageEvent) => {
        void Promise.resolve().then(() => {
          const text = typeof event.data === 'string' ? event.data : String(event.data)
          let payload: unknown
          try { payload = JSON.parse(text) } catch { return }
          const typed = payload as GatewayPayload
          // Slack's hello is a text envelope, not op 10 — surface it once.
          if ((typed as { type?: string }).type === 'hello') hooks.onHello(ws)
          else if (typed.op === OP_HELLO) hooks.onHello(ws)
          try {
            if (hooks.onPayload(payload as GatewayPayload) === 'reconnect') {
              try { ws.close() } catch { /* already closed */ }
            }
          } catch (error) {
            this.appendLog(id, `消息处理失败：${error instanceof Error ? error.message : String(error)}`)
          }
        })
      })
      ws.addEventListener('close', settle)
      ws.addEventListener('error', () => { try { ws.close() } catch { /* already closing */ } })
    })
  }

  /** The live socket of a channel, when connected. */
  private sockets = new Map<string, WebSocket>()

  private wsFor(id: string): WebSocket | undefined {
    return this.sockets.get(id)
  }

  /** All per-channel statuses (the 状态点 data source). */
  status(): ChannelBridgeStatus[] {
    return [...this.statuses.values()].map(entry => ({ ...entry }))
  }

  /** One channel's recent runtime log lines. */
  getLog(channelId: string, lines = 50): string[] {
    const runtime = this.runtimes.get(channelId)
    if (runtime === undefined) return []
    return runtime.log.slice(-Math.max(1, Math.trunc(lines)))
  }
}
