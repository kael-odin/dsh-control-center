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
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import type { DesktopDialogResult, DesktopFileReadResult, DesktopFileWriteResult, DesktopFontsResult, DesktopMenuResult, DesktopNotifyResult, DesktopSaveDialogResult, DesktopStatus, DesktopZoomResult } from './desktop-types.ts';
export declare class DesktopService extends Service {
    static inject: readonly [];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private readonly nativeUrl;
    private readonly nativeToken;
    constructor(ctx: Context, _config?: {
        logger?: Context['logger'];
    });
    private get bridge();
    /**
     * Proxy a request to the native bridge. Returns `undefined` when the bridge
     * is absent, unreachable, or answers with a non-OK HTTP status — callers map
     * that to an honest error result (never a throw).
     */
    private bridgeFetch;
    /** Capability probe: is the native bridge reachable, and what does it report? */
    check(): Promise<DesktopStatus>;
    /** Push the assistant prefs snapshot so the shell (re)registers hotkeys. */
    pushAssistantPrefs(prefs: unknown): Promise<{
        ok: boolean;
    }>;
    fonts(): Promise<DesktopFontsResult>;
    menu(model: unknown): Promise<DesktopMenuResult>;
    adjustZoom(delta: number, reset: boolean): Promise<DesktopZoomResult>;
    relaunch(): Promise<{
        ok: boolean;
        error?: string;
    }>;
    pickFile(properties: readonly string[]): Promise<DesktopDialogResult>;
    pickSaveFile(defaultPath: string): Promise<DesktopSaveDialogResult>;
    readFile(path: string): Promise<DesktopFileReadResult>;
    writeFile(path: string, contentBase64: string): Promise<DesktopFileWriteResult>;
    notify(title: string, body: string): Promise<DesktopNotifyResult>;
    [Symbol.dispose](): void;
}
//# sourceMappingURL=desktop.d.ts.map