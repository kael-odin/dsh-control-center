/**
 * Extract an npx MCP config sample from a package README — ported from
 * Cherry Studio `src/renderer/utils/mcp.ts getMcpConfigSampleFromReadme`.
 *
 * Scans for a `"mcpServers": { ... }` JSON block (one nesting level deep),
 * takes its first entry, and accepts it only when the command is `npx` — the
 * one shape our stdio installer can serve directly.
 */
export interface McpConfigSample {
    command: string;
    args?: string[];
    env?: Record<string, string>;
}
export declare function getMcpConfigSampleFromReadme(readme: string): McpConfigSample | null;
//# sourceMappingURL=mcp-readme-sample.d.ts.map