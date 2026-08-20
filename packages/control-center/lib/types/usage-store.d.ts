/**
 * Usage record store: append-only JSONL under <dshHome>/control-center/
 * usage.jsonl with a bounded in-memory view. Keyed per DSH home so tests
 * with isolated homes never observe each other.
 */
import type { UsageRecord } from './usage-types.ts';
export declare function usageStoreFor(home: string): UsageStore;
export declare class UsageStore {
    private readonly file;
    private records;
    private loaded;
    constructor(home: string);
    private ensureLoaded;
    /** Append one record; the file write is fire-and-forget (never blocks calls). */
    record(input: Omit<UsageRecord, 'id' | 'createdAt'>): UsageRecord;
    private trimFile;
    all(): UsageRecord[];
}
//# sourceMappingURL=usage-store.d.ts.map