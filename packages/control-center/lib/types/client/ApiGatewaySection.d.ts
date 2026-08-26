import type { ReactNode } from 'react';
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client';
export interface ApiGatewaySectionInjected {
    gateway: {
        status(): Promise<{
            running: boolean;
            port: number;
            url: string | null;
        }>;
        start(): Promise<{
            ok: true;
            value: {
                running: boolean;
                port: number;
                url: string | null;
            };
        } | {
            ok: false;
            error: string;
        }>;
        stop(): Promise<{
            ok: true;
            value: {
                running: boolean;
                port: number;
                url: string | null;
            };
        }>;
    };
    api: Pick<IApiClient, 'settings'>;
}
export type ApiGatewaySectionProps = Partial<ApiGatewaySectionInjected>;
export declare function ApiGatewaySection(props: ApiGatewaySectionProps): ReactNode;
//# sourceMappingURL=ApiGatewaySection.d.ts.map