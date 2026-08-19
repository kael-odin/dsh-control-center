/**
 * Control Center Providers Service - Host side provider management.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import { settingsNamespace, type SettingsScope } from '@deepseek-ai/dsh-settings'
import Schema from '@deepseek-ai/schemastery'
import type {
  ProviderView,
  CreateProviderDto,
  UpdateProviderDto,
  TestConnectionResult,
  DiscoverModelsResult,
  ModelView,
  UpdateModelDto
} from './provider-types.ts'

const PROVIDERS_NAMESPACE = settingsNamespace('control-center-providers')

interface ProviderRecord {
  id: string
  name: string
  type: string
  baseURL: string
  enabled: boolean
  apiKeyRef?: string
  customHeaders?: Record<string, string>
  models?: ModelRecord[]
  lastTestedAt?: string
  lastDiscoveredAt?: string
  createdAt: string
  updatedAt: string
}

interface ModelRecord {
  id: string
  name: string
  enabled: boolean
  capabilities?: {
    chat?: boolean
    completion?: boolean
    embedding?: boolean
    vision?: boolean
    functionCalling?: boolean
  }
  contextWindow?: number
  maxOutputTokens?: number
}

interface ProvidersSettings {
  providers: ProviderRecord[]
}

export interface ProvidersServiceConfig {
  logger?: Context['logger']
}

export class ProvidersService extends Service {
  static inject = ['settings', 'credentials'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterProviders')
  private scope: SettingsScope<ProvidersSettings>

  constructor(ctx: Context, _config?: ProvidersServiceConfig) {
    super(ctx, 'control-center-providers')
    this.scope = ctx.settings.register(PROVIDERS_NAMESPACE, Schema.object({
      providers: Schema.array(Schema.object({
        id: Schema.string(),
        name: Schema.string(),
        type: Schema.string(),
        baseURL: Schema.string(),
        enabled: Schema.boolean().default(true),
        apiKeyRef: Schema.string().role('secret'),
        customHeaders: Schema.dict(String),
        models: Schema.array(Schema.any()),
        lastTestedAt: Schema.string(),
        lastDiscoveredAt: Schema.string(),
        createdAt: Schema.string(),
        updatedAt: Schema.string()
      })).default([])
    }), { base: { providers: [] } })
  }

  async list(): Promise<ProviderView[]> {
    const settings = this.scope.get()
    const providers = settings.providers || []
    return Promise.all(providers.map(async (record) => {
      const hasApiKey = record.apiKeyRef
        ? (await this.ctx.credentials.describe(credentialRef(record.apiKeyRef))).configured
        : false
      return this.recordToView(record, hasApiKey)
    }))
  }

  async getById(params: { providerId: string }): Promise<ProviderView | null> {
    const settings = this.scope.get()
    const record = settings.providers.find(p => p.id === params.providerId)
    if (!record) return null
    const hasApiKey = record.apiKeyRef
      ? (await this.ctx.credentials.describe(credentialRef(record.apiKeyRef))).configured
      : false
    return this.recordToView(record, hasApiKey)
  }

  async create(params: { dto: CreateProviderDto }): Promise<ProviderView> {
    const { dto } = params
    const settings = this.scope.get()
    const id = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (settings.providers.some(p => p.id === id)) {
      throw new Error(`Provider with ID "${id}" already exists`)
    }
    const now = new Date().toISOString()
    let apiKeyRef: string | undefined
    if (dto.apiKey) {
      apiKeyRef = `CC_PROVIDER_${id.toUpperCase().replace(/-/g, '_')}_API_KEY`
      await this.ctx.credentials.set(credentialRef(apiKeyRef), dto.apiKey)
    }
    const record: ProviderRecord = {
      id, name: dto.name, type: dto.type, baseURL: dto.baseURL,
      enabled: dto.enabled ?? true,
      ...(apiKeyRef !== undefined ? { apiKeyRef } : {}),
      ...(dto.customHeaders !== undefined ? { customHeaders: dto.customHeaders } : {}),
      models: [], createdAt: now, updatedAt: now
    }
    await this.ctx.settings.update(PROVIDERS_NAMESPACE, {
      providers: [...settings.providers, record]
    })
    return this.recordToView(record, !!dto.apiKey)
  }

  async update(params: { providerId: string; dto: UpdateProviderDto }): Promise<ProviderView> {
    const { providerId, dto } = params
    const settings = this.scope.get()
    const index = settings.providers.findIndex(p => p.id === providerId)
    if (index === -1) throw new Error(`Provider "${providerId}" not found`)
    const record = settings.providers[index]
    if (record === undefined) throw new Error(`Provider "${providerId}" not found`)
    const now = new Date().toISOString()
    if (dto.apiKey !== undefined) {
      if (!record.apiKeyRef) {
        record.apiKeyRef = `CC_PROVIDER_${providerId.toUpperCase().replace(/-/g, '_')}_API_KEY`
      }
      await this.ctx.credentials.set(credentialRef(record.apiKeyRef), dto.apiKey)
    }
    const updated: ProviderRecord = {
      ...record,
      name: dto.name ?? record.name,
      baseURL: dto.baseURL ?? record.baseURL,
      ...(dto.customHeaders !== undefined ? { customHeaders: dto.customHeaders } : {}),
      enabled: dto.enabled ?? record.enabled,
      updatedAt: now
    }
    const newProviders = [...settings.providers]
    newProviders[index] = updated
    await this.ctx.settings.update(PROVIDERS_NAMESPACE, { providers: newProviders })
    const hasApiKey = updated.apiKeyRef
      ? (await this.ctx.credentials.describe(credentialRef(updated.apiKeyRef))).configured
      : false
    return this.recordToView(updated, hasApiKey)
  }

  async delete(params: { providerId: string }): Promise<void> {
    const settings = this.scope.get()
    const record = settings.providers.find(p => p.id === params.providerId)
    if (!record) throw new Error(`Provider "${params.providerId}" not found`)
    if (record.apiKeyRef) {
      await this.ctx.credentials.unset(credentialRef(record.apiKeyRef))
    }
    await this.ctx.settings.update(PROVIDERS_NAMESPACE, {
      providers: settings.providers.filter(p => p.id !== params.providerId)
    })
  }

  async testConnection(params: { providerId: string }): Promise<TestConnectionResult> {
    const settings = this.scope.get()
    const record = settings.providers.find(p => p.id === params.providerId)
    if (!record) throw new Error(`Provider "${params.providerId}" not found`)

    const testedAt = new Date().toISOString()
    const startTime = Date.now()

    try {
      // Get API key from credentials if available
      let apiKey: string | undefined
      if (record.apiKeyRef) {
        const resolved = await this.ctx.credentials.resolve(credentialRef(record.apiKeyRef))
        apiKey = resolved?.value
      }

      // Build headers based on provider type
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(record.customHeaders || {})
      }

      // Provider-specific authentication
      if (apiKey) {
        if (record.type === 'anthropic') {
          headers['x-api-key'] = apiKey
          headers['anthropic-version'] = '2023-06-01'
        } else if (record.type === 'gemini') {
          // Gemini uses query param, not header
        } else {
          // OpenAI-compatible: Bearer token
          headers['Authorization'] = `Bearer ${apiKey}`
        }
      }

      // Build URL with provider-specific paths
      let url = `${record.baseURL}/models`
      if (record.type === 'gemini' && apiKey) {
        url = `${record.baseURL}/v1beta/models?key=${apiKey}`
      } else if (record.type === 'ollama') {
        url = `${record.baseURL}/api/tags`
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        const text = await response.text()
        return {
          success: false,
          error: `HTTP ${response.status}: ${text.slice(0, 200)}`,
          testedAt
        }
      }

      const latencyMs = Date.now() - startTime

      // Update lastTestedAt
      const index = settings.providers.findIndex(p => p.id === params.providerId)
      if (index !== -1 && settings.providers[index] !== undefined) {
        const updated = [...settings.providers]
        const existing = settings.providers[index]!
        updated[index] = { ...existing, lastTestedAt: testedAt }
        await this.ctx.settings.update(PROVIDERS_NAMESPACE, { providers: updated })
      }

      return { success: true, latencyMs, testedAt }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        testedAt
      }
    }
  }

  async discoverModels(params: { providerId: string }): Promise<DiscoverModelsResult> {
    const settings = this.scope.get()
    const record = settings.providers.find(p => p.id === params.providerId)
    if (!record) throw new Error(`Provider "${params.providerId}" not found`)

    const discoveredAt = new Date().toISOString()

    try {
      // Get API key from credentials if available
      let apiKey: string | undefined
      if (record.apiKeyRef) {
        const resolved = await this.ctx.credentials.resolve(credentialRef(record.apiKeyRef))
        apiKey = resolved?.value
      }

      // Build headers based on provider type
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(record.customHeaders || {})
      }

      // Provider-specific authentication and URL
      let url = `${record.baseURL}/models`
      if (apiKey) {
        if (record.type === 'anthropic') {
          headers['x-api-key'] = apiKey
          headers['anthropic-version'] = '2023-06-01'
          url = `${record.baseURL}/v1/models`
        } else if (record.type === 'gemini') {
          url = `${record.baseURL}/v1beta/models?key=${apiKey}`
        } else if (record.type === 'ollama') {
          url = `${record.baseURL}/api/tags`
        } else {
          // OpenAI-compatible: Bearer token
          headers['Authorization'] = `Bearer ${apiKey}`
        }
      } else if (record.type === 'ollama') {
        url = `${record.baseURL}/api/tags`
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(15000)
      })

      if (!response.ok) {
        const text = await response.text()
        return {
          models: [],
          discoveredAt,
          error: `HTTP ${response.status}: ${text.slice(0, 200)}`
        }
      }

      const data = await response.json()

      // Parse response based on provider type
      let remoteModels: any[] = []
      if (record.type === 'ollama') {
        remoteModels = Array.isArray(data.models) ? data.models : []
      } else if (record.type === 'gemini') {
        remoteModels = Array.isArray(data.models) ? data.models : []
      } else {
        // OpenAI-compatible format
        remoteModels = Array.isArray(data.data) ? data.data : []
      }

      // Convert to ModelView format
      const discovered: ModelView[] = remoteModels.map((m: any) => {
        const modelId = record.type === 'gemini' ? (m.name || m.id) : m.id
        return {
          id: modelId,
          name: m.name || modelId,
          providerId: params.providerId,
          enabled: true
        }
      })

      // Merge with existing models (preserve enabled state)
      const existingModels = record.models || []
      const existingById = new Map(existingModels.map(m => [m.id, m]))

      const merged: ModelRecord[] = discovered.map(d => {
        const existing = existingById.get(d.id)
        return {
          id: d.id,
          name: d.name,
          enabled: existing?.enabled ?? true,
          ...(existing?.capabilities !== undefined ? { capabilities: existing.capabilities } : {}),
          ...(existing?.contextWindow !== undefined ? { contextWindow: existing.contextWindow } : {}),
          ...(existing?.maxOutputTokens !== undefined ? { maxOutputTokens: existing.maxOutputTokens } : {})
        }
      })

      // Update provider with discovered models
      const index = settings.providers.findIndex(p => p.id === params.providerId)
      if (index !== -1 && settings.providers[index] !== undefined) {
        const updated = [...settings.providers]
        const existing = settings.providers[index]!
        updated[index] = { ...existing, models: merged, lastDiscoveredAt: discoveredAt }
        await this.ctx.settings.update(PROVIDERS_NAMESPACE, { providers: updated })
      }

      return {
        models: merged.map(m => ({
          id: m.id,
          name: m.name,
          providerId: params.providerId,
          enabled: m.enabled,
          ...(m.capabilities !== undefined ? { capabilities: m.capabilities } : {}),
          ...(m.contextWindow !== undefined ? { contextWindow: m.contextWindow } : {}),
          ...(m.maxOutputTokens !== undefined ? { maxOutputTokens: m.maxOutputTokens } : {})
        })),
        discoveredAt
      }
    } catch (error) {
      return {
        models: [],
        discoveredAt,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async updateModel(_params: { providerId: string; modelId: string; dto: UpdateModelDto }): Promise<ModelView> {
    const { providerId, modelId, dto } = _params
    const settings = this.scope.get()
    const providerIndex = settings.providers.findIndex(p => p.id === providerId)
    if (providerIndex === -1) throw new Error(`Provider "${providerId}" not found`)

    const provider = settings.providers[providerIndex]
    if (provider === undefined) throw new Error(`Provider "${providerId}" not found`)

    const models = provider.models || []
    const modelIndex = models.findIndex(m => m.id === modelId)
    if (modelIndex === -1) throw new Error(`Model "${modelId}" not found in provider "${providerId}"`)

    const existingModel = models[modelIndex]
    if (existingModel === undefined) throw new Error(`Model "${modelId}" not found`)

    // Update model with new properties
    const updatedModel: ModelRecord = {
      ...existingModel,
      enabled: dto.enabled
    }

    // Update models array
    const updatedModels = [...models]
    updatedModels[modelIndex] = updatedModel

    // Update provider in settings
    const updatedProviders = [...settings.providers]
    updatedProviders[providerIndex] = { ...provider, models: updatedModels, updatedAt: new Date().toISOString() }

    await this.ctx.settings.update(PROVIDERS_NAMESPACE, { providers: updatedProviders })

    // Return updated model as view
    return {
      id: updatedModel.id,
      name: updatedModel.name,
      providerId,
      enabled: updatedModel.enabled,
      ...(updatedModel.capabilities !== undefined ? { capabilities: updatedModel.capabilities } : {}),
      ...(updatedModel.contextWindow !== undefined ? { contextWindow: updatedModel.contextWindow } : {}),
      ...(updatedModel.maxOutputTokens !== undefined ? { maxOutputTokens: updatedModel.maxOutputTokens } : {})
    }
  }

  private recordToView(record: ProviderRecord, hasApiKey: boolean): ProviderView {
    return {
      id: record.id, name: record.name, type: record.type as any,
      baseURL: record.baseURL, enabled: record.enabled, hasApiKey,
      models: (record.models || []).map(m => ({
        id: m.id, name: m.name, providerId: record.id, enabled: m.enabled,
        ...(m.capabilities !== undefined ? { capabilities: m.capabilities } : {}),
        ...(m.contextWindow !== undefined ? { contextWindow: m.contextWindow } : {}),
        ...(m.maxOutputTokens !== undefined ? { maxOutputTokens: m.maxOutputTokens } : {})
      })),
      ...(record.customHeaders !== undefined ? { customHeaders: record.customHeaders } : {}),
      ...(record.lastTestedAt !== undefined ? { lastTestedAt: record.lastTestedAt } : {}),
      ...(record.lastDiscoveredAt !== undefined ? { lastDiscoveredAt: record.lastDiscoveredAt } : {}),
      createdAt: record.createdAt, updatedAt: record.updatedAt
    }
  }
}
