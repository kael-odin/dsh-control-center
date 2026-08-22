/**
 * Desktop-environment detection for the Control Center renderer.
 *
 * The shell injects a minimal `window.__DSH_DESKTOP__` marker ({ shell, host,
 * version }) — no native bridge URL or token. Native capability truth comes
 * from the host's `controlCenterDesktop` service (`desktop.check()`), so the
 * renderer never holds the privileged native token.
 */
export interface DesktopCapabilityMarker {
    shell: true;
    host: string;
    version: string;
}
export declare function getDesktopCapabilities(): DesktopCapabilityMarker | null;
export declare function isDesktopEnv(): boolean;
export declare function onDesktopReady(listener: (marker: DesktopCapabilityMarker) => void): () => void;
//# sourceMappingURL=desktop-capabilities.d.ts.map