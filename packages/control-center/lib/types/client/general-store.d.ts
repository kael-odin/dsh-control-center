/** General settings store for desktop behavior and Cherry-compatible context preferences. */
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client';
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { SettingsSchemaOperations } from './schema-operations.ts';
export declare const GENERAL_NAMESPACE = "control-center-general";
export interface GeneralPrefs {
    launchOnBoot: boolean;
    trayEnabled: boolean;
    trayOnClose: boolean;
    trayOnLaunch: boolean;
    preventSleepWhenBusy: boolean;
    developerMode: boolean;
    contextEnabled: boolean;
    contextMaxMessages: number | null;
    contextToolOutputThreshold: number;
    contextAutoCompress: boolean;
    contextCompressionProvider: string;
    contextCompressionModel: string;
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
    /** Persist one preference; keeps every other setting unchanged. */
    save<K extends keyof GeneralPrefs>(key: K, value: GeneralPrefs[K]): Promise<boolean>;
}
//# sourceMappingURL=general-store.d.ts.map