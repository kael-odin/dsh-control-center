export interface ModelOption {
    value: string;
    label: string;
    providerId: string;
    providerName: string;
}
export interface ModelSelectorProps {
    models: readonly ModelOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    /** Opens the settings models section (bridged to the settings shell). */
    onConfigure?: () => void;
    ariaLabel?: string;
    className?: string;
    align?: 'start' | 'end';
}
export declare function ModelSelector({ models, value, onChange, placeholder, onConfigure, ariaLabel, className, align }: ModelSelectorProps): import("react").JSX.Element;
export declare function ProviderAvatar({ id, name, size }: {
    id: string;
    name: string;
    size?: number;
}): import("react").JSX.Element;
//# sourceMappingURL=ModelSelector.d.ts.map