/**
 * Live context policy for Control Center's General settings.
 *
 * The policy spills accepted plain-text tool results before DSH appends the
 * result to the session. It also turns a recent-message limit into a durable
 * surface replacement, so every model request remains reconstructable from the
 * session log.
 */

import type { Context } from '@deepseek-ai/cordis'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import type { ContentBlock, GenerateOptions, Message } from '@deepseek-ai/dsh-llm/types'
import type { PostToolDecision, ToolExecution, ToolExecutionResult } from '@deepseek-ai/dsh-tools'

/** Character counts Cherry retains around an oversized in-flight tool result. */
export const CONTEXT_TOOL_OUTPUT_HEAD_CHARS = 500
export const CONTEXT_TOOL_OUTPUT_TAIL_CHARS = 1_000

const CONTEXT_WINDOW_PLUGIN = 'control-center-context-policy'
const CONTEXT_WINDOW_SUMMARY = 'Earlier history omitted by the configured message window.'
const CONTEXT_WINDOW_CONTENT = 'Earlier conversation history was omitted by the configured recent-message window. Use the retained messages as the active context.'

/** The General-settings fields consumed by the live policy. */
export interface ContextPolicySettings {
  contextEnabled: boolean
  contextMaxMessages: unknown
  contextToolOutputThreshold: number
  contextAutoCompress: boolean
  contextCompressionProvider: string
  contextCompressionModel: string
}

interface SpillStore {
  saveText(input: {
    owner: { sessionId: string }
    source: { toolName: string; callId: string; label: 'result' | 'dispatch' }
    suggestedName: string
    content: string
  }): Promise<{
    locator: string
    retrievalHint: string
  }>
}

interface ContextPolicySession {
  readonly surface: { readonly nodes: readonly number[] }
  readonly events: readonly unknown[]
  deriveEventMessage(event: unknown): Message | null
  append(type: string, data: unknown, options?: unknown): unknown
}

interface ContextPolicyAgent {
  readonly session: ContextPolicySession
  readonly options: { provider?: string; model?: string }
}

interface SessionOwnedExecution {
  agent?: {
    session: {
      header: {
        id: string
      }
    }
  }
}

interface ContextPolicyCompaction {
  compactRegion(
    start: number,
    end: number,
    agent: ContextPolicyAgent,
    signal?: AbortSignal,
  ): Promise<unknown>
}

interface AgentPresets {
  serviceFor(agent: ContextPolicyAgent, name: 'compaction'): ContextPolicyCompaction | undefined
}

interface TokenMeter {
  estimateMessage(message: Message): number
}

/** One head range selected for a replay-safe context-window replacement. */
export interface ContextWindowSelection {
  start: number
  end: number
  shadowedSeqs: number[]
}

/** Count Unicode code points so a retained boundary cannot split a surrogate pair. */
export function contextCodePointLength(text: string): number {
  return Array.from(text).length
}

/** Normalize persisted values the settings document may contain outside the UI. */
export function normalizeContextMaxMessages(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1
    ? value
    : null
}

