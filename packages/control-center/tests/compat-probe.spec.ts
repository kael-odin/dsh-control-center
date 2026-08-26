import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { CompatService } from '../src/compat-probe.ts'

describe('CompatService capability probe', () => {
  it('reports missing services honestly and available ones as available', async () => {
    const ctx = new Context()
    const settings = {
      register: () => ({ get: () => ({}), watch: () => () => {}, update: async () => {} }),
    }
    ;(ctx as unknown as { settings: unknown }).settings = settings

    // No storage/llm/apiProxy/invariants mounted — all should be unavailable.
    const service = new CompatService(ctx)
    const result = await service.probe()
    expect(result.ok).toBe(true)
    const byName = new Map(result.value.map(probe => [probe.name, probe]))
    expect(byName.get('settings')?.available).toBe(true)
    expect(byName.get('llm')?.available).toBe(false)
    expect(byName.get('apiProxy')?.available).toBe(false)
    expect(byName.get('apiProxy.sessions')?.available).toBe(false)
  })

  it('runs a live sessions.list RPC when apiProxy is present', async () => {
    const ctx = new Context()
    const settings = {
      register: () => ({ get: () => ({}), watch: () => () => {}, update: async () => {} }),
    }
    ;(ctx as unknown as { settings: unknown }).settings = settings
    let listed = 0
    const fakeApi = {
      sessions: {
        list: async () => {
          listed++
          return { rpcId: 'test', result: { ok: true as const, value: { items: [] } } }
        },
      },
    }
    const realGet = ctx.get.bind(ctx)
    ;(ctx as unknown as { get: unknown }).get = (name: string) => (name === 'apiProxy' ? fakeApi : realGet(name))

    const service = new CompatService(ctx)
    const result = await service.probe()
    const byName = new Map(result.value.map(probe => [probe.name, probe]))
    expect(listed).toBe(1)
    expect(byName.get('apiProxy.sessions')).toMatchObject({ available: true })
  })
})
