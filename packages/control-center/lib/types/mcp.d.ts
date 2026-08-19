import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import type { CreateMcpServerDto, McpServerCapabilities, McpServerView, UpdateMcpServerDto } from './mcp-types';
declare module '@deepseek-ai/dsh-api-remotes/client' {
    interface TypertClientRemote {
        controlCenterMcp?: {
            list(): Promise<McpServerView[]>;
            getById(params: {
                serverId: string;
            }): Promise<McpServerView | null>;
            create(params: {
                dto: CreateMcpServerDto;
            }): Promise<McpServerView>;
            update(params: {
                serverId: string;
                dto: UpdateMcpServerDto;
            }): Promise<McpServerView>;
            delete(params: {
                serverId: string;
            }): Promise<void>;
            reorder(params: {
                serverIds: string[];
            }): Promise<void>;
            stopServer(params: {
                serverId: string;
            }): Promise<void>;
            refreshTools(params: {
                serverId: string;
            }): Promise<void>;
            getServerLogs(params: {
                serverId: string;
                lines?: number;
            }): Promise<string[]>;
            getCapabilities(params: {
                serverId: string;
            }): Promise<McpServerCapabilities | null>;
        };
    }
}
export declare class McpService extends Service {
    static inject: readonly ["settings"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private scope;
    private runtimeStates;
    constructor(ctx: Context);
    private recordToView;
    list(): Promise<McpServerView[]>;
    getById(params: {
        serverId: string;
    }): Promise<McpServerView | null>;
    create(params: {
        dto: CreateMcpServerDto;
    }): Promise<McpServerView>;
    update(params: {
        serverId: string;
        dto: UpdateMcpServerDto;
    }): Promise<McpServerView>;
    delete(params: {
        serverId: string;
    }): Promise<void>;
    reorder(params: {
        serverIds: string[];
    }): Promise<void>;
    private startServer;
    stopServer(params: {
        serverId: string;
    }): Promise<void>;
    refreshTools(params: {
        serverId: string;
    }): Promise<void>;
    getServerLogs(params: {
        serverId: string;
        lines?: number;
    }): Promise<string[]>;
    getCapabilities(params: {
        serverId: string;
    }): Promise<McpServerCapabilities | null>;
    private addServerLog;
}
//# sourceMappingURL=mcp.d.ts.map