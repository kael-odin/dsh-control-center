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
    namespaces: Record<string, unknown>;
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
    [Symbol.dispose](): void;
}
//# sourceMappingURL=data.d.ts.map