/** Gateway types + typert namespace (shared between Host and Client). */
import type { GatewayStatus } from './gateway.ts';
export type { GatewayStatus };
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespaceMap {
        controlCenterGateway: {
            status(): Promise<GatewayStatus>;
            start(): Promise<{
                ok: true;
                value: GatewayStatus;
            } | {
                ok: false;
                error: string;
            }>;
            stop(): Promise<{
                ok: true;
                value: GatewayStatus;
            }>;
        };
    }
}
//# sourceMappingURL=gateway-types.d.ts.map