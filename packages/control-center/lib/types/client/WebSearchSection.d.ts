/** Cherry-style web-search provider management with live readiness checks. */
import type { TypertClientRemote } from '@deepseek-ai/dsh-typert-protocol';
import type { WebSearchKey } from './websearch-locales.ts';
export interface WebSearchSectionInjected {
    websearch: NonNullable<TypertClientRemote['controlCenterWebSearch']>;
    t: (key: WebSearchKey) => string;
}
export declare function WebSearchSection({ websearch, t }: WebSearchSectionInjected): import("react").JSX.Element;
//# sourceMappingURL=WebSearchSection.d.ts.map