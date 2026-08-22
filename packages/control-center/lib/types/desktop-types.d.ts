/**
 * Desktop shell bridge types.
 *
 * The host DesktopService proxies the Electron shell's native capabilities
 * (file dialogs, notifications, fonts, window zoom/relaunch) over the
 * control-center RPC wire. Web profiles register the same service; every method
 * honestly reports the bridge as unavailable there.
 */
/** Capability probe result: `supported: false` means no reachable native bridge. */
export interface DesktopStatus {
    supported: boolean;
    electron?: string;
    node?: string;
    trayActive?: boolean;
    hotkey?: string;
    hotkeyRegistered?: boolean;
    error?: string;
}
/** Native file dialog result (mirrors Electron `dialog.showOpenDialog`). */
export interface DesktopDialogResult {
    ok: boolean;
    canceled?: boolean;
    filePaths?: string[];
    error?: string;
}
/** Native save dialog result (mirrors Electron `dialog.showSaveDialog`). */
export interface DesktopSaveDialogResult {
    ok: boolean;
    canceled?: boolean;
    filePath?: string;
    error?: string;
}
/** Native file write result: confined to save-dialog picks. */
export interface DesktopFileWriteResult {
    ok: boolean;
    error?: string;
}
/** Native file read result: content as base64, confined to native-dialog picks. */
export interface DesktopFileReadResult {
    ok: boolean;
    name?: string;
    contentBase64?: string;
    mediaType?: string;
    error?: string;
}
export interface DesktopFontsResult {
    ok: boolean;
    fonts?: string[];
    error?: string;
}
export interface DesktopMenuAction {
    type: 'command';
    command: string;
}
export interface DesktopMenuResult {
    ok: boolean;
    action?: DesktopMenuAction | undefined;
    error?: string;
}
export interface DesktopZoomResult {
    ok: boolean;
    zoom?: number;
    error?: string;
}
export interface DesktopNotifyResult {
    ok: boolean;
    supported?: boolean;
    error?: string;
}
/** Typert envelope shared by every desktop remote method. */
export type TypertEnvelope<T> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: {
        code: string;
        message: string;
        details: object;
    };
};
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespaceMap {
        controlCenterDesktop: {
            check(): Promise<TypertEnvelope<DesktopStatus>>;
            fonts(): Promise<TypertEnvelope<DesktopFontsResult>>;
            menu(model: unknown): Promise<TypertEnvelope<DesktopMenuResult>>;
            adjustZoom(delta: number, reset: boolean): Promise<TypertEnvelope<DesktopZoomResult>>;
            relaunch(): Promise<TypertEnvelope<{
                ok: boolean;
                error?: string;
            }>>;
            pickFile(properties: readonly string[]): Promise<TypertEnvelope<DesktopDialogResult>>;
            pickSaveFile(defaultPath: string): Promise<TypertEnvelope<DesktopSaveDialogResult>>;
            readFile(path: string): Promise<TypertEnvelope<DesktopFileReadResult>>;
            writeFile(path: string, contentBase64: string): Promise<TypertEnvelope<DesktopFileWriteResult>>;
            notify(title: string, body: string): Promise<TypertEnvelope<DesktopNotifyResult>>;
        };
    }
}
//# sourceMappingURL=desktop-types.d.ts.map