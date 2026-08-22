/**
 * Desktop shell bridge service.
 *
 * The Electron desktop shell spawns a DSH host and exposes its native
 * capabilities (file dialogs, notifications, fonts, window zoom/relaunch) over
 * a token-protected loopback HTTP micro-service in the Electron main process.
 * This host service is the DSH-side consumer of that bridge: the Electron main
 * passes the bridge URL/token to the spawned host via `DSH_DESKTOP_NATIVE_URL`
 * / `DSH_DESKTOP_NATIVE_TOKEN`, so the host reaches Electron's native APIs over
 * HTTP — the renderer never holds the token.
 *
 * The service is always registered (web profiles too). When the bridge env is
 * absent or the bridge is unreachable, every method reports an honest
 * `{ ok: false, error: 'desktop native bridge is not reachable' }` and
 * `check()` returns `{ supported: false }` — the UI flips its "需要桌面版" rows
 * on that, with no per-desktop gating code.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import type {
  DesktopDialogResult,
  DesktopFileReadResult,
  DesktopFileWriteResult,
  DesktopFontsResult,
  DesktopMenuResult,
  DesktopNotifyResult,
  DesktopSaveDialogResult,
  DesktopStatus,
  DesktopZoomResult,
} from './desktop-types.ts'

const BRIDGE_URL_ENV = 'DSH_DESKTOP_NATIVE_URL'
const BRIDGE_TOKEN_ENV = 'DSH_DESKTOP_NATIVE_TOKEN'
const BRIDGE_UNAVAILABLE = 'desktop native bridge is not reachable'

interface NativeStatusPayload {
  ok: boolean
  shell?: boolean
  electron?: string
  node?: string
  trayActive?: boolean
  hotkey?: string
  hotkeyRegistered?: boolean
}

export class DesktopService extends Service {
  static inject = [] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterDesktop')
  private readonly nativeUrl: string | undefined
  private readonly nativeToken: string | undefined

  constructor(ctx: Context, _config?: { logger?: Context['logger'] }) {
    super(ctx, 'controlCenterDesktop')
    // Read the bridge env in the constructor so a bundled deployment that does
    // not set it (web profiles) honestly reports unsupported.
    this.nativeUrl = process.env[BRIDGE_URL_ENV]
    this.nativeToken = process.env[BRIDGE_TOKEN_ENV]
  }

  private get bridge(): { url: string; token: string } | undefined {
    if (this.nativeUrl === undefined || this.nativeToken === undefined) return undefined
    return { url: this.nativeUrl, token: this.nativeToken }
  }

  /**
   * Proxy a request to the native bridge. Returns `undefined` when the bridge
   * is absent, unreachable, or answers with a non-OK HTTP status — callers map
   * that to an honest error result (never a throw).
   */
  private async bridgeFetch<T>(
    path: string,
    init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
    timeoutMs = 10000,
  ): Promise<T | undefined> {
    const bridge = this.bridge
    if (bridge === undefined) return undefined
    try {
      const response = await fetch(`${bridge.url}${path}`, {
        method: init.method ?? 'GET',
        headers: {
          authorization: `Bearer ${bridge.token}`,
          ...(init.body === undefined ? {} : { 'content-type': 'application/json' }),
          ...init.headers,
        },
        body: init.body === undefined ? null : JSON.stringify(init.body),
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (!response.ok) return undefined
      return await response.json() as T
    } catch {
      return undefined
    }
  }

  /** Capability probe: is the native bridge reachable, and what does it report? */
  async check(): Promise<DesktopStatus> {
    const result = await this.bridgeFetch<NativeStatusPayload>('/dsh-native/status', {}, 5000)
    if (result === undefined || result.ok !== true) {
      return { supported: false, error: BRIDGE_UNAVAILABLE }
    }
    return {
      supported: true,
      ...(result.electron !== undefined ? { electron: result.electron } : {}),
      ...(result.node !== undefined ? { node: result.node } : {}),
      ...(result.trayActive !== undefined ? { trayActive: result.trayActive } : {}),
      ...(result.hotkey !== undefined ? { hotkey: result.hotkey } : {}),
      ...(result.hotkeyRegistered !== undefined ? { hotkeyRegistered: result.hotkeyRegistered } : {}),
    }
  }

  async fonts(): Promise<DesktopFontsResult> {
    const result = await this.bridgeFetch<DesktopFontsResult>('/dsh-native/fonts', { method: 'POST', body: {} })
    return result === undefined ? { ok: false, error: BRIDGE_UNAVAILABLE } : result
  }

  async menu(model: unknown): Promise<DesktopMenuResult> {
    const result = await this.bridgeFetch<DesktopMenuResult>('/dsh-native/menu', { method: 'POST', body: { model } })
    return result === undefined ? { ok: false, error: BRIDGE_UNAVAILABLE } : result
  }

  async adjustZoom(delta: number, reset: boolean): Promise<DesktopZoomResult> {
    const result = await this.bridgeFetch<DesktopZoomResult>('/dsh-native/zoom', { method: 'POST', body: { delta, reset } })
    return result === undefined ? { ok: false, error: BRIDGE_UNAVAILABLE } : result
  }

  async relaunch(): Promise<{ ok: boolean; error?: string }> {
    const result = await this.bridgeFetch<{ ok: boolean; error?: string }>('/dsh-native/relaunch', { method: 'POST', body: {} })
    return result === undefined ? { ok: false, error: BRIDGE_UNAVAILABLE } : result
  }

  async pickFile(properties: readonly string[]): Promise<DesktopDialogResult> {
    const result = await this.bridgeFetch<DesktopDialogResult>('/dsh-native/fileDialog', { method: 'POST', body: { properties } }, 60000)
    return result === undefined ? { ok: false, error: BRIDGE_UNAVAILABLE } : result
  }

  async pickSaveFile(defaultPath: string): Promise<DesktopSaveDialogResult> {
    const result = await this.bridgeFetch<DesktopSaveDialogResult>(
      '/dsh-native/saveFileDialog',
      { method: 'POST', body: { defaultPath } },
      60000,
    )
    return result === undefined ? { ok: false, error: BRIDGE_UNAVAILABLE } : result
  }

  async readFile(path: string): Promise<DesktopFileReadResult> {
    const result = await this.bridgeFetch<DesktopFileReadResult>('/dsh-native/readFile', { method: 'POST', body: { path } }, 60000)
    return result === undefined ? { ok: false, error: BRIDGE_UNAVAILABLE } : result
  }

  async writeFile(path: string, contentBase64: string): Promise<DesktopFileWriteResult> {
    const result = await this.bridgeFetch<DesktopFileWriteResult>(
      '/dsh-native/writeFile',
      { method: 'POST', body: { path, contentBase64 } },
      60000,
    )
    return result === undefined ? { ok: false, error: BRIDGE_UNAVAILABLE } : result
  }

  async notify(title: string, body: string): Promise<DesktopNotifyResult> {
    const result = await this.bridgeFetch<DesktopNotifyResult>('/dsh-native/notify', { method: 'POST', body: { title, body } })
    return result === undefined ? { ok: false, error: BRIDGE_UNAVAILABLE } : result
  }

  [Symbol.dispose]() {
    // No owned lifecycle to release.
  }
}
