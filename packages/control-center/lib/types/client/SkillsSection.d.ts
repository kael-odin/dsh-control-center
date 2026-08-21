/**
 * Skills catalog section component.
 *
 * Cherry-style skills management UI over the controlCenterSkills Remote service.
 * Displays installed skills in a card grid with search, enable/disable, and uninstall
 * actions. Online search installs from the host's skill marketplace (a real host
 * capability); local import needs a host filesystem path and is honestly gated.
 *
 * AGPL-3.0-only – adapted from Cherry Studio ResourceCatalog pattern for skills.
 */
import type { InstalledSkill } from '../skills-types.ts';
/** Wire envelope of a strict-mode Typert remote call (same shape as translation-types). */
type RemoteResult<T> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: {
        code: string;
        message: string;
        details: object;
    };
};
interface SkillsService {
    list(params: {
        search?: string;
    }): Promise<RemoteResult<InstalledSkill[]>>;
    update(skillId: string, dto: {
        isGlobalEnabled: boolean;
    }): Promise<RemoteResult<InstalledSkill>>;
    uninstall(skillId: string): Promise<RemoteResult<{
        absent: true;
    }>>;
}
export interface SkillsSectionProps {
    skills?: SkillsService;
}
export declare function SkillsSection(props: SkillsSectionProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=SkillsSection.d.ts.map