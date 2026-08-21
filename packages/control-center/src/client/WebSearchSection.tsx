/**
 * Web Search settings page (Cherry-composition: SettingsContentColumn cards).
 *
 * AGPL-3.0-only – layout adapted from Cherry Studio WebSearchSettings +
 * SettingsPrimitives (content column, setting cards, compact field style).
 */

import { useState, useEffect } from 'react'
import type { WebSearchProvider, WebSearchConfig, WebSearchCapability } from '../websearch/types.ts'
import type { TypertClientRemote } from '@deepseek-ai/dsh-typert-protocol'
import type { WebSearchKey } from './websearch-locales.ts'
import css from './WebSearchSection.module.css'

export interface WebSearchSectionInjected {
  websearch: NonNullable<TypertClientRemote['controlCenterWebSearch']>
  t: (key: WebSearchKey) => string
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

const CAPABILITY_TITLES: Record<WebSearchCapability, WebSearchKey> = {
  searchKeywords: 'searchKeywords',
  fetchUrls: 'fetchUrls'
}

const CAPABILITY_DESCRIPTIONS: Record<WebSearchCapability, WebSearchKey> = {
  searchKeywords: 'searchKeywordsDescription',
  fetchUrls: 'fetchUrlsDescription'
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

export function WebSearchSection({ websearch, t }: WebSearchSectionInjected) {
  const [config, setConfig] = useState<WebSearchConfig | null>(null)
  const [providers, setProviders] = useState<WebSearchProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    Promise.all([
      websearch.getConfig(),
      websearch.listProviders()
    ]).then(([cfg, pvs]) => {
      if (!active) return
      setConfig(unwrap(cfg))
      setProviders(unwrap(pvs))
      setLoading(false)
    }).catch((err) => {
      if (!active) return
      setLoading(false)
      setError(err instanceof Error ? err.message : String(err))
      console.error('Failed to load web search config:', err)
    })
    return () => { active = false }
  }, [websearch])

  if (loading) {
    return <div className={css.loading}>{t('loading')}</div>
  }

  if (error !== null) {
    return (
      <div className={css.error} role="alert">
        <strong>{t('unavailable')}</strong>
        <span>{error}</span>
      </div>
    )
  }

  if (!config) {
    return <div className={css.error} role="alert">{t('noConfig')}</div>
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
        <h2 className={css.pageTitle}>{t('title')}</h2>
        <p className={css.pageDescription}>
          {t('description')}
        </p>
      </div>

      {/* General settings card */}
      <div className={css.card}>
        <div className={css.cardTitle}>{t('general')}</div>

        <div className={css.fieldRow}>
          <div className={css.fieldLabel}>
            {t('maxResults')}
            <div className={css.fieldHint}>{t('maxResultsHint')}</div>
          </div>
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
            {t('clientToolsPreferred')}
            <div className={css.fieldHint}>{t('clientToolsPreferredHint')}</div>
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
            {t('excludeDomains')}
            <div className={css.fieldHint}>{t('excludeDomainsHint')}</div>
          </div>
          <input
            type="text"
            placeholder={t('excludeDomainsPlaceholder')}
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
            {t('compressionMethod')}
            <div className={css.fieldHint}>{t('compressionMethodHint')}</div>
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
            <option value="none">{t('compressionNone')}</option>
            <option value="cutoff">{t('compressionCutoff')}</option>
          </select>
        </div>

        {config.compression.method === 'cutoff' && (
          <div className={css.fieldRow}>
            <div className={css.fieldLabel}>{t('cutoffLimit')}</div>
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
              <div className={css.cardTitle}>{t(CAPABILITY_TITLES[section.capability])}</div>
              <div className={css.cardDescription}>{t(CAPABILITY_DESCRIPTIONS[section.capability])}</div>
            </div>

            <div className={css.fieldRow}>
              <div className={css.fieldLabel}>{t('defaultProvider')}</div>
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
                    <div className={css.fieldLabel}>{t('apiKeys')}</div>
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
                            placeholder={t('apiKeyPlaceholder')}
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
                              {t('remove')}
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
                        {t('addApiKey')}
                      </button>
                    </div>
                  </div>
                )}

                {selectedProvider.capabilities.some(c =>
                  c.feature === section.capability && 'apiHost' in c
                ) && (
                  <div className={css.fieldRow}>
                    <div className={css.fieldLabel}>{t('apiHost')}</div>
                    <input
                      type="url"
                      value={
                        selectedProvider.capabilities.find(c => c.feature === section.capability && 'apiHost' in c)
                          ?.['apiHost'] ?? ''
                      }
                      onChange={async (e) => {
                        await handleApiHostChange(selectedProvider.id, section.capability, e.target.value)
                      }}
                      placeholder={t('apiHostPlaceholder')}
                      className={css.input}
                    />
                  </div>
                )}

                {selectedProvider.capabilities.some(c =>
                  c.feature === section.capability && c.auth?.type === 'basic'
                ) && (
                  <>
                    <div className={css.fieldRow}>
                      <div className={css.fieldLabel}>{t('basicAuthUsername')}</div>
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
                      <div className={css.fieldLabel}>{t('basicAuthPassword')}</div>
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
