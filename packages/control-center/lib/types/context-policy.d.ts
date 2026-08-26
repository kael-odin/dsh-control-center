/**
 * Live context policy for Control Center's General settings.
 *
 * The policy spills accepted plain-text tool results before DSH appends the
 * result to the session. It also turns a recent-message limit into a durable
 * surface replacement, so every model request remains reconstructable from the
 * session log.
 */
import type { Context } from '@deepseek-ai/cordis';
import type { ContentBlock, Message } from '@deepseek-ai/dsh-llm/types';
/** Character counts Cherry retains around an oversized in-flight tool result. */
export declare const CONTEXT_TOOL_OUTPUT_HEAD_CHARS = 500;
export declare const CONTEXT_TOOL_OUTPUT_TAIL_CHARS = 1000;
/** The General-settings fields consumed by the live policy. */
export interface ContextPolicySettings {
    contextEnabled: boolean;
    contextMaxMessages: unknown;
    contextToolOutputThreshold: number;
    contextAutoCompress: boolean;
    contextCompressionProvider: string;
    contextCompressionModel: string;
}
interface ContextPolicySession {
    readonly surface: {
        readonly nodes: readonly number[];
    };
    readonly events: readonly unknown[];
    deriveEventMessage(event: unknown): Message | null;
    append(type: string, data: unknown, options?: unknown): unknown;
}
interface TokenMeter {
    estimateMessage(message: Message): number;
}
/** One head range selected for a replay-safe context-window replacement. */
export interface ContextWindowSelection {
    start: number;
    end: number;
    shadowedSeqs: number[];
}
/** Count Unicode code points so a retained boundary cannot split a surrogate pair. */
export declare function contextCodePointLength(text: string): number;
/** Normalize persisted values the settings document may contain outside the UI. */
export declare function normalizeContextMaxMessages(value: unknown): number | null;
/**
 * Select an old surface prefix that can be compacted without splitting tool
 * calls from their results. Generated compaction checkpoints are not charged
 * against the configured count, so a stable checkpoint plus N recent messages
 * does not compact again on every request.
 */
export declare function selectContextWindow(session: ContextPolicySession, maxMessages: unknown): ContextWindowSelection | undefined;
/** Replace an old range with a truthful model-visible omission checkpoint. */
export declare function omitContextWindow(session: ContextPolicySession, selection: ContextWindowSelection, tokenMeter: TokenMeter): void;
/** Flatten all-text output, or preserve a result whose rich block layout matters. */
export declare function flattenContextToolOutput(content: readonly ContentBlock[]): string | undefined;
/**
 * Build a bounded Cherry-style preview for a spilled result.
 *
 * The notice is reserved before head/tail allocation so the result stays within
 * the configured character threshold even when a locator is long.
 */
export declare function createContextToolOutputPreview(text: string, threshold: number, spill: {
    locator: string;
    retrievalHint: string;
}): string | undefined;
/** Return an explicit summary route only when the user supplied a complete pair. */
export declare function resolveContextCompressionTarget(settings: Pick<ContextPolicySettings, 'contextEnabled' | 'contextAutoCompress' | 'contextCompressionProvider' | 'contextCompressionModel'>): {
    provider: string;
    model: string;
} | undefined;
/**
 * Register live context controls. Settings are read at every execution boundary,
 * so the next tool result, compaction request, or model step sees the latest
 * saved values without a host restart.
 */
export declare function installContextPolicy(ctx: Context, readSettings: () => ContextPolicySettings): void;
export {};
//# sourceMappingURL=context-policy.d.ts.map