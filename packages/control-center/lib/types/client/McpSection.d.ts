/**
 * MCP Section - Split-pane layout matching Cherry Studio MCP management.
 * Left sidebar: server list with search/filter. Right detail: server settings + logs.
 */
import type { CreateMcpServerDto, McpServerView, UpdateMcpServerDto, McpServerCapabilities } from '../mcp-types.ts';
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
interface McpService {
    list(): Promise<RemoteResult<McpServerView[]>>;
    create(params: {
        dto: CreateMcpServerDto;
    }): Promise<RemoteResult<McpServerView>>;
    update(params: {
        serverId: string;
        dto: UpdateMcpServerDto;
    }): Promise<RemoteResult<McpServerView>>;
    delete(params: {
        serverId: string;
    }): Promise<RemoteResult<null>>;
    stopServer(params: {
        serverId: string;
    }): Promise<RemoteResult<null>>;
    refreshTools(params: {
        serverId: string;
    }): Promise<RemoteResult<null>>;
    getServerLogs(params: {
        serverId: string;
        lines?: number;
    }): Promise<RemoteResult<string[]>>;
    getCapabilities(params: {
        serverId: string;
    }): Promise<RemoteResult<McpServerCapabilities | null>>;
}
export interface McpSectionProps {
    mcp?: McpService;
}
export declare function McpSection(props: McpSectionProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=McpSection.d.ts.map