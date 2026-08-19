/** Host half of DSH Control Center: compatibility gate and onboarding settings. */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { assertCompatibleDsh } from './compatibility.ts'
import type { TypertContribution } from '@deepseek-ai/dsh-typert-registry'
import TranslationService from './translation.ts'
import translationRemote from './translation-remote-client.ts'
import PaintingService from './painting.ts'
import paintingRemote from './painting-remote-client.ts'
import KnowledgeService from './knowledge.ts'
import knowledgeRemote from './knowledge-remote-client.ts'
import { SkillsService } from './skills.ts'
import skillsRemote from './skills-remote-client.ts'
import { McpService } from './mcp.ts'
import mcpRemote from './mcp-remote-client.ts'
import { WebSearchService } from './websearch.ts'
import websearchRemote from './websearch-remote-client.ts'
import { ProvidersService } from './providers.ts'
import providersRemote from './provider-remote-client.ts'
import { ReposService } from './repos.ts'
import reposRemote from './repo-remote-client.ts'
import { FileProcessingService } from './file-processing.ts'
import fileProcessingRemote from './file-processing-remote-client.ts'
import { UsageService } from './usage.ts'
import usageRemote from './usage-remote-client.ts'
import { DataService } from './data.ts'
import dataRemote from './data-remote-client.ts'
import { SystemService } from './system.ts'
import systemRemote from './system-remote-client.ts'

const ONBOARDING_SETTINGS_NAMESPACE = 'ui-onboarding'

interface OnboardingSettings {
  welcomeNoticeVersion?: string
}

const OnboardingSettingsSchema: z<OnboardingSettings> = z.object({
  welcomeNoticeVersion: z.string(),
})

/** Cordis plugin name. */
export const name = 'dsh-control-center'

export const inject = ['typert', 'settings']

/** Reject incompatible DSH packages, then restore the onboarding namespace. */
export function apply(ctx: Context): void {
  assertCompatibleDsh()
  new TranslationService(ctx)
  new PaintingService(ctx)
  new KnowledgeService(ctx)
  new SkillsService(ctx)
  new McpService(ctx)
  new WebSearchService(ctx)
  new ProvidersService(ctx)
  new ReposService(ctx)
  new FileProcessingService(ctx)
  new UsageService(ctx)
  new DataService(ctx)
  new SystemService(ctx)
  const contributions: readonly TypertContribution[] = [
    {
      package: '@dsh-control-center/control-center',
      face: 'host',
      schemas: [],
      model: { services: [], events: [], objects: [] },
      invocations: [
        ...translationRemote.descriptors,
        ...paintingRemote.descriptors,
        ...knowledgeRemote.descriptors,
        ...skillsRemote.descriptors,
        ...mcpRemote.descriptors,
        ...websearchRemote.descriptors,
        ...providersRemote.descriptors,
        ...reposRemote.descriptors,
        ...fileProcessingRemote.descriptors,
        ...usageRemote.descriptors,
        ...dataRemote.descriptors,
        ...systemRemote.descriptors
      ]
    }
  ]
  for (const contribution of contributions) ctx.typert.register(contribution)
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(
      settingsNamespace(ONBOARDING_SETTINGS_NAMESPACE),
      OnboardingSettingsSchema,
    )
  })
}

export { assertCompatibleDsh } from './compatibility.ts'
export { TranslationService } from './translation.ts'
export type * from './translation-types.ts'
export { PaintingService } from './painting.ts'
export type * from './painting-types.ts'
export { KnowledgeService } from './knowledge.ts'
export type * from './knowledge-types.ts'
export { SkillsService } from './skills.ts'
export type * from './skills-types.ts'
export { McpService } from './mcp.ts'
export type * from './mcp-types.ts'
export { WebSearchService } from './websearch.ts'
export type * from './websearch/types.ts'
export { ProvidersService } from './providers.ts'
export type * from './provider-types.ts'
export { ReposService } from './repos.ts'
export type * from './repo-types.ts'
export { FileProcessingService } from './file-processing.ts'
export type * from './file-processing-types.ts'
export { UsageService } from './usage.ts'
export type * from './usage-types.ts'
export { DataService } from './data.ts'
export type * from './data-types.ts'
export { SystemService } from './system.ts'
export type * from './system-types.ts'
export { assertSecretSchemaSafe, auditSecretSchema } from './secret-schema.ts'
export type { SecretSchemaViolation } from './secret-schema.ts'
