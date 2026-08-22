/**
 * Parsers behind the 添加 MCP 服务器 dialog's 快速导入 box (Cherry's
 * QuickCreate flow): paste an `npx` command line, a JSON server definition
 * (bare or wrapped in a `mcpServers` object), or a plain URL, and the fields
 * prefill. Nothing here writes — parsing only proposes; the user still
 * submits the form.
 */
export type McpTransportType = 'stdio' | 'sse' | 'streamableHttp';
export interface ParsedServerSpec {
    name?: string | undefined;
    type: McpTransportType;
    command?: string | undefined;
    args?: string[] | undefined;
    env?: Record<string, string> | undefined;
    baseUrl?: string | undefined;
}
export type ParseResult = {
    ok: true;
    spec: ParsedServerSpec;
} | {
    ok: false;
    error: string;
};
/**
 * Parse one pasted snippet into a server draft.
 * @param text - raw clipboard text: npx line, JSON def, mcpServers wrapper,
 *   or a URL.
 * @returns a parsed draft, or a human-readable refusal.
 */
export declare function parseServerSpec(text: string): ParseResult;
//# sourceMappingURL=mcp-import.d.ts.map