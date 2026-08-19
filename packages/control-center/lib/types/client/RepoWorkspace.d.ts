/**
 * Code Repository workspace: browse any local repository registered in the
 * catalog — file tree with lazy directory expansion and text-file preview.
 */
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client';
export interface RepoWorkspaceInjected {
    getRepos: () => NonNullable<ClientRemote['controlCenterRepos']>;
    hooks: {
        reposReady: HostObservable<boolean>;
    };
}
export type RepoWorkspaceProps = PropsRuntime<'application.surface', 'repo'> & InjectFace<RepoWorkspaceInjected>;
export declare function RepoWorkspace({ getRepos, useReposReady }: RepoWorkspaceProps): import("react").JSX.Element;
//# sourceMappingURL=RepoWorkspace.d.ts.map