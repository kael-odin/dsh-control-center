import type { RemoteDescriptor } from '@deepseek-ai/dsh-api-remotes/client'

const websearchRemote: RemoteDescriptor = {
  package: '@dsh-control-center/control-center',
  descriptors: [{
    namespace: 'controlCenterWebSearch',
    methods: [
      'getConfig',
      'updateConfig',
      'listProviders',
      'getProvider',
      'updateProviderOverride',
      'checkProviderReady'
    ]
  }]
}

export default websearchRemote

declare module '@deepseek-ai/dsh-api-remotes/client' {
  interface Remote {
    controlCenterWebSearch?: {
      getConfig(): Promise<import('./websearch/types.ts').WebSearchConfig>
      updateConfig(update: Partial<import('./websearch/types.ts').WebSearchConfig>): Promise<import('./websearch/types.ts').WebSearchConfig>
      listProviders(): Promise<import('./websearch/types.ts').WebSearchProvider[]>
      getProvider(params: { providerId: import('./websearch/types.ts').WebSearchProviderId }): Promise<import('./websearch/types.ts').WebSearchProvider | null>
      updateProviderOverride(params: {
        providerId: import('./websearch/types.ts').WebSearchProviderId
        override: Partial<import('./websearch/types.ts').WebSearchProviderOverrides[keyof import('./websearch/types.ts').WebSearchProviderOverrides]>
      }): Promise<import('./websearch/types.ts').WebSearchProvider>
      checkProviderReady(params: {
        providerId: import('./websearch/types.ts').WebSearchProviderId
        capability: import('./websearch/types.ts').WebSearchCapability
      }): Promise<boolean>
    }
  }
}
