/**
 * Providers management section component.
 *
 * Cherry-style providers management UI over the controlCenterProviders Remote service.
 * Displays configured providers in a card grid with search, enable/disable, test, and delete actions.
 *
 * AGPL-3.0-only – adapted from Cherry Studio provider management pattern.
 */
import type { ProviderView, CreateProviderDto, UpdateProviderDto, TestConnectionResult, DiscoverModelsResult } from '../provider-types.ts';
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
    }): Promise<TestConnectionResult>;
    discoverModels(params: {
        providerId: string;
    }): Promise<DiscoverModelsResult>;
}
export interface ProvidersSectionProps {
    providers?: ProvidersService;
}
export declare function ProvidersSection(props: ProvidersSectionProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ProvidersSection.old.d.ts.map