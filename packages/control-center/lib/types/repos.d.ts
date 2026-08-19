/**
 * Code Repository workspace Host service.
 *
 * Persists a catalog of local repositories (settings namespace) and exposes
 * read-only file-tree browsing confined to the registered repo roots: every
 * tree/readFile call is resolved and verified to stay inside a registered
 * repository before any filesystem access.
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import type { RepoRecord, RepoTreeEntry, RepoFileView, RepoBranch } from './repo-types.ts';
export declare class ReposService extends Service {
    static inject: readonly ["settings"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private scope;
    constructor(ctx: Context, _config?: {
        logger?: Context['logger'];
    });
    /** Registered repo roots, resolved to absolute paths. */
    private roots;
    /** Assert `candidate` stays inside one of the registered repo roots. */
    private confine;
    list(): Promise<RepoRecord[]>;
    add(path: string): Promise<RepoRecord>;
    remove(repoId: string): Promise<{
        absent: true;
    }>;
    tree(path: string, dir?: string): Promise<RepoTreeEntry[]>;
    readFile(path: string, maxBytes?: number): Promise<RepoFileView>;
    getBranch(path: string): Promise<RepoBranch>;
    [Symbol.dispose](): void;
}
//# sourceMappingURL=repos.d.ts.map