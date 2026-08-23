/**
 * Desktop general preferences (启动行为 / 托盘) behind the 通用 page — Cherry
 * GeneralSettings parity for the parts DSH can honor: the preferences persist
 * in the shared `control-center-general` settings namespace, and the desktop
 * companion reads the same document at startup to apply 开机自启 and
 * 关闭到托盘. Proxy / context management / hardware acceleration are honest
 * platform notes on the page, not fake switches.
 */
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client';
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { SettingsSchemaOperations } from './schema-operations.ts';
export declare const GENERAL_NAMESPACE = "control-center-general";
export interface GeneralPrefs {
    launchOnBoot: boolean;
    trayEnabled: boolean;
    trayOnClose: boolean;
    preventSleepWhenBusy: boolean;
}
export interface GeneralState {
    status: 'idle' | 'loading' | 'ready' | 'error';
    error: string | null;
    writeError: string | null;
    available: boolean;
    writable: boolean;
    revision: number | null;
    prefs: GeneralPrefs;
}
export declare class GeneralSettingsStore {
    private readonly api;
    private readonly schema;
    readonly store: SnapshotStore<GeneralState>;
    private generation;
    constructor(api: Pick<IApiClient, 'settings'>, schema: SettingsSchemaOperations);
    load(): Promise<void>;
    /** Persist one preference; keeps the others untouched. */
    save(key: keyof GeneralPrefs, value: boolean): Promise<boolean>;
}
//# sourceMappingURL=general-store.d.ts.map