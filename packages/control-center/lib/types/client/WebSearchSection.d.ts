/**
 * Web Search settings page (Cherry-composition: SettingsContentColumn cards).
 *
 * AGPL-3.0-only – layout adapted from Cherry Studio WebSearchSettings +
 * SettingsPrimitives (content column, setting cards, compact field style).
 */
import type { TypertClientRemote } from '@deepseek-ai/dsh-typert-protocol';
interface WebSearchSectionProps {
    websearch: NonNullable<TypertClientRemote['controlCenterWebSearch']>;
}
export declare function WebSearchSection({ websearch }: WebSearchSectionProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=WebSearchSection.d.ts.map