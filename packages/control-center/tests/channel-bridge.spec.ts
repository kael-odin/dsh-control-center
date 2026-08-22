import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChannelBridgeService } from '../src/channel-bridge.ts'

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
})
