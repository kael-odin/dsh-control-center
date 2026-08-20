/**
 * Data management settings section: export / import / clear the Control
 * Center data (credentials stay in the DSH credentials store).
 */
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client';
export interface DataSectionInjected {
    getData: () => NonNullable<ClientRemote['controlCenterData']>;
    hooks: {
        dataReady: HostObservable<boolean>;
    };
}
export type DataSectionProps = PropsRuntime<'settings.section'> & InjectFace<DataSectionInjected>;
export declare function DataSection({ getData, useDataReady }: DataSectionProps): import("react").JSX.Element;
//# sourceMappingURL=DataSection.d.ts.map