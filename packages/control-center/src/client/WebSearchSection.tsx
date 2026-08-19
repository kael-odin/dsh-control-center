/**
 * Web Search settings page (Cherry-composition: SettingsContentColumn cards).
 *
 * AGPL-3.0-only – layout adapted from Cherry Studio WebSearchSettings +
 * SettingsPrimitives (content column, setting cards, compact field style).
 */

import { useState, useEffect } from 'react'
import type { WebSearchProvider, WebSearchConfig, WebSearchCapability } from '../websearch/types.ts'
import type { TypertClientRemote } from '@deepseek-ai/dsh-typert-protocol'
import css from './WebSearchSection.module.css'

interface WebSearchSectionProps {
  websearch: NonNullable<TypertClientRemote['controlCenterWebSearch']>
}

interface ProviderEntry {
  provider: WebSearchProvider
  capability: WebSearchCapability
}

interface FeatureSection {
  capability: WebSearchCapability
  entries: ProviderEntry[]
}

/** Unwrap a strict-mode Typert envelope, throwing the wire error message on failure. */
function unwrap<T>(result: { ok: true; value: T } | { ok: false; error: { code: string; message: string; details: object } }): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

const CAPABILITY_TITLES: Record<WebSearchCapability, string> = {
  searchKeywords: 'Search Keywords',
  fetchUrls: 'Fetch URLs'
}

const CAPABILITY_DESCRIPTIONS: Record<WebSearchCapability, string> = {
  searchKeywords: 'Provider used to search the web for keywords and return ranked results.',
  fetchUrls: 'Provider used to fetch and convert a URL into readable content.'
}

