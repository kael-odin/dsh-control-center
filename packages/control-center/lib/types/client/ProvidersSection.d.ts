/**
 * Provider Management - Split-pane layout with 100% UI parity to Cherry Studio.
 * Left sidebar: provider list with search/filter. Right detail: provider settings + model list.
 */
import type { ProviderView, CreateProviderDto, UpdateProviderDto, UpdateModelDto, ModelView } from '../provider-types.ts';
interface ProvidersService {
    list(): Promise<ProviderView[]>;
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
    }): Promise<{
        success: boolean;
        latencyMs?: number;
        error?: string;
    }>;
    discoverModels(params: {
        providerId: string;
    }): Promise<{
        models: any[];
        error?: string;
    }>;
    updateModel(params: {
        providerId: string;
        modelId: string;
        dto: UpdateModelDto;
    }): Promise<ModelView>;
}
export interface ProvidersSectionProps {
    providers?: ProvidersService;
}
export declare function ProvidersSection(props: ProvidersSectionProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ProvidersSection.d.ts.map