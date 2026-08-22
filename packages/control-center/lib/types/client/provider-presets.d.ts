/**
 * Built-in provider presets — Cherry Studio provider catalog parity
 * (providers.json endpointConfigs). All presets are OpenAI-compatible
 * endpoints unless noted; provider-specific IAM/OAuth flows (Vertex, Bedrock,
 * Azure IAM) are represented by their API-key/baseURL form.
 *
 * AGPL-3.0-only — adapted from Cherry Studio's provider registry.
 */
import type { ProviderType } from '../provider-types.ts';
export interface ProviderPreset {
    /** Stable preset id. */
    id: string;
    /** Display name (zh-CN, Cherry label). */
    name: string;
    /** API shape used for connection tests and discovery. */
    type: ProviderType;
    /** Base URL prefill; '' means the user supplies it. */
    baseURL: string;
    /** Preset group for the picker. */
    group: 'domestic' | 'international' | 'local' | 'custom';
}
export declare const PROVIDER_PRESETS: readonly ProviderPreset[];
export declare const PROVIDER_PRESET_GROUPS: ReadonlyArray<{
    id: ProviderPreset['group'];
    label: string;
}>;
/**
 * Preset ids the harness's pi-ai adapter ships as installed catalog routes. A
 * fresh pick of one of these routes is served by pi-ai's own catalog entry
 * (its base URL, protocol, and models), so the editor treats it as a shipped
 * route rather than a hand-declared one. This is a client-side UI heuristic
 * mirroring the adapter's installed catalog; once a route is configured the
 * authoritative answer comes from `llm.providers()`'s `declared` field.
 */
export declare const PI_AI_SHIPPED_PRESET_IDS: ReadonlySet<string>;
export declare const PROVIDER_TYPES: ReadonlyArray<{
    value: ProviderType;
    label: string;
}>;
export declare const DEFAULT_BASE_URLS: Record<ProviderType, string>;
/**
 * The wire protocol a preset's endpoint most plausibly speaks, pre-filled into
 * the profile when a user configures the preset through the UI. The harness's
 * pi-ai adapter accepts only `openai-completions`, `openai-responses`, and
 * `anthropic-messages` for a hand-declared route, so every preset maps to the
 * closest of the three: OpenAI-compatible families default to chat
 * completions, Anthropic to Messages. The remaining types (Google, Azure,
 * Ollama) are OpenAI-compatible in name only — their native endpoints are not
 * — so the default is an honest best-effort the user must adjust (or use the
 * adapter's own catalog route for the same provider), surfaced by the UI as a
 * capability note rather than silently claimed to work.
 * @param type - the preset's declared API shape.
 * @returns the wire protocol to pre-fill, or `openai-completions` as the
 *   honest fallback.
 */
export declare function presetApiOf(type: ProviderType): string;
//# sourceMappingURL=provider-presets.d.ts.map