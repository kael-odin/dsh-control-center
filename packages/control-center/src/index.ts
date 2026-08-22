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
import { ChannelBridgeService } from './channel-bridge.ts'
import channelBridgeRemote from './channel-bridge-remote-client.ts'
import { ModelCheckService } from './model-check.ts'
import { ProvidersService } from './providers.ts'
import providersRemote from './provider-remote-client.ts'
import modelCheckRemote from './model-check-remote-client.ts'
import { FileProcessingService } from './file-processing.ts'
import fileProcessingRemote from './file-processing-remote-client.ts'
import { UsageService } from './usage.ts'
import usageRemote from './usage-remote-client.ts'
import { DataService } from './data.ts'
import dataRemote from './data-remote-client.ts'
import { SystemService } from './system.ts'
import systemRemote from './system-remote-client.ts'
import { TasksService } from './tasks.ts'
import tasksRemote from './tasks-remote-client.ts'
import { LocalModelsService } from './local-models.ts'
import { UpdateService } from './update.ts'
import { localModelsRemote, updateRemote } from './local-models-remote-client.ts'
import { DesktopService } from './desktop.ts'
import desktopRemote from './desktop-remote-client.ts'

const ONBOARDING_SETTINGS_NAMESPACE = 'ui-onboarding'
const NOTIFICATION_SETTINGS_NAMESPACE = 'control-center-notifications'
const APPEARANCE_SETTINGS_NAMESPACE = 'control-center-appearance'
/**
 * Profiles of providers disabled from the Model Services page live here while
 * their `llm-pi-ai` route is unset, so a re-enable restores them verbatim.
 */
const PROVIDER_STASH_NAMESPACE = settingsNamespace('control-center-provider-stash')
const PROVIDER_STASH_SCHEMA = z.object({
  providers: z.dict(z.any()).default({}),
})

/** One fallback route (Cherry `chat.retry.fallback_model_ids`, provider/model split). */
const RETRY_FALLBACK_SCHEMA = z.object({
  provider: z.string().default(''),
  model: z.string().default(''),
})

/**
 * Per-purpose model preferences (快捷/翻译/绘画) plus the Cherry 重试设置 for
 * the 默认模型 page. Retry fields mirror Cherry's chat.retry.* defaults
 * (enabled false, max attempts 3, backoff on, no fallbacks).
 */
export const MODEL_PREFS_NAMESPACE_SETTINGS = settingsNamespace('control-center-model-prefs')
const MODEL_PREFS_SCHEMA = z.object({
  translationProvider: z.string().default(''),
  translationModel: z.string().default(''),
  paintingProvider: z.string().default(''),
  paintingModel: z.string().default(''),
  quickProvider: z.string().default(''),
  quickModel: z.string().default(''),
  retryEnabled: z.boolean().default(false),
  retryMaxAttempts: z.number().step(1).min(1).max(10).default(3),
  retryBackoff: z.boolean().default(true),
  retryFallbacks: z.array(RETRY_FALLBACK_SCHEMA).default([]),
})

interface AppearanceSettings {
  colorPrimary: string
  fontFamily: string
  codeFontFamily: string
  customCss: string
  desktopZoom: number
}

const AppearanceSettingsSchema: z<AppearanceSettings> = z.object({
  colorPrimary: z.string().default('#00b96b'),
  fontFamily: z.string().default(''),
  codeFontFamily: z.string().default(''),
  customCss: z.string().default(''),
  desktopZoom: z.number().min(0.5).max(2).default(1),
})

interface NotificationSettings {
  assistant: boolean
  backup: boolean
  knowledge: boolean
  update: boolean
}

const NotificationSettingsSchema: z<NotificationSettings> = z.object({
  assistant: z.boolean().default(false),
  backup: z.boolean().default(false),
  knowledge: z.boolean().default(false),
  update: z.boolean().default(false),
})

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
  new ModelCheckService(ctx)
  new ChannelBridgeService(ctx)
  new FileProcessingService(ctx)
  new UsageService(ctx)
  new DataService(ctx)
  new SystemService(ctx)
  new TasksService(ctx)
  new LocalModelsService(ctx)
  new UpdateService(ctx)
  new DesktopService(ctx)
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
        ...modelCheckRemote.descriptors,
        ...channelBridgeRemote.descriptors,
        ...fileProcessingRemote.descriptors,
        ...usageRemote.descriptors,
        ...dataRemote.descriptors,
        ...systemRemote.descriptors,
        ...tasksRemote.descriptors,
        ...localModelsRemote.descriptors,
        ...updateRemote.descriptors,
        ...desktopRemote.descriptors
      ]
    }
  ]
  for (const contribution of contributions) ctx.typert.register(contribution)
  ctx.settings.register(
    settingsNamespace(ONBOARDING_SETTINGS_NAMESPACE),
    OnboardingSettingsSchema,
  )
  ctx.settings.register(
    settingsNamespace(NOTIFICATION_SETTINGS_NAMESPACE),
    NotificationSettingsSchema,
  )
  ctx.settings.register(
    settingsNamespace(APPEARANCE_SETTINGS_NAMESPACE),
    AppearanceSettingsSchema,
  )
  ctx.settings.register(
    PROVIDER_STASH_NAMESPACE,
    PROVIDER_STASH_SCHEMA,
  )
  ctx.settings.register(
    MODEL_PREFS_NAMESPACE_SETTINGS,
    MODEL_PREFS_SCHEMA,
  )
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
export { ModelCheckService } from './model-check.ts'
export { ChannelBridgeService } from './channel-bridge.ts'
export type { ChannelBridgeStatus } from './channel-bridge.ts'
export type { ModelCheckResult } from './model-check.ts'
export type * from './provider-types.ts'
export { FileProcessingService } from './file-processing.ts'
export type * from './file-processing-types.ts'
export { UsageService } from './usage.ts'
export type * from './usage-types.ts'
export { DataService } from './data.ts'
export type * from './data-types.ts'
export { SystemService } from './system.ts'
export type * from './system-types.ts'
export { TasksService, cronMatches } from './tasks.ts'
export type * from './tasks-types.ts'
export { LocalModelsService } from './local-models.ts'
export { UpdateService } from './update.ts'
export type * from './local-models-types.ts'
export { DesktopService } from './desktop.ts'
export type * from './desktop-types.ts'
export { assertSecretSchemaSafe, auditSecretSchema } from './secret-schema.ts'
export type { SecretSchemaViolation } from './secret-schema.ts'
