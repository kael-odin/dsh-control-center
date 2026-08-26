/** Provider resolution and capability-level readiness checks. */

import { PRESETS_WEB_SEARCH_PROVIDERS } from './presets.ts'
import type { WebSearchCapability, WebSearchProvider, WebSearchProviderOverrides } from './types.ts'

export function resolveProviders(overrides: WebSearchProviderOverrides): WebSearchProvider[] {
  return PRESETS_WEB_SEARCH_PROVIDERS.map((preset) => {
    const override = overrides[preset.id]
    const apiKeys = (override?.apiKeys ?? []).map(value => value.trim()).filter(Boolean)
    const capabilities = preset.capabilities.map((presetCapability) => {
      const hostOverride = override?.capabilities?.[presetCapability.feature]?.apiHost
      const apiHost = hostOverride === undefined ? presetCapability.apiHost : hostOverride.trim()
      return {
        feature: presetCapability.feature,
        ...(apiHost === undefined ? {} : { apiHost }),
        requiresApiHost: presetCapability.requiresApiHost,
        requiresApiKey: presetCapability.requiresApiKey,
        ...(preset.id === 'searxng' ? { auth: { type: 'basic' as const } } : {}),
      }
    })
    return {
      id: preset.id,
      name: preset.name,
      type: preset.type,
      ...(preset.description === undefined ? {} : { description: preset.description }),
      ...(preset.officialWebsite === undefined ? {} : { officialWebsite: preset.officialWebsite }),
      ...(preset.apiKeyWebsite === undefined ? {} : { apiKeyWebsite: preset.apiKeyWebsite }),
      capabilities,
      apiKeys,
      engines: (override?.engines ?? []).map(value => value.trim()).filter(Boolean),
      basicAuthUsername: override?.basicAuthUsername?.trim() ?? '',
      basicAuthPassword: override?.basicAuthPassword?.trim() ?? '',
      requiresApiKey: capabilities.some(item => item.requiresApiKey === true),
    }
  })
}

export function isWebSearchProviderReady(
  provider: WebSearchProvider | null,
  capability: WebSearchCapability,
): boolean {
  if (provider === null) return false
  const selected = provider.capabilities.find(item => item.feature === capability)
  if (selected === undefined) return false
  if (selected.requiresApiHost === true && (selected.apiHost?.trim() ?? '') === '') return false
  if (selected.requiresApiKey === true && provider.apiKeys.length === 0) return false
  return true
}
