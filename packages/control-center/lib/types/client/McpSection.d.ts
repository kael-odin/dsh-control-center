/**
 * MCP Section - Split-pane layout matching Cherry Studio MCP management.
 * Left sidebar: server list with search/filter. Right detail: server settings + logs.
 */
import type { CreateMcpServerDto, McpServerView, UpdateMcpServerDto } from '../mcp-types.ts';
interface McpService {
    list(): Promise<McpServerView[]>;
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
}
export interface McpSectionProps {
    mcp?: McpService;
}
export declare function McpSection(props: McpSectionProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=McpSection.d.ts.map