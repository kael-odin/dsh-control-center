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
    shell: true;
    /** Which host owns the shell (product namespace). */
    host: string;
    /** Shell version (package version of @dsh-control-center/desktop). */
    version: string;
    /** Honest, intentionally minimal capability list; grows as bridges land. */
    capabilities: readonly string[];
    /** Loopback URL of the native bridge (Electron main micro-service), when up. */
    nativeUrl?: string;
    /** Per-launch bearer token guarding the native bridge. */
    nativeToken?: string;
}
/** Read the desktop marker injected by the shell, or `null` in a browser tab. */
export declare function getDesktopCapabilities(): DesktopCapabilityMarker | null;
/** Whether this renderer is owned by the desktop shell. */
export declare function isDesktopEnv(): boolean;
/** Subscribe to the shell's "desktop ready" event (fires after marker injection). */
export declare function onDesktopReady(listener: (marker: DesktopCapabilityMarker) => void): () => void;
/** True when the native bridge is up (renderer can reach Electron via HTTP). */
export declare function hasNativeBridge(): boolean;
export interface NativeDialogResult {
    ok: boolean;
    canceled?: boolean;
    filePaths?: string[];
    error?: string;
}
/**
 * Token-protected client for Electron's native bridge (loopback micro-service
 * hosted by the shell's Electron main). Uses the marker's nativeUrl/nativeToken.
 */
export declare const desktopNativeApi: {
    /** Probe the bridge — confirms the Electron main service is reachable. */
    status(): Promise<{
        ok: boolean;
        shell?: boolean;
        electron?: string;
        error?: string;
    }>;
    /** Open the system file dialog (Electron dialog.showOpenDialog via main). */
    pickFile(properties?: readonly string[]): Promise<NativeDialogResult>;
    /** Read a local file the user just picked via the native dialog (confined to
     * the last-picked paths by the main-process bridge). */
    readFile(path: string): Promise<{
        ok: boolean;
        name?: string;
        contentBase64?: string;
        mediaType?: string;
        error?: string;
    }>;
    /** Send a system notification (Electron Notification via main). */
    notify(title: string, body?: string): Promise<{
        ok: boolean;
        supported?: boolean;
        error?: string;
    }>;
};
//# sourceMappingURL=desktop-capabilities.d.ts.map