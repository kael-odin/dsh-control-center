/**
 * Shared Cherry settings-page primitives: SettingsContentColumn (p-6 max-w-3xl),
 * SettingGroup (rounded-xl card), SettingRow, SettingSwitch, SettingTitle.
 */
import type { ReactNode } from 'react';
export declare function SettingsPageShell({ children, className }: {
    children: ReactNode;
    className?: string;
}): import("react").JSX.Element;
export declare function SettingTitle({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function SettingDescription({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function SettingDivider(): import("react").JSX.Element;
export declare function SettingGroup({ children, className }: {
    children: ReactNode;
    className?: string | undefined;
}): import("react").JSX.Element;
export declare function SettingRow({ children, className }: {
    children: ReactNode;
    className?: string | undefined;
}): import("react").JSX.Element;
export declare function SettingRowTitle({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export interface SettingSwitchProps {
    label: ReactNode;
    checked: boolean;
    onChange: (next: boolean) => void;
    description?: ReactNode;
    disabled?: boolean;
}
/** Label-left + switch-right setting row (Cherry DescriptionSwitch). */
export declare function SettingSwitch({ label, checked, onChange, description, disabled }: SettingSwitchProps): import("react").JSX.Element;
//# sourceMappingURL=SettingsPages.d.ts.map