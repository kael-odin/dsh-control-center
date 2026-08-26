/**
 * Quick assistant / selection assistant / screenshot preferences service.
 *
 * Cherry parity for the three system-level assistant pages. Preferences live
 * in a DSH settings namespace (not renderer localStorage) so the desktop
 * shell consumes them — the host pushes the snapshot to the native bridge on
 * every write, and the Electron main registers/unregisters global hotkeys
 * (screenshot capture, quick-assist focus) accordingly.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { RpcId } from '@deepseek-ai/dsh-host-apiproxy'
import type { ApiProxy } from '@deepseek-ai/dsh-host-apiproxy/api'
import { settingsNamespace, type SettingsScope } from '@deepseek-ai/dsh-settings'
import Schema from '@deepseek-ai/schemastery'
import { markRemoteMethods } from './knowledge/remote-methods.ts'
import type { DesktopService } from './desktop.ts'
import type { AssistantPrefs, QuickPrefs, ScreenshotPrefs, SelectionPrefs } from './assistant-types.ts'

const ASSISTANT_NAMESPACE = settingsNamespace('control-center-assistant')

export const DEFAULT_SCREENSHOT: ScreenshotPrefs = { enabled: false, autoOcr: true }
export const DEFAULT_QUICK: QuickPrefs = {
  enabled: false, clickTrayToShow: false, readClipboardAtStartup: true, modelMode: 'model', agentPresetId: '',
}
export const DEFAULT_SELECTION: SelectionPrefs = {
  enabled: false, triggerMode: 'selected', compact: false, followToolbar: true, rememberWinSize: false,
  autoClose: false, autoPin: false, opacity: 100, filterMode: 'default', filterList: [], actions: [],
}

interface AssistantSettings {
  screenshot: ScreenshotPrefs
  quick: QuickPrefs
  selection: SelectionPrefs
}

function normalize(raw: Partial<AssistantSettings> | undefined): AssistantPrefs {
  return {
    screenshot: { ...DEFAULT_SCREENSHOT, ...raw?.screenshot },
    quick: { ...DEFAULT_QUICK, ...raw?.quick },
    selection: { ...DEFAULT_SELECTION, ...raw?.selection },
  }
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    controlCenterAssistant: AssistantService
    /** Desktop bridge face (DesktopService registers no merge of its own). */
    controlCenterDesktop?: DesktopService
  }
}

export class AssistantService extends Service {
  static inject = ['settings'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterAssistant')
  private scope: SettingsScope<AssistantSettings>

  constructor(ctx: Context) {
    super(ctx, 'controlCenterAssistant')
    markRemoteMethods(this, [
      ['get', 'get'],
      ['set', 'set'],
      ['listAgentPresets', 'listAgentPresets'],
    ])
    this.scope = ctx.settings.register(ASSISTANT_NAMESPACE, Schema.object({
      screenshot: Schema.any().default({}),
      quick: Schema.any().default({}),
      selection: Schema.any().default({}),
    }), { base: { screenshot: {}, quick: {}, selection: {} } })
    // The desktop shell registers hotkeys from the bridge snapshot; push the
    // persisted prefs as soon as the host is up so a restart restores them.
    const desktop = ctx.controlCenterDesktop as DesktopService | undefined
    if (desktop !== undefined) void desktop.pushAssistantPrefs(this.read())
  }

  /**
   * The deployment's agent presets for picker UIs (Quick Assistant 「使用助手」
   * mode). Proxied host-side because the browser cannot reach ctx.apiProxy.
   */
  async listAgentPresets(): Promise<{
    ok: true
    value: Array<{ id: string; name: string; trust: 'system' | 'user'; isDefault: boolean }>
  } | { ok: false; error: string }> {
    try {
      const api = this.ctx.get('apiProxy') as ApiProxy
      const response = await api.agentPresets.list({
        rpcId: RpcId(globalThis.crypto.randomUUID()),
        payload: {},
      })
      if (!response.result.ok) return { ok: false, error: response.result.error.message }
      return {
        ok: true,
        value: response.result.value.presets.map(preset => ({
          id: preset.id,
          name: preset.name ?? preset.id,
          trust: preset.trust,
          isDefault: preset.isDefault,
        })),
      }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  private read(): AssistantPrefs {
    return normalize(this.scope.get() as Partial<AssistantSettings>)
  }

  async get(): Promise<{ ok: true; value: AssistantPrefs }> {
    return { ok: true, value: this.read() }
  }

  async set(params: {
    screenshot?: Partial<ScreenshotPrefs>
    quick?: Partial<QuickPrefs>
    selection?: Partial<SelectionPrefs>
  }): Promise<{ ok: true; value: AssistantPrefs }> {
    const current = this.read()
    const next = normalize({
      screenshot: { ...current.screenshot, ...params.screenshot },
      quick: { ...current.quick, ...params.quick },
      selection: { ...current.selection, ...params.selection },
    })
    await this.scope.update(() => next)
    const desktop = this.ctx.controlCenterDesktop as DesktopService | undefined
    if (desktop !== undefined) void desktop.pushAssistantPrefs(next)
    return { ok: true, value: next }
  }
}
