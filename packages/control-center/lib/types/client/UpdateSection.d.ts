/**
 * Update settings section: check the GitHub release feed for a newer
 * Control Center version.
 */
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client';
export interface UpdateSectionInjected {
    getUpdate: () => NonNullable<ClientRemote['controlCenterUpdate']>;
    hooks: {
        updateReady: HostObservable<boolean>;
    };
}
export type UpdateSectionProps = PropsRuntime<'settings.section'> & InjectFace<UpdateSectionInjected>;
export declare function UpdateSection({ getUpdate, useUpdateReady }: UpdateSectionProps): import("react").JSX.Element;
//# sourceMappingURL=UpdateSection.d.ts.map