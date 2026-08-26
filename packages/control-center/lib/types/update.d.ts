/**
 * Update Host service: check the GitHub release feed for a newer Control
 * Center version than the installed one.
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
export interface UpdateInfo {
    currentVersion: string;
    latestVersion: string | null;
    updateAvailable: boolean;
    releaseUrl: string | null;
    notes: string | null;
    checkedAt: string;
}
/** One published release as shown in the inline release-notes page. */
export interface ReleaseEntry {
    tagName: string;
    name: string | null;
    publishedAt: string | null;
    body: string | null;
    htmlUrl: string | null;
    prerelease: boolean;
}
export declare class UpdateService extends Service {
    static inject: readonly ["settings"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    constructor(ctx: Context, _config?: {
        logger?: Context['logger'];
    });
    checkForUpdates(): Promise<UpdateInfo>;
    /**
     * The deployment's recent releases (newest first) for the inline
     * release-notes page — Cherry's releaseNotes top-level page parity.
     */
    listReleases(): Promise<{
        ok: true;
        value: ReleaseEntry[];
    } | {
        ok: false;
        error: string;
    }>;
    private currentVersion;
    private packageRoot;
    [Symbol.dispose](): void;
}
//# sourceMappingURL=update.d.ts.map