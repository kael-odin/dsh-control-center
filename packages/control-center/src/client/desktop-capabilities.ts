/**
 * Desktop-environment detection for the Control Center renderer.
 */
export interface DesktopCapabilityMarker {
  shell: true
  host: string
  version: string
  capabilities: readonly string[]
  nativeUrl?: string
  nativeToken?: string
}

export function getDesktopCapabilities(): DesktopCapabilityMarker | null {
  const marker = (globalThis as unknown as { __DSH_DESKTOP__?: DesktopCapabilityMarker }).__DSH_DESKTOP__
  return marker && marker.shell === true ? marker : null
}

export function isDesktopEnv(): boolean {
  return getDesktopCapabilities() !== null
}

export function onDesktopReady(listener: (marker: DesktopCapabilityMarker) => void): () => void {
  const handler = (event: Event): void => {
    const marker = (event as CustomEvent<DesktopCapabilityMarker>).detail
    if (marker) listener(marker)
  }
  document.addEventListener('dsh-desktop-ready', handler as EventListener)
  return () => { document.removeEventListener('dsh-desktop-ready', handler as EventListener) }
}

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

interface NativeJsonResult {
  ok: boolean
  error?: string
}

async function postJson<T extends NativeJsonResult>(path: string, body: unknown, timeoutMs = 10000): Promise<T> {
  const m = getDesktopCapabilities()
  if (!m?.nativeUrl || !m.nativeToken) return { ok: false, error: 'native bridge unavailable' } as unknown as T
  try {
    const r = await fetch(`${m.nativeUrl}${path}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${m.nativeToken}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
    return await r.json() as T
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) } as unknown as T
  }
}

export const desktopNativeApi = {
  async status(): Promise<{ ok: boolean; shell?: boolean; electron?: string; error?: string }> {
    const m = getDesktopCapabilities()
    if (!m?.nativeUrl || !m.nativeToken) return { ok: false, error: 'native bridge unavailable' }
    try {
      const r = await fetch(`${m.nativeUrl}/dsh-native/status`, {
        headers: { authorization: `Bearer ${m.nativeToken}` }, signal: AbortSignal.timeout(5000),
      })
      return await r.json() as { ok: boolean; shell?: boolean; electron?: string }
    } catch (e) { return { ok: false, error: String((e as Error)?.message ?? e) } }
  },
  async pickFile(properties: readonly string[] = ['openFile']): Promise<NativeDialogResult> {
    return postJson<NativeDialogResult>('/dsh-native/fileDialog', { properties }, 60000)
  },
  async readFile(path: string): Promise<{ ok: boolean; name?: string; contentBase64?: string; mediaType?: string; error?: string }> {
    return postJson('/dsh-native/readFile', { path }, 60000)
  },
  async fonts(): Promise<{ ok: boolean; fonts?: string[]; error?: string }> {
    return postJson('/dsh-native/fonts', {}, 10000)
  },
  async adjustZoom(delta: number, reset = false): Promise<{ ok: boolean; zoom?: number; error?: string }> {
    return postJson('/dsh-native/zoom', { delta, reset })
  },
  async relaunch(): Promise<{ ok: boolean; error?: string }> {
    return postJson('/dsh-native/relaunch', {})
  },
  async notify(title: string, body = ''): Promise<{ ok: boolean; supported?: boolean; error?: string }> {
    return postJson('/dsh-native/notify', { title, body })
  },
}
