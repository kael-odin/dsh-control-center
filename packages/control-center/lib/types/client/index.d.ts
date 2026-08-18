/** Browser half of DSH Control Center. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type SettingsKey } from './shell-locales.ts';
import { type ModelsKey } from './locales.ts';
export type { ModelsSettingsState, ProviderRow } from './store.ts';
export type { ModelSelectionState } from './ModelSelectionPanel.tsx';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        'control-center': SettingsKey;
        'control-center.models': ModelsKey;
    }
}
export declare const inject: string[];
/** Register the settings shell, Provider/Model page, and onboarding steps. */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map