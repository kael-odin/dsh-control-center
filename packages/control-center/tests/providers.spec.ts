import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProvidersService } from '../src/providers.ts'

function makeService(): ProvidersService {
  const ctx = new Context()
  const storage = new Map<string, unknown>()
  ;(ctx as unknown as Record<string, unknown>).settings = {
    register: (ns: unknown, _schema: unknown, opts?: { base?: unknown }) => {
      storage.set(String(ns), opts?.base ?? {})
      return { get: () => storage.get(String(ns)) ?? {}, update: (patch: unknown) => { storage.set(String(ns), patch) } }
    },
    get: (ns: unknown) => storage.get(String(ns)) ?? {},
    update: async (ns: unknown, patch: unknown) => { storage.set(String(ns), patch) },
    describe: () => [],
  }
  ;(ctx as unknown as Record<string, unknown>).credentials = { resolve: () => ({ value: 'key', source: 'test' }), set: async () => {} }
  ctx.reflect.provide('credentials', { resolve: () => ({ value: 'key', source: 'test' }), set: async () => {}, describe: async () => ({ refs: [] }) } as never)
  ;(ctx as unknown as Record<string, unknown>).llm = { listConfigurableProviders: () => [] }
  ;(ctx as unknown as { logger: unknown }).logger = { info: () => {}, warn: () => {}, error: () => {} }
  return new ProvidersService(ctx)
}

const fetchStub = (models: Array<{ id: string; name: string }>) => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ data: models }), {
    status: 200, headers: { 'content-type': 'application/json' },
  })))
}

afterEach(() => { vi.unstubAllGlobals() })

describe('ProvidersService model metadata', () => {
  it('discoverModels then updateModel merges fine-grained metadata fields', async () => {
    fetchStub([{ id: 'chat-model', name: 'Chat Model' }])
    const service = makeService()
    const created = await service.create({ name: 'Test', type: 'openai', baseURL: 'http://test.local/v1', apiKey: 'key' })
    const providerId = created.id

    const discovered = await service.discoverModels(providerId)
    expect(discovered.models.length).toBe(1)
    expect(discovered.models[0]?.id).toBe('chat-model')

    const updated = await service.updateModel(providerId, 'chat-model', {
      enabled: true,
      capabilities: { chat: true, reasoning: true, vision: false },
      contextWindow: 128000,
      maxOutputTokens: 8192,
      incrementalOutput: true,
      purpose: 'dialogue',
      protocol: 'openai',
      typeLabels: ['text'],
      pricing: { currency: 'USD', input: 0.27, output: 1.10, cacheRead: 0.07, cacheWrite: 1.10 },
    })
    expect(updated.capabilities).toMatchObject({ chat: true, reasoning: true, vision: false })
    expect(updated.contextWindow).toBe(128000)
    expect(updated.maxOutputTokens).toBe(8192)
    expect(updated.incrementalOutput).toBe(true)
    expect(updated.purpose).toBe('dialogue')
    expect(updated.protocol).toBe('openai')
    expect(updated.typeLabels).toEqual(['text'])
    expect(updated.pricing).toMatchObject({ currency: 'USD', input: 0.27, cacheRead: 0.07 })

    // The fields survive a round-trip through list().
    const listed = await service.list()
    const provider = listed.find(p => p.id === providerId)
    const model = provider?.models.find(m => m.id === 'chat-model')
    expect(model?.purpose).toBe('dialogue')
    expect(model?.pricing?.input).toBe(0.27)

    // A partial update leaves untouched fields intact.
    const partial = await service.updateModel(providerId, 'chat-model', { maxOutputTokens: 4096 })
    expect(partial.maxOutputTokens).toBe(4096)
    expect(partial.purpose).toBe('dialogue')
  })
})
