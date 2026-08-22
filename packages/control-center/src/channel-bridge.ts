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
  static inject = ['settings'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterChannelBridge')

  private readonly statuses = new Map<string, ChannelBridgeStatus & { name: string; type: string }>()
  private readonly runtimes = new Map<string, Runtime>()
  private readonly names = new Map<string, string>()
  private source: (() => ChannelsSection) | undefined

  constructor(ctx: Context) {
    super(ctx, 'controlCenterChannelBridge')
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
    void this.pollTelegram(record.id, record.name, token, controller.signal)
  }

  private async pollTelegram(id: string, name: string, token: string, signal: AbortSignal): Promise<void> {
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
          const text = typeof update.message?.text === 'string' ? update.message.text : ''
          this.appendLog(id, text.length > 0 ? `收到消息：${text.slice(0, 80)}` : '收到更新')
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
