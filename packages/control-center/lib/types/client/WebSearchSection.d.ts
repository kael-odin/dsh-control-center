/**
 * Web Search settings page (Cherry-composition: SettingsContentColumn cards).
 *
 * AGPL-3.0-only – layout adapted from Cherry Studio WebSearchSettings +
 * SettingsPrimitives (content column, setting cards, compact field style).
 */
import type { TypertClientRemote } from '@deepseek-ai/dsh-typert-protocol';
import type { WebSearchKey } from './websearch-locales.ts';
export interface WebSearchSectionInjected {
    websearch: NonNullable<TypertClientRemote['controlCenterWebSearch']>;
    t: (key: WebSearchKey) => string;
}
export declare function WebSearchSection({ websearch, t }: WebSearchSectionInjected): import("react").JSX.Element;
//# sourceMappingURL=WebSearchSection.d.ts.map