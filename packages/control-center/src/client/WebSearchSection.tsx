import { useState, useEffect } from 'react'
import type { WebSearchProvider, WebSearchConfig, WebSearchCapability } from '../websearch/types.ts'
import type { Remote } from '@deepseek-ai/dsh-api-remotes/client'

interface WebSearchSectionProps {
  websearch: NonNullable<Remote['controlCenterWebSearch']>
}

interface ProviderEntry {
  provider: WebSearchProvider
  capability: WebSearchCapability
}

interface FeatureSection {
  capability: WebSearchCapability
  entries: ProviderEntry[]
}

const CAPABILITY_TITLES: Record<WebSearchCapability, string> = {
  searchKeywords: 'Search Keywords',
  fetchUrls: 'Fetch URLs'
}

function getFeatureSections(providers: WebSearchProvider[]): FeatureSection[] {
  const sections: Record<WebSearchCapability, ProviderEntry[]> = {
    searchKeywords: [],
    fetchUrls: []
  }

  for (const provider of providers) {
    for (const capability of provider.capabilities) {
      sections[capability.feature].push({
        provider,
        capability: capability.feature
      })
    }
  }

  return [
    { capability: 'searchKeywords', entries: sections.searchKeywords },
    { capability: 'fetchUrls', entries: sections.fetchUrls }
  ].filter(section => section.entries.length > 0)
}

