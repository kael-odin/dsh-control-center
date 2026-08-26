/** Provider resolution and capability-level readiness checks. */
import type { WebSearchCapability, WebSearchProvider, WebSearchProviderOverrides } from './types.ts';
export declare function resolveProviders(overrides: WebSearchProviderOverrides): WebSearchProvider[];
export declare function isWebSearchProviderReady(provider: WebSearchProvider | null, capability: WebSearchCapability): boolean;
//# sourceMappingURL=utils.d.ts.map