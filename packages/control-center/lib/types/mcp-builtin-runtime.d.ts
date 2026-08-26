/**
 * In-process MCP servers — Cherry's 9 inMemory built-ins, hosted inside this
 * process (no stdio/HTTP hop). The MCP settings schema already carries an
 * `inMemory` server type; these are the runtimes that make that type real.
 *
 * Currently implemented: sequential-thinking (structured reasoning), memory
 * (knowledge-graph memory), browser (web page fetch → readable text, SSRF
 * guarded). The rest of Cherry's set (fetch, filesystem, brave-search,
 * python, dify-knowledge, didi) map onto DSH-native capabilities and are
 * listed but not yet provided in-process.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
/** A running in-memory server paired with its client transport. */
export interface RunningInMemoryServer {
    server: McpServer;
    clientTransport: InMemoryTransport;
}
/** Runtime keys that have a real in-process implementation on the host. */
export declare const AVAILABLE_INMEMORY_RUNTIMES: readonly string[];
/**
 * Create one in-process MCP server for a builtin runtime, linked to a client
 * transport. The caller connects the client to `clientTransport`.
 */
export declare function createInMemoryServer(name: string): RunningInMemoryServer;
//# sourceMappingURL=mcp-builtin-runtime.d.ts.map