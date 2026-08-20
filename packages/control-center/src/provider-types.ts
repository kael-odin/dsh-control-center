/**
 * Provider Management types (shared between Host and Client).
 *
 * AGPL-3.0-only – adapted from Cherry Studio insofar as Provider types are
 * derived from their Provider management contracts and UI.
 */

/** Provider type enum - common LLM provider categories. */
export type ProviderType =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'azure'
  | 'deepseek'
  | 'ollama'
  | 'openai-compatible'
  | 'custom'

/** Provider status from connection test or discovery. */
export type ProviderStatus = 'active' | 'inactive' | 'error' | 'unknown'

/** Model discovered from a provider. */
export interface ModelView {
  id: string
  name: string
  providerId: string
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

/** Provider view exposed to Client (no secrets). */
export interface ProviderView {
  id: string
  name: string
  type: ProviderType
  baseURL: string
  enabled: boolean
  hasApiKey: boolean // credential status, not the key itself
  models: ModelView[]
  customHeaders?: Record<string, string>
  status?: ProviderStatus
  lastTestedAt?: string
  lastDiscoveredAt?: string
  createdAt: string
  updatedAt: string
}

/** Create provider DTO. */
export interface CreateProviderDto {
  name: string
  type: ProviderType
  baseURL: string
  apiKey?: string // will be stored in credentials
  customHeaders?: Record<string, string>
  enabled?: boolean
}

/** Update provider DTO. */
export interface UpdateProviderDto {
  name?: string
  baseURL?: string
  apiKey?: string // if provided, updates credential
  customHeaders?: Record<string, string>
  enabled?: boolean
}

/** Connection test result. */
export interface TestConnectionResult {
  success: boolean
  error?: string
  latencyMs?: number
  testedAt: string
}

/** Model discovery result. */
export interface DiscoverModelsResult {
  models: ModelView[]
  discoveredAt: string
  error?: string
}

/** Update model enablement. */
export interface UpdateModelDto {
  enabled: boolean
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    controlCenterProviders: {
      list(): Promise<{ ok: true; value: ProviderView[] } | { ok: false; error: { code: string; message: string; details: object } }>
      get(providerId: string): Promise<{ ok: true; value: ProviderView | null } | { ok: false; error: { code: string; message: string; details: object } }>
      create(dto: CreateProviderDto): Promise<{ ok: true; value: ProviderView } | { ok: false; error: { code: string; message: string; details: object } }>
      update(providerId: string, dto: UpdateProviderDto): Promise<{ ok: true; value: ProviderView } | { ok: false; error: { code: string; message: string; details: object } }>
      delete(providerId: string): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
      testConnection(providerId: string): Promise<{ ok: true; value: TestConnectionResult } | { ok: false; error: { code: string; message: string; details: object } }>
      discoverModels(providerId: string): Promise<{ ok: true; value: DiscoverModelsResult } | { ok: false; error: { code: string; message: string; details: object } }>
      updateModel(providerId: string, modelId: string, dto: UpdateModelDto): Promise<{ ok: true; value: ModelView } | { ok: false; error: { code: string; message: string; details: object } }>
    }
  }
}
