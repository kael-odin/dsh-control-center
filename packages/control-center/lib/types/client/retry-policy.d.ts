/**
 * Projection of the Cherry 重试设置 onto DSH provider-owned retry policies.
 *
 * The harness executes retries through its own `llm-retry` plugin, which reads
 * each provider route's immutable `retryPolicy` (resolved at registration from
 * the provider profile). There is no global user-level policy object to flip:
 * a global setting is real only if it is written into every live profile. This
 * module builds exactly those settings ops.
 *
 * Semantics follow Cherry (`chat.retry.*`, passed through to the AI SDK):
 * - disabled → an explicit `{ mode: 'normal', maxRetries: 0 }` policy, i.e.
 *   genuinely no automatic retry (the harness default would be five).
 * - enabled with backoff on → omit the `backoff` key so the adapter defaults
 *   apply (bounded exponential backoff with jitter).
 * - enabled with backoff off → a minimal positive delay with no jitter,
 *   because the policy schema rejects zero.
 */
import type { RetryConfig } from './model-prefs-store.ts';
/** One live provider profile addressed for a retryPolicy write. */
export interface RetryPolicyTarget {
    /** Settings namespace carrying the profile (`llm-pi-ai` / `llm-deepseek`). */
    readonly ns: string;
    /**
     * Path of the profile object inside the section ([] when the whole section
     * is one provider, like `llm-deepseek`).
     */
    readonly path: readonly string[];
}
/** The DSH retry-policy value one Cherry retry config projects to. */
export declare function dshRetryPolicyOf(config: RetryConfig): Record<string, unknown>;
/**
 * Path-addressed ops writing the projected policy into every target profile
 * plus the provider-stash copies, so a later re-enable restores a current
 * policy too. One op per profile keeps the caller free to batch them into its
 * per-namespace mutates.
 */
export declare function retryPolicyOps(config: RetryConfig, targets: readonly RetryPolicyTarget[], stashProviderIds?: readonly string[]): ReadonlyArray<{
    ns: string;
    op: {
        op: 'set';
        path: string[];
        value: unknown;
    };
}>;
/** Group flat writes into one mutate payload per namespace. */
export declare function groupByNamespace(writes: ReadonlyArray<{
    ns: string;
    op: {
        op: 'set';
        path: string[];
        value: unknown;
    };
}>): ReadonlyArray<{
    ns: string;
    ops: Array<{
        op: 'set';
        path: string[];
        value: unknown;
    }>;
}>;
//# sourceMappingURL=retry-policy.d.ts.map