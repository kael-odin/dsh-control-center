/**
 * Shared Cherry-faithful panel primitives for the translate side panels:
 * switch, segmented control, icon button, confirm dialog, copy feedback.
 */
import { type ReactNode } from 'react';
export interface SwitchProps {
    checked: boolean;
    onChange: (next: boolean) => void;
    label: string;
}
export declare function Switch({ checked, onChange, label }: SwitchProps): import("react").JSX.Element;
export interface SegmentedProps<T extends string> {
    options: ReadonlyArray<{
        value: T;
        label: string;
        disabled?: boolean;
    }>;
    value: T;
    onChange: (next: T) => void;
}
export declare function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>): import("react").JSX.Element;
export interface IconButtonProps {
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    title?: string;
    disabled?: boolean;
    active?: boolean;
    on?: boolean;
    className?: string;
    children: ReactNode;
}
/** Cherry IconButton (size sm/md variants, ghost tone). */
export declare function IconButton({ onClick, title, disabled, active, on, className, children }: IconButtonProps): import("react").JSX.Element;
export interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description?: string;
    confirmText: string;
    cancelText?: string;
    destructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}
export declare function ConfirmDialog({ open, title, description, confirmText, cancelText, destructive, onConfirm, onCancel }: ConfirmDialogProps): import("react").JSX.Element | null;
export interface PanelShellProps {
    title: string;
    onClose: () => void;
    children: ReactNode;
    headerExtra?: ReactNode;
    /** CSS module class values index as `string | undefined` under noUncheckedIndexedAccess. */
    bodyClassName?: string | undefined;
} /** Floating right side panel (Cherry PageSidePanel geometry). */
export declare function PanelShell({ title, onClose, children, headerExtra, bodyClassName }: PanelShellProps): import("react").JSX.Element;
/** Cherry HelpTooltip: circled question mark revealing an explanation bubble. */
export declare function HelpTooltip({ text, label }: {
    text: string;
    label?: string;
}): import("react").JSX.Element;
/** Copy-to-clipboard with transient check feedback. */
export declare function useCopy(): {
    copied: boolean;
    copy: (text: string) => void;
};
//# sourceMappingURL=panel-ui.d.ts.map