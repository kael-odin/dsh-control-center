/**
 * Per-model health checks for configuration surfaces: one tiny real
 * completion per checked model, streamed through the same adapter registry
 * production requests use.
 *
 * This is deliberately NOT an endpoint ping — discoverModels already answers
 * reachability. A model check proves the route serves THIS model id: adapter,
 * credential, and catalog agree, and the provider actually completes. The
 * prompt asks for a fixed token so a healthy check costs cents of nothing and
 * the reply doubles as evidence.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { createUserMessage, type LlmRuntime } from '@deepseek-ai/dsh-llm'
import { bindTypertRemote, Remote } from '@deepseek-ai/dsh-typert-protocol'

/** Serializable outcome of one model check. */
export interface ModelCheckResult {
  ok: boolean
  /** Round-trip latency through prepare + first finish, when ok. */
  latencyMs?: number
  /** First bytes of the completion, capped — evidence, not content. */
  reply?: string
  /** Failure message when not ok (provider refusal, auth, timeout…). */
  error?: string
}

/** Hard ceiling on one check; a hung provider fails rather than blocking the run. */
const CHECK_TIMEOUT_MS = 30_000

const CHECK_PROMPT = 'Reply with exactly: OK'

function markModelCheckRemoteMethods(service: ModelCheckService): void {
  const initializers: Array<(this: ModelCheckService) => void> = []
  for (const [method, exportName] of [
    ['check', 'check'],
  ] as const) {
    const implementation = Reflect.get(ModelCheckService.prototype, method) as (this: ModelCheckService, ...args: never[]) => unknown
    const decorator = Remote(exportName)
    decorator(implementation, {
      kind: 'method', name: method, static: false, private: false,
      access: { has: value => method in value, get: value => Reflect.get(value, method) as never },
      addInitializer: initializer => { initializers.push(initializer) },
      metadata: undefined,
    })
  }
  for (const initialize of initializers) initialize.call(service)
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    controlCenterModelCheck: ModelCheckService
  }
}

/**
 * One-shot real completions used as model health probes.
 */
export class ModelCheckService extends Service {
  static inject = ['llm'] as const
  readonly typertRemote = bindTypertRemote(this, 'controlCenterModelCheck')

  private readonly llm: LlmRuntime

  constructor(ctx: Context) {
    super(ctx, 'controlCenterModelCheck')
    this.llm = ctx.get('llm') as LlmRuntime
    markModelCheckRemoteMethods(this)
  }

  /**
   * Stream one minimal completion against {@param model} on
   * {@param provider}, aborting at the first finish (or the ceiling).
   */
  async check(provider: string, model: string): Promise<ModelCheckResult> {
    if (typeof provider !== 'string' || provider.trim().length === 0) throw new Error('model check needs a provider route')
    if (typeof model !== 'string' || model.trim().length === 0) throw new Error('model check needs a model id')
    const startedAt = Date.now()
    const controller = new AbortController()
    const timer = setTimeout(() => { controller.abort(new Error(`model check timed out after ${CHECK_TIMEOUT_MS / 1000}s`)) }, CHECK_TIMEOUT_MS)
    try {
      const prepared = await this.llm.prepareCall({ provider, model }, controller.signal)
      const message = createUserMessage({
        source: { kind: 'user' },
        content: [{ type: 'text', text: CHECK_PROMPT }],
      })
      let reply = ''
      for await (const chunk of prepared.stream({
        ...prepared.config,
        messages: [message],
        signal: controller.signal,
      })) {
        if (chunk.type === 'text-delta') reply += chunk.text
        if (chunk.type === 'finish') {
          if (chunk.reason.kind === 'error') {
            return { ok: false, error: chunk.reason.failure.message }
          }
          if (chunk.reason.kind === 'aborted') {
            return { ok: false, error: 'model check aborted' }
          }
          break
        }
      }
      return { ok: true, latencyMs: Date.now() - startedAt, reply: reply.slice(0, 80) }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    } finally {
      clearTimeout(timer)
    }
  }
}
