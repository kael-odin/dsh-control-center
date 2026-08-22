import { describe, expect, it, vi } from 'vitest'
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsSchemaOperations } from '../src/client/schema-operations.ts'
import { ModelPrefsStore } from '../src/client/model-prefs-store.ts'

function ok<T>(value: T) {
  return { rpcId: 'test' as never, result: { ok: true as const, value } }
}

const schema: SettingsSchemaOperations = {
  rehydrate: serialized => serialized as never,
  validate: () => undefined,
  nodeAtPath: () => undefined,
  getPath: (value, path) => {
    let current: unknown = value
    for (const key of path) {
      if (typeof current !== 'object' || current === null) return undefined
      current = (current as Record<string, unknown>)[key]
    }
    return current
  },
  hasPath: () => false,
  setPath: () => ({}),
  deletePath: () => ({}),
}

describe('ModelPrefsStore', () => {
  it('loads both purposes and the catalog from the host authorities', async () => {
    const api = {
      settings: {
        describe: vi.fn(async () => ok({
          writable: true, hasDocument: true,
          namespaces: [{
            ns: 'control-center-model-prefs', schema: {}, revision: 2,
            value: { translationProvider: 'acme', translationModel: 't1', paintingProvider: '', paintingModel: '' },
          }],
        })),
      },
      llm: { models: vi.fn(async () => ok({ groups: [{ id: 'acme', name: 'Acme', models: [{ id: 't1', name: 'T1' }] }], failures: [] })) },
    } as unknown as Pick<IApiClient, 'settings' | 'llm'>
    const store = new ModelPrefsStore(api, schema)
    await store.load()
    const state = store.store.getSnapshot()
    expect(state.status).toBe('ready')
    expect(state.translation).toEqual({ provider: 'acme', model: 't1' })
    expect(state.painting).toBeNull()
    expect(state.groups).toHaveLength(1)
    expect(state.revision).toBe(2)
  })

  it('persists one purpose without touching the other', async () => {
    const mutate = vi.fn(async () => ok({ revision: 3, user: {} }))
    const api = {
      settings: {
        describe: vi.fn(async () => ok({
          writable: true, hasDocument: true,
          namespaces: [{
            ns: 'control-center-model-prefs', schema: {}, revision: 2,
            value: { translationProvider: 'acme', translationModel: 't1', paintingProvider: '', paintingModel: '' },
          }],
        })),
        mutate,
      },
      llm: { models: vi.fn(async () => ok({ groups: [], failures: [] })) },
    } as unknown as Pick<IApiClient, 'settings' | 'llm'>
    const store = new ModelPrefsStore(api, schema)
    await store.load()
    await expect(store.save('painting', { provider: 'p', model: 'm' })).resolves.toBe(true)
    expect(mutate).toHaveBeenCalledWith({
      ns: 'control-center-model-prefs',
      expectedRevision: 2,
      ops: [
        { op: 'set', path: ['paintingProvider'], value: 'p' },
        { op: 'set', path: ['paintingModel'], value: 'm' },
      ],
    })
  })

  it('degrades to an unavailable-but-ready state when the namespace is missing', async () => {
    const api = {
      settings: { describe: vi.fn(async () => ok({ writable: true, hasDocument: true, namespaces: [] })) },
      llm: { models: vi.fn(async () => ok({ groups: [{ id: 'acme', name: 'Acme', models: [] }], failures: [] })) },
    } as unknown as Pick<IApiClient, 'settings' | 'llm'>
    const store = new ModelPrefsStore(api, schema)
    await store.load()
    const state = store.store.getSnapshot()
    // An older host without the namespace must NOT fail the whole page.
    expect(state.status).toBe('ready')
    expect(state.available).toBe(false)
    await expect(store.save('painting', { provider: 'p', model: 'm' })).resolves.toBe(false)
  })
})
