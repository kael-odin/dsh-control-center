/**
 * Desktop-environment detection for the Control Center renderer.
 *
 * The shell injects a minimal `window.__DSH_DESKTOP__` marker ({ shell, host,
 * version }) — no native bridge URL or token. Native capability truth comes
 * from the host's `controlCenterDesktop` service (`desktop.check()`), so the
 * renderer never holds the privileged native token.
 */
export interface DesktopCapabilityMarker {
  shell: true
  host: string
  version: string
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
