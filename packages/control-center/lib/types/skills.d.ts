/**
 * Skills vertical Host service.
 *
 * SQLite catalog at <dshHome>/control-center/skills.sqlite with append-only
 * migrations. Skill files are stored in <dshHome>/skills/ and registered
 * with DSH's skill runtime.
 *
 * AGPL-3.0-only – adapted from Cherry Studio's SkillService architecture.
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import type { InstalledSkill, ListSkillsQuery, UpdateSkillDto, SkillInstallOptions, MarketplaceSearchQuery, MarketplaceSearchResponse } from './skills-types.ts';
export interface SkillsServiceConfig {
    dshHome: string;
    logger: Context['logger'];
}
export declare class SkillsService extends Service {
    static inject: readonly [];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private readonly db;
    private readonly skillsDir;
    constructor(ctx: Context, config?: SkillsServiceConfig);
    private migrate;
    /**
     * List installed skills with optional search filter.
     */
    list(query?: ListSkillsQuery): Promise<InstalledSkill[]>;
    /**
     * Get skill by ID.
     */
    getById(skillId: string): Promise<InstalledSkill | null>;
    /**
     * Update skill (currently only global enable/disable).
     */
    update(skillId: string, dto: UpdateSkillDto): Promise<InstalledSkill>;
    /**
     * Install a skill from various sources.
     */
    install(options: SkillInstallOptions): Promise<InstalledSkill>;
    private installFromDirectory;
    /**
     * Install one skill directory from a github.com tree URL
     * (`/{owner}/{repo}/tree/{branch}/{dir}`): the Git Trees API lists the
     * subtree, each blob downloads from raw.githubusercontent.com, and the
     * staged copy re-enters the ordinary directory installer — validation,
     * hashing, and dedupe stay in exactly one code path.
     */
    private installFromUrl;
    private copyDirectory;
    /**
     * Uninstall a skill.
     */
    uninstall(skillId: string): Promise<void>;
    /**
     * Search marketplace.
     *
     * Not yet implemented: the claude-plugins.dev search endpoint has not been
     * wired. Throws loudly rather than silently returning an empty result set,
     * so callers cannot mistake an unimplemented capability for "no matches".
     */
    /**
     * Search the three public skill registries (Cherry's set) in parallel via
     * host fetch — browser CORS never gates it. Results are installable
     * through {@link install} with `{ source: 'url', url: sourceUrl }` when the
     * entry carries a GitHub directory.
     */
    searchMarketplace(query: MarketplaceSearchQuery): Promise<MarketplaceSearchResponse>;
    [Symbol.dispose](): void;
}
//# sourceMappingURL=skills.d.ts.map