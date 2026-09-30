/**
 * Agent-preset roster for picker UIs (channel agent binding). The browser
 * cannot reach the harness `agentPresets` service directly, so the host
 * proxies `remoteExportList()`; system/user trust and the default flag are
 * preserved for honest labeling.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote, remoteErrorOf } from '@deepseek-ai/dsh-typert-protocol'
import type { AgentPresetRegistry } from '@deepseek-ai/dsh-agent-preset-registry'
import { markRemoteMethods } from './knowledge/remote-methods.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    controlCenterAgentPresets: AgentPresetsService
  }
}

export class AgentPresetsService extends Service {
  static inject = [] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterAgentPresets')

  constructor(ctx: Context) {
    super(ctx, 'controlCenterAgentPresets')
    markRemoteMethods(this, [
      ['listAgentPresets', 'listAgentPresets'],
    ])
  }

  async listAgentPresets(): Promise<{
    ok: true
    value: Array<{ id: string; name: string; isDefault: boolean }>
  } | { ok: false; error: string }> {
    try {
      const presets = this.ctx.get('agentPresets') as AgentPresetRegistry
      const roster = await presets.remoteExportList()
      return {
        ok: true,
        value: roster.presets.map(preset => ({
          id: preset.id,
          name: preset.name ?? preset.id,
          isDefault: preset.isDefault,
        })),
      }
    } catch (error) {
      {
        const failure = remoteErrorOf(error)
        if (failure) return { ok: false, error: `${failure.code}: ${failure.message}` }
      }
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  }
}
