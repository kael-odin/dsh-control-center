import type { ProviderView } from '../provider-types.ts';
interface ProviderAuthenticationProps {
    provider: ProviderView;
    onUpdateProvider: (updates: {
        apiKey?: string;
        baseURL?: string;
        customHeaders?: Record<string, string>;
    }) => Promise<void>;
    onTestConnection: () => Promise<void>;
    onDiscoverModels: () => Promise<void>;
    isTestingConnection: boolean;
    isDiscoveringModels: boolean;
    connectionTestResult: {
        success: boolean;
        latencyMs?: number;
        error?: string;
    } | null;
}
export declare function ProviderAuthentication({ provider, onUpdateProvider, onTestConnection, onDiscoverModels, isTestingConnection, isDiscoveringModels, connectionTestResult }: ProviderAuthenticationProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ProviderAuthentication.d.ts.map