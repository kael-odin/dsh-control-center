import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChannelBridgeService, decodeLarkFrame, encodeLarkFrame } from '../src/channel-bridge.ts'

type FetchLike = (url: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => Promise<{
  ok: boolean
  status: number
  json: () => Promise<unknown>
}>

const realFetch = globalThis.fetch

function makeService(instances: unknown[]): { service: ChannelBridgeService; ctx: Context } {
  const ctx = new Context()
  // No settings service mounted: installSettingsSection takes its composition
  // fallback and never calls the hooks, so the spec drives the source directly.
  const service = new ChannelBridgeService(ctx)
  ;(service as unknown as { source: () => unknown }).source = () => ({ instances })
  return { service, ctx }
}

/** Drive reconcile synchronously (the settings watcher normally does this). */
function reconcileNow(service: ChannelBridgeService): void {
  (service as unknown as { reconcile: () => void }).reconcile()
}

async function settle(ms = 30): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

afterEach(() => {
  globalThis.fetch = realFetch
})

describe('ChannelBridgeService', () => {
  it('reports connected and logs received updates for an active telegram channel', async () => {
    const updates = [
      { ok: true, status: 200, json: async () => ({ ok: true, result: [{ update_id: 11, message: { text: '你好', chat: { id: 7 } } }] }) },
    ]
    let calls = 0
    globalThis.fetch = (async () => {
      calls += 1
      return updates[0]!
    }) as unknown as typeof fetch

    const { service } = makeService([
      { id: 'tg1', type: 'telegram', name: 'TG', isActive: true, config: { bot_token: 'tok' } },
    ])
    reconcileNow(service)
    await settle(50)
    const statuses = service.status()
    expect(statuses).toHaveLength(1)
    expect(statuses[0]?.state).toBe('connected')
    expect(calls).toBeGreaterThan(0)
    const log = service.getLog('tg1', 20)
    expect(log.some(line => line.includes('收到消息：你好'))).toBe(true)

    // Stop the loop so the test exits cleanly.
    vi.spyOn(service, 'reconcile').mockImplementation(() => {})
    ;(service as unknown as { runtimes: Map<string, { controller: AbortController }> }).runtimes.get('tg1')!.controller.abort()
  })

  it('surfaces a token error state with the provider description', async () => {
    globalThis.fetch = (async () => ({
      ok: false,
      status: 401,
      json: async () => ({ ok: false, description: 'Unauthorized' }),
    })) as unknown as typeof fetch

    const { service } = makeService([
      { id: 'tg2', type: 'telegram', name: 'TG2', isActive: true, config: { bot_token: 'bad' } },
    ])
    reconcileNow(service)
    await settle(50)
    const statuses = service.status()
    expect(statuses[0]?.state).toBe('error')
    expect(statuses[0]?.detail).toContain('Unauthorized')
    ;(service as unknown as { runtimes: Map<string, { controller: AbortController }> }).runtimes.get('tg2')!.controller.abort()
  })

  it('marks a missing bot token as error without starting any loop', async () => {
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as unknown as typeof fetch
    const { service } = makeService([
      { id: 'tg3', type: 'telegram', name: 'TG3', isActive: true, config: {} },
    ])
    reconcileNow(service)
    await settle(20)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(service.status()[0]).toMatchObject({ state: 'error', detail: '缺少 Bot Token' })
    expect(service.getLog('tg3')).toEqual([])
  })

  it('drives a discord gateway attempt and reports the 401 as error', async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: false,
      status: 401,
      body: null,
      json: async () => ({}),
    })) as unknown as typeof fetch
    globalThis.fetch = fetchSpy
    const { service } = makeService([
      { id: 'dc1', type: 'discord', name: 'DC', isActive: true, config: { bot_token: 'fake' } },
    ])
    reconcileNow(service)
    await settle(50)
    const statuses = service.status()
    expect(statuses[0]).toMatchObject({ state: 'error' })
    expect(statuses[0]?.detail).toContain('401')
    // Runtime started and wrote a log line.
    expect(service.getLog('dc1', 20).length).toBeGreaterThan(0)
    ;(service as unknown as { runtimes: Map<string, { controller: AbortController }> }).runtimes.get('dc1')!.controller.abort()
  })

  it('reports missing discord token as error without a runtime', async () => {
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as unknown as typeof fetch
    const { service } = makeService([
      { id: 'dc2', type: 'discord', name: 'DC2', isActive: true, config: {} },
    ])
    reconcileNow(service)
    await settle(20)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(service.status()[0]).toMatchObject({ state: 'error', detail: '缺少 Bot Token' })
  })

  it('reports missing slack tokens as error without starting a loop', async () => {
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as unknown as typeof fetch
    const { service } = makeService([
      { id: 'sl1', type: 'slack', name: 'SL', isActive: true, config: { bot_token: 'xoxb-x' } },
      { id: 'sl2', type: 'slack', name: 'SL2', isActive: true, config: {} },
    ])
    reconcileNow(service)
    await settle(20)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(service.status()[0]).toMatchObject({ state: 'error', detail: '缺少 Bot Token（xoxb-）或 App-Level Token（xapp-）' })
  })

  it('reports missing qq credentials as error without starting a loop', async () => {
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as unknown as typeof fetch
    const { service } = makeService([
      { id: 'qq1', type: 'qq', name: 'QQ', isActive: true, config: { app_id: '123' } },
    ])
    reconcileNow(service)
    await settle(20)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(service.status()[0]).toMatchObject({ state: 'error', detail: '缺少 AppID 或 ClientSecret' })
  })

  it('reports missing feishu credentials as error without starting a loop', async () => {
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as unknown as typeof fetch
    const { service } = makeService([
      { id: 'fs2', type: 'feishu', name: 'FS2', isActive: true, config: { app_id: 'cli_x' } },
    ])
    reconcileNow(service)
    await settle(20)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(service.status()[0]).toMatchObject({ state: 'error', detail: '缺少 AppID 或 AppSecret' })
  })

  it('marks a wechat channel without stored credentials as 未登录 instead of connecting', async () => {
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as unknown as typeof fetch
    const { service } = makeService([
      { id: 'wx-nocred-spec', type: 'wechat', name: 'WX', isActive: true, config: {} },
    ])
    reconcileNow(service)
    // startWechat loads credentials asynchronously before deciding.
    await settle(50)
    expect(fetchSpy).not.toHaveBeenCalled()
    const entry = service.status().find(status => status.channelId === 'wx-nocred-spec')
    expect(entry?.state).toBe('error')
    expect(entry?.detail).toContain('未登录')
  })
})

