/**
 * Builtin (preset) MCP server definitions — ported from Cherry Studio
 * `src/shared/data/presets/mcpServers.ts`.
 *
 * Only presets reachable over a wire are ported. Cherry additionally ships
 * nine `inMemory` built-ins (memory, sequential-thinking, fetch, filesystem,
 * brave-search, python, dify-knowledge, browser, didi) whose implementations
 * live inside Cherry's own runtime — declaring them here would advertise
 * servers this host cannot serve, so they are intentionally absent until real
 * implementations exist.
 */
export interface BuiltinMcpPreset {
    name: string;
    description: string;
    reference?: string;
    type: 'stdio' | 'sse' | 'streamableHttp';
    baseUrl?: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    headers?: Record<string, string>;
    provider?: string;
    /** True when the preset needs user credentials before it can serve. */
    shouldConfig?: boolean;
}
export declare const BUILTIN_MCP_PRESETS: readonly BuiltinMcpPreset[];
/** External MCP marketplaces (ported from Cherry's 更多市场 list). */
export interface McpMarketSite {
    name: string;
    url: string;
    description: string;
}
export declare const MCP_MARKET_SITES: readonly McpMarketSite[];
/**
 * Cherry's 9 inMemory built-in servers. Only descriptors live here (client
 * bundle safe); the in-process runtimes live in `mcp-builtin-runtime.ts`
 * (host side, pulls in the MCP SDK + zod). The four DSH-native ones (fetch /
 * filesystem / brave-search / python) are honest "capability maps onto DSH"
 * entries; the rest are listed until a runtime exists.
 */
export interface BuiltinMemoryServer {
    name: string;
    description: string;
    /** True when an in-process runtime actually exists on the host. */
    available: boolean;
    /** Protocol command key the host runtime dispatches on. */
    runtimeKey: string;
}
export declare const BUILTIN_MEMORY_SERVERS: readonly BuiltinMemoryServer[];
//# sourceMappingURL=mcp-builtin.d.ts.map