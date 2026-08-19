import type { ProviderView } from '../provider-types.ts';
interface ProviderModelListProps {
    provider: ProviderView;
    onToggleModel?: (modelId: string, enabled: boolean) => Promise<void>;
}
export declare function ProviderModelList({ provider, onToggleModel }: ProviderModelListProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ProviderModelList.d.ts.map