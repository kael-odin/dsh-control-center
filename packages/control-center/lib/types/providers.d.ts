/**
 * Control Center Providers Service - Host side provider management.
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import type { ProviderView, CreateProviderDto, UpdateProviderDto, TestConnectionResult, DiscoverModelsResult, ModelView, UpdateModelDto } from './provider-types.ts';
export interface ProvidersServiceConfig {
    logger?: Context['logger'];
}
export declare class ProvidersService extends Service {
    static inject: readonly ["settings", "credentials"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private scope;
    constructor(ctx: Context, _config?: ProvidersServiceConfig);
    list(): Promise<ProviderView[]>;
    getById(providerId: string): Promise<ProviderView | null>;
    create(dto: CreateProviderDto): Promise<ProviderView>;
    update(providerId: string, dto: UpdateProviderDto): Promise<ProviderView>;
    delete(providerId: string): Promise<void>;
    testConnection(providerId: string): Promise<TestConnectionResult>;
    discoverModels(providerId: string): Promise<DiscoverModelsResult>;
    updateModel(providerId: string, modelId: string, dto: UpdateModelDto): Promise<ModelView>;
    private recordToView;
}
//# sourceMappingURL=providers.d.ts.map