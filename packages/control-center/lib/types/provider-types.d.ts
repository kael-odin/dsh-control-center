/**
 * Provider Management types (shared between Host and Client).
 *
 * AGPL-3.0-only – adapted from Cherry Studio insofar as Provider types are
 * derived from their Provider management contracts and UI.
 */
/** Provider type enum - common LLM provider categories. */
export type ProviderType = 'openai' | 'anthropic' | 'google' | 'azure' | 'deepseek' | 'openai-compatible' | 'custom';
/** Provider status from connection test or discovery. */
export type ProviderStatus = 'active' | 'inactive' | 'error' | 'unknown';
/** Model discovered from a provider. */
export interface ModelView {
    id: string;
    name: string;
    providerId: string;
    enabled: boolean;
    capabilities?: {
        chat?: boolean;
        completion?: boolean;
        embedding?: boolean;
        vision?: boolean;
        functionCalling?: boolean;
    };
    contextWindow?: number;
    maxOutputTokens?: number;
}
/** Provider view exposed to Client (no secrets). */
export interface ProviderView {
    id: string;
    name: string;
    type: ProviderType;
    baseURL: string;
    enabled: boolean;
    hasApiKey: boolean;
    models: ModelView[];
    customHeaders?: Record<string, string>;
    status?: ProviderStatus;
    lastTestedAt?: string;
    lastDiscoveredAt?: string;
    createdAt: string;
    updatedAt: string;
}
/** Create provider DTO. */
export interface CreateProviderDto {
    name: string;
    type: ProviderType;
    baseURL: string;
    apiKey?: string;
    customHeaders?: Record<string, string>;
    enabled?: boolean;
}
/** Update provider DTO. */
export interface UpdateProviderDto {
    name?: string;
    baseURL?: string;
    apiKey?: string;
    customHeaders?: Record<string, string>;
    enabled?: boolean;
}
/** Connection test result. */
export interface TestConnectionResult {
    success: boolean;
    error?: string;
    latencyMs?: number;
    testedAt: string;
}
/** Model discovery result. */
export interface DiscoverModelsResult {
    models: ModelView[];
    discoveredAt: string;
    error?: string;
}
/** Update model enablement. */
export interface UpdateModelDto {
    enabled: boolean;
}
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespaceMap {
        controlCenterProviders: {
            list(): Promise<ProviderView[]>;
            get(params: {
                providerId: string;
            }): Promise<ProviderView | null>;
            create(params: {
                dto: CreateProviderDto;
            }): Promise<ProviderView>;
            update(params: {
                providerId: string;
                dto: UpdateProviderDto;
            }): Promise<ProviderView>;
            delete(params: {
                providerId: string;
            }): Promise<void>;
            testConnection(params: {
                providerId: string;
            }): Promise<TestConnectionResult>;
            discoverModels(params: {
                providerId: string;
            }): Promise<DiscoverModelsResult>;
            updateModel(params: {
                providerId: string;
                modelId: string;
                dto: UpdateModelDto;
            }): Promise<ModelView>;
        };
    }
}
//# sourceMappingURL=provider-types.d.ts.map