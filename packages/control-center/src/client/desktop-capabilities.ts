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
