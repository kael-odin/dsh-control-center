/** Host half of DSH Control Center: compatibility gate and onboarding settings. */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from './settings-ns.ts'
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
import { ExportMatrixService } from './export-matrix.ts'
import dataRemote from './data-remote-client.ts'
import exportMatrixRemote from './export-matrix-remote-client.ts'
import { SystemService } from './system.ts'
import systemRemote from './system-remote-client.ts'
import { TasksService } from './tasks.ts'
import tasksRemote from './tasks-remote-client.ts'
import { LocalModelsService } from './local-models.ts'
import { UpdateService } from './update.ts'
import { CompatService } from './compat-probe.ts'
import { installLogRing } from './log-ring.ts'
import { NotesService } from './notes.ts'
import notesRemote from './notes-remote-client.ts'
import { GatewayService } from './gateway.ts'
import gatewayRemote from './gateway-remote-client.ts'
import { localModelsRemote, updateRemote, compatRemote } from './local-models-remote-client.ts'
import { AgentPresetsService } from './agent-presets.ts'
import agentPresetsRemote from './agent-presets-remote-client.ts'
import { installContextPolicy, type ContextPolicySettings } from './context-policy.ts'
import { ControlCenterSettings } from './settings-store.ts'

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
/** Multi-key slot metadata per provider (values stay in DSH credentials). */
const API_KEYS_NAMESPACE_SETTINGS = settingsNamespace('control-center-api-keys')
/** General settings (developer mode, context management, client id). */
const GENERAL_NAMESPACE_SETTINGS = settingsNamespace('control-center-general')
const KNOWLEDGE_NAMESPACE_SETTINGS = settingsNamespace('control-center-knowledge')
const KNOWLEDGE_SCHEMA = z.object({
  // Cherry 语义：检索自动注入默认开启（仅影响配置了 embedding 的库）。
  autoInject: z.boolean().default(true),
})
const COMPOSER_NAMESPACE_SETTINGS = settingsNamespace('control-center-composer')

const COMPOSER_PHRASE_SCHEMA = z.object({
  label: z.string(),
  text: z.string(),
})

const COMPOSER_SCHEMA = z.object({
  phrases: z.array(COMPOSER_PHRASE_SCHEMA).default([]),
})
const GENERAL_SCHEMA = z.object({
  developerMode: z.boolean().default(false),
  // Cherry 通用·客户端 ID: a stable random install id, generated once on
  // first boot and shown read-only in the General page.
  clientId: z.string().default(''),
  // Cherry chat.context_settings.* projected onto DSH's compaction/pruning policy.
  contextEnabled: z.boolean().default(true),
  contextMaxMessages: z.any().default(null),
  contextToolOutputThreshold: z.number().step(1).min(2_000).default(50_000),
  contextAutoCompress: z.boolean().default(true),
  contextCompressionProvider: z.string().default(''),
  contextCompressionModel: z.string().default(''),
})

const API_KEYS_SCHEMA = z.object({
  providers: z.dict(z.any()).default({}),
})

const MODEL_PREFS_SCHEMA = z.object({
  translationProvider: z.string().default(''),
  translationModel: z.string().default(''),
  paintingProvider: z.string().default(''),
  paintingModel: z.string().default(''),
  // Notes editor AI continuation; empty falls back to the host's agent-default route.
  notesProvider: z.string().default(''),
  notesModel: z.string().default(''),
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
}

const AppearanceSettingsSchema: z<AppearanceSettings> = z.object({
  // Keep in sync with DEFAULT_THEME_OVERRIDES.colorPrimary in
  // client/theme-overrides.ts — the host half never imports client code, so
  // design-tokens.spec.ts asserts the two literals match instead.
  colorPrimary: z.string().default('#8B5CF6'),
  fontFamily: z.string().default(''),
  codeFontFamily: z.string().default(''),
  customCss: z.string().default(''),
})

interface NotificationSettings {
  conversation: boolean
  backup: boolean
  knowledge: boolean
  update: boolean
}

const NotificationSettingsSchema: z<NotificationSettings> = z.object({
  conversation: z.boolean().default(false),
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
  installLogRing(ctx)
  // Self-owned namespace store (0.2.0 removed the settings API) — must mount
  // before any service constructor resolves it via its inject list.
  const cc = new ControlCenterSettings(ctx)
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
  new ExportMatrixService(ctx)
  new SystemService(ctx)
  new TasksService(ctx)
  new LocalModelsService(ctx)
  new UpdateService(ctx)
  new AgentPresetsService(ctx)
  new CompatService(ctx)
  new NotesService(ctx)
  new GatewayService(ctx)
  // Notes tree metadata (starred flags) — registered so the service's
  // settings.update has a schema to merge into.
  cc.register(settingsNamespace('control-center-notes'), z.object({
    starred: z.array(z.string()).default([]),
  }))
  // Gateway config (port + API key) shared by the runtime and the settings page.
  cc.register(settingsNamespace('control-center-gateway'), z.object({
    port: z.number().step(1).min(1).max(65535).default(23333),
    apiKey: z.string().default(''),
  }))
  const generalScope = cc.register(
    GENERAL_NAMESPACE_SETTINGS,
    GENERAL_SCHEMA,
  )
  // 客户端 ID: mint once, never rotate — an empty stored value means first boot.
  try {
    const generalValue = generalScope.get() as { clientId?: string }
    if (typeof generalValue.clientId !== 'string' || generalValue.clientId.length === 0) {
      generalScope.update({ clientId: crypto.randomUUID() })
    }
  } catch { /* crypto unavailable in exotic runtimes; the page shows an empty id */ }
  installContextPolicy(ctx, () => generalScope.get() as ContextPolicySettings)
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
        ...exportMatrixRemote.descriptors,
        ...systemRemote.descriptors,
        ...tasksRemote.descriptors,
        ...localModelsRemote.descriptors,
        ...updateRemote.descriptors,
        ...compatRemote.descriptors,
        ...notesRemote.descriptors,
        ...gatewayRemote.descriptors,
        ...agentPresetsRemote.descriptors
      ]
    }
  ]
  for (const contribution of contributions) ctx.typert.register(contribution)
  cc.register(
    settingsNamespace(ONBOARDING_SETTINGS_NAMESPACE),
    OnboardingSettingsSchema,
  )
  cc.register(
    settingsNamespace(NOTIFICATION_SETTINGS_NAMESPACE),
    NotificationSettingsSchema,
  )
  cc.register(
    settingsNamespace(APPEARANCE_SETTINGS_NAMESPACE),
    AppearanceSettingsSchema,
  )
  cc.register(
    PROVIDER_STASH_NAMESPACE,
    PROVIDER_STASH_SCHEMA,
  )
  cc.register(
    MODEL_PREFS_NAMESPACE_SETTINGS,
    MODEL_PREFS_SCHEMA,
  )
  cc.register(
    COMPOSER_NAMESPACE_SETTINGS,
    COMPOSER_SCHEMA,
  )
  cc.register(
    KNOWLEDGE_NAMESPACE_SETTINGS,
    KNOWLEDGE_SCHEMA,
  )
  cc.register(
    API_KEYS_NAMESPACE_SETTINGS,
    API_KEYS_SCHEMA,
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
export { AgentPresetsService } from './agent-presets.ts'
export { assertSecretSchemaSafe, auditSecretSchema } from './secret-schema.ts'
export type { SecretSchemaViolation } from './secret-schema.ts'
