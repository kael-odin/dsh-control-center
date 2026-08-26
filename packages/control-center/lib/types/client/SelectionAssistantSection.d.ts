import type { AssistantRemote, DesktopRemote } from './assistant-store.ts';
export interface SelectionAssistantSectionInjected {
    assistant: AssistantRemote | undefined;
    desktop: DesktopRemote | undefined;
}
export declare function SelectionAssistantSection({ assistant, desktop }: SelectionAssistantSectionInjected): import("react").JSX.Element;
//# sourceMappingURL=SelectionAssistantSection.d.ts.map