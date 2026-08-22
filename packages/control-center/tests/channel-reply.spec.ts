import { Context } from '@deepseek-ai/cordis'
import { LlmAdapter, LlmRuntime, type GenerateOptions, type StreamChunk } from '@deepseek-ai/dsh-llm'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChannelBridgeService } from '../src/channel-bridge.ts'

const realFetch = globalThis.fetch

afterEach(() => { globalThis.fetch = realFetch })

class ReplyAdapter extends LlmAdapter {
  constructor(private readonly reply: string) { super() }
  override async *stream(_options: GenerateOptions): AsyncIterable<StreamChunk> {
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: this.reply }
    yield { type: 'block-end', index: 0, block: { type: 'text', text: this.reply } }
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

    const service = new ChannelBridgeService(ctx)
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

    const service = new ChannelBridgeService(ctx)
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

    const service = new ChannelBridgeService(ctx)
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
})
