/**
 * Quick assistant / selection assistant / screenshot preferences service.
 *
 * Cherry parity for the three system-level assistant pages. Preferences live
 * in a DSH settings namespace (not renderer localStorage) so the desktop
 * shell consumes them — the host pushes the snapshot to the native bridge on
 * every write, and the Electron main registers/unregisters global hotkeys
 * (screenshot capture, quick-assist focus) accordingly.
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import type { DesktopService } from './desktop.ts';
import type { AssistantPrefs, QuickPrefs, ScreenshotPrefs, SelectionPrefs } from './assistant-types.ts';
export declare const DEFAULT_SCREENSHOT: ScreenshotPrefs;
export declare const DEFAULT_QUICK: QuickPrefs;
export declare const DEFAULT_SELECTION: SelectionPrefs;
declare module '@deepseek-ai/cordis' {
    interface Context {
        controlCenterAssistant: AssistantService;
        /** Desktop bridge face (DesktopService registers no merge of its own). */
        controlCenterDesktop?: DesktopService;
    }
}
export declare class AssistantService extends Service {
    static inject: readonly ["settings"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private scope;
    constructor(ctx: Context);
    private read;
    get(): Promise<{
        ok: true;
        value: AssistantPrefs;
    }>;
    set(params: {
        screenshot?: Partial<ScreenshotPrefs>;
        quick?: Partial<QuickPrefs>;
        selection?: Partial<SelectionPrefs>;
    }): Promise<{
        ok: true;
        value: AssistantPrefs;
    }>;
}
//# sourceMappingURL=assistant.d.ts.map