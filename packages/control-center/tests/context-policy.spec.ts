import { Context, Service } from '@deepseek-ai/cordis'
import { LlmAdapter, LlmRuntime, type GenerateOptions, type StreamChunk } from '@deepseek-ai/dsh-llm'
import { describe, expect, it } from 'vitest'
import type { ContentBlock } from '@deepseek-ai/dsh-llm/types'
import type { PostToolDecision, ToolExecution, ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import {
  contextCodePointLength,
  createContextToolOutputPreview,
  flattenContextToolOutput,
  installContextPolicy,
  normalizeContextMaxMessages,
  omitContextWindow,
  resolveContextCompressionTarget,
  selectContextWindow,
  type ContextPolicySettings,
} from '../src/context-policy.ts'

const signal = new AbortController().signal

function execution(overrides: Partial<ToolExecution> = {}): ToolExecution {
  return {
    callId: 'call-1',
    name: 'search',
    arguments: {},
    signal,
    ...overrides,
  } as ToolExecution
}

function result(content: ContentBlock[]): ToolExecutionResult {
  return { content, isError: false, value: null } as ToolExecutionResult
}

class FakeSpillStore extends Service {
  saves: Array<{
    content: string
    owner: { sessionId: string }
    source: { toolName: string; callId: string; label: 'result' | 'dispatch' }
  }> = []

  constructor(ctx: Context) {
    super(ctx, 'spillStore')
  }

  async saveText(input: {
    content: string
    owner: { sessionId: string }
    source: { toolName: string; callId: string; label: 'result' | 'dispatch' }
  }) {
    this.saves.push({ content: input.content, owner: input.owner, source: input.source })
    return { locator: '/private/search.txt', retrievalHint: 'Use read.' }
  }
}

class RecordingAdapter extends LlmAdapter {
  readonly seen: GenerateOptions[] = []

  override async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    this.seen.push(options)
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

class FakeTokenMeter extends Service {
  constructor(ctx: Context) {
    super(ctx, 'tokenMeter')
  }

  estimateMessage(entry: { content: unknown[] }): number {
    return entry.content.length * 7
  }
}

class FakeAgentPresets extends Service {
  calls: Array<{ start: number; end: number; signal: AbortSignal | undefined }> = []

  constructor(ctx: Context) {
    super(ctx, 'agentPresets')
  }

  serviceFor() {
    return {
      compactRegion: async (start: number, end: number, _agent: unknown, callSignal?: AbortSignal) => {
        this.calls.push({ start, end, signal: callSignal })
      },
    }
  }
}

function settings(overrides: Partial<ContextPolicySettings> = {}): ContextPolicySettings {
  return {
    contextEnabled: true,
    contextMaxMessages: null,
    contextToolOutputThreshold: 2_000,
    contextAutoCompress: true,
    contextCompressionProvider: '',
    contextCompressionModel: '',
    ...overrides,
  }
}

async function post(
  ctx: Context,
  exec: ToolExecution,
  output: ToolExecutionResult,
  next: () => Promise<PostToolDecision>,
): Promise<PostToolDecision> {
  return await ctx.waterfall(
    ctx as never,
    'tools/post-execute',
    exec,
    output,
    next,
  )
}

async function dispatchLog(
  ctx: Context,
  exec: ToolExecution,
  name: string,
  subCallId: string,
  content: ContentBlock[],
): Promise<ContentBlock[]> {
  return await ctx.waterfall(
    ctx as never,
    'tools/code-dispatch-log',
    { exec, agent: (exec as { agent?: unknown }).agent, name, subCallId, isError: false, content } as never,
    async () => content,
  )
}

async function preStep(
  ctx: Context,
  agent: { session: ReturnType<typeof fakeSession>; options: Record<string, never> },
  stepSignal: AbortSignal,
  next: () => Promise<unknown>,
): Promise<unknown> {
  return await ctx.waterfall(
    ctx as never,
    'agent/pre-step',
    { agent, messages: [], turn: 1, step: 1, signal: stepSignal } as never,
    next as never,
  )
}

async function drain(stream: AsyncIterable<unknown>): Promise<void> {
  for await (const _chunk of stream) { /* drain */ }
}

interface FakeEvent {
  type: string
  data: Record<string, unknown>
}

function message(role: 'user' | 'assistant', text: string, source: Record<string, unknown>) {
  return { role, content: [{ type: 'text', text }], source }
}

function fakeSession(events: FakeEvent[], nodes: number[]) {
  const appends: Array<{ type: string; data: unknown; options: unknown }> = []
  return {
    surface: { nodes },
    events,
    appends,
    deriveEventMessage(event: FakeEvent) {
      switch (event.type) {
        case 'user/message': return event.data as never
        case 'assistant/message': return (event.data.message ?? null) as never
        case 'tool/result': return (event.data.message ?? null) as never
        default: return null
      }
    },
    append(type: string, data: unknown, options?: unknown) {
      appends.push({ type, data, options })
    },
  }
}

describe('ContextPolicy tool-output truncation', () => {
  it('keeps plain text intact for small results and rich blocks', () => {
    expect(flattenContextToolOutput([{ type: 'text', text: 'small' }])).toBe('small')
    expect(flattenContextToolOutput([
      { type: 'text', text: 'small' },
      { type: 'reasoning', text: 'private' },
    ] as ContentBlock[])).toBeUndefined()
  })

  it('builds a Unicode-safe preview within the configured character limit', () => {
    const full = `${'😀'.repeat(1_000)}\n${'tail'.repeat(1_000)}`
    const preview = createContextToolOutputPreview(full, 2_000, {
      locator: '/private/spill.txt',
      retrievalHint: 'Use read with offset/limit.',
    })

    expect(preview).toBeDefined()
    expect(contextCodePointLength(preview!)).toBeLessThanOrEqual(2_000)
    expect(preview).toContain('truncated (2 lines, 5001 chars total)')
    expect(preview).toContain('Full formatted result stored at: /private/spill.txt')
    expect(preview).not.toContain('�')
  })

  it('uses the latest settings and preserves downstream contexts', async () => {
    const ctx = new Context()
    let currentSettings = settings({ contextToolOutputThreshold: 2_000 })
    const spill = new FakeSpillStore(ctx)
    installContextPolicy(ctx, () => currentSettings)

    const downstreamContexts = [{ id: 'notice' }] as never
    const full = `${'head'.repeat(900)}${'tail'.repeat(900)}`
    const decision = await post(
      ctx,
      execution({ agent: { session: { header: { id: 'session-1' } } } as never }),
      result([{ type: 'text', text: full }]),
      async () => ({ kind: 'accept', additionalContexts: downstreamContexts }),
    )

    expect(spill.saves).toEqual([{
      content: full,
      owner: { sessionId: 'session-1' },
      source: { toolName: 'search', callId: 'call-1', label: 'result' },
    }])
    expect(decision.kind).toBe('accept')
    if (decision.kind !== 'accept') throw new Error('expected accepted result')
    expect(decision.additionalContexts).toBe(downstreamContexts)
    expect(decision.content?.[0]).toMatchObject({ type: 'text' })
    const text = decision.content?.[0]
    expect(text?.type === 'text' ? contextCodePointLength(text.text) : Number.POSITIVE_INFINITY).toBeLessThanOrEqual(2_000)

    currentSettings = settings({ contextEnabled: false, contextToolOutputThreshold: 2_000 })
    const disabled = await post(
      ctx,
      execution({ agent: { session: { header: { id: 'session-1' } } } as never }),
      result([{ type: 'text', text: full }]),
      async () => ({ kind: 'accept' }),
    )
    expect(disabled).toEqual({ kind: 'accept' })
    expect(spill.saves).toHaveLength(1)
  })

  it('spills an oversized Code Mode dispatch log without changing its original content', async () => {
    const ctx = new Context()
    const spill = new FakeSpillStore(ctx)
    installContextPolicy(ctx, () => settings({ contextToolOutputThreshold: 2_000 }))
    const full = 'D'.repeat(3_000)
    const exec = execution({
      name: 'run_code',
      agent: { session: { header: { id: 'session-code' } } } as never,
    })

    const logged = await dispatchLog(ctx, exec, 'read', 'call-1:code:1', [{ type: 'text', text: full }])

    expect(spill.saves).toEqual([{
      content: full,
      owner: { sessionId: 'session-code' },
      source: { toolName: 'read', callId: 'call-1:code:1', label: 'dispatch' },
    }])
    expect(logged).toHaveLength(1)
    const block = logged[0]
    expect(block?.type === 'text' ? contextCodePointLength(block.text) : Number.POSITIVE_INFINITY).toBeLessThanOrEqual(2_000)
  })

  it('passes through results without a spill backend or a session owner', async () => {
    const ctx = new Context()
    installContextPolicy(ctx, () => settings())
    const full = 'x'.repeat(3_000)

    const noOwner = await post(ctx, execution(), result([{ type: 'text', text: full }]), async () => ({ kind: 'accept' }))
    expect(noOwner).toEqual({ kind: 'accept' })

    const valueReplacement = await post(
      ctx,
      execution(),
      result([{ type: 'text', text: full }]),
      async () => ({ kind: 'accept', value: null }),
    )
    expect(valueReplacement).toEqual({ kind: 'accept', value: null })

    const richDispatch = await dispatchLog(
      ctx,
      execution({ agent: { session: { header: { id: 'session-1' } } } as never }),
      'read',
      'call-1:code:1',
      [{ type: 'text', text: full }, { type: 'reasoning', text: 'private' }] as ContentBlock[],
    )
    expect(richDispatch).toHaveLength(2)
  })
})

describe('ContextPolicy message window', () => {
  it('normalizes only positive safe-integer message limits', () => {
    expect(normalizeContextMaxMessages(2)).toBe(2)
    expect(normalizeContextMaxMessages(null)).toBeNull()
    expect(normalizeContextMaxMessages(2.8)).toBeNull()
    expect(normalizeContextMaxMessages(0)).toBeNull()
    expect(normalizeContextMaxMessages(Number.NaN)).toBeNull()
    expect(normalizeContextMaxMessages(Number.MAX_SAFE_INTEGER + 1)).toBeNull()
  })

  it('extends the retained tail to a user boundary without splitting a tool pair', () => {
    const events: FakeEvent[] = [
      { type: 'user/message', data: message('user', 'old user', { kind: 'user' }) },
      { type: 'assistant/message', data: { message: message('assistant', 'old answer', { kind: 'model' }) } },
      { type: 'user/message', data: message('user', 'tool prompt', { kind: 'user' }) },
      { type: 'assistant/message', data: { message: {
        role: 'assistant',
        content: [{ type: 'tool-call', id: 'call-1', name: 'search', arguments: '{}' }],
        source: { kind: 'model' },
      } } },
      { type: 'tool/result', data: { message: {
        role: 'user',
        content: [{ type: 'tool-result', toolCallId: 'call-1', content: [{ type: 'text', text: 'result' }] }],
        source: { kind: 'tool', callId: 'call-1' },
      } } },
      { type: 'assistant/message', data: { message: message('assistant', 'tool answer', { kind: 'model' }) } },
      { type: 'user/message', data: message('user', 'latest prompt', { kind: 'user' }) },
    ]
    const session = fakeSession(events, [0, 1, 2, 3, 4, 5, 6])

    const selection = selectContextWindow(session as never, 3)
    expect(selection).toEqual({ start: 0, end: 1, shadowedSeqs: [0, 1] })
  })

  it('writes an adjacent shadow price and omission checkpoint', () => {
    const events: FakeEvent[] = [
      { type: 'user/message', data: message('user', 'old user', { kind: 'user' }) },
      { type: 'assistant/message', data: { message: message('assistant', 'old answer', { kind: 'model' }) } },
      { type: 'user/message', data: message('user', 'recent', { kind: 'user' }) },
    ]
    const session = fakeSession(events, [0, 1, 2])
    const selection = selectContextWindow(session as never, 1)!
    const meter = { estimateMessage: (entry: { content: unknown[] }) => entry.content.length * 7 }

    omitContextWindow(session as never, selection, meter)

    expect(session.appends[0]).toEqual({
      type: 'compaction/prune',
      data: { shadowedRange: { start: 0, end: 1 }, shadowedSeqs: [0, 1], shadowedTokenCount: 14 },
      options: undefined,
    })
    expect(session.appends[1]).toMatchObject({
      type: 'user/message',
      data: {
        source: { kind: 'plugin', plugin: 'control-center-context-policy', form: 'notice' },
      },
      options: { surfaceOp: { op: 'replace', start: 0, end: 1 }, sourceEventSeqs: [0, 1] },
    })
  })

  it('uses a custom compression route only for a complete configured pair', () => {
    expect(resolveContextCompressionTarget({
      contextEnabled: true,
      contextAutoCompress: true,
      contextCompressionProvider: ' DeepSeek ',
      contextCompressionModel: ' deepseek-chat ',
    })).toEqual({ provider: 'DeepSeek', model: 'deepseek-chat' })
    expect(resolveContextCompressionTarget({
      contextEnabled: true,
      contextAutoCompress: true,
      contextCompressionProvider: 'DeepSeek',
      contextCompressionModel: '',
    })).toBeUndefined()
    expect(resolveContextCompressionTarget({
      contextEnabled: true,
      contextAutoCompress: false,
      contextCompressionProvider: 'DeepSeek',
      contextCompressionModel: 'deepseek-chat',
    })).toBeUndefined()
  })

  it('routes only mutable compaction requests through the configured summary model', async () => {
    const ctx = new Context()
    const llm = new LlmRuntime(ctx)
    const adapter = new RecordingAdapter()
    llm.registerAdapter(['conversation', 'summary'], adapter)
    installContextPolicy(ctx, () => settings({
      contextCompressionProvider: 'summary',
      contextCompressionModel: 'summary-model',
    }))

    await drain(llm.stream({ provider: 'conversation', model: 'conversation-model', messages: [] }))
    await drain(llm.stream({
      provider: 'conversation', model: 'conversation-model', messages: [], purpose: 'compaction',
    }))
    await drain(llm.stream(Object.freeze({
      provider: 'conversation', model: 'frozen-model', messages: [], purpose: 'compaction',
    })))

    expect(adapter.seen.map(request => ({ provider: request.provider, model: request.model, purpose: request.purpose }))).toEqual([
      { provider: 'conversation', model: 'conversation-model', purpose: undefined },
      { provider: 'summary', model: 'summary-model', purpose: 'compaction' },
      { provider: 'conversation', model: 'frozen-model', purpose: 'compaction' },
    ])
  })

  it('applies omission before downstream pre-step handling', async () => {
    const ctx = new Context()
    const meter = new FakeTokenMeter(ctx)
    installContextPolicy(ctx, () => settings({ contextMaxMessages: 1, contextAutoCompress: false }))
    const session = fakeSession([
      { type: 'user/message', data: message('user', 'old', { kind: 'user' }) },
      { type: 'assistant/message', data: { message: message('assistant', 'old reply', { kind: 'model' }) } },
      { type: 'user/message', data: message('user', 'recent', { kind: 'user' }) },
    ], [0, 1, 2])
    const agent = { session, options: {} }

    await preStep(ctx, agent, signal, async () => {
      expect(meter).toBeDefined()
      expect(session.appends.map(entry => entry.type)).toEqual(['compaction/prune', 'user/message'])
      return { kind: 'enter', messages: [] }
    })
  })

  it('uses the preset-isolated compaction service before downstream pre-step handling', async () => {
    const ctx = new Context()
    const presets = new FakeAgentPresets(ctx)
    installContextPolicy(ctx, () => settings({ contextMaxMessages: 1, contextAutoCompress: true }))
    const session = fakeSession([
      { type: 'user/message', data: message('user', 'old', { kind: 'user' }) },
      { type: 'assistant/message', data: { message: message('assistant', 'old reply', { kind: 'model' }) } },
      { type: 'user/message', data: message('user', 'recent', { kind: 'user' }) },
    ], [0, 1, 2])
    const agent = { session, options: {} }

    await preStep(ctx, agent, signal, async () => {
      expect(presets.calls).toEqual([{ start: 0, end: 1, signal }])
      return { kind: 'enter', messages: [] }
    })
    expect(session.appends).toHaveLength(0)
  })

  it('does not compact or omit after pre-step cancellation', async () => {
    const ctx = new Context()
    const meter = new FakeTokenMeter(ctx)
    const presets = new FakeAgentPresets(ctx)
    installContextPolicy(ctx, () => settings({ contextMaxMessages: 1, contextAutoCompress: false }))
    const session = fakeSession([
      { type: 'user/message', data: message('user', 'old', { kind: 'user' }) },
      { type: 'assistant/message', data: { message: message('assistant', 'old reply', { kind: 'model' }) } },
      { type: 'user/message', data: message('user', 'recent', { kind: 'user' }) },
    ], [0, 1, 2])
    const agent = { session, options: {} }

    await preStep(ctx, agent, AbortSignal.abort('cancelled'), async () => ({ kind: 'enter', messages: [] }))

    expect(meter).toBeDefined()
    expect(presets.calls).toEqual([])
    expect(session.appends).toHaveLength(0)
  })
})
