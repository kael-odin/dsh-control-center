import { describe, it, expect } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { WebSearchService } from '../src/websearch.ts'
import type { WebSearchConfig } from '../src/websearch/types.ts'

function setup() {
  const ctx = new Context()

  // Mock settings with stateful behavior
  let config: WebSearchConfig = {
    defaultSearchKeywordsProvider: 'exa-mcp',
    defaultFetchUrlsProvider: 'jina',
    providerOverrides: {},
    maxResults: 5,
    excludeDomains: [],
    compression: { method: 'cutoff', cutoffLimit: 2000 },
    clientToolsPreferred: true
  }

  const settings = {
    register: () => ({
      get: () => config,
      set: (value: WebSearchConfig) => {
        config = value
        return value
      },
      update: (patch: Partial<WebSearchConfig>) => {
        config = { ...config, ...patch }
        return config
      }
    })
  }

  ctx.reflect.provide('settings', settings)
  const service = new WebSearchService(ctx)
  return { ctx, service }
}

describe('WebSearchService', () => {

  describe('getConfig', () => {
    it('should return default config', async () => {
      const { service } = setup()
      const config = await service.getConfig()
      expect(config).toMatchObject({
        defaultSearchKeywordsProvider: 'exa-mcp',
        defaultFetchUrlsProvider: 'jina',
        providerOverrides: {},
        maxResults: 5,
        excludeDomains: [],
        compression: { method: 'cutoff', cutoffLimit: 2000 },
        clientToolsPreferred: true
      })
    })
  })

  describe('updateConfig', () => {
    it('should update config', async () => {
      const { service } = setup()
      const updated = await service.updateConfig({
        maxResults: 10,
        excludeDomains: ['example.com']
      })

      expect(updated.maxResults).toBe(10)
      expect(updated.excludeDomains).toEqual(['example.com'])

      const config = await service.getConfig()
      expect(config.maxResults).toBe(10)
      expect(config.excludeDomains).toEqual(['example.com'])
    })
  })

  describe('listProviders', () => {
    it('should return all preset providers', async () => {
      const { service } = setup()
      const providers = await service.listProviders()
      expect(providers.length).toBe(10)
      expect(providers.map(p => p.id)).toEqual([
        'zhipu',
        'tavily',
        'searxng',
        'exa',
        'exa-mcp',
        'bocha',
        'querit',
        'fetch',
        'jina',
        'firecrawl'
      ])
    })

    it('should apply overrides', async () => {
      const { service } = setup()
      await service.updateConfig({
        providerOverrides: {
          tavily: {
            apiKeys: ['test-key-1', 'test-key-2']
          }
        }
      })

      const providers = await service.listProviders()
      const tavily = providers.find(p => p.id === 'tavily')
      expect(tavily?.apiKeys).toEqual(['test-key-1', 'test-key-2'])
    })
  })

  describe('getProvider', () => {
    it('should return specific provider', async () => {
      const { service } = setup()
      const provider = await service.getProvider({ providerId: 'exa-mcp' })
      expect(provider).toBeTruthy()
      expect(provider?.id).toBe('exa-mcp')
      expect(provider?.name).toBe('Exa (MCP)')
    })

    it('should return null for unknown provider', async () => {
      const { service } = setup()
      const provider = await service.getProvider({ providerId: 'unknown' as any })
      expect(provider).toBeNull()
    })
  })

  describe('updateProviderOverride', () => {
    it('should update provider override', async () => {
      const { service } = setup()
      const updated = await service.updateProviderOverride({
        providerId: 'jina',
        override: {
          apiKeys: ['jina-key']
        }
      })

      expect(updated.id).toBe('jina')
      expect(updated.apiKeys).toEqual(['jina-key'])

      const config = await service.getConfig()
      expect(config.providerOverrides.jina?.apiKeys).toEqual(['jina-key'])
    })

    it('should update capability apiHost', async () => {
      const { service } = setup()
      const updated = await service.updateProviderOverride({
        providerId: 'searxng',
        override: {
          capabilities: {
            searchKeywords: { apiHost: 'http://custom:8888' }
          }
        }
      })

      const capability = updated.capabilities.find(c => c.feature === 'searchKeywords')
      expect(capability?.apiHost).toBe('http://custom:8888')
    })
  })

  describe('checkProviderReady', () => {
    it('should return false for provider without API key', async () => {
      const { service } = setup()
      const ready = await service.checkProviderReady({
        providerId: 'tavily',
        capability: 'searchKeywords'
      })
      expect(ready).toBe(false)
    })

    it('should return true for provider with API key', async () => {
      const { service } = setup()
      await service.updateProviderOverride({
        providerId: 'tavily',
        override: { apiKeys: ['test-key'] }
      })

      const ready = await service.checkProviderReady({
        providerId: 'tavily',
        capability: 'searchKeywords'
      })
      expect(ready).toBe(true)
    })

    it('should return true for fetch provider without API key', async () => {
      const { service } = setup()
      const ready = await service.checkProviderReady({
        providerId: 'fetch',
        capability: 'fetchUrls'
      })
      expect(ready).toBe(true)
    })

    it('should return true for searxng with apiHost', async () => {
      const { service } = setup()
      await service.updateProviderOverride({
        providerId: 'searxng',
        override: {
          capabilities: {
            searchKeywords: { apiHost: 'http://localhost:8080' }
          }
        }
      })

      const ready = await service.checkProviderReady({
        providerId: 'searxng',
        capability: 'searchKeywords'
      })
      expect(ready).toBe(true)
    })
  })
})
