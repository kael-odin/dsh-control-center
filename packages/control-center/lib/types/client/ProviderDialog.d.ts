/**
 * Provider Add/Edit Dialog Component
 *
 * Modal dialog for creating new providers or editing existing ones.
 * Follows the Settings + Credentials + TypertRemote pattern.
 */
import type { CreateProviderDto, ProviderView, UpdateProviderDto } from '../provider-types';
interface ProvidersService {
    create(params: {
        dto: CreateProviderDto;
    }): Promise<ProviderView>;
    update(params: {
        providerId: string;
        dto: UpdateProviderDto;
    }): Promise<ProviderView>;
}
interface ProviderDialogProps {
    open: boolean;
    mode: 'create' | 'edit';
    provider?: ProviderView | undefined;
    providersService?: ProvidersService | undefined;
    onClose: () => void;
    onSuccess?: (() => void) | undefined;
}
export declare function ProviderDialog({ open, mode, provider, providersService, onClose, onSuccess }: ProviderDialogProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=ProviderDialog.d.ts.map