/**
 * Cherry Combobox parity: button trigger + popover with optional search,
 * grouped option list, and footer slot. Used for language and model pickers.
 */
import { type ReactNode } from 'react';
export interface ComboboxOption {
    value: string;
    label: string;
    /** Secondary line under the label (e.g. provider name). */
    sublabel?: string;
    icon?: ReactNode;
    /** Group id; options without one stay ungrouped. */
    group?: string;
}
export interface ComboboxGroup {
    id: string;
    label: string;
}
export interface ComboboxProps {
    value: string;
    options: readonly ComboboxOption[];
    onChange: (value: string) => void;
    /** Trigger placeholder when nothing is selected. */
    placeholder?: string;
    searchable?: boolean;
    groups?: readonly ComboboxGroup[];
    /** Optional footer row (e.g. "配置自定义模型"). */
    footer?: ReactNode;
    className?: string | undefined;
    ariaLabel?: string | undefined;
    align?: 'start' | 'end' | undefined;
}
export declare function Combobox({ value, options, onChange, placeholder, searchable, groups, footer, className, ariaLabel, align }: ComboboxProps): import("react").JSX.Element;
//# sourceMappingURL=Combobox.d.ts.map