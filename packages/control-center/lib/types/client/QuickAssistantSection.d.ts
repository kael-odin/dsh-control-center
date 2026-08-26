import type { AssistantRemote, DesktopRemote } from './assistant-store.ts';
export interface QuickAssistantSectionInjected {
    assistant: AssistantRemote | undefined;
    desktop: DesktopRemote | undefined;
}
export declare function QuickAssistantSection({ assistant, desktop }: QuickAssistantSectionInjected): import("react").JSX.Element;
//# sourceMappingURL=QuickAssistantSection.d.ts.map