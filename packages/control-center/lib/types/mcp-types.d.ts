/**
 * MCP (Model Context Protocol) Type Definitions
 *
 * Based on Cherry Studio's MCP server schema with adaptations for DSH.
 */
export type McpServerType = 'stdio' | 'sse' | 'streamableHttp' | 'inMemory';
export type McpServerInstallSource = 'builtin' | 'manual' | 'protocol' | 'unknown';
export interface McpConfigSample {
    name?: string;
    description?: string;
    env?: Record<string, string>;
    args?: string[];
    headers?: Record<string, string>;
}
export interface McpServerRecord {
    id: string;
    name: string;
    type?: McpServerType;
    description?: string;
    baseUrl?: string;
    command?: string;
    registryUrl?: string;
    args?: string[];
    env?: Record<string, string>;
    headers?: Record<string, string>;
    provider?: string;
    providerUrl?: string;
    logoUrl?: string;
    tags?: string[];
    longRunning?: boolean;
    timeout?: number;
    dxtVersion?: string;
    dxtPath?: string;
    reference?: string;
    searchKey?: string;
    configSample?: McpConfigSample;
    disabledTools?: string[];
    disabledAutoApproveTools?: string[];
    shouldConfig?: boolean;
    sortOrder?: number;
    isActive: boolean;
    installSource?: McpServerInstallSource;
    isTrusted?: boolean;
    trustedAt?: number;
    installedAt?: number;
    createdAt: string;
    updatedAt: string;
}
export interface McpServerView {
    id: string;
    name: string;
    type?: McpServerType;
    description?: string;
    baseUrl?: string;
    command?: string;
    registryUrl?: string;
    args?: string[];
    env?: Record<string, string>;
    headers?: Record<string, string>;
    provider?: string;
    providerUrl?: string;
    logoUrl?: string;
    tags?: string[];
    longRunning?: boolean;
    timeout?: number;
    disabledTools?: string[];
    sortOrder?: number;
    isActive: boolean;
    installSource?: McpServerInstallSource;
    isTrusted?: boolean;
    runtimeState?: 'disabled' | 'connecting' | 'connected' | 'error';
    lastError?: string;
    version?: string;
    createdAt: string;
    updatedAt: string;
}
export interface CreateMcpServerDto {
    name: string;
    type?: McpServerType;
    description?: string;
    baseUrl?: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    headers?: Record<string, string>;
    provider?: string;
    providerUrl?: string;
    logoUrl?: string;
    tags?: string[];
    longRunning?: boolean;
    timeout?: number;
    installSource?: McpServerInstallSource;
    isActive?: boolean;
    isTrusted?: boolean;
}
export interface UpdateMcpServerDto {
    name?: string;
    description?: string;
    baseUrl?: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    headers?: Record<string, string>;
    longRunning?: boolean;
    timeout?: number;
    disabledTools?: string[];
    isActive?: boolean;
    isTrusted?: boolean;
}
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespaceMap {
        controlCenterMcp: {
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
export interface McpToolInfo {
    name: string;
    description?: string;
    inputSchema?: any;
}
export interface McpPromptInfo {
    name: string;
    description?: string;
    arguments?: Array<{
        name: string;
        description?: string;
        required?: boolean;
    }>;
}
export interface McpResourceInfo {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}
export interface McpServerCapabilities {
    tools?: McpToolInfo[];
    prompts?: McpPromptInfo[];
    resources?: McpResourceInfo[];
}
//# sourceMappingURL=mcp-types.d.ts.map