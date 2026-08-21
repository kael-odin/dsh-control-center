/** JSON-safe native menu contract shared by the DSH renderer and Electron bridge. */
export type NativeMenuItem = {
    type: 'separator';
} | {
    type: 'command';
    command: string;
    label: string;
    enabled: boolean;
    checked?: boolean;
    accelerator?: string;
} | {
    type: 'submenu';
    label: string;
    enabled: boolean;
    children: NativeMenuItem[];
};
export interface NativeMenuContextSnapshot {
    sessionId?: string;
    workspace?: string;
    selection?: string;
    focusedElement?: string;
}
export interface NativeMenuModel {
    id: string;
    location: 'webcontents.context' | 'app.menu';
    items: NativeMenuItem[];
    context: NativeMenuContextSnapshot;
}
export interface NativeMenuOpenResult {
    ok: boolean;
    action?: {
        type: 'command';
        command: string;
    };
    error?: string;
}
export declare const NATIVE_MENU_COMMANDS: readonly ["app.settings.open", "app.zoom.in", "app.zoom.out", "app.zoom.reset"];
export type NativeMenuCommand = (typeof NATIVE_MENU_COMMANDS)[number];
export declare function isNativeMenuCommand(value: unknown): value is NativeMenuCommand;
export declare function createNativeMenuModel(id: string, context?: NativeMenuContextSnapshot): NativeMenuModel;
export declare function validateNativeMenuModel(model: unknown): NativeMenuModel;
export declare function createNativeMenuDisposer(dispose: () => void): () => void;
//# sourceMappingURL=native-menu-contract.d.ts.map