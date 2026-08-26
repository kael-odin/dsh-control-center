/**
 * Repo workspace (Cherry CodeCliPage parity, detection-first): the AI coding
 * CLIs visible on this machine's PATH, with versions and install hints.
 * Cherry also manages install/launch; DSH keeps that with the operator's
 * package manager — this surface is an honest capability map of the machine.
 */
import type { ReactNode } from 'react';
import type { EnvCheckEntry } from '../system-types.ts';
export interface RepoWorkspaceInjected {
    listCodeClis: () => Promise<EnvCheckEntry[]>;
}
export declare function RepoWorkspace({ listCodeClis }: RepoWorkspaceInjected): ReactNode;
//# sourceMappingURL=RepoWorkspace.d.ts.map