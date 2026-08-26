/**
 * MCP Discover views — Cherry McpSettingsPage 内置服务器 / 市场 parity.
 *
 * Cherry shows these as real subnav pages, not dialog tabs. The presets and
 * market sites are the same data the Add dialog uses; both views add servers
 * directly through the shared create path (no dialog hop).
 */
import type { CreateMcpServerDto, McpDiscoverProvider, McpHostedServer, McpNpxPackage } from '../mcp-types.ts';
interface DiscoverProps {
    onAdd: (dto: CreateMcpServerDto) => Promise<void>;
    /** Host npx-market search; absent until the remote mounts. */
    searchNpx?: ((scope: string) => Promise<McpNpxPackage[]>) | undefined;
    /** Host hosted-MCP discovery; absent until the remote mounts. */
    discover?: ((provider: McpDiscoverProvider, token: string) => Promise<McpHostedServer[]>) | undefined;
}
/** 内置服务器 — wire-reachable presets from Cherry's mcpServers.ts. */
export declare function McpBuiltinView({ onAdd }: DiscoverProps): import("react").JSX.Element;
/** 市场 — npx scope search + external market site links (Cherry 市场页 parity). */
export declare function McpMarketView({ onAdd, searchNpx }: DiscoverProps): import("react").JSX.Element;
export declare function McpProviderSettingsView({ onAdd, discover }: DiscoverProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=McpDiscoverViews.d.ts.map