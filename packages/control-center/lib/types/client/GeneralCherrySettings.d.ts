/**
 * One 通用 preference block contributed to the native General settings page —
 * Cherry GeneralSettings parity for the parts DSH can honor (启动行为 / 托盘),
 * plus honest platform notes for 代理 / 上下文管理.
 *
 * The native General page renders every `settings.general.item` row; this
 * component owns its own copy, store, and write path through the injected
 * `generalController`.
 */
import type { ReactNode } from 'react';
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots';
import type { GeneralSettingsStore, GeneralState } from './general-store.ts';
import type { en } from './locales.ts';
export interface GeneralCherrySettingsInjected {
    controller: GeneralSettingsStore;
    useSnapshot: SnapshotSelectorHook<GeneralState>;
    t: (key: keyof typeof en) => string;
}
export type GeneralCherrySettingsProps = Partial<GeneralCherrySettingsInjected>;
export declare function GeneralCherrySettings(props: GeneralCherrySettingsProps): ReactNode;
//# sourceMappingURL=GeneralCherrySettings.d.ts.map