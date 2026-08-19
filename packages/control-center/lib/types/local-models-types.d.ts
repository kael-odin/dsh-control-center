/**
 * Local Models + Update types (shared between Host and Client).
 */
import type { LocalModelServer, LocalModelEntry } from './local-models.ts';
import type { UpdateInfo } from './update.ts';
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespaceMap {
        controlCenterLocalModels: {
            listServers(): Promise<{
                ok: true;
                value: LocalModelServer[];
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            addServer(input: {
                name: string;
                kind: LocalModelServer['kind'];
                baseUrl?: string;
            }): Promise<{
                ok: true;
                value: LocalModelServer;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            removeServer(serverId: string): Promise<{
                ok: true;
                value: {
                    absent: true;
                };
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            discoverModels(serverId: string): Promise<{
                ok: true;
                value: LocalModelEntry[];
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
        };
        controlCenterUpdate: {
            checkForUpdates(): Promise<{
                ok: true;
                value: UpdateInfo;
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
export type { LocalModelServer, LocalModelEntry, UpdateInfo };
//# sourceMappingURL=local-models-types.d.ts.map