import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol';
import type { ChannelBridgeStatus } from './channel-bridge.ts';
/** Client descriptor contribution for the Control Center channel bridge. */
declare const channelBridgeRemote: TypertRemoteContribution;
export default channelBridgeRemote;
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespaceMap {
        controlCenterChannelBridge: {
            status(): Promise<{
                ok: true;
                value: ChannelBridgeStatus[];
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            getLog(channelId: string, lines?: number): Promise<{
                ok: true;
                value: string[];
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
        };
    }
}
//# sourceMappingURL=channel-bridge-remote-client.d.ts.map