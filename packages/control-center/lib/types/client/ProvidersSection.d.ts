/**
 * Provider Management - Split-pane layout with 100% UI parity to Cherry Studio.
 * Left sidebar: provider list with search/filter. Right detail: provider settings + model list.
 */
import type { ProviderView, CreateProviderDto, UpdateProviderDto, UpdateModelDto, ModelView } from '../provider-types.ts';
/** Wire envelope of a strict-mode Typert remote call (same shape as translation-types). */
type RemoteResult<T> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: {
        code: string;
        message: string;
        details: object;
    };
};
interface ProvidersService {
    list(): Promise<RemoteResult<ProviderView[]>>;
    create(params: {
        dto: CreateProviderDto;
    }): Promise<RemoteResult<ProviderView>>;
    update(params: {
        providerId: string;
        dto: UpdateProviderDto;
    }): Promise<RemoteResult<ProviderView>>;
    delete(params: {
        providerId: string;
    }): Promise<RemoteResult<{
        absent: true;
    }>>;
    testConnection(params: {
        providerId: string;
    }): Promise<RemoteResult<{
        success: boolean;
        latencyMs?: number;
        error?: string;
    }>>;
    discoverModels(params: {
        providerId: string;
    }): Promise<RemoteResult<{
        models: any[];
        error?: string;
    }>>;
    updateModel(params: {
        providerId: string;
        modelId: string;
        dto: UpdateModelDto;
    }): Promise<RemoteResult<ModelView>>;
}
export interface ProvidersSectionProps {
    providers?: ProvidersService;
}
export declare function ProvidersSection(props: ProvidersSectionProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ProvidersSection.d.ts.map