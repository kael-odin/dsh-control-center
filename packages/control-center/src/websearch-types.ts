/**
 * WebSearch Remote namespace augmentation for TypeScript inference.
 */

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertClientRemote {
    controlCenterWebSearch?: {
      getConfig(): Promise<import('./websearch/types.ts').WebSearchConfig>
      updateConfig(params: Partial<import('./websearch/types.ts').WebSearchConfig>): Promise<import('./websearch/types.ts').WebSearchConfig>
      listProviders(): Promise<import('./websearch/types.ts').WebSearchProvider[]>
      getProvider(params: { providerId: import('./websearch/types.ts').WebSearchProviderId }): Promise<import('./websearch/types.ts').WebSearchProvider | null>
      updateProviderOverride(params: {
        providerId: import('./websearch/types.ts').WebSearchProviderId
        override: import('./websearch/types.ts').WebSearchProviderOverrides[import('./websearch/types.ts').WebSearchProviderId]
      }): Promise<import('./websearch/types.ts').WebSearchProvider>
      checkProviderReady(params: {
        providerId: import('./websearch/types.ts').WebSearchProviderId
        capability: import('./websearch/types.ts').WebSearchCapability
      }): Promise<boolean>
    }
  }
}

export {}
