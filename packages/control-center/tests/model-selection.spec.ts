// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import type { IApiClient, ModelSelection } from '@deepseek-ai/dsh-api-remotes/client'
import { ModelSelectionStore } from '../src/client/ModelSelectionPanel.tsx'
import type { SettingsSchemaOperations } from '../src/client/schema-operations.ts'

function ok<T>(value: T) {
  return { rpcId: 'test' as never, result: { ok: true as const, value } }
}

/** Minimal bound schema callbacks: the store only reads plain paths. */
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

const groups = [{ id: 'acme', name: 'Acme', models: [{ id: 'm1', name: 'M1' }] }]
const namespace = (provider: string, model: string, revision = 1) => ({
  ns: 'agent-default-model', schema: {}, value: { provider, model }, revision, applies: 'live' as const, secrets: [],
})

describe('model selection controller', () => {
  it('writes a future default without invoking session selection', async () => {
    const mutate = vi.fn(async () => ok(namespace('acme', 'm1', 2)))
    const selectModel = vi.fn()
    const api = {
      settings: { describe: vi.fn(async () => ok({ writable: true, hasDocument: true, namespaces: [namespace('old', 'm0')] })), mutate },
      sessions: { models: vi.fn(), selectModel },
      llm: { models: vi.fn(async () => ok({ groups, failures: [] })) },
    } as unknown as Pick<IApiClient, 'settings' | 'sessions' | 'llm'>
    const store = new ModelSelectionStore(api, schema)
    await store.load(undefined)
    await expect(store.saveDefault({ provider: 'acme', model: 'm1' })).resolves.toBe(true)
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ ns: 'agent-default-model', expectedRevision: 1 }))
    expect(selectModel).not.toHaveBeenCalled()
  })

  it('distinguishes a current-only switch when the default cannot be confirmed', async () => {
    const selection: ModelSelection = { provider: 'acme', model: 'm1' }
    let describes = 0
    const api = {
      settings: {
        describe: vi.fn(async () => {
          describes++
          return ok({ writable: true, hasDocument: true, namespaces: [namespace('old', 'm0')] })
        }),
      },
      sessions: {
        models: vi.fn(async () => ok({ current: { provider: 'old', model: 'm0' }, routable: true, groups, failures: [] })),
        selectModel: vi.fn(async () => ok({ selected: selection })),
      },
      llm: { models: vi.fn(async () => ok({ groups, failures: [] })) },
    } as unknown as Pick<IApiClient, 'settings' | 'sessions' | 'llm'>
    const store = new ModelSelectionStore(api, schema)
    await store.load('session-1' as never, false)
    await expect(store.selectCurrent(selection)).resolves.toBe(true)
    expect(describes).toBe(2)
    expect(store.store.getSnapshot().currentResult).toBe('current-only')
  })
})
