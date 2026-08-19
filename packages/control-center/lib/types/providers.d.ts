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
    getById(params: {
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
    updateModel(_params: {
        providerId: string;
        modelId: string;
        dto: UpdateModelDto;
    }): Promise<ModelView>;
    private recordToView;
}
//# sourceMappingURL=providers.d.ts.map