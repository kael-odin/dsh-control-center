import type { CreateMcpServerDto, McpNpxPackage } from '../mcp-types';
interface AddMcpServerDialogProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (dto: CreateMcpServerDto) => Promise<void>;
    /** Host npx-market search; absent until the remote mounts. */
    searchNpx?: ((scope: string) => Promise<McpNpxPackage[]>) | undefined;
}
export declare function AddMcpServerDialog({ visible, onClose, onSubmit, searchNpx }: AddMcpServerDialogProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=AddMcpServerDialog.d.ts.map