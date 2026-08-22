/**
 * Skill marketplace search — ported from Cherry Studio
 * `src/shared/utils/skillMarketplace.ts`: three public registries searched in
 * parallel, partial failures tolerated (only an all-source failure rejects),
 * de-duplicated by display name.
 *
 * Transport is injected so tests can stub responses; production passes the
 * host `fetch`.
 */
export type SkillSearchSource = 'skills.sh' | 'claude-plugins.dev' | 'clawhub.ai' | 'github';
/** One installable search hit. `installUrl` is what the installer consumes. */
export interface SkillSearchResult {
    slug: string;
    name: string;
    description: string | null;
    author: string | null;
    stars: number;
    downloads: number;
    sourceRegistry: SkillSearchSource;
    sourceUrl: string | null;
    /** GitHub tree URL of the skill directory — resolvable by the URL installer. */
    installUrl: string | null;
}
export declare const SKILL_SEARCH_FAILED = "skill_search_failed";
/**
 * Search every supported registry. Only an all-source failure rejects;
 * per-source failures are reported through {@param onSourceFailure}.
 */
export declare function searchSkillMarketplaces(query: string, fetchJson: (url: string) => Promise<unknown>, onSourceFailure?: (source: SkillSearchSource, error: unknown) => void): Promise<SkillSearchResult[]>;
//# sourceMappingURL=skill-marketplace.d.ts.map