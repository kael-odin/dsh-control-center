/**
 * Usage Analytics — Cherry UsageSettings parity: window tabs, metric strip
 * with deltas, insight strip, daily heatmap, distribution chart, entries
 * table. Data comes from the Control Center usage record store (translation/
 * painting/embedding calls record real tokens).
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