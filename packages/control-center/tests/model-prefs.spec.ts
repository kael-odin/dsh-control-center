import { describe, expect, it, vi } from 'vitest'
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsSchemaOperations } from '../src/client/schema-operations.ts'
import { readRetryConfig, ModelPrefsStore } from '../src/client/model-prefs-store.ts'

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

  it('loads the quick selection and retry config alongside the other purposes', async () => {
    const api = {
      settings: {
        describe: vi.fn(async () => ok({
          writable: true, hasDocument: true,
          namespaces: [{
            ns: 'control-center-model-prefs', schema: {}, revision: 4,
            value: {
              translationProvider: '', translationModel: '', paintingProvider: '', paintingModel: '',
              quickProvider: 'acme', quickModel: 't1',
              retryEnabled: true, retryMaxAttempts: 5, retryBackoff: false,
              retryFallbacks: [{ provider: 'acme', model: 't1' }],
            },
          }],
        })),
      },
      llm: { models: vi.fn(async () => ok({ groups: [], failures: [] })) },
    } as unknown as Pick<IApiClient, 'settings' | 'llm'>
    const store = new ModelPrefsStore(api, schema)
    await store.load()
    const state = store.store.getSnapshot()
    expect(state.quick).toEqual({ provider: 'acme', model: 't1' })
    expect(state.retry).toEqual({
      enabled: true, maxAttempts: 5, backoff: false, fallbacks: [{ provider: 'acme', model: 't1' }],
    })
  })

  it('persists the whole retry config in one atomic section write', async () => {
    const mutate = vi.fn(async () => ok({ revision: 9, user: {} }))
    const api = {
      settings: {
        describe: vi.fn(async () => ok({
          writable: true, hasDocument: true,
          namespaces: [{
            ns: 'control-center-model-prefs', schema: {}, revision: 8,
            value: { translationProvider: '', translationModel: '', paintingProvider: '', paintingModel: '' },
          }],
        })),
        mutate,
      },
      llm: { models: vi.fn(async () => ok({ groups: [], failures: [] })) },
    } as unknown as Pick<IApiClient, 'settings' | 'llm'>
    const store = new ModelPrefsStore(api, schema)
    await store.load()
    await expect(store.saveRetry({ enabled: true, maxAttempts: 7, backoff: false, fallbacks: [{ provider: 'p', model: 'm' }] }))
      .resolves.toBe(true)
    expect(mutate).toHaveBeenCalledWith({
      ns: 'control-center-model-prefs',
      expectedRevision: 8,
      ops: [
        { op: 'set', path: ['retryEnabled'], value: true },
        { op: 'set', path: ['retryMaxAttempts'], value: 7 },
        { op: 'set', path: ['retryBackoff'], value: false },
        { op: 'set', path: ['retryFallbacks'], value: [{ provider: 'p', model: 'm' }] },
      ],
    })
  })

  it('reports a failed write without failing the whole page', async () => {
    const mutate = vi.fn(async () =>
      ({ rpcId: 'test' as never, result: { ok: false as const, error: { code: 'CONFLICT', message: 'revision moved' } } }))
    const api = {
      settings: {
        describe: vi.fn(async () => ok({
          writable: true, hasDocument: true,
          namespaces: [{
            ns: 'control-center-model-prefs', schema: {}, revision: 2,
            value: { translationProvider: '', translationModel: '', paintingProvider: '', paintingModel: '' },
          }],
        })),
        mutate,
      },
      llm: { models: vi.fn(async () => ok({ groups: [], failures: [] })) },
    } as unknown as Pick<IApiClient, 'settings' | 'llm'>
    const store = new ModelPrefsStore(api, schema)
    await store.load()
    await expect(store.save('quick', { provider: 'p', model: 'm' })).resolves.toBe(false)
    const state = store.store.getSnapshot()
    expect(state.status).toBe('ready')
    expect(state.writeError).toBe('revision moved')
  })
})

describe('readRetryConfig', () => {
  it('falls back to Cherry defaults on absent or out-of-range fields', () => {
    expect(readRetryConfig({}, schema)).toEqual({ enabled: false, maxAttempts: 3, backoff: true, fallbacks: [] })
    expect(readRetryConfig({ retryEnabled: true, retryMaxAttempts: 99 }, schema))
      .toMatchObject({ enabled: true, maxAttempts: 3 })
    expect(readRetryConfig({ retryBackoff: false }, schema)).toMatchObject({ backoff: false })
  })

  it('drops malformed fallback entries but keeps well-formed ones', () => {
    expect(readRetryConfig({
      retryFallbacks: [
        { provider: 'a', model: 'x' },
        { provider: '', model: 'y' },
        null,
        { provider: 'b' },
      ],
    }, schema).fallbacks).toEqual([{ provider: 'a', model: 'x' }])
  })
})
