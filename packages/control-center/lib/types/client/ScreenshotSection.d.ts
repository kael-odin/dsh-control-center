/**
 * Screenshot settings — Cherry ScreenshotSettings parity: enable, shortcut
 * row (links to the shortcuts page), OCR switch + local-model status.
 * The desktop shell registers the capture hotkey from the host-pushed prefs;
 * notices reflect the live environment (web cannot capture, desktop reports
 * its registration state).
 */
import type { AssistantRemote, DesktopRemote } from './assistant-store.ts';
export interface ScreenshotSectionInjected {
    assistant: AssistantRemote | undefined;
    desktop: DesktopRemote | undefined;
}
export declare function ScreenshotSection({ assistant, desktop }: ScreenshotSectionInjected): import("react").JSX.Element;
//# sourceMappingURL=ScreenshotSection.d.ts.map