function getFeatureSections(providers: WebSearchProvider[]): FeatureSection[] {
  const sections: Record<WebSearchCapability, ProviderEntry[]> = {
    searchKeywords: [],
    fetchUrls: []
  }

  for (const provider of providers) {
    for (const capability of provider.capabilities) {
      sections[capability.feature as WebSearchCapability].push({
        provider,
        capability: capability.feature as WebSearchCapability
      })
    }
  }

  return [
    { capability: 'searchKeywords' as WebSearchCapability, entries: sections.searchKeywords },
    { capability: 'fetchUrls' as WebSearchCapability, entries: sections.fetchUrls }
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
      setConfig(unwrap(cfg))
      setProviders(unwrap(pvs))
      setLoading(false)
    }).catch((err) => {
      setLoading(false)
      console.error('Failed to load web search config:', err)
    })
  }, [websearch])

  if (loading || !config) {
    return <div className={css.loading}>Loading...</div>
  }

  const featureSections = getFeatureSections(providers)

  const handleDefaultProviderChange = async (capability: WebSearchCapability, providerId: string) => {
    const update = capability === 'searchKeywords'
      ? { defaultSearchKeywordsProvider: providerId as any }
      : { defaultFetchUrlsProvider: providerId as any }

    const updated = unwrap(await websearch.updateConfig(update))
    setConfig(updated)
  }

  const handleApiKeyChange = async (providerId: string, apiKeys: string[]) => {
    const updated = unwrap(await websearch.updateProviderOverride({
      providerId: providerId as any,
      override: { apiKeys }
    }))

    setProviders(prevProviders =>
      prevProviders.map(p => p.id === providerId ? updated : p)
    )
  }

  const handleApiHostChange = async (providerId: string, capability: WebSearchCapability, apiHost: string) => {
    const updated = unwrap(await websearch.updateProviderOverride({
      providerId: providerId as any,
      override: {
        capabilities: {
          [capability]: { apiHost }
        }
      }
    }))

    setProviders(prevProviders =>
      prevProviders.map(p => p.id === providerId ? updated : p)
    )
  }

  return (
    <div className={css.root}>
      <div className={css.pageHeader}>
        <h2 className={css.pageTitle}>Web Search</h2>
        <p className={css.pageDescription}>
          Configure web search providers and capabilities
        </p>
      </div>

      {/* General settings card */}
      <div className={css.card}>
        <div className={css.cardTitle}>General Settings</div>

        <div className={css.fieldRow}>
          <div className={css.fieldLabel}>Max Results</div>
          <input
            type="number"
            min="1"
            max="50"
            value={config.maxResults}
            onChange={async (e) => {
              const maxResults = parseInt(e.target.value, 10)
              const updated = unwrap(await websearch.updateConfig({ maxResults }))
              setConfig(updated)
            }}
            className={css.input}
          />
        </div>

        <div className={css.fieldRow}>
          <div className={css.fieldLabel}>
            Client Tools Preferred
            <div className={css.fieldHint}>Use client-side tools when available</div>
          </div>
          <input
            type="checkbox"
            checked={config.clientToolsPreferred}
            onChange={async (e) => {
              const updated = unwrap(await websearch.updateConfig({
                clientToolsPreferred: e.target.checked
              }))
              setConfig(updated)
            }}
            className={css.checkbox}
          />
        </div>

        <div className={css.fieldRow}>
          <div className={css.fieldLabel}>
            Exclude Domains
            <div className={css.fieldHint}>Comma-separated domains to exclude from results</div>
          </div>
          <input
            type="text"
            placeholder="example.com, spam.com"
            value={config.excludeDomains.join(', ')}
            onChange={async (e) => {
              const domains = e.target.value.split(',').map(d => d.trim()).filter(Boolean)
              const updated = unwrap(await websearch.updateConfig({ excludeDomains: domains }))
              setConfig(updated)
            }}
            className={css.input}
          />
        </div>

        <div className={css.fieldRow}>
          <div className={css.fieldLabel}>
            Compression Method
            <div className={css.fieldHint}>How search results are compressed before passing to the model</div>
          </div>
          <select
            value={config.compression.method}
            onChange={async (e) => {
              const updated = unwrap(await websearch.updateConfig({
                compression: {
                  ...config.compression,
                  method: e.target.value as 'cutoff' | 'none'
                }
              }))
              setConfig(updated)
            }}
            className={css.select}
          >
            <option value="none">None</option>
            <option value="cutoff">Cutoff</option>
          </select>
        </div>

        {config.compression.method === 'cutoff' && (
          <div className={css.fieldRow}>
            <div className={css.fieldLabel}>Cutoff Limit (characters)</div>
            <input
              type="number"
              min="500"
              max="10000"
              step="100"
              value={config.compression.cutoffLimit}
              onChange={async (e) => {
                const updated = unwrap(await websearch.updateConfig({
                  compression: {
                    method: 'cutoff',
                    cutoffLimit: parseInt(e.target.value, 10)
                  }
                }))
                setConfig(updated)
              }}
              className={css.input}
            />
          </div>
        )}
      </div>

      {/* Per-capability provider cards */}
      {featureSections.map((section) => {
        const defaultProviderId = section.capability === 'searchKeywords'
          ? config.defaultSearchKeywordsProvider
          : config.defaultFetchUrlsProvider

        const selectedProvider = providers.find(p => p.id === defaultProviderId)
          ?? section.entries[0]?.provider

        return (
          <div key={section.capability} className={css.card}>
            <div>
              <div className={css.cardTitle}>{CAPABILITY_TITLES[section.capability]}</div>
              <div className={css.cardDescription}>{CAPABILITY_DESCRIPTIONS[section.capability]}</div>
            </div>

            <div className={css.fieldRow}>
              <div className={css.fieldLabel}>Default Provider</div>
              <select
                value={selectedProvider?.id ?? ''}
                onChange={(e) => handleDefaultProviderChange(section.capability, e.target.value)}
                className={css.select}
              >
                {section.entries.map(({ provider }) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedProvider && (
              <div className={css.providerDetail}>
                <div>
                  <div className={css.providerName}>{selectedProvider.name}</div>
                  <div className={css.providerDescription}>{selectedProvider.description}</div>
                </div>

                {selectedProvider.requiresApiKey && (
                  <div className={css.fieldRow}>
                    <div className={css.fieldLabel}>API Keys</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                      {(selectedProvider.apiKeys.length > 0 ? selectedProvider.apiKeys : ['']).map((key, index) => (
                        <div key={index} className={css.apiKeyRow}>
                          <input
                            type="password"
                            value={key}
                            onChange={async (e) => {
                              const newKeys = [...selectedProvider.apiKeys]
                              newKeys[index] = e.target.value
                              await handleApiKeyChange(selectedProvider.id, newKeys.filter(Boolean))
                            }}
                            placeholder="Enter API key"
                            className={css.input}
                          />
                          {selectedProvider.apiKeys.length > 1 && (
                            <button
                              type="button"
                              className={css.iconButton}
                              onClick={async () => {
                                const newKeys = selectedProvider.apiKeys.filter((_, i) => i !== index)
                                await handleApiKeyChange(selectedProvider.id, newKeys)
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className={css.iconButton}
                        onClick={async () => {
                          await handleApiKeyChange(selectedProvider.id, [...selectedProvider.apiKeys, ''])
                        }}
                      >
                        Add API Key
                      </button>
                    </div>
                  </div>
                )}

                {selectedProvider.capabilities.some(c =>
                  c.feature === section.capability && 'apiHost' in c
                ) && (
                  <div className={css.fieldRow}>
                    <div className={css.fieldLabel}>API Host</div>
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
                      className={css.input}
                    />
                  </div>
                )}

                {selectedProvider.capabilities.some(c =>
                  c.feature === section.capability && c.auth?.type === 'basic'
                ) && (
                  <>
                    <div className={css.fieldRow}>
                      <div className={css.fieldLabel}>Basic Auth Username</div>
                      <input
                        type="text"
                        value={selectedProvider.basicAuthUsername ?? ''}
                        onChange={async (e) => {
                          unwrap(await websearch.updateProviderOverride({
                            providerId: selectedProvider.id as any,
                            override: { basicAuthUsername: e.target.value }
                          }))
                        }}
                        className={css.input}
                      />
                    </div>
                    <div className={css.fieldRow}>
                      <div className={css.fieldLabel}>Basic Auth Password</div>
                      <input
                        type="password"
                        value={selectedProvider.basicAuthPassword ?? ''}
                        onChange={async (e) => {
                          unwrap(await websearch.updateProviderOverride({
                            providerId: selectedProvider.id as any,
                            override: { basicAuthPassword: e.target.value }
                          }))
                        }}
                        className={css.input}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
