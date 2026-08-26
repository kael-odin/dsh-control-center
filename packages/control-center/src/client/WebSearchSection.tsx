/** Cherry-style web-search provider management with live readiness checks. */

import { useEffect, useMemo, useState } from 'react'
import type { TypertClientRemote } from '@deepseek-ai/dsh-typert-protocol'
import type { WebSearchCapability, WebSearchConfig, WebSearchProvider, WebSearchProviderId } from '../websearch/types.ts'
import type { WebSearchKey } from './websearch-locales.ts'
import css from './WebSearchSection.module.css'

export interface WebSearchSectionInjected {
  websearch: NonNullable<TypertClientRemote['controlCenterWebSearch']>
  t: (key: WebSearchKey) => string
}

type RemoteEnvelope<T> = { ok: true; value: T } | { ok: false; error: { code: string; message: string; details: object } }
type CheckResult = {
  ok: boolean
  providerId: WebSearchProviderId
  capability: WebSearchCapability
  latencyMs: number
  resultCount?: number
  message: string
}

type ProviderEntry = { provider: WebSearchProvider; capability: WebSearchCapability }
type FeatureSection = { capability: WebSearchCapability; entries: ProviderEntry[] }

function unwrap<T>(result: RemoteEnvelope<T>): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

const CAPABILITY_TITLES: Record<WebSearchCapability, WebSearchKey> = {
  searchKeywords: 'searchKeywords',
  fetchUrls: 'fetchUrls',
}
const CAPABILITY_DESCRIPTIONS: Record<WebSearchCapability, WebSearchKey> = {
  searchKeywords: 'searchKeywordsDescription',
  fetchUrls: 'fetchUrlsDescription',
}

function getFeatureSections(providers: WebSearchProvider[]): FeatureSection[] {
  const sections: Record<WebSearchCapability, ProviderEntry[]> = { searchKeywords: [], fetchUrls: [] }
  for (const provider of providers) {
    for (const capability of provider.capabilities) {
      sections[capability.feature].push({ provider, capability: capability.feature })
    }
  }
  return (Object.keys(sections) as WebSearchCapability[]).map(capability => ({ capability, entries: sections[capability] })).filter(section => section.entries.length > 0)
}

function capabilityOf(provider: WebSearchProvider, feature: WebSearchCapability) {
  return provider.capabilities.find(item => item.feature === feature)
}

function statusKey(providerId: WebSearchProviderId, capability: WebSearchCapability): string {
  return `${capability}:${providerId}`
}

function supportsOptionalApiKey(provider: WebSearchProviderId): boolean {
  return provider === 'exa-mcp' || provider === 'jina' || provider === 'firecrawl'
}

