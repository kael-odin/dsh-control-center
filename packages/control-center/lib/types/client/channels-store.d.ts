/**
 * Channel instances (频道) authority: the `control-center-channels` settings
 * namespace. The desktop bridge reads the same section from settings.yaml to
 * bind bots, so a channel configured here is exactly what a desktop deploy
 * picks up — no second store, no sync.
 *
 * When the running host predates the namespace the store degrades to
 * ready/unavailable, and the section falls back to browser-local persistence
 * with an honest notice (same contract as the model-preferences store).
 */
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client';
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
export declare const CHANNELS_NAMESPACE = "control-center-channels";
/** One configured channel instance (shape owned by the section). */
export interface ChannelInstance {
    id: string;
    type: string;
    name: string;
    config: Record<string, unknown>;
    permissionMode: string;
    isActive: boolean;
    createdAt: number;
}
export interface ChannelsState {
    status: 'idle' | 'loading' | 'ready' | 'error';
    error: string | null;
    /** False when the running host does not register the namespace. */
    available: boolean;
    writable: boolean;
    revision: number | null;
    instances: readonly ChannelInstance[];
}
/** The shared controller (one per client surface). */
export declare class ChannelsStore {
    private readonly api;
    readonly store: SnapshotStore<ChannelsState>;
    private generation;
    constructor(api: Pick<IApiClient, 'settings'>);
    load(): Promise<void>;
    /** The instances array, tolerant of a host that stored anything unexpected. */
    private readInstances;
    /** Persist the whole instance list (small by construction). */
    save(instances: readonly ChannelInstance[]): Promise<boolean>;
}
/**
 * One-time import of the pre-settings localStorage list. Runs at most once
 * per browser (flagged), and only merges when the authority is empty — a
 * configured settings.yaml always wins over browser leftovers.
 */
export declare function importLegacyChannels(store: ChannelsStore): Promise<boolean>;
//# sourceMappingURL=channels-store.d.ts.map