/**
 * Web Search provider utilities - resolver and readiness checks.
 */
import type { WebSearchProvider, WebSearchProviderOverrides, WebSearchCapability } from './types.ts';
export declare function resolveProviders(overrides: WebSearchProviderOverrides): WebSearchProvider[];
export declare function isWebSearchProviderReady(provider: WebSearchProvider | null, capability: WebSearchCapability): boolean;
//# sourceMappingURL=utils.d.ts.map