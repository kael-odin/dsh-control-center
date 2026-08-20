import type { CreateMcpServerDto } from '../mcp-types';
interface AddMcpServerDialogProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (dto: CreateMcpServerDto) => Promise<void>;
}
export declare function AddMcpServerDialog({ visible, onClose, onSubmit }: AddMcpServerDialogProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=AddMcpServerDialog.d.ts.map