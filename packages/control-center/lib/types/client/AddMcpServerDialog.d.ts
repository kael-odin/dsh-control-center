import type { CreateMcpServerDto, McpNpxPackage } from '../mcp-types';
interface AddMcpServerDialogProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (dto: CreateMcpServerDto) => Promise<void>;
    /** Host npx-market search; absent until the remote mounts. */
    searchNpx?: ((scope: string) => Promise<McpNpxPackage[]>) | undefined;
    /** Tab to open on next show (builtin/sites give direct market entry). */
    initialTab?: 'manual' | 'market' | 'builtin' | 'sites';
}
export declare function AddMcpServerDialog({ visible, onClose, onSubmit, searchNpx, initialTab }: AddMcpServerDialogProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=AddMcpServerDialog.d.ts.map