import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { webSearchRemote } from '@dsh-control-center/control-center'
import type {
  WebSearchConfig,
  WebSearchProvider,
  WebSearchProviderId,
  WebSearchProviderOverrides
} from '@dsh-control-center/control-center'

export function useWebSearchConfig() {
  return useQuery({
    queryKey: ['websearch', 'config'],
    queryFn: () => webSearchRemote.getConfig()
  })
}

export function useWebSearchProviders() {
  return useQuery({
    queryKey: ['websearch', 'providers'],
    queryFn: () => webSearchRemote.listProviders()
  })
}

export function useWebSearchProvider(providerId: WebSearchProviderId) {
  return useQuery({
    queryKey: ['websearch', 'provider', providerId],
    queryFn: () => webSearchRemote.getProvider({ providerId })
  })
}

export function useUpdateWebSearchConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: Partial<WebSearchConfig>) => webSearchRemote.updateConfig(params),
    onSuccess: (data) => {
      queryClient.setQueryData(['websearch', 'config'], data)
    }
  })
}

export function useUpdateProviderOverride() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      providerId: WebSearchProviderId
      override: WebSearchProviderOverrides[WebSearchProviderId]
    }) => webSearchRemote.updateProviderOverride(params),
    onSuccess: (data) => {
      queryClient.setQueryData(['websearch', 'provider', data.id], data)
      queryClient.invalidateQueries({ queryKey: ['websearch', 'providers'] })
    }
  })
}

export function useCheckProviderReady() {
  return useMutation({
    mutationFn: (params: {
      providerId: WebSearchProviderId
      capability: 'searchKeywords' | 'fetchUrls'
    }) => webSearchRemote.checkProviderReady(params)
  })
}
