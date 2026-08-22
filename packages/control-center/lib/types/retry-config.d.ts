/**
 * Host-side reader for the Cherry 重试设置 persisted in the shared
 * `control-center-model-prefs` namespace.
 *
 * The namespace is owned (registered) by the plugin entry, and duplicate
 * registration fails loud, so consumer services peek through
 * `settings.describe()` — the same pattern the channel bridge already uses
 * for `agent-default-model`. Reading live means a settings edit reaches the
 * next call without a restart; a missing settings service (standalone-service
 * tests) simply disables retry.
 */
/** Cherry 重试设置 facts one host-side call honors. */
export interface HostRetryPolicy {
    readonly enabled: boolean;
    readonly maxAttempts: number;
    readonly backoff: boolean;
    readonly fallbacks: ReadonlyArray<{
        readonly provider: string;
        readonly model: string;
    }>;
}
export declare const NO_RETRY_POLICY: HostRetryPolicy;
/** Minimal describe() surface the reader needs. */
export interface RetrySettingsSource {
    describe(): unknown;
}
/** Read the persisted retry config; anything malformed disables retry. */
export declare function readHostRetryPolicy(settings: RetrySettingsSource | undefined): HostRetryPolicy;
//# sourceMappingURL=retry-config.d.ts.map