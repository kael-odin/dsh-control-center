/**
 * Quick assistant settings — Cherry QuickAssistantSettings parity: enable
 * switch, tray/clipboard rows, model row, window preview. The desktop shell
 * registers the global quick-assist hotkey from the host-pushed prefs (v1
 * focuses the main window; the floating assistant window is planned); the
 * notices reflect the live environment.
 */
import type { AssistantRemote, DesktopRemote } from './assistant-store.ts';
export interface QuickAssistantSectionInjected {
    assistant: AssistantRemote | undefined;
    desktop: DesktopRemote | undefined;
}
export declare function QuickAssistantSection({ assistant, desktop }: QuickAssistantSectionInjected): import("react").JSX.Element;
//# sourceMappingURL=QuickAssistantSection.d.ts.map