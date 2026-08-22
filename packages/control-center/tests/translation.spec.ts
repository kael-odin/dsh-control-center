import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { LlmAdapter, LlmRuntime, type GenerateOptions, type StreamChunk } from '@deepseek-ai/dsh-llm'
import { TranslationService } from '../src/translation.ts'

/** The LlmRuntime a bare test context wired up. */
function llmOf(ctx: Context): LlmRuntime {
  return ctx.get('llm') as LlmRuntime
}

class TranslationAdapter extends LlmAdapter {
  override async * stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    if (options.signal?.aborted) {
      yield { type: 'finish', reason: { kind: 'aborted', failure: { code: 'ABORTED', message: 'cancelled' } } }
      return
    }
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: '你好，世界' }
    yield { type: 'block-end', index: 0, block: { type: 'text', text: '你好，世界' } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

/** Always fails with a terminal error finish — the retry/fallback trigger. */
class FailingAdapter extends LlmAdapter {
  override async * stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    if (options.signal?.aborted) {
      yield { type: 'finish', reason: { kind: 'aborted', failure: { code: 'ABORTED', message: 'cancelled' } } }
      return
    }
    yield { type: 'finish', reason: { kind: 'error', failure: { code: 'PROVIDER_DOWN', message: 'boom' } } }
  }
}

/** Attach the shared model-prefs namespace the way the settings provider does. */
function installPrefs(ctx: Context, value: Record<string, unknown>): void {
  ;(ctx as unknown as { settings: unknown }).settings = {
    describe: () => [{ ns: 'control-center-model-prefs', value }],
  }
}

async function setup() {
  const ctx = new Context()
  const llm = new LlmRuntime(ctx)
  llm.registerAdapter(['fixture'], new TranslationAdapter())
  const service = new TranslationService(ctx)
  return { ctx, service }
}

async function settle(service: TranslationService, jobId: string) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const job = service.get(jobId)
    if (job.status !== 'running') return job
    await new Promise(resolve => setTimeout(resolve, 1))
  }
  throw new Error('translation job did not settle')
}

describe('TranslationService', () => {
  it('runs outside coding sessions and records paginated history', async () => {
    const { ctx, service } = await setup()
    const started = service.start({
      sourceLanguage: 'auto', targetLanguage: 'zh-CN', text: 'Hello world',
      selection: { provider: 'fixture', model: 'translate-1' },
    })
    const job = await settle(service, started.jobId)
    expect(job.status).toBe('completed')
    expect(job.output).toBe('你好，世界')
    const history = service.listHistory(null, 20)
    expect(history.items).toHaveLength(1)
    expect(history.items[0]).toMatchObject({ sourceText: 'Hello world', translatedText: '你好，世界' })
    service.deleteHistory(history.items[0]!.id)
    expect(service.listHistory(null, 20).items).toEqual([])
  })

  it('manages custom languages without changing built-ins', async () => {
    const { ctx, service } = await setup()
    expect(service.languages().source.some(item => item.id === 'auto')).toBe(true)
    expect(service.putLanguage('eo', 'Esperanto')).toEqual({ id: 'eo', label: 'Esperanto', builtin: false })
    expect(service.languages().target.some(item => item.id === 'eo')).toBe(true)
    service.deleteLanguage('eo')
    expect(service.languages().target.some(item => item.id === 'eo')).toBe(false)
  })

  it('rejects blank input before a provider call', async () => {
    const { ctx, service } = await setup()
    expect(() => service.start({
      sourceLanguage: 'auto', targetLanguage: 'zh-CN', text: '   ',
      selection: { provider: 'fixture', model: 'translate-1' },
    })).toThrow('must not be blank')
  })

  it('falls back to the configured route when the primary one has no adapter', async () => {
    const { ctx, service } = await setup()
    installPrefs(ctx, {
      retryEnabled: false,
      retryFallbacks: [{ provider: 'fixture', model: 'translate-1' }],
    })
    const started = service.start({
      sourceLanguage: 'auto', targetLanguage: 'zh-CN', text: 'Hello world',
      selection: { provider: 'broken', model: 'nope' },
    })
    const job = await settle(service, started.jobId)
    expect(job.status).toBe('completed')
    expect(job.output).toBe('你好，世界')
  })

  it('retries a failing primary before moving on, then reports the last failure', async () => {
    const { ctx, service } = await setup()
    llmOf(ctx).registerAdapter(['broken'], new FailingAdapter())
    installPrefs(ctx, {
      retryEnabled: true,
      retryMaxAttempts: 2,
      retryBackoff: false,
      retryFallbacks: [{ provider: 'also-broken', model: 'x' }],
    })
    llmOf(ctx).registerAdapter(['also-broken'], new FailingAdapter())
    const started = service.start({
      sourceLanguage: 'auto', targetLanguage: 'zh-CN', text: 'Hello world',
      selection: { provider: 'broken', model: 'f1' },
    })
    const job = await settle(service, started.jobId)
    expect(job.status).toBe('error')
    expect(job.failure?.message).toBe('boom')
  })

  it('does not retry when the policy is disabled', async () => {
    const { ctx, service } = await setup()
    const llm = llmOf(ctx)
    installPrefs(ctx, { retryEnabled: false, retryMaxAttempts: 5, retryBackoff: false })
    const prepare = vi.spyOn(llm, 'prepareCall')
    const started = service.start({
      sourceLanguage: 'auto', targetLanguage: 'zh-CN', text: 'Hello world',
      // No adapter for this provider: every attempt fails before dispatch.
      selection: { provider: 'ghost', model: 'f1' },
    })
    const job = await settle(service, started.jobId)
    expect(job.status).toBe('error')
    expect(prepare).toHaveBeenCalledTimes(1)
  })

  it('spends the full attempt budget per route when retries are enabled', async () => {
    const { ctx, service } = await setup()
    const llm = llmOf(ctx)
    installPrefs(ctx, { retryEnabled: true, retryMaxAttempts: 3, retryBackoff: false })
    const prepare = vi.spyOn(llm, 'prepareCall')
    const started = service.start({
      sourceLanguage: 'auto', targetLanguage: 'zh-CN', text: 'Hello world',
      // No adapter for this provider: every attempt fails before dispatch.
      selection: { provider: 'ghost', model: 'f1' },
    })
    const job = await settle(service, started.jobId)
    expect(job.status).toBe('error')
    // maxAttempts retries AFTER the first request.
    expect(prepare).toHaveBeenCalledTimes(4)
  })
})
