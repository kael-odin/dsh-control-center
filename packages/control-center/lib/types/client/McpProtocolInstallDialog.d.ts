/**
 * MCP protocol install dialog — Cherry McpProtocolInstallDialog parity.
 *
 * Confirms a batch install of protocol-based MCP servers parsed from a pasted
 * config (JSON array or `mcpServers` object). Each server shows its type badge
 * and a compact config preview; 安装 adds them all through the shared create
 * path.
 */
import type { CreateMcpServerDto } from '../mcp-types.ts';
import type { ParsedServerSpec } from './mcp-import.ts';
interface McpProtocolInstallDialogProps {
    servers: ParsedServerSpec[];
    onClose: () => void;
    onInstall: (server: ParsedServerSpec) => Promise<void>;
}
declare function specToDto(spec: ParsedServerSpec): CreateMcpServerDto;
export declare function McpProtocolInstallDialog({ servers, onClose, onInstall }: McpProtocolInstallDialogProps): import("react").JSX.Element;
export { specToDto };
//# sourceMappingURL=McpProtocolInstallDialog.d.ts.map