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

const ONBOARDING_SETTINGS_NAMESPACE = 'ui-onboarding'

interface OnboardingSettings {
  welcomeNoticeVersion?: string
}

const OnboardingSettingsSchema: z<OnboardingSettings> = z.object({
  welcomeNoticeVersion: z.string(),
})

/** Cordis plugin name. */
export const name = 'dsh-control-center'

export const inject = ['typert']

/** Reject incompatible DSH packages, then restore the onboarding namespace. */
export function apply(ctx: Context): void {
  assertCompatibleDsh()
  new TranslationService(ctx)
  new PaintingService(ctx)
  new KnowledgeService(ctx)
  new SkillsService(ctx)
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
        ...skillsRemote.descriptors
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
export { assertSecretSchemaSafe, auditSecretSchema } from './secret-schema.ts'
export type { SecretSchemaViolation } from './secret-schema.ts'
