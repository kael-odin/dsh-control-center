/** Host half of DSH Control Center: compatibility gate and onboarding settings. */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { assertCompatibleDsh } from './compatibility.ts'
import type { TypertContribution } from '@deepseek-ai/dsh-typert-registry'
import TranslationService from './translation.ts'
import translationRemote from './translation-remote-client.ts'

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
  ctx.typert.register({
    package: '@dsh-control-center/control-center',
    face: 'host',
    schemas: [],
    model: { services: [], events: [], objects: [] },
    invocations: translationRemote.descriptors,
  } satisfies TypertContribution)
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
export { assertSecretSchemaSafe, auditSecretSchema } from './secret-schema.ts'
export type { SecretSchemaViolation } from './secret-schema.ts'
