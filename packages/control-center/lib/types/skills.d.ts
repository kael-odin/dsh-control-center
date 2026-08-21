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
    searchMarketplace(_query: MarketplaceSearchQuery): Promise<MarketplaceSearchResponse>;
    [Symbol.dispose](): void;
}
//# sourceMappingURL=skills.d.ts.map