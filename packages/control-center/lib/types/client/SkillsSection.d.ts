/**
 * Skills catalog section component.
 *
 * Cherry-style skills management UI over the controlCenterSkills Remote service.
 * Displays installed skills in a card grid with search, enable/disable, and uninstall actions.
 *
 * AGPL-3.0-only – adapted from Cherry Studio ResourceCatalog pattern for skills.
 */
import type { InstalledSkill } from '../skills-types.ts';
interface SkillsService {
    list(params: {
        search?: string;
    }): Promise<InstalledSkill[]>;
    update(params: {
        skillId: string;
        dto: {
            isGlobalEnabled: boolean;
        };
    }): Promise<InstalledSkill>;
    uninstall(params: {
        skillId: string;
    }): Promise<void>;
}
export interface SkillsSectionProps {
    skills?: SkillsService;
}
export declare function SkillsSection(props: SkillsSectionProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=SkillsSection.d.ts.map