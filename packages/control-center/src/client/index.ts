/** Browser half of DSH Control Center. */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-api-remotes/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { bindSnapshotSelector } from './bind-snapshot.ts'
import { resolveSlotLabel, type HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { SettingsDescribeFace, SettingsSchemaService } from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
// The application workspace seam types ship in the harness source baseline,
// not in the published rc.7 ui-layout — vendor the declaration mirror so the
// build is self-contained (runtime slots still come from the harness).
import type {} from './application-slots.ts'
// 0.1.2: `ctx.slots` / `ctx.sessions` Context augmentations live here.
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '../translation-types.ts'
import type { SettingsWireOp } from '../settings-store.ts'
import type {} from '../settings-store.ts'
import translationRemote from '../translation-remote-client.ts'
import type {} from '../painting-types.ts'
import paintingRemote from '../painting-remote-client.ts'
import { PaintingWorkspace } from './PaintingWorkspace.tsx'
import type { PaintWorkspaceInjected } from './PaintingWorkspace.tsx'
import type {} from '../knowledge-types.ts'
import knowledgeRemote from '../knowledge-remote-client.ts'
import { KnowledgeWorkspace } from './KnowledgeWorkspace.tsx'
import type { KnowledgeWorkspaceInjected } from './KnowledgeWorkspace.tsx'
import { NotesWorkspace } from './NotesWorkspace.tsx'
import type { NotesWorkspaceInjected } from './NotesWorkspace.tsx'
// Type-only: pulls ui-chat's SlotMap merge ('conversation.chat.assistant-actions')
// and ui-session's standard props augmentation into this program.
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
// Type-only: pulls ui-conversation's session-standard augmentation
// (useInput/inputActions) and the composer input slots into this program.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { AssistantMessageActions, type AssistantMessageActionsServices } from './AssistantMessageActions.tsx'
import { QuickPhrasesButton, type ComposerSettingsFace } from './QuickPhrasesButton.tsx'
import { InputHistoryButton } from './InputHistoryButton.tsx'
import { MessageSearchButton } from './MessageSearchButton.tsx'
import type { SessionHistoryFace } from './input-history.ts'
import { KnowledgeChipButton, type KnowledgeChipKnowledgeFace } from './KnowledgeChipButton.tsx'
import { msgActionsZh, msgActionsEn, type MsgActionsKey } from './msgactions-locales.ts'
import { CHERRY_12_LOCALES } from './i18n-12.ts'
import type {} from '../skills-types.ts'
import skillsRemote from '../skills-remote-client.ts'
import { SkillsSection } from './SkillsSection.tsx'
import type {} from '../provider-types.ts'
import type {} from '../model-check.ts'
import providersRemote from '../provider-remote-client.ts'
import modelCheckRemote from '../model-check-remote-client.ts'
import { ProviderDirectorySection } from './ProviderDirectorySection.tsx'
import type { ProviderDirectorySectionInjected } from './ProviderDirectorySection.tsx'
import type {} from '../mcp-types.ts'
import mcpRemote from '../mcp-remote-client.ts'
import type {} from '../mcp-types.ts'
import { McpSection } from './McpSection.tsx'
import type {} from '../websearch-types.ts'
import websearchRemote from '../websearch-remote-client.ts'
import { WebSearchSection } from './WebSearchSection.tsx'
import type { WebSearchSectionInjected } from './WebSearchSection.tsx'
import type {} from '../file-processing-types.ts'
import fileProcessingRemote from '../file-processing-remote-client.ts'
import { ProcessorSection } from './ProcessorSection.tsx'
import type {} from '../usage-types.ts'
import usageRemote from '../usage-remote-client.ts'
import { UsageSection } from './UsageSection.tsx'
import type { UsageSectionInjected } from './UsageSection.tsx'
import type {} from '../data-types.ts'
import dataRemote from '../data-remote-client.ts'
import exportMatrixRemote from '../export-matrix-remote-client.ts'
import { DataSection } from './DataSection.tsx'
import type { DataSectionInjected } from './DataSection.tsx'
import type {} from '../system-types.ts'
import systemRemote from '../system-remote-client.ts'
import { AboutSection, DependenciesSection } from './SystemSection.tsx'
import type { SystemSectionInjected } from './SystemSection.tsx'
import type {} from '../tasks-types.ts'
import tasksRemote from '../tasks-remote-client.ts'
import { TasksSection } from './TasksSection.tsx'
import type { TasksSectionInjected } from './TasksSection.tsx'
import type {} from '../local-models-types.ts'
import { localModelsRemote, updateRemote } from '../local-models-remote-client.ts'
import channelBridgeRemote from '../channel-bridge-remote-client.ts'
import agentPresetsRemote from '../agent-presets-remote-client.ts'
import settingsRemote from '../settings-remote-client.ts'
import { LocalModelsSection } from './LocalModelsSection.tsx'
import { ApiGatewaySection } from './ApiGatewaySection.tsx'
import type { ApiGatewaySectionInjected } from './ApiGatewaySection.tsx'
import type { LocalModelsSectionInjected } from './LocalModelsSection.tsx'
import { UpdateSection } from './UpdateSection.tsx'
import type { UpdateSectionInjected } from './UpdateSection.tsx'
import { CapabilityGateSection } from './CapabilityGateSection.tsx'
import type { CapabilityGateSectionProps } from './CapabilityGateSection.tsx'
import { SettingsRoot } from './SettingsRoot.tsx'
import type { SettingsOnboardingStep, SettingsRootInjected, SettingsSectionRow } from './shell-contract.ts'
import { CloseLabel, HeaderContent, TriggerContent } from './chrome.tsx'
import { GeneralSection } from './GeneralSection.tsx'
import { GeneralCherrySettings } from './GeneralCherrySettings.tsx'
import type { GeneralCherrySettingsInjected } from './GeneralCherrySettings.tsx'
import { AppearanceSection } from './AppearanceSection.tsx'
import type { AppearanceSectionInjected } from './AppearanceSection.tsx'
import { NotificationSection, type NotificationSectionInjected } from './NotificationSection.tsx'
import { ConversationNotificationRuntime, NOTIFICATION_SETTINGS_NAMESPACE } from './notification-runtime.ts'
import { ShortcutSection } from './ShortcutSection.tsx'
import { ChannelsSection } from './ChannelsSection.tsx'
import type { ChannelsSectionInjected, ChannelBridgeHandle, AgentPresetsRemote } from './ChannelsSection.tsx'
import { ChannelsStore } from './channels-store.ts'
import { GeneralSettingsStore } from './general-store.ts'
import { SettingsDocumentAction } from './SettingsDocumentAction.tsx'
import type { SettingsDocumentActionInjected } from './SettingsDocumentAction.tsx'
import { refreshDocumentIfLoaded, SettingsDocumentStore } from './settings-document-store.ts'
import { en as shellEn, zh as shellZh, type SettingsKey } from './shell-locales.ts'
import { ModelsSection } from './ModelsSection.tsx'
import type { ModelsSectionInjected } from './ModelsSection.tsx'
import { DeepSeekOnboardingDialog } from './DeepSeekOnboardingDialog.tsx'
import type { DeepSeekOnboardingInjected } from './DeepSeekOnboardingDialog.tsx'
import { WelcomeNotice } from './WelcomeNotice.tsx'
import type { WelcomeNoticeInjected } from './WelcomeNotice.tsx'
import { refreshWelcomeIfLoaded, WelcomeNoticeStore } from './welcome-store.ts'
import { ModelsSettingsStore } from './store.ts'
import { ModelSelectionStore } from './ModelSelectionPanel.tsx'
import { ModelPrefsStore } from './model-prefs-store.ts'
import { createSettingsSchemaOperations } from './schema-operations.ts'
import { en as modelsEn, zh as modelsZh, type ModelsKey } from './locales.ts'
import { en as websearchEn, zh as websearchZh, type WebSearchKey } from './websearch-locales.ts'
import { WELCOME_NOTICE_SETTINGS_NAMESPACE } from '../onboarding-copy.ts'
import { ProductWorkspaceNavItem } from './ProductWorkspaceNavItem.tsx'
import { ProductWorkspaceSurface } from './ProductWorkspaceSurface.tsx'
import { TranslationWorkspace } from './TranslationWorkspace.tsx'
import type { ProductWorkspaceId } from './product-workspace-contract.ts'

export type { ModelsSettingsState, ProviderRow } from './store.ts'
export type { ModelSelectionState } from './ModelSelectionPanel.tsx'

const SHELL_NS = 'control-center'
const MODELS_NS = 'control-center.models'
const MSGACTIONS_NS = 'control-center.msgactions'
const WEBSEARCH_NS = 'control-center.websearch'
const KNOWN_NATIVE = new Set(['general', 'agent-presets', 'plugins'])

/** Cherry settings group mapping: models are core, capabilities/personal get
 * their own groups, DSH-owned sections stay native. */
function groupOf(id: string): SettingsSectionRow['group'] {
  if (id === 'models' || id === 'providers' || id === 'local-models' || id === 'api-gateway') return 'core'
  if (id === 'general') return 'personal'
  if (id === 'skills' || id === 'mcp' || id === 'websearch' || id === 'file-processing' || id === 'ocr') return 'capabilities'
  if (id === 'usage' || id === 'data' || id === 'appearance' || id === 'notifications') return 'personal'
  if (id === 'about' || id === 'dependencies') return 'system'
  if (id === 'tasks' || id === 'shortcuts' || id === 'quick-assistant' || id === 'selection-assistant' || id === 'screenshot' || id === 'channels') return 'automation'
  if (id === 'update') return 'system'
  if (KNOWN_NATIVE.has(id)) return 'native'
  return 'other'
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'control-center': SettingsKey
    'control-center.models': ModelsKey
    'control-center.websearch': WebSearchKey
    'control-center.msgactions': MsgActionsKey
  }
}

