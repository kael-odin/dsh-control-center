/**
 * WebSearch Remote namespace augmentation for TypeScript inference.
 *
 * Strict-mode Typert remote calls return a discriminated envelope:
 * `{ ok: true; value: T } | { ok: false; error: { code, message, details } }`.
 */
type RemoteResult<T> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: {
        code: string;
        message: string;
        details: object;
    };
};
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertClientRemote {
        controlCenterWebSearch?: {
            getConfig(): Promise<RemoteResult<import('./websearch/types.ts').WebSearchConfig>>;
            updateConfig(params: Partial<import('./websearch/types.ts').WebSearchConfig>): Promise<RemoteResult<import('./websearch/types.ts').WebSearchConfig>>;
            listProviders(): Promise<RemoteResult<import('./websearch/types.ts').WebSearchProvider[]>>;
            getProvider(params: {
                providerId: import('./websearch/types.ts').WebSearchProviderId;
            }): Promise<RemoteResult<import('./websearch/types.ts').WebSearchProvider | null>>;
            updateProviderOverride(params: {
                providerId: import('./websearch/types.ts').WebSearchProviderId;
                override: import('./websearch/types.ts').WebSearchProviderOverrides[import('./websearch/types.ts').WebSearchProviderId];
            }): Promise<RemoteResult<import('./websearch/types.ts').WebSearchProvider>>;
            checkProviderReady(params: {
                providerId: import('./websearch/types.ts').WebSearchProviderId;
                capability: import('./websearch/types.ts').WebSearchCapability;
            }): Promise<RemoteResult<boolean>>;
        };
    }
}
export {};
//# sourceMappingURL=websearch-types.d.ts.map