export function WebSearchSection({ websearch }: WebSearchSectionProps) {
  const [config, setConfig] = useState<WebSearchConfig | null>(null)
  const [providers, setProviders] = useState<WebSearchProvider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      websearch.getConfig(),
      websearch.listProviders()
    ]).then(([cfg, pvs]) => {
      setConfig(cfg)
      setProviders(pvs)
      setLoading(false)
    })
  }, [websearch])

  if (loading || !config) {
    return <div className="p-4">Loading...</div>
  }

  const featureSections = getFeatureSections(providers)

  const handleDefaultProviderChange = async (capability: WebSearchCapability, providerId: string) => {
    const update = capability === 'searchKeywords'
      ? { defaultSearchKeywordsProvider: providerId as any }
      : { defaultFetchUrlsProvider: providerId as any }

    const updated = await websearch.updateConfig(update)
    setConfig(updated)
  }

  const handleApiKeyChange = async (providerId: string, apiKeys: string[]) => {
    const updated = await websearch.updateProviderOverride({
      providerId: providerId as any,
      override: { apiKeys }
    })

    setProviders(prevProviders =>
      prevProviders.map(p => p.id === providerId ? updated : p)
    )
  }

  const handleApiHostChange = async (providerId: string, capability: WebSearchCapability, apiHost: string) => {
    const updated = await websearch.updateProviderOverride({
      providerId: providerId as any,
      override: {
        capabilities: {
          [capability]: { apiHost }
        }
      }
    })

    setProviders(prevProviders =>
      prevProviders.map(p => p.id === providerId ? updated : p)
    )
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Web Search</h2>
        <p className="text-sm text-muted-foreground">
          Configure web search providers and capabilities
        </p>
      </div>

      {/* General Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">General Settings</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Results</label>
            <input
              type="number"
              min="1"
              max="50"
              value={config.maxResults}
              onChange={async (e) => {
                const maxResults = parseInt(e.target.value, 10)
                const updated = await websearch.updateConfig({ maxResults })
                setConfig(updated)
              }}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Client Tools Preferred</label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.clientToolsPreferred}
                onChange={async (e) => {
                  const updated = await websearch.updateConfig({
                    clientToolsPreferred: e.target.checked
                  })
                  setConfig(updated)
                }}
                className="rounded"
              />
              <span className="text-sm">Use client-side tools when available</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Exclude Domains</label>
          <input
            type="text"
            placeholder="example.com, spam.com (comma-separated)"
            value={config.excludeDomains.join(', ')}
            onChange={async (e) => {
              const domains = e.target.value.split(',').map(d => d.trim()).filter(Boolean)
              const updated = await websearch.updateConfig({ excludeDomains: domains })
              setConfig(updated)
            }}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        {/* Compression Settings */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Compression Method</label>
          <select
            value={config.compression.method}
            onChange={async (e) => {
              const updated = await websearch.updateConfig({
                compression: {
                  ...config.compression,
                  method: e.target.value as 'cutoff' | 'none'
                }
              })
              setConfig(updated)
            }}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="none">None</option>
            <option value="cutoff">Cutoff</option>
          </select>
        </div>

        {config.compression.method === 'cutoff' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Cutoff Limit (characters)</label>
            <input
              type="number"
              min="500"
              max="10000"
              step="100"
              value={config.compression.cutoffLimit}
              onChange={async (e) => {
                const updated = await websearch.updateConfig({
                  compression: {
                    method: 'cutoff',
                    cutoffLimit: parseInt(e.target.value, 10)
                  }
                })
                setConfig(updated)
              }}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        )}
      </div>

      {/* Provider Settings by Capability */}
      {featureSections.map((section) => {
        const defaultProviderId = section.capability === 'searchKeywords'
          ? config.defaultSearchKeywordsProvider
          : config.defaultFetchUrlsProvider

        const selectedProvider = providers.find(p => p.id === defaultProviderId)
          ?? section.entries[0]?.provider

        return (
          <div key={section.capability} className="space-y-4">
            <h3 className="text-lg font-medium">{CAPABILITY_TITLES[section.capability]}</h3>

            {/* Provider Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Provider</label>
              <select
                value={selectedProvider?.id ?? ''}
                onChange={(e) => handleDefaultProviderChange(section.capability, e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {section.entries.map(({ provider }) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Provider Configuration */}
            {selectedProvider && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{selectedProvider.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedProvider.description}</p>
                  </div>
                </div>

                {/* API Keys */}
                {selectedProvider.requiresApiKey && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">API Keys</label>
                    <div className="space-y-2">
                      {(selectedProvider.apiKeys.length > 0 ? selectedProvider.apiKeys : ['']).map((key, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="password"
                            value={key}
                            onChange={async (e) => {
                              const newKeys = [...selectedProvider.apiKeys]
                              newKeys[index] = e.target.value
                              await handleApiKeyChange(selectedProvider.id, newKeys.filter(Boolean))
                            }}
                            placeholder="Enter API key"
                            className="flex-1 px-3 py-2 border rounded-md font-mono text-sm"
                          />
                          {selectedProvider.apiKeys.length > 1 && (
                            <button
                              onClick={async () => {
                                const newKeys = selectedProvider.apiKeys.filter((_, i) => i !== index)
                                await handleApiKeyChange(selectedProvider.id, newKeys)
                              }}
                              className="px-3 py-2 text-sm border rounded-md hover:bg-muted"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={async () => {
                          await handleApiKeyChange(selectedProvider.id, [...selectedProvider.apiKeys, ''])
                        }}
                        className="px-3 py-2 text-sm border rounded-md hover:bg-muted"
                      >
                        Add API Key
                      </button>
                    </div>
                  </div>
                )}

                {/* API Host */}
                {selectedProvider.capabilities.some(c =>
                  c.feature === section.capability && 'apiHost' in c
                ) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">API Host</label>
                    <input
                      type="url"
                      value={
                        selectedProvider.capabilities.find(c => c.feature === section.capability && 'apiHost' in c)
                          ?.['apiHost'] ?? ''
                      }
                      onChange={async (e) => {
                        await handleApiHostChange(selectedProvider.id, section.capability, e.target.value)
                      }}
                      placeholder="https://example.com/api"
                      className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                    />
                  </div>
                )}

                {/* Basic Auth */}
                {selectedProvider.capabilities.some(c =>
                  c.feature === section.capability && c.auth?.type === 'basic'
                ) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Basic Auth Username</label>
                      <input
                        type="text"
                        value={selectedProvider.basicAuthUsername ?? ''}
                        onChange={async (e) => {
                          await websearch.updateProviderOverride({
                            providerId: selectedProvider.id as any,
                            override: { basicAuthUsername: e.target.value }
                          })
                        }}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Basic Auth Password</label>
                      <input
                        type="password"
                        value={selectedProvider.basicAuthPassword ?? ''}
                        onChange={async (e) => {
                          await websearch.updateProviderOverride({
                            providerId: selectedProvider.id as any,
                            override: { basicAuthPassword: e.target.value }
                          })
                        }}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