function countLines(text: string): number {
  let lines = 1
  for (const char of text) {
    if (char === '\n') lines++
  }
  return lines
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function eventType(event: unknown): string | undefined {
  const type = record(event)?.type
  return typeof type === 'string' ? type : undefined
}

function eventSource(event: unknown): Record<string, unknown> | undefined {
  return record(record(record(event)?.data)?.source)
}

function isContextCheckpoint(event: unknown): boolean {
  const source = eventSource(event)
  return eventType(event) === 'user/message'
    && source?.kind === 'plugin'
    && (source.plugin === CONTEXT_WINDOW_PLUGIN || source.plugin === 'compact')
}

function toolCallDelta(event: unknown): number | undefined {
  switch (eventType(event)) {
    case 'assistant/message': {
      const message = record(record(record(event)?.data)?.message)
      const content = Array.isArray(message?.content) ? message.content : undefined
      if (content === undefined) return undefined
      return content.filter(block => record(block)?.type === 'tool-call').length
    }
    case 'tool/result':
      return -1
    case 'user/message':
      return 0
    default:
      return undefined
  }
}

/** Whether the cut before `index` leaves no assistant tool call unpaired. */
function isToolPairingBalancedAt(
  session: ContextPolicySession,
  nodes: readonly number[],
  index: number,
): boolean {
  let openCalls = 0
  for (const seq of nodes.slice(0, index)) {
    const event = session.events[seq]
    const delta = toolCallDelta(event)
    if (delta === undefined) return false
    openCalls += delta
    if (openCalls < 0) return false
  }
  return openCalls === 0
}

/** Whether a retained tail begins with coherent user-facing context. */
function isHistoryBoundary(session: ContextPolicySession, event: unknown): boolean {
  if (isContextCheckpoint(event)) return true
  const message = session.deriveEventMessage(event)
  return message !== null && message.role === 'user' && message.source.kind !== 'tool'
}

/**
 * Select an old surface prefix that can be compacted without splitting tool
 * calls from their results. Generated compaction checkpoints are not charged
 * against the configured count, so a stable checkpoint plus N recent messages
 * does not compact again on every request.
 */
export function selectContextWindow(
  session: ContextPolicySession,
  maxMessages: unknown,
): ContextWindowSelection | undefined {
  const limit = normalizeContextMaxMessages(maxMessages)
  if (limit === null) return undefined
  const nodes = [...session.surface.nodes]
  let modelMessages = 0
  let keepFrom: number | undefined

  for (let index = nodes.length - 1; index >= 0; index--) {
    const seq = nodes[index]
    if (seq === undefined) return undefined
    const event = session.events[seq]
    if (event === undefined) return undefined
    if (isContextCheckpoint(event)) continue
    if (session.deriveEventMessage(event) === null) continue
    modelMessages++
    if (modelMessages > limit) {
      keepFrom = index + 1
      break
    }
  }

  if (keepFrom === undefined) return undefined
  while (keepFrom > 0) {
    const firstRetained = nodes[keepFrom]
    if (firstRetained === undefined) return undefined
    const firstEvent = session.events[firstRetained]
    if (firstEvent === undefined) return undefined
    if (isToolPairingBalancedAt(session, nodes, keepFrom) && isHistoryBoundary(session, firstEvent)) break
    keepFrom--
  }
  if (keepFrom === 0 || !isToolPairingBalancedAt(session, nodes, keepFrom)) return undefined

  const shadowedSeqs = nodes.slice(0, keepFrom)
  const start = shadowedSeqs[0]
  const end = shadowedSeqs.at(-1)
  if (start === undefined || end === undefined) return undefined
  return { start, end, shadowedSeqs }
}

/** Replace an old range with a truthful model-visible omission checkpoint. */
export function omitContextWindow(
  session: ContextPolicySession,
  selection: ContextWindowSelection,
  tokenMeter: TokenMeter,
): void {
  let shadowedTokenCount = 0
  for (const seq of selection.shadowedSeqs) {
    const event = session.events[seq]
    if (event === undefined) throw new Error(`context policy: missing surface event ${String(seq)}`)
    const message = session.deriveEventMessage(event)
    if (message !== null) shadowedTokenCount += tokenMeter.estimateMessage(message)
  }
  if (!Number.isSafeInteger(shadowedTokenCount) || shadowedTokenCount < 0) {
    throw new Error('context policy: invalid shadowed token count')
  }

  const checkpoint = createUserMessage({
    content: [{ type: 'text', text: CONTEXT_WINDOW_CONTENT }],
    source: { kind: 'plugin', plugin: CONTEXT_WINDOW_PLUGIN, form: 'notice', summary: CONTEXT_WINDOW_SUMMARY },
  })
  // The token meter's bounded projection needs a shadow price immediately
  // before every non-summary surface replacement.
  session.append('compaction/prune', {
    shadowedRange: { start: selection.start, end: selection.end },
    shadowedSeqs: selection.shadowedSeqs,
    shadowedTokenCount,
  })
  session.append('user/message', checkpoint, {
    surfaceOp: { op: 'replace', start: selection.start, end: selection.end },
    sourceEventSeqs: selection.shadowedSeqs,
  })
}

/** Flatten all-text output, or preserve a result whose rich block layout matters. */
export function flattenContextToolOutput(content: readonly ContentBlock[]): string | undefined {
  let text = ''
  for (const block of content) {
    if (block.type !== 'text') return undefined
    text += block.text
  }
  return text
}

/**
 * Build a bounded Cherry-style preview for a spilled result.
 *
 * The notice is reserved before head/tail allocation so the result stays within
 * the configured character threshold even when a locator is long.
 */
export function createContextToolOutputPreview(
  text: string,
  threshold: number,
  spill: { locator: string; retrievalHint: string },
): string | undefined {
  if (!Number.isSafeInteger(threshold) || threshold < 1) return undefined
  const points = Array.from(text)
  const totalChars = points.length
  if (totalChars <= threshold) return undefined

  const marker = `\n--- truncated (${String(countLines(text))} lines, ${String(totalChars)} chars total) ---\n`
  const markerChars = contextCodePointLength(marker)
  const notice = `(Omitted ${String(totalChars)} chars. Full formatted result stored at: ${spill.locator}. ${spill.retrievalHint})`
  const reservedChars = markerChars + contextCodePointLength(notice) + 2
  const previewBudget = threshold - reservedChars
  if (previewBudget < 0) return undefined

  const headChars = Math.min(CONTEXT_TOOL_OUTPUT_HEAD_CHARS, previewBudget)
  const tailChars = Math.min(CONTEXT_TOOL_OUTPUT_TAIL_CHARS, previewBudget - headChars)
  const omittedChars = totalChars - headChars - tailChars
  const resolvedNotice = `(Omitted ${String(omittedChars)} chars. Full formatted result stored at: ${spill.locator}. ${spill.retrievalHint})`
  const preview = headChars + tailChars === 0
    ? ''
    : `${points.slice(0, headChars).join('')}${marker}${points.slice(totalChars - tailChars).join('')}`
  const output = preview === '' ? resolvedNotice : `${preview}\n\n${resolvedNotice}`
  return contextCodePointLength(output) <= threshold ? output : undefined
}

/** Return an explicit summary route only when the user supplied a complete pair. */
export function resolveContextCompressionTarget(
  settings: Pick<ContextPolicySettings, 'contextEnabled' | 'contextAutoCompress' | 'contextCompressionProvider' | 'contextCompressionModel'>,
): { provider: string; model: string } | undefined {
  if (!settings.contextEnabled || !settings.contextAutoCompress) return undefined
  const provider = settings.contextCompressionProvider.trim()
  const model = settings.contextCompressionModel.trim()
  return provider === '' || model === '' ? undefined : { provider, model }
}

function ownerSessionId(exec: ToolExecution): string | undefined {
  return (exec as ToolExecution & SessionOwnedExecution).agent?.session.header.id
}

/** Save one oversized plain-text result and return its bounded model/log projection. */
async function spillContextToolOutput(
  ctx: Context,
  exec: ToolExecution,
  toolName: string,
  callId: string,
  label: 'result' | 'dispatch',
  content: readonly ContentBlock[],
  threshold: number,
): Promise<ContentBlock[] | undefined> {
  const text = flattenContextToolOutput(content)
  if (text === undefined || contextCodePointLength(text) <= threshold) return undefined

  const sessionId = ownerSessionId(exec)
  const spillStore = ctx.get('spillStore', false) as unknown as SpillStore | undefined
  if (sessionId === undefined || spillStore === undefined) return undefined

  let spill: Awaited<ReturnType<SpillStore['saveText']>>
  try {
    spill = await spillStore.saveText({
      owner: { sessionId },
      source: { toolName, callId, label },
      suggestedName: `${toolName}.txt`,
      content: text,
    })
  } catch (error) {
    ctx.logger.warn(`context policy: spill failed for ${toolName} ${label}; keeping the inline result: ${String(error)}`)
    return undefined
  }

  const preview = createContextToolOutputPreview(text, threshold, spill)
  return preview === undefined ? undefined : [{ type: 'text', text: preview }]
}

function warningKey(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Register live context controls. Settings are read at every execution boundary,
 * so the next tool result, compaction request, or model step sees the latest
 * saved values without a host restart.
 */
export function installContextPolicy(
  ctx: Context,
  readSettings: () => ContextPolicySettings,
): void {
  const warned = new Set<string>()
  const warnOnce = (key: string, message: string): void => {
    if (warned.has(key)) return
    warned.add(key)
    ctx.logger.warn(message)
  }

  ctx.on('tools/post-execute', async (
    exec: ToolExecution,
    result: Readonly<ToolExecutionResult>,
    next,
  ): Promise<PostToolDecision> => {
    const decision = await next()
    if (decision.kind !== 'accept' || Object.hasOwn(decision, 'value')
      || exec.parent !== undefined || exec.name === 'read') return decision

    const settings = readSettings()
    if (!settings.contextEnabled) return decision
    const content = decision.content ?? result.content
    const replaced = await spillContextToolOutput(
      ctx,
      exec,
      exec.name,
      exec.callId,
      'result',
      content,
      settings.contextToolOutputThreshold,
    )
    if (replaced === undefined) return decision
    return {
      kind: 'accept',
      content: replaced,
      ...decision.additionalContexts === undefined ? {} : { additionalContexts: decision.additionalContexts },
    }
  }, { global: true, prepend: true })

  // Code Mode receives complete nested values before this waterfall runs. Only
  // the durable tool/code-dispatch projection is replaced, never the program value.
  ctx.on('tools/code-dispatch-log', async (dispatch, next): Promise<ContentBlock[]> => {
    const content = await next()
    const settings = readSettings()
    if (!settings.contextEnabled) return content
    const replaced = await spillContextToolOutput(
      ctx,
      dispatch.exec,
      dispatch.name,
      dispatch.subCallId,
      'dispatch',
      content,
      settings.contextToolOutputThreshold,
    )
    return replaced ?? content
  }, { global: true, prepend: true })

  ctx.on('llm/stream', (options: GenerateOptions, next) => {
    if (options.purpose !== 'compaction') return next()
    const target = resolveContextCompressionTarget(readSettings())
    if (target === undefined || Object.isFrozen(options)) return next()
    options.provider = target.provider
    options.model = target.model
    return next()
  }, { prepend: true })

  ctx.on('agent/pre-step', async (
    { agent, signal },
    next,
  ) => {
    if (!signal.aborted) {
      const settings = readSettings()
      const selection = settings.contextEnabled
        ? selectContextWindow(agent.session, settings.contextMaxMessages)
        : undefined
      if (selection !== undefined) {
        if (settings.contextAutoCompress) {
          const presets = ctx.get('agentPresets', false) as unknown as AgentPresets | undefined
          const engine = presets?.serviceFor(agent, 'compaction')
          if (engine === undefined) {
            warnOnce('missing-compaction', 'context policy: no agent-scoped compaction service is available; keeping the full history')
          } else {
            try {
              await engine.compactRegion(selection.start, selection.end, agent, signal)
            } catch (error) {
              warnOnce(
                `compaction:${warningKey(error)}`,
                `context policy: recent-message compaction failed; keeping the full history: ${warningKey(error)}`,
              )
            }
          }
        } else {
          const tokenMeter = ctx.get('tokenMeter', false) as unknown as TokenMeter | undefined
          if (tokenMeter === undefined) {
            warnOnce('missing-token-meter', 'context policy: no token meter is available for the recent-message window')
          } else {
            try {
              omitContextWindow(agent.session, selection, tokenMeter)
            } catch (error) {
              warnOnce(
                `omission:${warningKey(error)}`,
                `context policy: recent-message omission failed; keeping the full history: ${warningKey(error)}`,
              )
            }
          }
        }
      }
    }
    return await next()
  }, { global: true, prepend: true })
}
