import { describe, expect, it, vi } from 'vitest'
import type { SettingsScopeBinder, SettingsSchemaService } from '@deepseek-ai/dsh-client-ui-settings/client'
import { createSettingsSchemaOperations } from '../src/client/schema-operations.ts'
import { ModelsSettingsStore } from '../src/client/store.ts'

function ok<T>(value: T) {
  return { ok: true as const, value }
}

const schemaService = {
  rehydrate: vi.fn((value: unknown) => value),
  validate: vi.fn(() => undefined),
  nodeAtPath: vi.fn(() => ({ type: 'string' })),
  getPath: vi.fn((value: unknown, path: readonly string[]) => path.reduce((current: any, key) => current?.[key], value)),
  hasPath: vi.fn(() => false),
  setPath: vi.fn((root: Record<string, unknown>) => root),
  deletePath: vi.fn((root: Record<string, unknown>) => root),
} as unknown as SettingsSchemaService

describe('latest settings services integration', () => {
  it('binds every schema operation to the injected SettingsSchemaService', () => {
    const operations = createSettingsSchemaOperations(schemaService)
    const draft = { providers: { acme: { api: 'openai' } } }
    operations.rehydrate({ type: 'object' })
    operations.validate({}, draft)
    operations.nodeAtPath({}, ['providers'])
    operations.getPath(draft, ['providers', 'acme'])
    operations.hasPath(draft, ['providers'])
    operations.setPath({}, ['providers'], draft.providers)
    operations.deletePath({}, ['providers'])
    expect(schemaService.rehydrate).toHaveBeenCalled()
    expect(schemaService.validate).toHaveBeenCalled()
    expect(schemaService.nodeAtPath).toHaveBeenCalled()
    expect(schemaService.getPath).toHaveBeenCalled()
    expect(schemaService.hasPath).toHaveBeenCalled()
    expect(schemaService.setPath).toHaveBeenCalled()
    expect(schemaService.deletePath).toHaveBeenCalled()
  })

  it('loads ModelsSettingsStore from SettingsDescribeFace without settings.describe', async () => {
    const settingsDescribe = vi.fn(async () => ok({ writable: true, namespaces: [] }))
    const mirror = {
      ensure: vi.fn(async () => {}),
      getSnapshot: vi.fn(() => ({ status: 'ready', view: { writable: true, namespaces: [] }, error: null })),
    }
    const api = {
      settings: { describe: settingsDescribe },
      llm: { listConfigurableProviders: vi.fn(async () => ok([])), listProviders: vi.fn(async () => ok([])) },
      credentials: { describe: vi.fn(async () => ok({})) },
    }
    const store = new ModelsSettingsStore(api as never, createSettingsSchemaOperations(schemaService), mirror)
    await store.load()
    expect(mirror.ensure).toHaveBeenCalledOnce()
    expect(mirror.getSnapshot).toHaveBeenCalled()
    expect(settingsDescribe).not.toHaveBeenCalled()
    expect(store.store.getSnapshot().status).toBe('ready')
  })

  it('surfaces an unavailable settings mirror instead of silently succeeding', async () => {
    const mirror = {
      ensure: vi.fn(async () => {}),
      getSnapshot: vi.fn(() => ({ status: 'unavailable', view: undefined, error: 'settings unavailable' })),
    }
    const api = {
      settings: { describe: vi.fn() },
      llm: { listConfigurableProviders: vi.fn(async () => ok([])), listProviders: vi.fn(async () => ok([])) },
      credentials: { describe: vi.fn(async () => ok({})) },
    }
    const store = new ModelsSettingsStore(api as never, createSettingsSchemaOperations(schemaService), mirror)
    await store.load()
    expect(store.store.getSnapshot()).toMatchObject({ status: 'error', error: 'settings unavailable' })
  })
})
