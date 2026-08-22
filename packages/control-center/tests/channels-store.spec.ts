// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import { ChannelsStore, importLegacyChannels, type ChannelInstance } from '../src/client/channels-store.ts'

function ok<T>(value: T) {
  return { rpcId: 'test' as never, result: { ok: true as const, value } }
}

function instance(id: string): ChannelInstance {
  return { id, type: 'telegram', name: id, config: {}, permissionMode: '__inherit', isActive: false, createdAt: 1 }
}

function makeApi(namespaces: unknown[]) {
  return {
    settings: { describe: vi.fn(async () => ok({ writable: true, hasDocument: true, namespaces })) },
  } as unknown as Pick<IApiClient, 'settings'>
}

describe('ChannelsStore', () => {
  it('loads instances from the authority', async () => {
    const api = makeApi([{ ns: 'control-center-channels', schema: {}, revision: 4, value: { instances: [instance('a')] } }])
    const store = new ChannelsStore(api)
    await store.load()
    expect(store.store.getSnapshot()).toMatchObject({
      status: 'ready', available: true, writable: true, revision: 4,
    })
    expect(store.store.getSnapshot().instances.map(c => c.id)).toEqual(['a'])
  })

  it('degrades to unavailable when the namespace is missing (older host)', async () => {
    const store = new ChannelsStore(makeApi([]))
    await store.load()
    const state = store.store.getSnapshot()
    expect(state.status).toBe('ready')
    expect(state.available).toBe(false)
    // Saves refuse rather than pretending to persist.
    await expect(store.save([instance('x')])).resolves.toBe(false)
  })

  it('persists the whole list with a revision guard', async () => {
    const mutate = vi.fn(async () => ok({ revision: 9, user: {} }))
    const api = {
      settings: {
        describe: vi.fn(async () => ok({
          writable: true, hasDocument: true,
          namespaces: [{ ns: 'control-center-channels', schema: {}, revision: 4, value: { instances: [] } }],
        })),
        mutate,
      },
    } as unknown as Pick<IApiClient, 'settings'>
    const store = new ChannelsStore(api)
    await store.load()
    await expect(store.save([instance('b')])).resolves.toBe(true)
    expect(mutate).toHaveBeenCalledWith({
      ns: 'control-center-channels',
      expectedRevision: 4,
      ops: [{ op: 'set', path: ['instances'], value: [expect.objectContaining({ id: 'b' })] }],
    })
    expect(store.store.getSnapshot().revision).toBe(9)
  })
})

describe('importLegacyChannels', () => {
  it('imports browser leftovers once into an empty authority', async () => {
    window.localStorage.clear()
    window.localStorage.setItem('cc.settings.channels', JSON.stringify([instance('legacy')]))
    window.localStorage.removeItem('cc.settings.channels.imported')
    const api = makeApi([{ ns: 'control-center-channels', schema: {}, revision: 1, value: { instances: [] } }])
    ;(api.settings as { mutate: unknown }).mutate = vi.fn(async () => ok({ revision: 2, user: {} }))
    const store = new ChannelsStore(api)
    await store.load()
    await expect(importLegacyChannels(store)).resolves.toBe(true)
    expect(window.localStorage.getItem('cc.settings.channels.imported')).toBe('1')
  })

  it('never overwrites a configured authority', async () => {
    window.localStorage.clear()
    window.localStorage.setItem('cc.settings.channels', JSON.stringify([instance('legacy')]))
    window.localStorage.removeItem('cc.settings.channels.imported')
    const api = makeApi([{ ns: 'control-center-channels', schema: {}, revision: 1, value: { instances: [instance('live')] } }])
    const store = new ChannelsStore(api)
    await store.load()
    await expect(importLegacyChannels(store)).resolves.toBe(false)
  })
})