// 0.1.6: typert mounts each Remote namespace as its own `remote.<ns>` service;
// every namespace this half touches must be declared here or the proxy refuses
// the property read ("cannot get property ... without inject").
export const inject = ['slots', 'locale', 'connection', 'remote', 'remote.settings', 'remote.llm', 'remote.credentials', 'remote.session', 'remote.agentPresets', 'remote.controlCenterExport', 'remote.controlCenterSettings', 'sessions', 'settingsScope', 'settingsSchema']


/**
 * One-shot readiness gate for the Remote namespaces. All controlCenter*
 * contributions mount in a single effect, so every per-remote ready source
 * flips at the same instant; the gate replaces the previous 25ms polling
 * probes with direct subscription on the settle event.
 */
function readyGate(): { source: HostObservable<boolean>; settle: () => void } {
  let settled = false
  const listeners = new Set<() => void>()
  return {
    source: {
      getSnapshot: () => settled,
      subscribe: (listener) => {
        if (settled) { queueMicrotask(listener); return () => {} }
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      },
    },
    settle: () => {
      if (settled) return
      settled = true
      // Direct Set iteration, not a snapshot: a listener unsubscribing during
      // the settle pass is skipped when not yet visited, and Set handles
      // deletion of the current/pending entries during iteration.
      for (const listener of listeners) listener()
    },
  }
}

  const remoteReadyGate = readyGate()
