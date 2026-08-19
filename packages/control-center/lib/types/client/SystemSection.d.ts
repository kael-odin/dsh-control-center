/**
 * System settings pages: About (versions + diagnostics) and Dependencies.
 */
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client';
export interface SystemSectionInjected {
    getSystem: () => NonNullable<ClientRemote['controlCenterSystem']>;
    hooks: {
        systemReady: HostObservable<boolean>;
    };
}
export type SystemSectionProps = PropsRuntime<'settings.section'> & InjectFace<SystemSectionInjected>;
/** 关于: versions, compatibility, environment, diagnostics. */
export declare function AboutSection({ getSystem, useSystemReady }: SystemSectionProps): import("react").JSX.Element;
/** 依赖: resolved DSH contract package versions. */
export declare function DependenciesSection({ getSystem, useSystemReady }: SystemSectionProps): import("react").JSX.Element;
//# sourceMappingURL=SystemSection.d.ts.map