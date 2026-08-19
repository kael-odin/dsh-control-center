import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client';
export interface PaintWorkspaceInjected {
    getPainting: () => NonNullable<ClientRemote['controlCenterPainting']>;
    hooks: {
        paintingReady: HostObservable<boolean>;
    };
}
export type PaintingWorkspaceProps = PropsRuntime<'application.surface', 'painting'> & InjectFace<PaintWorkspaceInjected>;
/** Full Painting workspace over the real Control Center painting service. */
export declare function PaintingWorkspace({ getPainting, usePaintingReady, close }: PaintingWorkspaceProps): import("react").JSX.Element;
//# sourceMappingURL=PaintingWorkspace.d.ts.map