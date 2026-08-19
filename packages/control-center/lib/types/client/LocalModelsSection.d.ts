/**
 * Local Models settings section: register local model servers (Ollama,
 * llama.cpp, OpenAI-compatible), discover their models, and adopt them
 * into the provider catalog.
 */
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client';
export interface LocalModelsSectionInjected {
    getLocalModels: () => NonNullable<ClientRemote['controlCenterLocalModels']>;
    hooks: {
        localModelsReady: HostObservable<boolean>;
    };
}
export type LocalModelsSectionProps = PropsRuntime<'settings.section'> & InjectFace<LocalModelsSectionInjected>;
export declare function LocalModelsSection({ getLocalModels, useLocalModelsReady }: LocalModelsSectionProps): import("react").JSX.Element;
//# sourceMappingURL=LocalModelsSection.d.ts.map