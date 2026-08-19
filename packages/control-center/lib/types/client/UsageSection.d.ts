/**
 * Usage Analytics settings section: service counts from the Control Center
 * catalog plus the DSH session store (client side).
 */
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client';
export interface UsageSectionInjected {
    getUsage: () => NonNullable<ClientRemote['controlCenterUsage']>;
    hooks: {
        usageReady: HostObservable<boolean>;
    };
}
export type UsageSectionProps = PropsRuntime<'settings.section'> & InjectFace<UsageSectionInjected>;
export declare function UsageSection({ getUsage, useUsageReady }: UsageSectionProps): import("react").JSX.Element;
//# sourceMappingURL=UsageSection.d.ts.map