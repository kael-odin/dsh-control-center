/**
 * Data management Host service: export / import / clear the Control Center
 * settings namespaces as one JSON snapshot (credentials stay in the DSH
 * credentials store and are never part of the export).
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
/**
 * Every settings namespace the Control Center plugin owns — the full backup
 * surface. Credentials stay in the DSH credentials store and are never part of
 * an export.
 */
export declare const DATA_NAMESPACES: import("@deepseek-ai/dsh-settings").SettingsNamespace[];
export interface DataExport {
    version: 1;
    exportedAt: string;
    namespaces: Record<string, object>;
}
export declare const S3_NS: import("@deepseek-ai/dsh-settings").SettingsNamespace;
export interface S3Config {
    endpoint: string;
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    /** Optional prefix under the bucket (e.g. `backups/`). */
    prefix: string;
}
export interface S3ConfigView {
    endpoint: string;
    bucket: string;
    region: string;
    accessKeyId: string;
    prefix: string;
    secretSet: boolean;
}
export interface S3ConfigUpdate {
    endpoint: string;
    bucket: string;
    region: string;
    accessKeyId: string;
    prefix: string;
    secret?: string;
}
/**
 * WebDAV cloud-backup vendors. 坚果云 (nutstore) is plain WebDAV, but users
 * keep separate accounts (and Nutstore requires an app-specific password), so
 * each vendor owns an isolated config namespace under one shared schema.
 */
export type WebDavVendor = 'webdav' | 'nutstore';
export declare const WEBDAV_VENDORS: readonly WebDavVendor[];
export declare const WEBDAV_NS: import("@deepseek-ai/dsh-settings").SettingsNamespace;
export interface WebDavConfig {
    host: string;
    user: string;
    pass: string;
    path: string;
}
/** Config view safe for the wire: the password never leaves the host. */
export interface WebDavConfigView {
    host: string;
    user: string;
    path: string;
    passSet: boolean;
}
/** Config update; `pass` is written only when non-empty (write-only input). */
export interface WebDavConfigUpdate {
    host: string;
    user: string;
    path: string;
    pass?: string;
}
export declare class DataService extends Service {
    static inject: readonly ["settings"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    constructor(ctx: Context, _config?: {
        logger?: Context['logger'];
    });
    exportControlCenter(): Promise<DataExport>;
    importControlCenter(snapshot: DataExport): Promise<{
        absent: true;
    }>;
    /** Reset every Control Center settings namespace to its default. */
    clearControlCenter(): Promise<{
        absent: true;
    }>;
    /** Write the snapshot to a file (backup to a local path). */
    exportToFile(path: string): Promise<{
        absent: true;
    }>;
    /** Read a snapshot from a file and import it. */
    importFromFile(path: string): Promise<{
        absent: true;
    }>;
    /**
     * Backup to a directory: create a timestamped snapshot file and prune
     * old backups beyond maxBackups (0 = unlimited).
     * Returns the newly created file path. The Typert gateway wraps this in
     * `{ ok: true, value: string }` on the client side; failures are thrown.
     */
    backupToDirectory(dir: string, maxBackups: number): Promise<string>;
    /**
     * List existing backup files in a directory, sorted newest-first.
     * Returns the file names; the Typert gateway wraps them in `{ ok, value }`.
     */
    listBackupFiles(dir: string): Promise<string[]>;
    /** Read the stored WebDAV config (password omitted on the wire). */
    getWebdavConfig(vendor?: WebDavVendor): Promise<WebDavConfigView>;
    /** Save the WebDAV config. `pass` is write-only: it replaces the stored
     * secret only when provided and non-empty. */
    setWebdavConfig(config: WebDavConfigUpdate, vendor?: WebDavVendor): Promise<{
        absent: true;
    }>;
    private loadWebdavConfig;
    /** PROPFIND the target collection to verify host + credentials. */
    testWebdavConnection(vendor?: WebDavVendor): Promise<{
        ok: boolean;
        message: string;
    }>;
    /** PUT a timestamped snapshot to the WebDAV collection. Returns the remote file name. */
    webdavBackup(vendor?: WebDavVendor): Promise<string>;
    /** GET a snapshot from the WebDAV collection and import it. */
    webdavRestore(fileName: string, vendor?: WebDavVendor): Promise<{
        absent: true;
    }>;
    /** PROPFIND Depth:1 to list snapshot files in the WebDAV collection. */
    listWebdavBackups(vendor?: WebDavVendor): Promise<string[]>;
    [Symbol.dispose](): void;
    /** Read the stored S3 config (secret omitted on the wire). */
    getS3Config(): Promise<S3ConfigView>;
    /** Save the S3 config; `secret` is write-only (keeps the stored one when empty). */
    setS3Config(config: S3ConfigUpdate): Promise<{
        absent: true;
    }>;
    private loadS3Config;
    /** HEAD the bucket to verify endpoint + credentials. */
    testS3Connection(): Promise<{
        ok: boolean;
        message: string;
    }>;
    /** PUT a timestamped snapshot to the bucket. Returns the remote object name. */
    s3Backup(): Promise<string>;
    /** GET a snapshot from the bucket and import it. */
    s3Restore(fileName: string): Promise<{
        absent: true;
    }>;
    /** ListObjectsV2 (prefix-scoped) to enumerate snapshot objects. */
    listS3Backups(): Promise<string[]>;
}
//# sourceMappingURL=data.d.ts.map