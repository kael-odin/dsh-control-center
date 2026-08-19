import { useState, useMemo, useCallback } from 'react'
import type {
  WebSearchProvider,
  WebSearchProviderId,
  WebSearchCapability
} from '@dsh-control-center/control-center'

export interface WebSearchProviderMenuEntry {
  key: string
  provider: WebSearchProvider
  capability: WebSearchCapability
  providerCapability: WebSearchProvider['capabilities'][number]
}

export function getWebSearchFeatureSections(providers: WebSearchProvider[]) {
  const sections: Array<{
    capability: WebSearchCapability
    entries: WebSearchProviderMenuEntry[]
  }> = []

  const capabilitiesSet = new Set<WebSearchCapability>()

  for (const provider of providers) {
    for (const capability of provider.capabilities) {
      capabilitiesSet.add(capability.feature)
    }
  }

  const capabilities = Array.from(capabilitiesSet).sort()

  for (const capability of capabilities) {
    const entries: WebSearchProviderMenuEntry[] = []

    for (const provider of providers) {
      const providerCapability = provider.capabilities.find(c => c.feature === capability)
      if (providerCapability) {
        entries.push({
          key: `${provider.id}-${capability}`,
          provider,
          capability,
          providerCapability
        })
      }
    }

    if (entries.length > 0) {
      sections.push({ capability, entries })
    }
  }

  return sections
}

export function useWebSearchProviderLists(
  providers: WebSearchProvider[],
  defaultSearchKeywordsProviderId: WebSearchProviderId,
  defaultFetchUrlsProviderId: WebSearchProviderId
) {
  const featureSections = useMemo(() => getWebSearchFeatureSections(providers), [providers])

  const defaultSearchKeywordsProvider = useMemo(
    () => providers.find(p => p.id === defaultSearchKeywordsProviderId),
    [providers, defaultSearchKeywordsProviderId]
  )

  const defaultFetchUrlsProvider = useMemo(
    () => providers.find(p => p.id === defaultFetchUrlsProviderId),
    [providers, defaultFetchUrlsProviderId]
  )

  return {
    featureSections,
    defaultSearchKeywordsProvider,
    defaultFetchUrlsProvider
  }
}

function trimString(value: string): string {
  return value.trim()
}

function trimStringList(values: readonly string[]): string[] {
  return values.map(trimString).filter(Boolean)
}

export function splitApiKeyString(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map(s => s.trim())
    .filter(Boolean)
}

export function formatApiKeys(value: string): string {
  return value.trim()
}

export function normalizeApiKeysInput(value: string): string[] {
  return splitApiKeyString(formatApiKeys(value))
}

export function apiKeysToInput(apiKeys: readonly string[]): string {
  return apiKeys.join(', ')
}

export function apiKeysToSignature(apiKeys: readonly string[]): string {
  return apiKeys.join('\n')
}

export function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function normalizeApiHostInput(value: string): string {
  return withoutTrailingSlash(value.trim())
}
