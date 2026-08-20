/**
 * Desktop-environment detection for the Control Center renderer.
 *
 * The desktop shell (`apps/desktop`) injects `window.__DSH_DESKTOP__` into the
 * renderer it owns. A plain browser tab loading the same DSH surface never sees
 * it, so the web UI can honestly distinguish "wrapped by the desktop shell"
 * from "open in a browser" and flip its "需要桌面版" rows / capability gates.
 *
 * Reading is lazy (the marker may arrive after the first render); components
 * read it when they mount/render, and can subscribe to the
 * `dsh-desktop-ready` custom event to re-evaluate.
 * @module
 */

export interface DesktopCapabilityMarker {
  /** True when running under the Control Center desktop shell. */
  shell: true
  /** Which host owns the shell (product namespace). */
  host: string
  /** Shell version (package version of @dsh-control-center/desktop). */
  version: string
  /** Honest, intentionally minimal capability list; grows as bridges land. */
  capabilities: readonly string[]
  /** Loopback URL of the native bridge (Electron main micro-service), when up. */
  nativeUrl?: string
  /** Per-launch bearer token guarding the native bridge. */
  nativeToken?: string
}

/** Read the desktop marker injected by the shell, or `null` in a browser tab. */
export function getDesktopCapabilities(): DesktopCapabilityMarker | null {
  const marker = (globalThis as unknown as { __DSH_DESKTOP__?: DesktopCapabilityMarker }).__DSH_DESKTOP__
  return marker && marker.shell === true ? marker : null
}

/** Whether this renderer is owned by the desktop shell. */
export function isDesktopEnv(): boolean {
  return getDesktopCapabilities() !== null
}

/** Subscribe to the shell's "desktop ready" event (fires after marker injection). */
export function onDesktopReady(listener: (marker: DesktopCapabilityMarker) => void): () => void {
  const handler = (event: Event): void => {
    const marker = (event as CustomEvent<DesktopCapabilityMarker>).detail
    if (marker) listener(marker)
  }
  document.addEventListener('dsh-desktop-ready', handler as EventListener)
  return () => { document.removeEventListener('dsh-desktop-ready', handler as EventListener) }
}

/** True when the native bridge is up (renderer can reach Electron via HTTP). */
export function hasNativeBridge(): boolean {
  const m = getDesktopCapabilities()
  return Boolean(m?.nativeUrl && m?.nativeToken)
}

export interface NativeDialogResult {
  ok: boolean
  canceled?: boolean
  filePaths?: string[]
  error?: string
}

/**
 * Token-protected client for Electron's native bridge (loopback micro-service
 * hosted by the shell's Electron main). Uses the marker's nativeUrl/nativeToken.
 */
export const desktopNativeApi = {
  /** Probe the bridge — confirms the Electron main service is reachable. */
  async status(): Promise<{ ok: boolean; shell?: boolean; electron?: string; error?: string }> {
    const m = getDesktopCapabilities()
    if (!m?.nativeUrl || !m.nativeToken) return { ok: false, error: 'native bridge unavailable' }
    try {
      const r = await fetch(`${m.nativeUrl}/dsh-native/status`, {
        headers: { authorization: `Bearer ${m.nativeToken}` },
        signal: AbortSignal.timeout(5000),
      })
      return (await r.json()) as { ok: boolean; shell?: boolean; electron?: string }
    } catch (e) {
      return { ok: false, error: String((e as Error)?.message ?? e) }
    }
  },

  /** Open the system file dialog (Electron dialog.showOpenDialog via main). */
  async pickFile(properties: readonly string[] = ['openFile']): Promise<NativeDialogResult> {
    const m = getDesktopCapabilities()
    if (!m?.nativeUrl || !m.nativeToken) return { ok: false, error: 'native bridge unavailable' }
    try {
      const r = await fetch(`${m.nativeUrl}/dsh-native/fileDialog`, {
        method: 'POST',
        headers: { authorization: `Bearer ${m.nativeToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ properties }),
        signal: AbortSignal.timeout(60000),
      })
      return (await r.json()) as NativeDialogResult
    } catch (e) {
      return { ok: false, error: String((e as Error)?.message ?? e) }
    }
  },

  /** Read a local file the user just picked via the native dialog (confined to
   * the last-picked paths by the main-process bridge). */
  async readFile(path: string): Promise<{ ok: boolean; name?: string; contentBase64?: string; mediaType?: string; error?: string }> {
    const m = getDesktopCapabilities()
    if (!m?.nativeUrl || !m.nativeToken) return { ok: false, error: 'native bridge unavailable' }
    try {
      const r = await fetch(`${m.nativeUrl}/dsh-native/readFile`, {
        method: 'POST',
        headers: { authorization: `Bearer ${m.nativeToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ path }),
        signal: AbortSignal.timeout(60000),
      })
      return (await r.json()) as { ok: boolean; name?: string; contentBase64?: string; mediaType?: string }
    } catch (e) {
      return { ok: false, error: String((e as Error)?.message ?? e) }
    }
  },

  /** Send a system notification (Electron Notification via main). */
  async notify(title: string, body = ''): Promise<{ ok: boolean; supported?: boolean; error?: string }> {    const m = getDesktopCapabilities()
    if (!m?.nativeUrl || !m.nativeToken) return { ok: false, error: 'native bridge unavailable' }
    try {
      const r = await fetch(`${m.nativeUrl}/dsh-native/notify`, {
        method: 'POST',
        headers: { authorization: `Bearer ${m.nativeToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ title, body }),
        signal: AbortSignal.timeout(10000),
      })
      return (await r.json()) as { ok: boolean; supported?: boolean }
    } catch (e) {
      return { ok: false, error: String((e as Error)?.message ?? e) }
    }
  },
}
