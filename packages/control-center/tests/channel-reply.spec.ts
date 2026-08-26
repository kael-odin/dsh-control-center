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
      ] }) })),
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
      register: vi.fn(() => ({ get: () => ({ instances: [] }) })),
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
      register: vi.fn(() => ({ get: () => ({ instances: [] }) })),
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
      register: vi.fn(() => ({ get: () => ({ instances: [] }) })),
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
      register: vi.fn(() => ({ get: () => ({ instances: [] }) })),
    }
    ;(ctx as unknown as { settings: unknown }).settings = settings

    const calls = { create: 0, prompts: [] as string[], historyReads: 0 }
    const selectRoutes: Array<{ provider: string; model: string }> = []
    let prompted = false
    const ok = <T>(value: T) => ({ rpcId: 'test', result: { ok: true as const, value } })
    const fakeApi = {
      sessions: {
        create: async () => {
          calls.create++
          return ok({ sessionId: 'sess-1' })
        },
        selectModel: async (request: { payload: { provider: string; model: string } }) => {
          selectRoutes.push(request.payload)
          return ok({ selected: {} })
        },
        prompt: async (request: { payload: { content: Array<{ type: string; text?: string }> } }) => {
          const text = request.payload.content.find(part => part.type === 'text')?.text ?? ''
          calls.prompts.push(text)
          prompted = true
          return ok({ accepted: true as const })
        },
        history: async () => {
          calls.historyReads++
          // Before the prompt there is no log; afterwards one finished turn.
          if (!prompted) return ok({ events: [], hasMore: false })
          return ok({
            hasMore: false,
            events: [
              { event: { type: 'user/message', seq: 0, time: 0, data: { content: [{ type: 'text', text: 'ping' }] } } },
              {
                event: {
                  type: 'assistant/message', seq: 1, time: 0,
                  data: { turn: 0, step: 0, message: { role: 'assistant', content: [{ type: 'text', text: 'AGENT REPLY' }] } },
                },
              },
              { event: { type: 'turn/end', seq: 2, time: 0, data: { turn: 0, reason: { kind: 'completed' } } } },
            ],
          })
        },
      },
    }
    const realGet = ctx.get.bind(ctx)
    ;(ctx as unknown as { get: unknown }).get = (name: string) => (name === 'apiProxy' ? fakeApi : realGet(name))

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
    expect(calls.historyReads).toBeGreaterThanOrEqual(2)
    expect(prepareSpy).not.toHaveBeenCalled()
    expect(selectRoutes).toEqual([{ sessionId: 'sess-1', provider: 'fixture', model: 'special' }])
    expect(sent[0]).toMatchObject({ chat_id: 42, text: 'AGENT REPLY' })
    service.getLog('tg-agent')
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
      register: vi.fn(() => ({ get: () => ({ instances: [] }) })),
    }
    ;(ctx as unknown as { settings: unknown }).settings = settings

    const fakeApi = {
      sessions: {
        create: async () => ({
          rpcId: 'test',
          result: { ok: false as const, error: { code: 'internal', message: 'session store down', details: {} } },
        }),
      },
    }
    const realGet = ctx.get.bind(ctx)
    ;(ctx as unknown as { get: unknown }).get = (name: string) => (name === 'apiProxy' ? fakeApi : realGet(name))

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
})
