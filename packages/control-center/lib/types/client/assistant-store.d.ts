/**
 * Shared client store for the assistant prefs (快捷助手 / 划词助手 / 截图).
 *
 * Prefs live in the host `control-center-assistant` settings namespace; this
 * hook loads them over the assistant remote, patches them, and performs the
 * one-time migration off the legacy renderer localStorage keys. The desktop
 * status hook drives the honest per-environment notices.
 */
import type { TypertClientRemote } from '@deepseek-ai/dsh-typert-protocol';
import type { DesktopStatus } from '../desktop-types.ts';
import type { AssistantPrefs } from '../assistant-types.ts';
export type AssistantRemote = NonNullable<TypertClientRemote['controlCenterAssistant']>;
export type DesktopRemote = NonNullable<TypertClientRemote['controlCenterDesktop']>;
export interface AssistantStore {
    prefs: AssistantPrefs | null;
    update: (patch: Partial<AssistantPrefs>) => Promise<void>;
}
/** Load prefs + one-time localStorage migration; optimistic patch then reconcile. */
export declare function useAssistantStore(assistant: AssistantRemote | undefined, legacyKey: string, legacySlice: keyof AssistantPrefs): AssistantStore;
/** Live desktop capability probe for honest per-environment notices. */
export declare function useDesktopStatus(desktop: DesktopRemote | undefined): DesktopStatus | null;
//# sourceMappingURL=assistant-store.d.ts.map