/** Register the settings shell, Provider/Model page, and onboarding steps. */
export function apply(ctx: ClientContext): void {
  const remote = ctx.remote
  // Plugin-owned namespaces ride the controlCenterSettings store (0.2.0 moved
  // them off the settings wire). The face is lazy: remotes mount in one effect
  // after apply() returns, but stores below are constructed synchronously.
  let ccSettings: NonNullable<typeof remote.controlCenterSettings> | undefined
  const ccSettingsFace = {
    describe: () => {
      if (ccSettings === undefined) throw new Error('controlCenterSettings Remote namespace is not mounted')
      return ccSettings.describe()
    },
    mutate: (ns: string, ops: ReadonlyArray<SettingsWireOp>, expectedRevision: number | undefined) => {
      if (ccSettings === undefined) throw new Error('controlCenterSettings Remote namespace is not mounted')
      return ccSettings.mutate(ns, ops, expectedRevision)
    },
  }
  let translation: NonNullable<typeof remote.controlCenterTranslation> | undefined
  const translationReadySource = remoteReadyGate.source
  let painting: NonNullable<typeof remote.controlCenterPainting> | undefined
  const paintingReadySource = remoteReadyGate.source
  let knowledge: NonNullable<typeof remote.controlCenterKnowledge> | undefined
  const knowledgeReadySource = remoteReadyGate.source
  let modelCheck: NonNullable<typeof remote.controlCenterModelCheck> | undefined
  let skills: NonNullable<typeof remote.controlCenterSkills> | undefined
  let mcp: NonNullable<typeof remote.controlCenterMcp> | undefined
  let websearch: NonNullable<typeof remote.controlCenterWebSearch> | undefined
  let fileProcessing: NonNullable<typeof remote.controlCenterFileProcessing> | undefined
  let usage: NonNullable<typeof remote.controlCenterUsage> | undefined
  let data: NonNullable<typeof remote.controlCenterData> | undefined
  let system: NonNullable<typeof remote.controlCenterSystem> | undefined
  let tasks: NonNullable<typeof remote.controlCenterTasks> | undefined
  let localModels: NonNullable<typeof remote.controlCenterLocalModels> | undefined
  let update: NonNullable<typeof remote.controlCenterUpdate> | undefined
  const localModelsReadySource = remoteReadyGate.source
  const updateReadySource = remoteReadyGate.source
  const alwaysReadySource: HostObservable<boolean> = {
    getSnapshot: () => true,
    subscribe: () => () => {},
  }
  const tasksReadySource = remoteReadyGate.source
  const systemReadySource = remoteReadyGate.source
  const usageReadySource = remoteReadyGate.source
  const dataReadySource = remoteReadyGate.source
  const exportReadySource = remoteReadyGate.source
  ctx.effect(async () => {
    // The client Remote registry keys contributions by package, so every
    // namespace must be mounted through one merged contribution.
    const controlCenterRemote: typeof translationRemote = {
      package: '@dsh-control-center/control-center',
      descriptors: [
        ...channelBridgeRemote.descriptors,
        ...translationRemote.descriptors,
        ...paintingRemote.descriptors,
        ...knowledgeRemote.descriptors,
        ...skillsRemote.descriptors,
        ...providersRemote.descriptors,
        ...modelCheckRemote.descriptors,
        ...mcpRemote.descriptors,
        ...websearchRemote.descriptors,
        ...fileProcessingRemote.descriptors,
        ...usageRemote.descriptors,
        ...dataRemote.descriptors,
        ...exportMatrixRemote.descriptors,
        ...systemRemote.descriptors,
        ...tasksRemote.descriptors,
        ...localModelsRemote.descriptors,
        ...updateRemote.descriptors,
        ...agentPresetsRemote.descriptors,
        ...settingsRemote.descriptors
      ],
    }
    const dispose = await remote.$mount(controlCenterRemote)
    translation = ctx.get('remote.controlCenterTranslation') as NonNullable<typeof remote.controlCenterTranslation>
    painting = ctx.get('remote.controlCenterPainting') as NonNullable<typeof remote.controlCenterPainting>
    knowledge = ctx.get('remote.controlCenterKnowledge') as NonNullable<typeof remote.controlCenterKnowledge>
    modelCheck = ctx.get('remote.controlCenterModelCheck') as NonNullable<typeof remote.controlCenterModelCheck>
    skills = ctx.get('remote.controlCenterSkills') as NonNullable<typeof remote.controlCenterSkills>
    mcp = ctx.get('remote.controlCenterMcp') as NonNullable<typeof remote.controlCenterMcp>
    websearch = ctx.get('remote.controlCenterWebSearch') as NonNullable<typeof remote.controlCenterWebSearch>
    fileProcessing = ctx.get('remote.controlCenterFileProcessing') as NonNullable<typeof remote.controlCenterFileProcessing>
    usage = ctx.get('remote.controlCenterUsage') as NonNullable<typeof remote.controlCenterUsage>
    data = ctx.get('remote.controlCenterData') as NonNullable<typeof remote.controlCenterData>
    system = ctx.get('remote.controlCenterSystem') as NonNullable<typeof remote.controlCenterSystem>
    tasks = ctx.get('remote.controlCenterTasks') as NonNullable<typeof remote.controlCenterTasks>
    localModels = ctx.get('remote.controlCenterLocalModels') as NonNullable<typeof remote.controlCenterLocalModels>
    update = ctx.get('remote.controlCenterUpdate') as NonNullable<typeof remote.controlCenterUpdate>
    channelBridge = ctx.get('remote.controlCenterChannelBridge') as NonNullable<typeof remote.controlCenterChannelBridge>
    ccSettings = ctx.get('remote.controlCenterSettings') as NonNullable<typeof remote.controlCenterSettings>
    remoteReadyGate.settle()
    return dispose
  }, 'control-center: control-center Remote namespaces')
  ctx.effect(() => ctx.locale.register(SHELL_NS, { zh: shellZh, en: shellEn }), 'control-center: shell dictionaries')
  ctx.effect(() => ctx.locale.register(MODELS_NS, { zh: modelsZh, en: modelsEn }), 'control-center: model dictionaries')
  ctx.effect(() => ctx.locale.register(WEBSEARCH_NS, { zh: websearchZh, en: websearchEn }), 'control-center: web search dictionaries')
  ctx.effect(() => ctx.locale.register(MSGACTIONS_NS, { zh: msgActionsZh, en: msgActionsEn }), 'control-center: msgactions dictionaries')
  ctx.effect(() => {
    const disposers: Array<() => void> = []
    for (const { id, label, fallback } of CHERRY_12_LOCALES) {
      if (id === 'zh' || id === 'en' || id === 'zh-CN') continue
      try { disposers.push(ctx.locale.addLanguage({ id, label, fallback })) } catch { /* already registered */ }
      for (const [ns, dict] of [[SHELL_NS, shellZh], [MODELS_NS, modelsZh], [WEBSEARCH_NS, websearchZh], [MSGACTIONS_NS, msgActionsZh]] as const) {
        try { disposers.push(ctx.locale.register(ns, id, dict as Record<string, string>)) } catch { /* already registered */ }
      }
    }
    return () => { for (const dispose of disposers) try { dispose() } catch { /* ignore */ } }
  }, 'control-center: 12-locale packs (Cherry 12 → DSH addLanguage)')
  const shellT = ctx.locale.bind(SHELL_NS)
  const modelT = ctx.locale.bind(MODELS_NS) as ModelsSectionInjected['t']
  const websearchT = ctx.locale.bind(WEBSEARCH_NS) as (key: WebSearchKey) => string
  const msgActionsT = ctx.locale.bind(MSGACTIONS_NS) as (key: MsgActionsKey) => string
  const connection = ctx.get('connection') as ConnectionHandle
  const settingsScope = ctx.get('settingsScope') as SettingsDescribeFace
  const settingsSchema = ctx.get('settingsSchema') as SettingsSchemaService
  const schema = createSettingsSchemaOperations(settingsSchema)
  // 0.2.0: the settingsScope is an observable mirror face; the store consumes it directly.
  const settingsMirror = settingsScope

  const documentController = connection.isLoopback ? new SettingsDocumentStore(ctx.remote) : undefined
  const documentInjected = documentController === undefined
    ? undefined
    : (() => {
        const useSnapshot = bindSnapshotSelector(documentController.store)
        return (): SettingsDocumentActionInjected => ({ controller: documentController, useSnapshot })
      })()

  const modelsController = new ModelsSettingsStore(ctx.remote, schema, settingsMirror)
  const useModels = bindSnapshotSelector(modelsController.store)
  // The Model Services (provider directory) page shares the same provider/
  // settings/credential join; a second store keeps the two pages' loads and
  // refresh triggers independent.
  const providerDirectoryController = new ModelsSettingsStore(ctx.remote, schema, settingsMirror)
  const useProviderDirectory = bindSnapshotSelector(providerDirectoryController.store)
  const selectionController = new ModelSelectionStore(ctx.remote, schema)
  const useSelection = bindSnapshotSelector(selectionController.store)
  const prefsController = new ModelPrefsStore(ccSettingsFace, ctx.remote, schema)
  const usePrefs = bindSnapshotSelector(prefsController.store)
  const channelsController = new ChannelsStore(ccSettingsFace)
  const useChannels = bindSnapshotSelector(channelsController.store)
  let channelBridge: NonNullable<typeof remote.controlCenterChannelBridge> | undefined
  const welcomeController = new WelcomeNoticeStore(ccSettingsFace, connection.isLoopback ? 'host' : 'memory')
  const generalController = new GeneralSettingsStore(ccSettingsFace, schema)
  const useGeneral = bindSnapshotSelector(generalController.store)
  ctx.effect(() => { void generalController.load(); return () => undefined }, 'control-center: general load')
  const notificationRuntime = new ConversationNotificationRuntime(
    ccSettingsFace,
    ctx.sessions.list as unknown as HostObservable<SessionListState>,
  )
  ctx.effect(() => notificationRuntime.start(), 'control-center: conversation notifications')
  ctx.effect(() => { void prefsController.load(); return () => undefined }, 'control-center: model prefs load')
  ctx.effect(() => { void channelsController.load(); return () => undefined }, 'control-center: channels load')

  let rowsVersion = -1
  let rowsRevision = -1
  let rows: readonly SettingsSectionRow[] = []
  let onboardingVersion = -1
  let onboardingSteps: readonly SettingsOnboardingStep[] = []
  const shellInjected = (): SettingsRootInjected => ({
    labels: {
      core: shellT('coreGroup'),
      capabilities: shellT('capabilitiesGroup'),
      personal: shellT('personalGroup'),
      native: shellT('nativeGroup'),
      system: shellT('systemGroup'),
      automation: shellT('automationGroup'),
      other: shellT('otherGroup'),
    },
    hooks: {
      sections: {
        getSnapshot: () => {
          const version = ctx.slots.getVersion('settings.section')
          const revision = ctx.locale.getSnapshot().revision
          if (version !== rowsVersion || revision !== rowsRevision) {
            rowsVersion = version
            rowsRevision = revision
            rows = ctx.slots.entries('settings.section')
              .map(entry => ({
                id: entry.options.id ?? '',
                order: entry.options.order ?? 0,
                label: resolveSlotLabel(entry.options.label) ?? '',
                group: groupOf(entry.options.id ?? ''),
              }))
              .sort((left, right) => left.order - right.order)
              .filter((row, index, all) => all.findIndex(seen => seen.id === row.id) === index)
          }
          return rows
        },
        subscribe: (listener) => {
          const offSlots = ctx.slots.subscribe('settings.section', listener)
          const offLocale = ctx.locale.subscribe(listener)
          return () => { offSlots(); offLocale() }
        },
      },
      onboardingSteps: {
        getSnapshot: () => {
          const version = ctx.slots.getVersion('settings.onboarding')
          if (version !== onboardingVersion) {
            onboardingVersion = version
            onboardingSteps = ctx.slots.entries('settings.onboarding')
              .map(entry => ({ id: entry.options.id ?? '', order: entry.options.order ?? 0 }))
              .sort((left, right) => left.order - right.order)
          }
          return onboardingSteps
        },
        subscribe: listener => ctx.slots.subscribe('settings.onboarding', listener),
      },
      sessions: ctx.sessions.list as unknown as HostObservable<SessionListState>,
    },
  })

  const modelSelection = {
    controller: selectionController,
    useSnapshot: useSelection,
    useSessions: bindSnapshotSelector(ctx.sessions.list as unknown as HostObservable<SessionListState>) as unknown as (<T>(selector: (state: SessionListState) => T) => T),
    load: (sessionId: SessionId | undefined, addressed: boolean) => { void selectionController.load(sessionId, addressed) },
    t: modelT,
    schema,
  }
  const modelsInjected = (): ModelsSectionInjected => ({
    controller: modelsController,
    useSnapshot: useModels,
    prefsController,
    usePrefsSnapshot: usePrefs,
    api: ctx.remote,
    modelSelection,
    schema,
    t: modelT,
  })
  const skillsInjected = () => ({
    skills: skills!,
  })
  const modelCheckInjected = (): { getCheck: () => {
    check(provider: string, model: string): Promise<
      { ok: true; value: { ok: boolean; latencyMs?: number | undefined; reply?: string | undefined; error?: string | undefined } }
      | { ok: false; error: { code: string; message: string; details: object } }
    >
  } | undefined } => ({
    getCheck: () => modelCheck,
  })
  const providerDirectoryInjected = (): ProviderDirectorySectionInjected => ({
    controller: providerDirectoryController,
    useSnapshot: useProviderDirectory,
    api: ctx.remote,
    schema,
    t: modelT,
    getCheck: modelCheckInjected().getCheck,
  })
  const mcpInjected = () => ({
    mcp: mcp!,
  })
  const websearchInjected = (): WebSearchSectionInjected => ({
    websearch: websearch!,
    t: websearchT,
  })
  const deepSeekOnboardingInjected = (): DeepSeekOnboardingInjected => ({
    controller: modelsController,
    hooks: { models: modelsController.store },
    api: ctx.remote,
    schema,
    t: modelT,
  })
  const welcomeInjected = (): WelcomeNoticeInjected => ({
    controller: welcomeController,
    hooks: { welcome: welcomeController.store },
    t: modelT,
  })

  ctx.effect(() => ctx.on('connection/reset', () => {
    refreshDocumentIfLoaded(documentController)
    refreshIfLoaded(modelsController)
    refreshWelcomeIfLoaded(welcomeController)
    // 0.2.0: SessionListState no longer carries the view-layer current-session
    // binding. Re-sync the future-default selection; the current-session
    // override rebinds when the binding source lands (upgrade note in PORT-0.2.0.md).
    void selectionController.load(undefined, false)
  }), 'control-center: connection invalidations')

  ctx.effect(() => {
    const refreshModels = (): void => { refreshIfLoaded(modelsController) }
    const disposers = [
      ctx.remote.$on('settings/document-updated', (namespace) => {
        refreshModels()
        if (prefsController.store.getSnapshot().status !== 'idle') void prefsController.load()
        if (channelsController.store.getSnapshot().status !== 'idle') void channelsController.load()
        if (namespace === WELCOME_NOTICE_SETTINGS_NAMESPACE) refreshWelcomeIfLoaded(welcomeController)
        if (namespace === NOTIFICATION_SETTINGS_NAMESPACE) void notificationRuntime.refreshPreferences()
      }),
      ctx.remote.$on('credentials/reference-updated', refreshModels),
      ctx.remote.$on('llm/adapters-updated', refreshModels),
    ]
    return () => { for (const dispose of disposers) dispose() }
  }, 'control-center: pushed invalidations')

  const workspaceRows: ReadonlyArray<{
    id: ProductWorkspaceId
    order: number
    label: SettingsKey
    description: SettingsKey
  }> = [
    { id: 'translation', order: 0, label: 'workspaceTranslation', description: 'workspaceTranslationDescription' },
    { id: 'painting', order: 10, label: 'workspacePainting', description: 'workspacePaintingDescription' },
    { id: 'knowledge', order: 20, label: 'workspaceKnowledge', description: 'workspaceKnowledgeDescription' },
    { id: 'notes', order: 30, label: 'workspaceNotes', description: 'workspaceNotesDescription' },
    // 'repo' (Code CLI detection) was mounted once and deliberately withdrawn:
    // user feedback judged it noise for this product's scope.
  ]
  for (const workspace of workspaceRows) {
    ctx.slots.inject('application.navigation', () => ctx.slots.register({
      name: 'application.navigation',
      id: workspace.id,
      order: workspace.order,
      label: () => shellT(workspace.label),
      inject: () => ({ id: workspace.id, label: shellT(workspace.label) }),
    }, ProductWorkspaceNavItem))
    if (workspace.id === 'translation') {
      ctx.slots.inject('application.surface', () => ctx.slots.register({
        name: 'application.surface',
        key: 'translation',
        inject: () => ({
          getTranslation: () => {
            if (translation === undefined) throw new Error('translation Remote namespace is not mounted')
            return translation
          },
          hooks: { translationReady: translationReadySource },
          useModelPref: () => usePrefs(state => state),
          listModels: async () => {
            const result = await ctx.remote.session.modelCatalog()
            if (!result.ok) throw new Error(result.error.message)
            return result.value.groups
          },
        }),
      }, TranslationWorkspace))
    } else if (workspace.id === 'painting') {
      ctx.slots.inject('application.surface', () => ctx.slots.register({
        name: 'application.surface',
        key: 'painting',
        inject: (): PaintWorkspaceInjected => ({
          getPainting: () => {
            if (painting === undefined) throw new Error('painting Remote namespace is not mounted')
            return painting
          },
          hooks: { paintingReady: paintingReadySource },
          useModelPref: () => usePrefs(state => state),
        }),
      }, PaintingWorkspace))
    } else if (workspace.id === 'knowledge') {
      ctx.slots.inject('application.surface', () => ctx.slots.register({
        name: 'application.surface',
        key: 'knowledge',
        inject: (): KnowledgeWorkspaceInjected => ({
          getKnowledge: () => {
            if (knowledge === undefined) throw new Error('knowledge Remote namespace is not mounted')
            return knowledge
          },
          hooks: { knowledgeReady: knowledgeReadySource },
          listModels: async () => {
            const result = await ctx.remote.session.modelCatalog()
            if (!result.ok) throw new Error(result.error.message)
            return result.value.groups
          },
        }),
      }, KnowledgeWorkspace))
    } else if (workspace.id === 'notes') {
      ctx.slots.inject('application.surface', () => ctx.slots.register({
        name: 'application.surface',
        key: 'notes',
        inject: (): NotesWorkspaceInjected => ({
          notes: ctx.get('remote.controlCenterNotes') as NotesWorkspaceInjected['notes'],
        }),
      }, NotesWorkspace))
    } else {
      ctx.slots.inject('application.surface', () => ctx.slots.register({
        name: 'application.surface',
        key: workspace.id,
        inject: () => ({
          id: workspace.id,
          title: shellT(workspace.label),
          description: shellT(workspace.description),
          closeLabel: shellT('workspaceBack'),
        }),
      }, ProductWorkspaceSurface))
    }
  }

  // Cherry parity: 存为笔记 / 存入知识库 actions on each finalized assistant
  // message (Phase 1.1). The text comes from one follow-shot over the session's
  // opening window; the newest assistant message is the row's own message.
  const readAssistantText = async (sessionId: SessionId): Promise<string | undefined> => {
    const controller = new AbortController()
    try {
      for await (const frame of ctx.remote.session.follow(
        { address: { kind: 'session', sessionId }, maxMessages: 8 },
        controller.signal,
      )) {
        if (frame.type !== 'snapshot') continue
        for (let index = frame.records.length - 1; index >= 0; index--) {
          const record = frame.records[index]
          if (record === undefined || record.type !== 'event' || record.event.type !== 'assistant/message') continue
          const blocks = (record.event.data as { message?: { content?: unknown } }).message?.content
          if (!Array.isArray(blocks)) continue
          const text = blocks
            .map(block => typeof block === 'object' && block !== null && (block as { type?: unknown }).type === 'text'
              && typeof (block as { text?: unknown }).text === 'string'
              ? (block as { text: string }).text
              : '')
            .join('\n\n')
            .trim()
          if (text.length > 0) return text
        }
        return undefined
      }
      return undefined
    } catch {
      return undefined
    } finally {
      controller.abort()
    }
  }
  const msgActionsServices = (): AssistantMessageActionsServices => ({
    // Same lazy resolution the notes workspace uses: the namespace is addressable
    // once the Remote registry mounts; the actions only call it on click.
    getNotes: () => ctx.get('remote.controlCenterNotes') as unknown as ReturnType<AssistantMessageActionsServices['getNotes']>,
    getKnowledge: () => ctx.get('remote.controlCenterKnowledge') as unknown as ReturnType<AssistantMessageActionsServices['getKnowledge']>,
    getTranslation: () => ctx.get('remote.controlCenterTranslation') as unknown as ReturnType<AssistantMessageActionsServices['getTranslation']>,
    getExportMatrix: () => ctx.get('remote.controlCenterExport') as unknown as ReturnType<AssistantMessageActionsServices['getExportMatrix']>,
    resolveTranslationRoute: async () => {
      // Cherry's per-purpose model prefs first (翻译模型), then the agent default.
      const described = await ctx.remote.settings.describe()
      if (described.ok) {
        const prefs = described.value.namespaces.find(view => view.ns === 'control-center-model-prefs')
        const prefsValue = prefs?.value as { translationProvider?: unknown; translationModel?: unknown } | undefined
        let provider = typeof prefsValue?.translationProvider === 'string' ? prefsValue.translationProvider : ''
        let model = typeof prefsValue?.translationModel === 'string' ? prefsValue.translationModel : ''
        if (provider.length === 0 || model.length === 0) {
          const fallback = described.value.namespaces.find(view => view.ns === 'agent-default-model')
          const fallbackValue = fallback?.value as { provider?: unknown; model?: unknown } | undefined
          if (provider.length === 0 && typeof fallbackValue?.provider === 'string') provider = fallbackValue.provider
          if (model.length === 0 && typeof fallbackValue?.model === 'string') model = fallbackValue.model
        }
        if (provider.length > 0 && model.length > 0) return { provider, model }
      }
      throw new Error(msgActionsT('noTranslateRoute'))
    },
    readAssistantText,
    readLastUserText: async (sessionId) => {
      const controller = new AbortController()
      try {
        for await (const frame of ctx.remote.session.follow(
          { address: { kind: 'session', sessionId }, maxMessages: 8 },
          controller.signal,
        )) {
          if (frame.type !== 'snapshot') continue
          for (let index = frame.records.length - 1; index >= 0; index--) {
            const record = frame.records[index]
            if (record === undefined || record.type !== 'event' || record.event.type !== 'user/message') continue
            const blocks = (record.event.data as { message?: { content?: unknown } }).message?.content
            if (!Array.isArray(blocks)) continue
            const text = blocks
              .map(block => typeof block === 'object' && block !== null && (block as { type?: unknown }).type === 'text'
                && typeof (block as { text?: unknown }).text === 'string'
                ? (block as { text: string }).text
                : '')
              .join('\n\n')
              .trim()
            if (text.length > 0) return text
          }
          return undefined
        }
        return undefined
      } catch {
        return undefined
      } finally {
        controller.abort()
      }
    },
    forkSession: async (sessionId) => {
      const forked = await (ctx.sessions as unknown as { fork: (opts: { sessionId: SessionId; atSeq?: number; increaseTitle?: boolean }) => Promise<SessionId>; open: (id: SessionId) => void }).fork({ sessionId, increaseTitle: true })
      ;(ctx.sessions as unknown as { open: (id: SessionId) => void }).open(forked)
      return forked
    },
    queuePrompt: async (sessionId, text) => {
      const binding = (ctx.sessions as unknown as { binding: (id: SessionId) => { session: { prompt: (content: readonly { type: 'text'; text: string }[], mode: 'queue' | 'steer') => Promise<{ ok: boolean; error?: { message: string } }> } } | undefined }).binding(sessionId)
      if (binding === undefined) throw new Error('Session binding is unavailable')
      const result = await binding.session.prompt([{ type: 'text', text }], 'queue')
      if (!result.ok) throw new Error((result as unknown as { error: { message: string } }).error.message)
      return { accepted: true as const }
    },
  })
  // 快捷短语: Cherry composer parity, first increment — an ⚡ entry in the
  // composer's right zone listing user phrases (control-center-composer
  // namespace) that append to the draft through inputActions.setDraft.
  // @知识库 chip: list the deployment's knowledge bases and insert an
  // annotation naming the base plus the knowledge_retrieve tool call.
  ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right',
    id: 'control-center.knowledge-chip',
    locale: MSGACTIONS_NS,
    inject: () => ({
      getKnowledge: () => ctx.get('remote.controlCenterKnowledge') as unknown as KnowledgeChipKnowledgeFace,
    }),
  }, KnowledgeChipButton))
  ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right',
    id: 'control-center.quick-phrases',
    locale: MSGACTIONS_NS,
    inject: () => ({
      settings: ctx.remote.settings as unknown as ComposerSettingsFace,
    }),
  }, QuickPhrasesButton))
  ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
    name: 'conversation.input.left',
    id: 'control-center.message-search',
    locale: MSGACTIONS_NS,
  }, MessageSearchButton))
  ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right',
    id: 'control-center.input-history',
    locale: MSGACTIONS_NS,
    inject: () => ({
      history: ctx.remote.session as unknown as SessionHistoryFace,
    }),
  }, InputHistoryButton))
  ctx.slots.inject('conversation.chat.assistant-actions', () => ctx.slots.register({
    name: 'conversation.chat.assistant-actions',
    id: 'control-center.message-actions',
    locale: MSGACTIONS_NS,
    inject: msgActionsServices,
  }, AssistantMessageActions))
  ctx.slots.inject('sidebar.settings', () => ctx.slots.register({
    name: 'sidebar.settings',
    children: {
      'settings.trigger': { kind: 'single', scope: 'root' },
      'settings.header': { kind: 'single', scope: 'root' },
      'settings.action': { kind: 'list', scope: 'root' },
      'settings.close': { kind: 'single', scope: 'root' },
      'settings.section': { kind: 'list', scope: 'root' },
      'settings.onboarding': { kind: 'list', scope: 'root' },
    },
    inject: shellInjected,
  }, SettingsRoot))
  ctx.slots.inject('settings.trigger', () => ctx.slots.register({ name: 'settings.trigger', locale: SHELL_NS }, TriggerContent))
  ctx.slots.inject('settings.header', () => ctx.slots.register({ name: 'settings.header', locale: SHELL_NS }, HeaderContent))
  if (documentInjected !== undefined) {
    ctx.slots.inject('settings.action', () => ctx.slots.register({
      name: 'settings.action', id: 'open-document', order: 0, locale: SHELL_NS, inject: documentInjected,
    }, SettingsDocumentAction))
  }
  ctx.slots.inject('settings.close', () => ctx.slots.register({ name: 'settings.close', locale: SHELL_NS }, CloseLabel))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'general',
    order: 0,
    label: () => shellT('generalNav'),
    locale: SHELL_NS,
    children: { 'settings.general.item': { kind: 'list', scope: 'root' } },
  }, GeneralSection))
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'control-center-general',
    order: 0,
    inject: (): GeneralCherrySettingsInjected => ({
      controller: generalController,
      useSnapshot: useGeneral,
      t: modelT as GeneralCherrySettingsInjected['t'],
    }),
  }, GeneralCherrySettings))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: 'models', order: 2, label: () => modelT('nav'), inject: modelsInjected,
  }, ModelsSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'skills',
    order: 11,
    label: () => shellT('skillsNav'),
    inject: skillsInjected,
  }, SkillsSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'providers',
    order: 1,
    label: () => shellT('providersNav'),
    inject: providerDirectoryInjected,
  }, ProviderDirectorySection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'mcp',
    order: 10,
    label: () => 'MCP',
    inject: mcpInjected,
  }, McpSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'websearch',
    order: 12,
    label: () => shellT('webSearchNav'),
    inject: websearchInjected,
  }, WebSearchSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'file-processing',
    order: 13,
    label: () => shellT('fileProcessingNav'),
    inject: () => ({
      feature: 'document_to_markdown' as const,
      title: shellT('fileProcessingTitle'),
      description: shellT('fileProcessingDescription'),
      service: fileProcessing!,
    }),
  }, ProcessorSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'ocr',
    order: 14,
    label: () => shellT('ocrNav'),
    inject: () => ({
      feature: 'image_to_text' as const,
      title: shellT('ocrTitle'),
      description: shellT('ocrDescription'),
      service: fileProcessing!,
    }),
  }, ProcessorSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'usage',
    order: 24,
    label: () => shellT('usageNav'),
    inject: (): UsageSectionInjected => ({
      getUsage: () => {
        if (usage === undefined) throw new Error('usage Remote namespace is not mounted')
        return usage
      },
      hooks: { usageReady: usageReadySource },
    }),
  }, UsageSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'data',
    order: 23,
    label: () => shellT('dataNav'),
    inject: (): DataSectionInjected => ({
      getData: () => {
        if (data === undefined) throw new Error('data Remote namespace is not mounted')
        return data
      },
      getExport: () => {
        const ns = ctx.get('remote.controlCenterExport') as NonNullable<typeof remote.controlCenterExport> | undefined
        if (ns === undefined) throw new Error('export Remote namespace is not mounted')
        return ns
      },
      getSystem: () => {
        if (system === undefined) throw new Error('system Remote namespace is not mounted')
        return system
      },
      hooks: { dataReady: dataReadySource, exportReady: exportReadySource, systemReady: systemReadySource },
    }),
  }, DataSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'appearance',
    order: 21,
    label: () => shellT('appearanceNav'),
    inject: (): AppearanceSectionInjected => ({
      api: ctx.remote,
      settings: ccSettingsFace,
      locale: ctx.locale,
    }),
  }, AppearanceSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'notifications',
    order: 22,
    label: () => shellT('notificationsNav'),
    inject: (): NotificationSectionInjected => ({ settings: ccSettingsFace }),
  }, NotificationSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'dependencies',
    order: 40,
    label: () => shellT('dependenciesNav'),
    inject: (): SystemSectionInjected => ({
      getSystem: () => {
        if (system === undefined) throw new Error('system Remote namespace is not mounted')
        return system
      },
      hooks: { systemReady: systemReadySource },
    }),
  }, DependenciesSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'about',
    order: 41,
    label: () => shellT('aboutNav'),
    inject: (): SystemSectionInjected => ({
      getSystem: () => {
        if (system === undefined) throw new Error('system Remote namespace is not mounted')
        return system
      },
      getBridge: (): ChannelBridgeHandle | undefined =>
        channelBridge === undefined ? undefined : channelBridge as unknown as ChannelBridgeHandle,
      getUpdate: (): NonNullable<typeof remote.controlCenterUpdate> | undefined => update,
      getCompat: (): NonNullable<typeof remote.controlCenterCompat> | undefined =>
        ctx.get('remote.controlCenterCompat') as NonNullable<typeof remote.controlCenterCompat> | undefined,
      hooks: { systemReady: systemReadySource },
    }),
  }, AboutSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'tasks',
    order: 31,
    label: () => shellT('tasksNav'),
    inject: (): TasksSectionInjected => ({
      getTasks: () => {
        if (tasks === undefined) throw new Error('tasks Remote namespace is not mounted')
        return tasks
      },
      hooks: { tasksReady: tasksReadySource },
    }),
  }, TasksSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'local-models',
    order: 3,
    label: () => shellT('localModelsNav'),
    inject: (): LocalModelsSectionInjected => ({
      getLocalModels: () => {
        if (localModels === undefined) throw new Error('local models Remote namespace is not mounted')
        return localModels
      },
      hooks: { localModelsReady: localModelsReadySource },
    }),
  }, LocalModelsSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'api-gateway',
    order: 4,
    label: () => shellT('apiGatewayNav'),
    inject: () => ({
      gateway: ctx.get('remote.controlCenterGateway') as ApiGatewaySectionInjected['gateway'],
      api: ctx.remote,
    }),
  }, ApiGatewaySection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'update',
    order: 42,
    label: () => shellT('updateNav'),
    inject: (): UpdateSectionInjected => ({
      getUpdate: () => {
        if (update === undefined) throw new Error('update Remote namespace is not mounted')
        return update
      },
      hooks: { updateReady: updateReadySource },
    }),
  }, UpdateSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'shortcuts',
    order: 32,
    label: () => shellT('shortcutsNav'),
  }, ShortcutSection))
  const channelsInjected = (): ChannelsSectionInjected => ({
    api: ctx.remote,
    useChannels,
    controller: channelsController,
    // Lazy read: the bridge Remote namespace mounts asynchronously after this
    // closure's first evaluation, so the value must be resolved per call.
    getBridge: (): ChannelBridgeHandle | undefined =>
      channelBridge === undefined ? undefined : channelBridge as unknown as ChannelBridgeHandle,
    // Agent-preset roster for the per-channel binding picker; undefined until mounted.
    getAgentPresets: (): AgentPresetsRemote | undefined =>
      ctx.get('remote.controlCenterAgentPresets') as AgentPresetsRemote | undefined,
  })
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'channels',
    order: 30,
    label: () => shellT('channelsNav'),
    inject: channelsInjected,
  }, ChannelsSection))
  const gated: ReadonlyArray<{ id: string; order: number; label: string; props: Omit<CapabilityGateSectionProps, 'title' | 'description'> }> = [


  ]
  for (const entry of gated) {
    const props = entry.props
    ctx.slots.inject('settings.section', () => ctx.slots.register({
      name: 'settings.section',
      id: entry.id,
      order: entry.order,
      label: () => entry.label,
      inject: () => ({
        title: entry.label,
        description: props.supported[0] ?? '',
        supported: props.supported,
        unavailable: props.unavailable,
        note: props.note,
        hooks: { gateReady: alwaysReadySource },
      }),
    }, CapabilityGateSection))
  }
  ctx.slots.inject('settings.onboarding', () => ctx.slots.register({
    name: 'settings.onboarding', id: 'welcome-notice', order: -100, inject: welcomeInjected,
  }, WelcomeNotice))
  ctx.slots.inject('settings.onboarding', () => ctx.slots.register({
    name: 'settings.onboarding', id: 'deepseek-official', order: 0, inject: deepSeekOnboardingInjected,
  }, DeepSeekOnboardingDialog))
}

function refreshIfLoaded(controller: ModelsSettingsStore): void {
  if (controller.store.getSnapshot().status !== 'idle') void controller.load()
}
