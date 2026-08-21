/**
 * Desktop-environment detection for the Control Center renderer.
 */
export interface DesktopCapabilityMarker {
    shell: true;
    host: string;
    version: string;
    capabilities: readonly string[];
    nativeUrl?: string;
    nativeToken?: string;
}
export declare function getDesktopCapabilities(): DesktopCapabilityMarker | null;
export declare function isDesktopEnv(): boolean;
export declare function onDesktopReady(listener: (marker: DesktopCapabilityMarker) => void): () => void;
export declare function hasNativeBridge(): boolean;
export interface NativeDialogResult {
    ok: boolean;
    canceled?: boolean;
    filePaths?: string[];
    error?: string;
}
export declare const desktopNativeApi: {
    status(): Promise<{
        ok: boolean;
        shell?: boolean;
        electron?: string;
        error?: string;
    }>;
    pickFile(properties?: readonly string[]): Promise<NativeDialogResult>;
    readFile(path: string): Promise<{
        ok: boolean;
        name?: string;
        contentBase64?: string;
        mediaType?: string;
        error?: string;
    }>;
    fonts(): Promise<{
        ok: boolean;
        fonts?: string[];
        error?: string;
    }>;
    menu(model: unknown): Promise<{
        ok: boolean;
        action?: {
            type: "command";
            command: string;
        };
        error?: string;
    }>;
    adjustZoom(delta: number, reset?: boolean): Promise<{
        ok: boolean;
        zoom?: number;
        error?: string;
    }>;
    relaunch(): Promise<{
        ok: boolean;
        error?: string;
    }>;
    notify(title: string, body?: string): Promise<{
        ok: boolean;
        supported?: boolean;
        error?: string;
    }>;
};
//# sourceMappingURL=desktop-capabilities.d.ts.map