/**
 * Update Host service: check the GitHub release feed for a newer Control
 * Center version than the installed one, and (PLUGINIZATION §2.A) download a
 * release bundle into DSH storage so the operator can install it in one flow.
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import { z } from 'zod';
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
/** Result of a successful prepareUpdate download. */
export interface PreparedUpdate {
    version: string;
    assetName: string;
    bytes: number;
}
declare const bundleSchema: z.ZodObject<{
    version: z.ZodString;
    assetName: z.ZodString;
    bytes: z.ZodNumber;
    dataBase64: z.ZodString;
    downloadedAt: z.ZodString;
}, z.core.$strip>;
export type UpdateBundleRecord = z.infer<typeof bundleSchema>;
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
    /**
     * PLUGINIZATION §2.A: download the latest release's bundle tarball into DSH
     * storage so installation is a guided flow instead of a manual GitHub trip.
     * The asset must be a `.tgz` whose name mentions the control-center package;
     * anything else is refused (no blind execution of release attachments).
     */
    prepareUpdate(): Promise<{
        ok: true;
        value: PreparedUpdate;
    } | {
        ok: false;
        error: string;
    }>;
    /** The stored prepared update, if one has been downloaded. */
    getPreparedUpdate(): Promise<{
        ok: true;
        value: PreparedUpdate | null;
    }>;
    private openBundleStore;
    private bundleTable;
    /**
     * Pick the installable tarball from a release's assets: prefer a name that
     * names the control-center package; refuse non-tgz attachments outright.
     */
    private pickBundleAsset;
    private currentVersion;
    private packageRoot;
    [Symbol.dispose](): void;
}
export {};
//# sourceMappingURL=update.d.ts.map