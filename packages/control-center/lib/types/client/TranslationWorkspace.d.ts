import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ClientRemote, ModelProviderGroup } from '@deepseek-ai/dsh-api-remotes/client';
export interface TranslationWorkspaceInjected {
    getTranslation: () => NonNullable<ClientRemote['controlCenterTranslation']>;
    listModels: () => Promise<readonly ModelProviderGroup[]>;
    hooks: {
        translationReady: HostObservable<boolean>;
    };
    /** Per-purpose preference snapshot; a matching entry preselects. */
    useModelPref?: () => import('./model-prefs-store.ts').ModelPrefsState;
}
export type TranslationWorkspaceProps = PropsRuntime<'application.surface', 'translation'> & InjectFace<TranslationWorkspaceInjected>;
/** Full Translation product workspace over the Control Center Host service. */
export declare function TranslationWorkspace({ getTranslation, listModels, useTranslationReady, useModelPref, close }: TranslationWorkspaceProps): import("react").JSX.Element;
//# sourceMappingURL=TranslationWorkspace.d.ts.map