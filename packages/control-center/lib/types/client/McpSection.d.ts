/**
 * MCP Section - Split-pane layout matching Cherry Studio MCP management.
 * Left sidebar: server list with search/filter. Right detail: server settings + logs.
 */
import type { CreateMcpServerDto, McpCheckResult, McpDiscoverProvider, McpHostedServer, McpServerView, UpdateMcpServerDto, McpServerCapabilities } from '../mcp-types.ts';
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
    create(dto: CreateMcpServerDto): Promise<RemoteResult<McpServerView>>;
    update(serverId: string, dto: UpdateMcpServerDto): Promise<RemoteResult<McpServerView>>;
    delete(serverId: string): Promise<RemoteResult<null>>;
    stopServer(serverId: string): Promise<RemoteResult<null>>;
    refreshTools(serverId: string): Promise<RemoteResult<null>>;
    getServerLogs(serverId: string, lines?: number): Promise<RemoteResult<string[]>>;
    getCapabilities(serverId: string): Promise<RemoteResult<McpServerCapabilities | null>>;
    checkServer(serverId: string): Promise<RemoteResult<McpCheckResult>>;
    searchNpxRegistry(scope: string): Promise<RemoteResult<Array<{
        fullName: string;
        name: string;
        description: string;
        version: string;
        link: string;
    }>>>;
    discoverMcpServers(provider: McpDiscoverProvider, token: string): Promise<RemoteResult<McpHostedServer[]>>;
}
export interface McpSectionProps {
    mcp?: McpService;
}
export declare function McpSection(props: McpSectionProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=McpSection.d.ts.map