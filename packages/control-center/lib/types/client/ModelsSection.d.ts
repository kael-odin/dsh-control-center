/**
 * 模型 (Default Models) section — Cherry ModelSettings parity.
 *
 * Provider editing lives in 模型服务, exactly as Cherry splits
 * ProviderSettings and ModelSettings into two pages. This page owns
 * per-purpose model selection over the host authority, in Cherry's row order:
 * - 默认模型 / 当前会话模型 via the shared ModelSelectionPanel;
 * - 快捷模型 preference plus its settings drawer (话题命名);
 * - 翻译模型 / 绘画模型 preferences persisted to `control-center-model-prefs`
 *   and honored by the workspaces as their initial selection instead of
 *   "whatever the catalog listed first";
 * - 重试设置 projected onto every live provider profile as a real DSH
 *   `retryPolicy`, so the harness retry plugin enforces it on actual requests.
 */
import type { ReactNode } from 'react';
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client';
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots';
import type { ModelSelectionPanelProps } from './ModelSelectionPanel.tsx';
import type { ModelPrefsState } from './model-prefs-store.ts';
import type { en } from './locales.ts';
/** Shared provider identity (also consumed by the 模型服务 page). */
export interface ProviderIdentity {
    /** Stable provider route id. */
    provider: string;
    /** Human-facing provider name. */
    displayName: string;
}
/** Stable visible and accessible identity for one provider target. */
export declare function providerTargetLabel(target: ProviderIdentity): string;
/** Replace the one provider placeholder in localized destructive-action copy. */
export declare function providerCopy(template: string, target: ProviderIdentity): string;
/**
 * Remove one user-added provider and its page-managed credential. Credential
 * removal comes first so a second-step failure leaves the provider row visible
 * and the whole operation safely retryable; both unsets are idempotent. The
 * settings removal names the profile rather than rebuilding its whole
 * namespace from a partial view. (Shared with the 模型服务 page.)
 */
export declare function removeProviderProfile(api: Pick<IApiClient, 'settings' | 'credentials'>, controller: {
    load(): Promise<void>;
}, target: {
    settingsNs: string;
    settingsPath: readonly string[];
    credentialRef?: string;
}): Promise<string | undefined>;
/** Injected dependencies of {@link ModelsSection}. */
export interface ModelsSectionInjected {
    /** The default/current model controller. */
    controller: import('./store.ts').ModelsSettingsStore;
    useSnapshot: SnapshotSelectorHook<import('./store.ts').ModelsSettingsState>;
    /** Per-purpose preference controller. */
    prefsController: import('./model-prefs-store.ts').ModelPrefsStore;
    usePrefsSnapshot: SnapshotSelectorHook<ModelPrefsState>;
    api: Pick<IApiClient, 'settings' | 'credentials' | 'llm'>;
    /** Default/current model selection props. */
    modelSelection: ModelSelectionPanelProps;
    schema: import('./schema-operations.ts').SettingsSchemaOperations;
    t: (key: keyof typeof en) => string;
}
/** Props delivered by the slot outlet (partial until injected). */
export type ModelsSectionProps = Partial<ModelsSectionInjected>;
/**
 * Render the 模型 section.
 * @param props - slot-delivered injected dependencies.
 * @returns the section, or null while the shell has not injected yet.
 */
export declare function ModelsSection(props: ModelsSectionProps): ReactNode;
//# sourceMappingURL=ModelsSection.d.ts.map