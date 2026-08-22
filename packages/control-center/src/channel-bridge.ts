/**
 * Channel bridge — the first REAL piece of the 频道 story: a host-process
 * service that watches `control-center-channels` and drives live connections
 * for active instances.
 *
 * Telegram long-polling is implemented end-to-end with nothing but fetch:
 * getUpdates against api.telegram.org with the instance's bot token. A
 * connected channel proves the token works, the bridge reports per-channel
 * status (connected / error / stopped), and every received update lands in a
 * per-channel log ring — the 日志 dialog shows real runtime lines instead of
 * "暂无日志".
 *
 * What this deliberately is NOT yet: the reply pipe into DSH sessions
 * (received messages are logged, not answered), and the other five platform
 * protocols. Those land on top of the lifecycle this file establishes.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { installSettingsSection } from '@deepseek-ai/dsh-settings'
import { bindTypertRemote, Remote } from '@deepseek-ai/dsh-typert-protocol'
import { createUserMessage, type LlmRuntime } from '@deepseek-ai/dsh-llm'

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
}

const LOG_LIMIT = 200
const POLL_TIMEOUT_S = 25
const RETRY_MS = 5_000
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
      for (const runtime of this.runtimes.values()) runtime.controller.abort()
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
      if (record.type === 'telegram' && !this.runtimes.has(record.id)) {
        this.startTelegram(record)
      }
    }
    // Stop loops whose instance disappeared or was disabled.
    for (const [id, runtime] of [...this.runtimes]) {
      if (!wanted.has(id)) {
        runtime.controller.abort()
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
            await this.handleIncoming(id, token, chatId, config, text)
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
   * One received message: enforce the instance's allowlist, resolve the
   * host's default model, stream a reply through the same LlmRuntime every
   * other consumer uses, and send it back via the bot API. Any failure is a
   * log line — the poll loop must survive a bad model or a refused send.
   */
  private async handleIncoming(
    id: string,
    token: string,
    chatId: number,
    config: Record<string, unknown>,
    text: string,
  ): Promise<void> {
    // Allowlist semantics from Cherry: an empty list allows everyone.
    const allowed = Array.isArray(config.allowed_chat_ids)
      ? config.allowed_chat_ids.map(entry => String(entry))
      : []
    if (allowed.length > 0 && !allowed.includes(String(chatId))) {
      this.appendLog(id, `忽略非允许会话 ${String(chatId)} 的消息`)
      return
    }

    const route = this.defaultModelRoute()
    if (route === null || this.llm === undefined) {
      this.appendLog(id, '未解析默认模型（agent-default-model），跳过回复')
      return
    }

    try {
      this.appendLog(id, `生成回复（${route.provider}/${route.model}）…`)
      const prepared = await this.llm.prepareCall({ provider: route.provider, model: route.model })
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
      const trimmedReply = reply.trim().length > 0 ? reply.trim() : '(空回复)'
      await this.sendTelegramMessage(token, chatId, trimmedReply)
      this.appendLog(id, `已回复：${trimmedReply.slice(0, 80)}`)
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error)
      this.appendLog(id, `回复失败：${messageText}`)
    }
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
