/**
 * Host capability probe (PLUGINIZATION.md §1.1): one startup-time survey of
 * every host surface the plugin depends on, so callers consult a single table
 * instead of scattering try/catch fallbacks — and the diagnostic bundle can
 * report exactly which contract broke on an unfamiliar DSH version.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote, TypertRemoteFailure } from '@deepseek-ai/dsh-typert-protocol'
import type { SessionController } from '@deepseek-ai/dsh-api-session-controller'

export interface CapabilityProbe {
  /** Dot path of the probed surface, e.g. `sessionController.page`. */
  name: string
  available: boolean
  detail?: string | undefined
}

/** Presence check via the context property — the same access every plugin
 * service uses (`ctx.settings`, `ctx.llm`, …); missing services throw or read
 * undefined depending on how the host composes them, both count as absent. */
function hasService(ctx: Context, name: string): CapabilityProbe {
  let service: unknown
  try {
    service = (ctx as unknown as Record<string, unknown>)[name]
  } catch {
    return { name, available: false, detail: '宿主未挂载该服务' }
  }
  return service !== undefined && service !== null
    ? { name, available: true }
    : { name, available: false, detail: '宿主未挂载该服务' }
}

/** The session controller is the channel agent-loop gateway; probing it
 * means calling the cheapest read, not just checking presence. */
async function probeSessionController(ctx: Context): Promise<CapabilityProbe> {
  if (!hasService(ctx, 'sessionController').available) {
    return { name: 'sessionController.page', available: false, detail: '宿主未挂载 sessionController' }
  }
  try {
    const sessions = (ctx as unknown as Record<string, unknown>).sessionController as SessionController
    await sessions.list({}, AbortSignal.timeout(5_000))
    return { name: 'sessionController.page', available: true }
  } catch (error) {
    const detail = error instanceof TypertRemoteFailure
      ? `${error.failure.code}: ${error.failure.message}`
      : error instanceof Error ? error.message : String(error)
    return { name: 'sessionController.page', available: false, detail }
  }
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    controlCenterCompat: CompatService
  }
}

export class CompatService extends Service {
  static inject = ['settings'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterCompat')

  constructor(ctx: Context) {
    super(ctx, 'controlCenterCompat')
  }

  /** Presence checks run synchronously; the sessions probe rides one RPC. */
  async probe(): Promise<{ ok: true; value: CapabilityProbe[] }> {
    const ctx = this.ctx
    const probes: CapabilityProbe[] = [
      hasService(ctx, 'settings'),
      hasService(ctx, 'storage'),
      hasService(ctx, 'llm'),
      hasService(ctx, 'sessionController'),
      hasService(ctx, 'agentPresets'),
      hasService(ctx, 'invariants'),
      await probeSessionController(ctx),
    ]
    return { ok: true, value: probes }
  }
}