describe('Lark protobuf frame codec', () => {
  it('round-trips a ping control frame', () => {
    const encoded = encodeLarkFrame({
      SeqID: 0,
      LogID: 0,
      service: 42,
      method: 0,
      headers: [{ key: 'type', value: 'ping' }],
    })
    const decoded = decodeLarkFrame(encoded)
    expect(decoded.SeqID).toBe(0)
    expect(decoded.service).toBe(42)
    expect(decoded.method).toBe(0)
    expect(decoded.headers).toEqual([{ key: 'type', value: 'ping' }])
  })

  it('round-trips an event data frame with payload', () => {
    const payload = new TextEncoder().encode(JSON.stringify({ code: 200 }))
    const encoded = encodeLarkFrame({
      SeqID: 7,
      LogID: 3,
      service: 42,
      method: 1,
      headers: [
        { key: 'type', value: 'event' },
        { key: 'message_id', value: 'om_x' },
        { key: 'sum', value: '1' },
        { key: 'seq', value: '0' },
      ],
      payload,
    })
    const decoded = decodeLarkFrame(encoded)
    expect(decoded.SeqID).toBe(7)
    expect(decoded.LogID).toBe(3)
    expect(decoded.method).toBe(1)
    expect(decoded.headers?.find(h => h.key === 'type')?.value).toBe('event')
    expect(decoded.headers?.find(h => h.key === 'message_id')?.value).toBe('om_x')
    expect(decoded.payload).toEqual(payload)
  })

  it('decodes larger numeric ids (varint multi-byte)', () => {
    const encoded = encodeLarkFrame({ SeqID: 123456, service: 200, method: 1 })
    const decoded = decodeLarkFrame(encoded)
    expect(decoded.SeqID).toBe(123456)
    expect(decoded.service).toBe(200)
  })
})
