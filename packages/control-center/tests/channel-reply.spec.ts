import { Context } from '@deepseek-ai/cordis'
import { LlmAdapter, LlmRuntime, type GenerateOptions, type StreamChunk } from '@deepseek-ai/dsh-llm'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChannelBridgeService } from '../src/channel-bridge.ts'

const realFetch = globalThis.fetch

/** Services started by the current test — stopped after each test so live
 * poll loops cannot consume the next test's fake-telegram traffic. */
const activeServices: ChannelBridgeService[] = []

afterEach(() => {
  globalThis.fetch = realFetch
  for (const service of activeServices.splice(0)) {
    const bare = service as unknown as { source: unknown; reconcile: () => void }
    bare.source = () => ({ instances: [] })
    bare.reconcile()
  }
})

class ReplyAdapter extends LlmAdapter {
  constructor(private readonly reply: string) { super() }
  override async *stream(_options: GenerateOptions): AsyncIterable<StreamChunk> {
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: this.reply }
    yield { type: 'block-end', index: 0, block: { type: 'text', text: this.reply } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

const selectRoutes: Array<{ sessionId: string; provider: string; model: string }> = []

/**
 * 0.1.2 sessionController fake: bare RemoteResult calls plus a `follow()`
 * stream that yields the opening snapshot frame and, once the prompt has been
 * admitted, the completed turn's events.
 */
function fakeSessionController(options: {
  create?: () => Promise<{ sessionId: string }>
  reply?: { text: string; turn?: number }
  failCreate?: string
} = {}) {
  const calls = { create: 0, prompts: [] as string[], follows: 0 }
  let prompted = false
  const controller = {
    create: async () => {
      calls.create++
      if (options.failCreate !== undefined) throw new Error(options.failCreate)
      return options.create ? options.create() : { sessionId: 'sess-1' }
    },
    selectModel: async (request: { sessionId: string; provider: string; model: string }) => {
      selectRoutes.push(request)
      return { selected: { provider: request.provider, model: request.model } }
    },
    prompt: async (request: { content: Array<{ type: string; text?: string }> }) => {
      calls.prompts.push(request.content.find(part => part.type === 'text')?.text ?? '')
      prompted = true
      return { accepted: true as const }
    },
    page: async () => ({ records: [], hasMore: false }),
    list: async () => ({ items: [] }),
    follow: async function* (_request: unknown, _signal?: AbortSignal) {
      calls.follows++
      yield { type: 'snapshot' as const, header: {}, cursor: 0, records: [], hasMore: false, projections: {} }
      if (prompted && options.reply !== undefined) {
        const turn = options.reply.turn ?? 0
        yield {
          type: 'event' as const,
          event: {
            type: 'assistant/message', seq: 1, time: 0,
            data: { turn, step: 0, message: { role: 'assistant', content: [{ type: 'text', text: options.reply.text }] } },
          },
        }
        yield { type: 'event' as const, event: { type: 'turn/end', seq: 2, time: 0, data: { turn, reason: { kind: 'completed' } } } }
      }
    },
  }
  return { controller, calls }
}

/** Adapter that records the stream options (including `system`) for assertions. */
class RecordingAdapter extends LlmAdapter {
  readonly seen: GenerateOptions[] = []
  override async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    this.seen.push(options)
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: 'BOUND' }
    yield { type: 'block-end', index: 0, block: { type: 'text', text: 'BOUND' } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

describe('ChannelBridgeService reply pipe', () => {
  it('streams a reply through the default model and sends it back', async () => {
    const ctx = new Context()
    const llm = new LlmRuntime(ctx)
    const streamSpy = vi.spyOn(llm, 'prepareCall')
    llm.registerAdapter(['fixture'], new ReplyAdapter('PONG'))

    const settings = {
      describe: () => ([
        { ns: 'agent-default-model', value: { provider: 'fixture', model: 'best' }, schema: {}, revision: 1 },
      ]),
      register: vi.fn(() => ({ get: () => ({ instances: [
        { id: 'tg1', type: 'telegram', name: 'TG', isActive: true, config: { bot_token: 'tok', allowed_chat_ids: ['42'] } },
      ] }), watch: vi.fn(() => () => {}), update: vi.fn(async () => {}) })),
    }
    ;(ctx as unknown as { settings: unknown }).settings = settings

    const sent: Array<{ chat_id: number; text: string }> = []
    globalThis.fetch = (async (input: string | URL, init?: { method?: string; body?: string }) => {
      const url = String(input)
      if (url.includes('/getUpdates')) {
        return { ok: true, status: 200, text: async () => '', json: async () => ({ ok: true, result: [{
          update_id: 7,
          message: { text: 'ping', chat: { id: 42 } },
        }] }) }
      }
      if (url.includes('/sendMessage')) {
        const body = JSON.parse(init?.body ?? '{}') as { chat_id: number; text: string }
        sent.push(body)
        return { ok: true, status: 200, text: async () => '', json: async () => ({ ok: true }) }
      }
      throw new Error(`unexpected ${url}`)
    }) as unknown as typeof fetch

    const service = activeServices[activeServices.push(new ChannelBridgeService(ctx)) - 1]
    ;(service as unknown as { source: () => unknown }).source = () => ({ instances: [
      { id: 'tg1', type: 'telegram', name: 'TG', isActive: true, config: { bot_token: 'tok', allowed_chat_ids: ['42'] } },
    ] })
    ;(service as unknown as { reconcile: () => void }).reconcile()

    await vi.waitFor(async () => {
      expect(sent).toHaveLength(1)
    })
    expect(streamSpy).toHaveBeenCalledWith(expect.objectContaining({ provider: 'fixture', model: 'best' }))
    expect(sent[0]).toMatchObject({ chat_id: 42, text: 'PONG' })
    service.getLog('tg1')
  })

  it('honors a per-channel agent binding (provider/model + system prompt) over the default route', async () => {
    const ctx = new Context()
    const llm = new LlmRuntime(ctx)
    const prepareSpy = vi.spyOn(llm, 'prepareCall')
    const adapter = new RecordingAdapter()
    llm.registerAdapter(['fixture'], adapter)

    const settings = {
      describe: () => ([
        // Default route exists but must be ignored for the bound channel.
        { ns: 'agent-default-model', value: { provider: 'fixture', model: 'default-model' }, schema: {}, revision: 1 },
      ]),
      register: vi.fn(() => ({ get: () => ({ instances: [] }), watch: vi.fn(() => () => {}), update: vi.fn(async () => {}) })),
    }
    ;(ctx as unknown as { settings: unknown }).settings = settings

    const sent: Array<{ chat_id: number; text: string }> = []
    globalThis.fetch = (async (input: string | URL, init?: { method?: string; body?: string }) => {
      const url = String(input)
      if (url.includes('/getUpdates')) {
        return { ok: true, status: 200, text: async () => '', json: async () => ({ ok: true, result: [{
          update_id: 7,
          message: { text: 'ping', chat: { id: 42 } },
        }] }) }
      }
      if (url.includes('/sendMessage')) {
        const body = JSON.parse(init?.body ?? '{}') as { chat_id: number; text: string }
        sent.push(body)
        return { ok: true, status: 200, text: async () => '', json: async () => ({ ok: true }) }
      }
      throw new Error(`unexpected ${url}`)
    }) as unknown as typeof fetch

    const service = activeServices[activeServices.push(new ChannelBridgeService(ctx)) - 1]
    ;(service as unknown as { source: () => unknown }).source = () => ({ instances: [
      {
        id: 'tg1', type: 'telegram', name: 'TG', isActive: true,
        config: {
          bot_token: 'tok', allowed_chat_ids: ['42'],
          agentProvider: 'fixture', agentModel: 'special', agentSystemPrompt: 'You are a Chinese-to-English translator.',
        },
      },
    ] })
    ;(service as unknown as { reconcile: () => void }).reconcile()

    await vi.waitFor(async () => {
      expect(sent).toHaveLength(1)
    })
    expect(prepareSpy).toHaveBeenCalledWith(expect.objectContaining({ provider: 'fixture', model: 'special' }))
    expect(prepareSpy).not.toHaveBeenCalledWith(expect.objectContaining({ model: 'default-model' }))
    const seenSystem = adapter.seen.map(options => options.system)
    expect(seenSystem).toContain('You are a Chinese-to-English translator.')
    expect(sent[0]).toMatchObject({ chat_id: 42, text: 'BOUND' })
    service.getLog('tg1')
  })

  it('ignores chats outside allowed_chat_ids without replying or calling the model', async () => {
    const ctx = new Context()
    const llm = new LlmRuntime(ctx)
    const prepareSpy = vi.spyOn(llm, 'prepareCall')
    llm.registerAdapter(['fixture'], new ReplyAdapter('PONG'))
    const settings = {
      describe: () => ([
        { ns: 'agent-default-model', value: { provider: 'fixture', model: 'best' }, schema: {}, revision: 1 },
      ]),
      register: vi.fn(() => ({ get: () => ({ instances: [] }), watch: vi.fn(() => () => {}), update: vi.fn(async () => {}) })),
    }
    ;(ctx as unknown as { settings: unknown }).settings = settings

    const sendCalls: number[] = []
    globalThis.fetch = (async (input: string | URL) => {
      const url = String(input)
      if (url.includes('/getUpdates')) {
        return { ok: true, status: 200, text: async () => '', json: async () => ({ ok: true, result: [{
          update_id: 8,
          message: { text: 'stranger', chat: { id: 999 } },
        }] }) }
      }
      if (url.includes('/sendMessage')) sendCalls.push(1)
      throw new Error(`unexpected ${url}`)
    }) as unknown as typeof fetch

    const service = activeServices[activeServices.push(new ChannelBridgeService(ctx)) - 1]
    ;(service as unknown as { source: () => unknown }).source = () => ({ instances: [
      { id: 'tg9', type: 'telegram', name: 'TG9', isActive: true, config: { bot_token: 'tok', allowed_chat_ids: ['42'] } },
    ] })
    ;(service as unknown as { reconcile: () => void }).reconcile()

    await new Promise(resolve => setTimeout(resolve, 60))
    expect(sendCalls).toHaveLength(0)
    expect(prepareSpy).not.toHaveBeenCalled()
    const log = service.getLog('tg9', 50)
    expect(log.some(line => line.includes('忽略非允许会话 999'))).toBe(true)
  })

  it('falls back to the configured route when the primary model keeps failing', async () => {
    const ctx = new Context()
    const llm = new LlmRuntime(ctx)
    const prepareSpy = vi.spyOn(llm, 'prepareCall')
    llm.registerAdapter(['fixture'], new ReplyAdapter('PONG'))

    const settings = {
      describe: () => ([
        { ns: 'agent-default-model', value: { provider: 'dead', model: 'gone' }, schema: {}, revision: 1 },
        {
          ns: 'control-center-model-prefs',
          value: { retryEnabled: true, retryMaxAttempts: 1, retryBackoff: false, retryFallbacks: [{ provider: 'fixture', model: 'best' }] },
          schema: {}, revision: 2,
        },
      ]),
      register: vi.fn(() => ({ get: () => ({ instances: [] }), watch: vi.fn(() => () => {}), update: vi.fn(async () => {}) })),
    }
    ;(ctx as unknown as { settings: unknown }).settings = settings

    const sent: Array<{ chat_id: number; text: string }> = []
    globalThis.fetch = (async (input: string | URL, init?: { method?: string; body?: string }) => {
      const url = String(input)
      if (url.includes('/getUpdates')) {
        return { ok: true, status: 200, text: async () => '', json: async () => ({ ok: true, result: [{
          update_id: 9,
          message: { text: 'ping', chat: { id: 42 } },
        }] }) }
      }
      if (url.includes('/sendMessage')) {
        const body = JSON.parse(init?.body ?? '{}') as { chat_id: number; text: string }
        sent.push(body)
        return { ok: true, status: 200, text: async () => '', json: async () => ({ ok: true }) }
      }
      throw new Error(`unexpected ${url}`)
    }) as unknown as typeof fetch

    const service = activeServices[activeServices.push(new ChannelBridgeService(ctx)) - 1]
    ;(service as unknown as { source: () => unknown }).source = () => ({ instances: [
      { id: 'tg2', type: 'telegram', name: 'TG2', isActive: true, config: { bot_token: 'tok', allowed_chat_ids: ['42'] } },
    ] })
    ;(service as unknown as { reconcile: () => void }).reconcile()

    await vi.waitFor(async () => {
      expect(sent).toHaveLength(1)
    })
    // The unconfigured primary route costs its full attempt budget (first
    // request + one retry) before the fallback route answers with its own.
    expect(prepareSpy).toHaveBeenCalledTimes(3)
    expect(sent[0]).toMatchObject({ chat_id: 42, text: 'PONG' })
    expect(service.getLog('tg2', 50).some(line => line.includes('重试'))).toBe(true)
  })

  it('runs a bound channel through the host agent loop session and delivers the collected assistant text', async () => {
    const ctx = new Context()
    const llm = new LlmRuntime(ctx)
    const prepareSpy = vi.spyOn(llm, 'prepareCall')
    llm.registerAdapter(['fixture'], new ReplyAdapter('SHOULD-NOT-BE-USED'))

    const settings = {
      describe: () => ([
        { ns: 'agent-default-model', value: { provider: 'fixture', model: 'default-model' }, schema: {}, revision: 1 },
      ]),
      register: vi.fn(() => ({ get: () => ({ instances: [] }), watch: vi.fn(() => () => {}), update: vi.fn(async () => {}) })),
    }
    ;(ctx as unknown as { settings: unknown }).settings = settings

    selectRoutes.length = 0
    const { controller, calls } = fakeSessionController({ reply: { text: 'AGENT REPLY' } })
    const realGet = ctx.get.bind(ctx)
    ;(ctx as unknown as { get: unknown }).get = (name: string) => (name === 'sessionController' ? controller : realGet(name))

    const sent: Array<{ chat_id: number; text: string }> = []
    globalThis.fetch = (async (input: string | URL, init?: { method?: string; body?: string }) => {
      const url = String(input)
      if (url.includes('/getUpdates')) {
        return { ok: true, status: 200, text: async () => '', json: async () => ({ ok: true, result: [{
          update_id: 10,
          message: { text: 'ping', chat: { id: 42 } },
        }] }) }
      }
      if (url.includes('/sendMessage')) {
        const body = JSON.parse(init?.body ?? '{}') as { chat_id: number; text: string }
        sent.push(body)
        return { ok: true, status: 200, text: async () => '', json: async () => ({ ok: true }) }
      }
      throw new Error(`unexpected ${url}`)
    }) as unknown as typeof fetch

    const service = activeServices[activeServices.push(new ChannelBridgeService(ctx)) - 1]
    ;(service as unknown as { source: () => unknown }).source = () => ({ instances: [
      {
        id: 'tg-agent', type: 'telegram', name: 'TG', isActive: true,
        config: { bot_token: 'tok', allowed_chat_ids: ['42'], agentProvider: 'fixture', agentModel: 'special' },
      },
    ] })
    ;(service as unknown as { reconcile: () => void }).reconcile()

    await vi.waitFor(async () => {
      expect(sent).toHaveLength(1)
    }, { timeout: 10_000 })
    expect(calls.create).toBe(1)
    expect(calls.prompts).toHaveLength(1)
    expect(calls.follows).toBe(1)
    expect(prepareSpy).not.toHaveBeenCalled()
    expect(selectRoutes).toEqual([{ sessionId: 'sess-1', provider: 'fixture', model: 'special' }])
    expect(sent[0]).toMatchObject({ chat_id: 42, text: 'AGENT REPLY' })
    console.log('DEBUG LOG:', JSON.stringify(service.getLog('tg-agent', 50), null, 1))
  })

  it('falls back to direct LLM when the agent-loop session fails', async () => {
    const ctx = new Context()
    const llm = new LlmRuntime(ctx)
    const prepareSpy = vi.spyOn(llm, 'prepareCall')
    llm.registerAdapter(['fixture'], new ReplyAdapter('FALLBACK'))

    const settings = {
      describe: () => ([
        { ns: 'agent-default-model', value: { provider: 'fixture', model: 'best' }, schema: {}, revision: 1 },
      ]),
      register: vi.fn(() => ({ get: () => ({ instances: [] }), watch: vi.fn(() => () => {}), update: vi.fn(async () => {}) })),
    }
    ;(ctx as unknown as { settings: unknown }).settings = settings

    const { controller } = fakeSessionController({ failCreate: 'session store down' })
    const realGet = ctx.get.bind(ctx)
    ;(ctx as unknown as { get: unknown }).get = (name: string) => (name === 'sessionController' ? controller : realGet(name))

    const sent: Array<{ chat_id: number; text: string }> = []
    globalThis.fetch = (async (input: string | URL, init?: { method?: string; body?: string }) => {
      const url = String(input)
      if (url.includes('/getUpdates')) {
        return { ok: true, status: 200, text: async () => '', json: async () => ({ ok: true, result: [{
          update_id: 11,
          message: { text: 'ping', chat: { id: 42 } },
        }] }) }
      }
      if (url.includes('/sendMessage')) {
        const body = JSON.parse(init?.body ?? '{}') as { chat_id: number; text: string }
        sent.push(body)
        return { ok: true, status: 200, text: async () => '', json: async () => ({ ok: true }) }
      }
      throw new Error(`unexpected ${url}`)
    }) as unknown as typeof fetch

    const service = activeServices[activeServices.push(new ChannelBridgeService(ctx)) - 1]
    ;(service as unknown as { source: () => unknown }).source = () => ({ instances: [
      {
        id: 'tg-fb', type: 'telegram', name: 'TG', isActive: true,
        config: { bot_token: 'tok', allowed_chat_ids: ['42'], agentProvider: 'fixture', agentModel: 'special' },
      },
    ] })
    ;(service as unknown as { reconcile: () => void }).reconcile()

    await vi.waitFor(async () => {
      expect(sent).toHaveLength(1)
    }, { timeout: 10_000 })
    // Fallback keeps the binding's own route (only the transport changed).
    expect(prepareSpy).toHaveBeenCalledWith(expect.objectContaining({ provider: 'fixture', model: 'special' }))
    expect(sent[0]).toMatchObject({ chat_id: 42, text: 'FALLBACK' })
    expect(service.getLog('tg-fb', 50).some(line => line.includes('回退直连模型'))).toBe(true)
  })

  it('persists the created agent session id back into the channel config', async () => {
    const ctx = new Context()
    const llm = new LlmRuntime(ctx)
    llm.registerAdapter(['fixture'], new ReplyAdapter('UNUSED'))

    let storedInstances: unknown[] = []
    const updates: Array<{ instances?: unknown[] }> = []
    const settings = {
      describe: () => ([]),
      register: vi.fn(() => ({
        get: () => ({ instances: storedInstances }),
        watch: vi.fn(() => () => {}),
        update: async (patch: { instances?: unknown[] }) => {
          updates.push(patch)
          if (Array.isArray(patch.instances)) storedInstances = patch.instances
        },
      })),
    }
    ;(ctx as unknown as { settings: unknown }).settings = settings

    const { controller } = fakeSessionController({ create: async () => ({ sessionId: 'sess-persist' }), reply: { text: 'DONE' } })
    const realGet = ctx.get.bind(ctx)
    ;(ctx as unknown as { get: unknown }).get = (name: string) => (name === 'sessionController' ? controller : realGet(name))

    const sent: Array<{ chat_id: number; text: string }> = []
    globalThis.fetch = (async (input: string | URL, init?: { method?: string; body?: string }) => {
      const url = String(input)
      if (url.includes('/getUpdates')) {
        return { ok: true, status: 200, text: async () => '', json: async () => ({ ok: true, result: [{
          update_id: 12,
          message: { text: 'ping', chat: { id: 52 } },
        }] }) }
      }
      if (url.includes('/sendMessage')) {
        const body = JSON.parse(init?.body ?? '{}') as { chat_id: number; text: string }
        sent.push(body)
        return { ok: true, status: 200, text: async () => '', json: async () => ({ ok: true }) }
      }
      throw new Error(`unexpected ${url}`)
    }) as unknown as typeof fetch

    const service = activeServices[activeServices.push(new ChannelBridgeService(ctx)) - 1]
    ;(service as unknown as { source: () => unknown }).source = () => ({ instances: [
      {
        id: 'tg-persist', type: 'telegram', name: 'TG', isActive: true,
        config: { bot_token: 'tok', allowed_chat_ids: ['52'], agentProvider: 'fixture', agentModel: 'special' },
      },
    ] })
    ;(service as unknown as { reconcile: () => void }).reconcile()

    await vi.waitFor(async () => {
      expect(sent).toHaveLength(1)
    }, { timeout: 10_000 })
    expect(updates).toHaveLength(1)
    expect(updates[0]?.instances).toHaveLength(1)
    expect((updates[0]?.instances?.[0] as { config?: { agentSessionId?: string } })?.config?.agentSessionId).toBe('sess-persist')
  })

  it('resumes a persisted agent session after restart without creating a new one', async () => {
    const ctx = new Context()
    const llm = new LlmRuntime(ctx)
    llm.registerAdapter(['fixture'], new ReplyAdapter('UNUSED'))

    const settings = {
      describe: () => ([]),
      register: vi.fn(() => ({ get: () => ({ instances: [] }), watch: vi.fn(() => () => {}), update: vi.fn(async () => {}) })),
    }
    ;(ctx as unknown as { settings: unknown }).settings = settings

    const { controller, calls } = fakeSessionController({ reply: { text: 'RESUMED', turn: 3 } })
    const realGet = ctx.get.bind(ctx)
    ;(ctx as unknown as { get: unknown }).get = (name: string) => (name === 'sessionController' ? controller : realGet(name))

    const sent: Array<{ chat_id: number; text: string }> = []
    globalThis.fetch = (async (input: string | URL, init?: { method?: string; body?: string }) => {
      const url = String(input)
      if (url.includes('/getUpdates')) {
        return { ok: true, status: 200, text: async () => '', json: async () => ({ ok: true, result: [{
          update_id: 13,
          message: { text: 'ping', chat: { id: 62 } },
        }] }) }
      }
      if (url.includes('/sendMessage')) {
        const body = JSON.parse(init?.body ?? '{}') as { chat_id: number; text: string }
        sent.push(body)
        return { ok: true, status: 200, text: async () => '', json: async () => ({ ok: true }) }
      }
      throw new Error(`unexpected ${url}`)
    }) as unknown as typeof fetch

    const service = activeServices[activeServices.push(new ChannelBridgeService(ctx)) - 1]
    ;(service as unknown as { source: () => unknown }).source = () => ({ instances: [
      {
        id: 'tg-resume', type: 'telegram', name: 'TG', isActive: true,
        config: {
          bot_token: 'tok', allowed_chat_ids: ['62'],
          agentProvider: 'fixture', agentModel: 'special', agentSessionId: 'old-sess',
        },
      },
    ] })
    ;(service as unknown as { reconcile: () => void }).reconcile()

    await vi.waitFor(async () => {
      expect(sent).toHaveLength(1)
    }, { timeout: 10_000 })
    expect(calls.create).toBe(0)
    expect(calls.prompts).toHaveLength(1)
    expect(sent[0]).toMatchObject({ chat_id: 62, text: 'RESUMED' })
    expect(service.getLog('tg-resume', 50).some(line => line.includes('已恢复 Agent 会话'))).toBe(true)
  })
})
