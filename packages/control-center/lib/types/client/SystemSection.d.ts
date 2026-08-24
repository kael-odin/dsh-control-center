/**
 * System settings pages: About (versions + diagnostics) and Dependencies.
 */
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client';
import type { ChannelBridgeHandle } from './ChannelsSection.tsx';
export interface SystemSectionInjected {
    getSystem: () => NonNullable<ClientRemote['controlCenterSystem']>;
    /** Lazy handle to the host channel bridge, for including channel runtime
     * status/logs in the diagnostic bundle (absent until the bridge mounts). */
    getBridge?: (() => ChannelBridgeHandle | undefined) | undefined;
    hooks: {
        systemReady: HostObservable<boolean>;
    };
}
export type SystemSectionProps = PropsRuntime<'settings.section'> & InjectFace<SystemSectionInjected>;
/** 关于: versions, compatibility, environment, diagnostics. */
export declare function AboutSection({ getSystem, getBridge, useSystemReady }: SystemSectionProps): import("react").JSX.Element;
/** 依赖: resolved DSH contract package versions. */
export declare function DependenciesSection({ getSystem, useSystemReady }: SystemSectionProps): import("react").JSX.Element;
//# sourceMappingURL=SystemSection.d.ts.map