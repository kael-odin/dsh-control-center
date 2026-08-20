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
export declare const PROVIDER_TYPES: ReadonlyArray<{
    value: ProviderType;
    label: string;
}>;
export declare const DEFAULT_BASE_URLS: Record<ProviderType, string>;
//# sourceMappingURL=provider-presets.d.ts.map