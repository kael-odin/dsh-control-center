import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import type { CreateMcpServerDto, McpDiscoverProvider, McpHostedServer, McpNpxPackage, McpServerCapabilities, McpServerView, McpCheckResult, UpdateMcpServerDto } from './mcp-types';
declare module '@deepseek-ai/dsh-api-remotes/client' {
    interface TypertClientRemote {
        controlCenterMcp?: {
            list(): Promise<{
                ok: true;
                value: McpServerView[];
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            getById(params: {
                serverId: string;
            }): Promise<{
                ok: true;
                value: McpServerView | null;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            create(params: {
                dto: CreateMcpServerDto;
            }): Promise<{
                ok: true;
                value: McpServerView;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            update(params: {
                serverId: string;
                dto: UpdateMcpServerDto;
            }): Promise<{
                ok: true;
                value: McpServerView;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            delete(params: {
                serverId: string;
            }): Promise<{
                ok: true;
                value: null;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            reorder(params: {
                serverIds: string[];
            }): Promise<{
                ok: true;
                value: null;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            stopServer(params: {
                serverId: string;
            }): Promise<{
                ok: true;
                value: null;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            refreshTools(params: {
                serverId: string;
            }): Promise<{
                ok: true;
                value: null;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            getServerLogs(params: {
                serverId: string;
                lines?: number;
            }): Promise<{
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
            getCapabilities(params: {
                serverId: string;
            }): Promise<{
                ok: true;
                value: McpServerCapabilities | null;
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
export declare class McpService extends Service {
    static inject: readonly ["settings"];
    static optional: readonly ["tools"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private scope;
    private runtimeStates;
    constructor(ctx: Context);
    private recordToView;
    list(): Promise<McpServerView[]>;
    getById(serverId: string): Promise<McpServerView | null>;
    create(dto: CreateMcpServerDto): Promise<McpServerView>;
    update(serverId: string, dto: UpdateMcpServerDto): Promise<McpServerView>;
    delete(serverId: string): Promise<void>;
    reorder(serverIds: string[]): Promise<void>;
    private startServer;
    stopServer(serverId: string): Promise<void>;
    refreshTools(serverId: string): Promise<void>;
    getServerLogs(serverId: string, lines?: number): Promise<string[]>;
    getCapabilities(serverId: string): Promise<McpServerCapabilities | null>;
    /** Probe a trusted server without changing its persisted enabled state. */
    checkServer(serverId: string): Promise<McpCheckResult>;
    /**
     * Search the public npm registry for MCP servers under one scope (Cherry's
     * Npx 市场列表). Runs on the host so browser CORS never gates it; results
     * are advisory candidates the user still has to add.
     */
    searchNpxRegistry(scope: string): Promise<McpNpxPackage[]>;
    /** Discover hosted MCP servers from a provider API (Cherry McpProviderSettings parity). */
    discoverMcpServers(provider: McpDiscoverProvider, token: string): Promise<McpHostedServer[]>;
    private addServerLog;
}
//# sourceMappingURL=mcp.d.ts.map