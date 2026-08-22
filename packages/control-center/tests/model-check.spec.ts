import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { LlmAdapter, LlmRuntime, type GenerateOptions, type StreamChunk } from '@deepseek-ai/dsh-llm'
import { ModelCheckService } from '../src/model-check.ts'

class OkAdapter extends LlmAdapter {
  override async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: 'OK' }
    yield { type: 'block-end', index: 0, block: { type: 'text', text: 'OK' } }
    yield { type: 'finish', reason: { kind: 'stop' } }
    void options
  }
}

class FailAdapter extends LlmAdapter {
  override async *stream(): AsyncIterable<StreamChunk> {
    yield { type: 'finish', reason: { kind: 'error', failure: { code: 'AUTH', message: '401 from provider' } } }
  }
}

describe('ModelCheckService', () => {
  it('completes a tiny real round-trip and reports latency plus reply', async () => {
    const ctx = new Context()
    const llm = new LlmRuntime(ctx)
    llm.registerAdapter(['fixture'], new OkAdapter())
    const service = new ModelCheckService(ctx)
    const result = await service.check('fixture', 'test-model')
    expect(result.ok).toBe(true)
    expect(result.reply).toContain('OK')
    expect(result.latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('surfaces a terminal provider failure as ok:false with its message', async () => {
    const ctx = new Context()
    const llm = new LlmRuntime(ctx)
    llm.registerAdapter(['fixture'], new FailAdapter())
    const service = new ModelCheckService(ctx)
    const result = await service.check('fixture', 'test-model')
    expect(result.ok).toBe(false)
    expect(result.error).toContain('401 from provider')
  })

  it('refuses blank routes before any provider call', async () => {
    const ctx = new Context()
    const llm = new LlmRuntime(ctx)
    llm.registerAdapter(['fixture'], new OkAdapter())
    const service = new ModelCheckService(ctx)
    // Call through the prototype: the decorated instance method may travel
    // the typert wrapper, which is exactly the path under test here.
    await expect(ModelCheckService.prototype.check.call(service, '', 'm')).rejects.toThrow('provider route')
    await expect(ModelCheckService.prototype.check.call(service, 'fixture', '  ')).rejects.toThrow('model id')
    await expect(service.check('fixture', '  ')).rejects.toThrow('model id')
  })
})
