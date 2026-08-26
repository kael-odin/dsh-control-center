/**
 * Host capability probe (PLUGINIZATION.md §1.1): one startup-time survey of
 * every host surface the plugin depends on, so callers consult a single table
 * instead of scattering try/catch fallbacks — and the diagnostic bundle can
 * report exactly which contract broke on an unfamiliar DSH version.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import type { ApiProxy } from '@deepseek-ai/dsh-host-apiproxy/api'

export interface CapabilityProbe {
  /** Dot path of the probed surface, e.g. `apiProxy.sessions`. */
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

function rpcId(raw: string): never {
  return raw as never
}

/** apiProxy.sessions is the channel agent-loop + presets gateway; probing it
 * means calling the cheapest read RPC, not just checking presence. */
async function probeApiProxySessions(ctx: Context): Promise<CapabilityProbe> {
  if (!hasService(ctx, 'apiProxy').available) {
    return { name: 'apiProxy.sessions', available: false, detail: '宿主未挂载 apiProxy' }
  }
  try {
    const api = (ctx as unknown as Record<string, unknown>).apiProxy as ApiProxy
    const response = await api.sessions.list({ rpcId: rpcId(crypto.randomUUID()), payload: {} })
    return response.result.ok
      ? { name: 'apiProxy.sessions', available: true }
      : { name: 'apiProxy.sessions', available: false, detail: `${response.result.error.code}: ${response.result.error.message}` }
  } catch (error) {
    return { name: 'apiProxy.sessions', available: false, detail: error instanceof Error ? error.message : String(error) }
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
      hasService(ctx, 'apiProxy'),
      hasService(ctx, 'invariants'),
      await probeApiProxySessions(ctx),
    ]
    return { ok: true, value: probes }
  }
}
