import { Context } from '@deepseek-ai/cordis'
import { LlmAdapter, LlmRuntime, type GenerateOptions, type StreamChunk } from '@deepseek-ai/dsh-llm'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GatewayService } from '../src/gateway.ts'

const realFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = realFetch })

class PongAdapter extends LlmAdapter {
  constructor(private readonly reply: string) { super() }
  override async *stream(_options: GenerateOptions): AsyncIterable<StreamChunk> {
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: this.reply }
    yield { type: 'block-end', index: 0, block: { type: 'text', text: this.reply } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

function makeService(port: number, apiKey: string): GatewayService {
  const ctx = new Context()
  const llm = new LlmRuntime(ctx)
  llm.registerAdapter(['fixture'], new PongAdapter('PONG'))
  ;(ctx as unknown as Record<string, unknown>).llm = llm
  ;(ctx as unknown as Record<string, unknown>).settings = {
    get: () => ({ port, apiKey }),
    update: async () => {},
    describe: () => ([
      { ns: 'agent-default-model', value: { provider: 'fixture', model: 'default' }, schema: {}, revision: 1 },
    ]),
  }
  ;(ctx as unknown as { logger: unknown }).logger = { info: () => {}, warn: () => {}, error: () => {} }
  return new GatewayService(ctx)
}

describe('GatewayService runtime', () => {
  it('serves OpenAI chat completions routed onto the host LLM', async () => {
    const service = makeService(0, 'sk-test')
    const started = await service.start()
    expect(started.ok).toBe(true)
    if (!started.ok) return
    const url = started.value.url
    expect(url).toContain('127.0.0.1')

    const response = await fetch(`${url}/chat/completions`, {
      method: 'POST',
      headers: { authorization: 'Bearer sk-test', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'fixture/best', messages: [{ role: 'user', content: 'ping' }] }),
    })
    expect(response.status).toBe(200)
    const payload = await response.json() as { choices: Array<{ message: { content: string } }> }
    expect(payload.choices[0]?.message.content).toBe('PONG')

    const stopped = await service.stop()
    expect(stopped.value.running).toBe(false)
  })

  it('rejects wrong keys with 401 and unknown models fall back to the default route', async () => {
    const service = makeService(0, 'sk-secret')
    const started = await service.start()
    if (!started.ok) throw new Error(started.error)
    const url = started.value.url

    const bad = await fetch(`${url}/chat/completions`, {
      method: 'POST',
      headers: { authorization: 'Bearer wrong', 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    })
    expect(bad.status).toBe(401)

    const fallback = await fetch(`${url}/chat/completions`, {
      method: 'POST',
      headers: { authorization: 'Bearer sk-secret', 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    })
    expect(fallback.status).toBe(200)
    await service.stop()
  })

  it('streams OpenAI SSE chunks and closes with [DONE]', async () => {
    const service = makeService(0, 'sk-s')
    const started = await service.start()
    if (!started.ok) throw new Error(started.error)
    const url = started.value.url

    const response = await fetch(`${url}/chat/completions`, {
      method: 'POST',
      headers: { authorization: 'Bearer sk-s', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'fixture/best', stream: true, messages: [{ role: 'user', content: 'hi' }] }),
    })
    expect(response.headers.get('content-type')).toContain('text/event-stream')
    const text = await response.text()
    expect(text).toContain('chat.completion.chunk')
    expect(text).toContain('[DONE]')
    await service.stop()
  })

  it('refuses to start without an API key', async () => {
    const service = makeService(0, '')
    const started = await service.start()
    expect(started).toMatchObject({ ok: false })
  })

  it('exposes an anthropic-compatible /v1/messages endpoint', async () => {
    const service = makeService(0, 'sk-a')
    const started = await service.start()
    if (!started.ok) throw new Error(started.error)
    const response = await fetch(`${started.value.url}/messages`, {
      method: 'POST',
      headers: { authorization: 'Bearer sk-a', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'fixture/best', messages: [{ role: 'user', content: 'hi' }] }),
    })
    const payload = await response.json() as { type: string; content: Array<{ text: string }> }
    expect(payload.type).toBe('message')
    expect(payload.content[0]?.text).toBe('PONG')
    await service.stop()
  })
})
