/** Host half of DSH Control Center: compatibility gate and onboarding settings. */
import type { Context } from '@deepseek-ai/cordis';
/** Cordis plugin name. */
export declare const name = "dsh-control-center";
export declare const inject: string[];
/** Reject incompatible DSH packages, then restore the onboarding namespace. */
export declare function apply(ctx: Context): void;
export { assertCompatibleDsh } from './compatibility.ts';
export { TranslationService } from './translation.ts';
export type * from './translation-types.ts';
export { PaintingService } from './painting.ts';
export type * from './painting-types.ts';
export { KnowledgeService } from './knowledge.ts';
export type * from './knowledge-types.ts';
export { SkillsService } from './skills.ts';
export type * from './skills-types.ts';
export { McpService } from './mcp.ts';
export type * from './mcp-types.ts';
export { WebSearchService } from './websearch.ts';
export type * from './websearch/types.ts';
export { ProvidersService } from './providers.ts';
export type * from './provider-types.ts';
export { ReposService } from './repos.ts';
export type * from './repo-types.ts';
export { FileProcessingService } from './file-processing.ts';
export type * from './file-processing-types.ts';
export { UsageService } from './usage.ts';
export type * from './usage-types.ts';
export { DataService } from './data.ts';
export type * from './data-types.ts';
export { assertSecretSchemaSafe, auditSecretSchema } from './secret-schema.ts';
export type { SecretSchemaViolation } from './secret-schema.ts';
//# sourceMappingURL=index.d.ts.map