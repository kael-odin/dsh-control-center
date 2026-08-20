/** Resolve a configured DSH provider's endpoint and credential through the same authority the Models page reads. */
import type { SettingsProvider } from '@deepseek-ai/dsh-settings';
import type { CredentialProvider } from '@deepseek-ai/dsh-credentials';
import type { LlmRuntime } from '@deepseek-ai/dsh-llm';
/** A provider route that is fully configured: display name, endpoint, and its settings identity. */
export interface ResolvedProvider {
    name: string;
    baseURL: string;
    settingsNs: string;
    settingsPath: readonly string[];
}
/**
 * Resolve a configured provider's endpoint from settings through the same
 * authority the Models page reads.
 */
export declare function resolveProvider(settings: SettingsProvider, llm: LlmRuntime, providerId: string): Promise<ResolvedProvider>;
/**
 * Get the provider credential value through the DSH credentials authority.
 * @returns the resolved secret value, or '' when unconfigured.
 */
export declare function resolveKey(settings: SettingsProvider, credentials: CredentialProvider, providerId: string, ns: string, path: readonly string[]): Promise<string>;
//# sourceMappingURL=provider-resolve.d.ts.map