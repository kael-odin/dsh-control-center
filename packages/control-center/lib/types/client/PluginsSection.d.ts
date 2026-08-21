import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client';
export interface PluginsSectionInjected {
    getSystem: () => NonNullable<ClientRemote['controlCenterSystem']>;
    hooks: {
        systemReady: HostObservable<boolean>;
    };
}
export type PluginsSectionProps = PropsRuntime<'settings.section'> & InjectFace<PluginsSectionInjected>;
export declare function PluginsSection({ getSystem, useSystemReady }: PluginsSectionProps): import("react").JSX.Element;
//# sourceMappingURL=PluginsSection.d.ts.map