export function WebSearchSection({ websearch, t }: WebSearchSectionInjected) {
  const [config, setConfig] = useState<WebSearchConfig | null>(null)
  const [providers, setProviders] = useState<WebSearchProvider[]>([])
  const [ready, setReady] = useState<Record<string, boolean>>({})
  const [checks, setChecks] = useState<Record<string, CheckResult>>({})
  const [checking, setChecking] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    void Promise.all([websearch.getConfig(), websearch.listProviders()]).then(async ([cfg, providerResult]) => {
      const loadedConfig = unwrap(cfg)
      const loadedProviders = unwrap(providerResult)
      const readiness = await Promise.all(loadedProviders.flatMap(provider => provider.capabilities.map(async capability => {
        const result = await websearch.checkProviderReady({ providerId: provider.id, capability: capability.feature })
        return [statusKey(provider.id, capability.feature), unwrap(result)] as const
      })))
      if (!active) return
      setConfig(loadedConfig)
      setProviders(loadedProviders)
      setReady(Object.fromEntries(readiness))
      setLoading(false)
    }).catch((err: unknown) => {
      if (!active) return
      setLoading(false)
      setError(err instanceof Error ? err.message : String(err))
    })
    return () => { active = false }
  }, [websearch])

  const featureSections = useMemo(() => getFeatureSections(providers), [providers])

  if (loading) return <div className={css.loading}>{t('loading')}</div>
  if (error !== null) return <div className={css.error} role="alert"><strong>{t('unavailable')}</strong><span>{error}</span></div>
  if (config === null) return <div className={css.error} role="alert">{t('noConfig')}</div>

  const updateProviderInState = (provider: WebSearchProvider): void => {
    setProviders(previous => previous.map(item => item.id === provider.id ? provider : item))
  }

  const handleDefaultProviderChange = async (capability: WebSearchCapability, providerId: string): Promise<void> => {
    const updated = unwrap(await websearch.updateConfig(capability === 'searchKeywords'
      ? { defaultSearchKeywordsProvider: providerId as WebSearchProviderId }
      : { defaultFetchUrlsProvider: providerId as WebSearchProviderId }))
    setConfig(updated)
  }

  const handleProviderPatch = async (providerId: WebSearchProviderId, patch: NonNullable<Parameters<typeof websearch.updateProviderOverride>[0]>['override']): Promise<void> => {
    updateProviderInState(unwrap(await websearch.updateProviderOverride({ providerId, override: patch })))
  }

  const handleCheck = async (provider: WebSearchProvider, capability: WebSearchCapability): Promise<void> => {
    const key = statusKey(provider.id, capability)
    setChecking(previous => ({ ...previous, [key]: true }))
    try {
      const result = unwrap(await websearch.checkProvider({ providerId: provider.id, capability }))
      setChecks(previous => ({ ...previous, [key]: result }))
      setReady(previous => ({ ...previous, [key]: result.ok }))
    } catch (err: unknown) {
      setChecks(previous => ({ ...previous, [key]: {
        ok: false, providerId: provider.id, capability, latencyMs: 0, message: err instanceof Error ? err.message : String(err),
      } }))
    } finally {
      setChecking(previous => ({ ...previous, [key]: false }))
    }
  }

  return (
    <div className={css.root}>
      <div className={css.pageHeader}>
        <h2 className={css.pageTitle}>{t('title')}</h2>
        <p className={css.pageDescription}>{t('description')}</p>
      </div>

      <div className={css.card}>
        <div className={css.cardTitle}>{t('general')}</div>
        <div className={css.fieldRow}><div className={css.fieldLabel}>{t('maxResults')}<div className={css.fieldHint}>{t('maxResultsHint')}</div></div><input type="number" min="1" max="50" value={config.maxResults} onChange={async event => { setConfig(unwrap(await websearch.updateConfig({ maxResults: Number(event.target.value) }))) }} className={css.input} /></div>
        <div className={css.fieldRow}><div className={css.fieldLabel}>{t('clientToolsPreferred')}<div className={css.fieldHint}>{t('clientToolsPreferredHint')}</div></div><input type="checkbox" checked={config.clientToolsPreferred} onChange={async event => { setConfig(unwrap(await websearch.updateConfig({ clientToolsPreferred: event.target.checked }))) }} className={css.checkbox} /></div>
        <div className={css.fieldRow}><div className={css.fieldLabel}>{t('excludeDomains')}<div className={css.fieldHint}>{t('excludeDomainsHint')}</div></div><input type="text" placeholder={t('excludeDomainsPlaceholder')} value={config.excludeDomains.join(', ')} onChange={async event => { setConfig(unwrap(await websearch.updateConfig({ excludeDomains: event.target.value.split(',').map(value => value.trim()).filter(Boolean) }))) }} className={css.input} /></div>
        <div className={css.fieldRow}><div className={css.fieldLabel}>{t('compressionMethod')}<div className={css.fieldHint}>{t('compressionMethodHint')}</div></div><select value={config.compression.method} onChange={async event => { setConfig(unwrap(await websearch.updateConfig({ compression: { ...config.compression, method: event.target.value as 'none' | 'cutoff' } }))) }} className={css.select}><option value="none">{t('compressionNone')}</option><option value="cutoff">{t('compressionCutoff')}</option></select></div>
        {config.compression.method === 'cutoff' && <div className={css.fieldRow}><div className={css.fieldLabel}>{t('cutoffLimit')}</div><input type="number" min="100" max="10000" step="100" value={config.compression.cutoffLimit} onChange={async event => { setConfig(unwrap(await websearch.updateConfig({ compression: { ...config.compression, cutoffLimit: Number(event.target.value) } }))) }} className={css.input} /></div>}
      </div>

      {featureSections.map(section => {
        const defaultProviderId = section.capability === 'searchKeywords' ? config.defaultSearchKeywordsProvider : config.defaultFetchUrlsProvider
        const selectedProvider = providers.find(provider => provider.id === defaultProviderId) ?? section.entries[0]?.provider
        if (selectedProvider === undefined) return null
        const selectedCapability = capabilityOf(selectedProvider, section.capability)
        if (selectedCapability === undefined) return null
        const key = statusKey(selectedProvider.id, section.capability)
        const needsKey = selectedCapability.requiresApiKey === true
        const showKey = needsKey || supportsOptionalApiKey(selectedProvider.id)
        const result = checks[key]
        return (
          <div key={section.capability} className={css.card}>
            <div className={css.cardHeader}><div><div className={css.cardTitle}>{t(CAPABILITY_TITLES[section.capability])}</div><div className={css.cardDescription}>{t(CAPABILITY_DESCRIPTIONS[section.capability])}</div></div><span className={ready[key] ? css.ready : css.notReady}>{ready[key] ? t('ready') : t('notReady')}</span></div>
            <div className={css.fieldRow}><div className={css.fieldLabel}>{t('defaultProvider')}</div><select value={selectedProvider.id} onChange={event => { void handleDefaultProviderChange(section.capability, event.target.value) }} className={css.select}>{section.entries.map(entry => <option key={entry.provider.id} value={entry.provider.id}>{entry.provider.name}</option>)}</select></div>
            <div className={css.providerDetail}>
              <div className={css.providerMeta}><div><div className={css.providerName}>{selectedProvider.name}</div><div className={css.providerDescription}>{selectedProvider.description}</div></div><div className={css.providerLinks}>{selectedProvider.officialWebsite && <a href={selectedProvider.officialWebsite} target="_blank" rel="noreferrer">{t('officialWebsite')}</a>}{selectedProvider.apiKeyWebsite && <a href={selectedProvider.apiKeyWebsite} target="_blank" rel="noreferrer">{t('apiKeyWebsite')}</a>}</div></div>
              {showKey && <div className={css.fieldRow}><div className={css.fieldLabel}>{needsKey ? t('apiKeys') : t('optionalApiKey')}</div><input type="password" value={selectedProvider.apiKeys[0] ?? ''} placeholder={t('apiKeyPlaceholder')} onChange={event => { void handleProviderPatch(selectedProvider.id, { apiKeys: event.target.value.trim() === '' ? [] : [event.target.value] }) }} className={css.input} /></div>}
              {selectedCapability.apiHost !== undefined && <div className={css.fieldRow}><div className={css.fieldLabel}>{t('apiHost')}</div><input type="url" value={selectedCapability.apiHost} placeholder={t('apiHostPlaceholder')} onChange={event => { void handleProviderPatch(selectedProvider.id, { capabilities: { [section.capability]: { apiHost: event.target.value } } }) }} className={css.input} /></div>}
              {selectedProvider.id === 'searxng' && <><div className={css.fieldRow}><div className={css.fieldLabel}>{t('engines')}<div className={css.fieldHint}>{t('enginesHint')}</div></div><input type="text" value={selectedProvider.engines?.join(', ') ?? ''} onChange={event => { void handleProviderPatch(selectedProvider.id, { engines: event.target.value.split(',').map(value => value.trim()).filter(Boolean) }) }} className={css.input} /></div><div className={css.fieldRow}><div className={css.fieldLabel}>{t('basicAuthUsername')}</div><input type="text" value={selectedProvider.basicAuthUsername ?? ''} onChange={event => { void handleProviderPatch(selectedProvider.id, { basicAuthUsername: event.target.value }) }} className={css.input} /></div><div className={css.fieldRow}><div className={css.fieldLabel}>{t('basicAuthPassword')}</div><input type="password" value={selectedProvider.basicAuthPassword ?? ''} onChange={event => { void handleProviderPatch(selectedProvider.id, { basicAuthPassword: event.target.value }) }} className={css.input} /></div></>}
              <div className={css.checkRow}><button type="button" className="cc-btn cc-btn-secondary" disabled={checking[key] === true} onClick={() => { void handleCheck(selectedProvider, section.capability) }}>{checking[key] ? t('checking') : t('check')}</button>{result && <span className={result.ok ? css.checkSuccess : css.checkFailure}>{result.ok ? `${t('checkSuccess')} · ${result.latencyMs}ms` : `${t('checkFailed')} · ${result.message}`}</span>}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
