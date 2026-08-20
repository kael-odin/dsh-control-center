/** Browser half of DSH Control Center. */
import type { ClientContext, SessionListState } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle, SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-web-react'
import { resolveSlotLabel, type HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
// The application workspace seam types ship in the harness source baseline,
// not in the published rc.7 ui-layout — vendor the declaration mirror so the
// build is self-contained (runtime slots still come from the harness).
import type {} from './application-slots.ts'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '../translation-types.ts'
import translationRemote from '../translation-remote-client.ts'
import type {} from '../painting-types.ts'
import paintingRemote from '../painting-remote-client.ts'
import { PaintingWorkspace } from './PaintingWorkspace.tsx'
import type { PaintWorkspaceInjected } from './PaintingWorkspace.tsx'
import type {} from '../knowledge-types.ts'
import knowledgeRemote from '../knowledge-remote-client.ts'
import { KnowledgeWorkspace } from './KnowledgeWorkspace.tsx'
import type { KnowledgeWorkspaceInjected } from './KnowledgeWorkspace.tsx'
import type {} from '../skills-types.ts'
import skillsRemote from '../skills-remote-client.ts'
import { SkillsSection } from './SkillsSection.tsx'
import type {} from '../provider-types.ts'
import providersRemote from '../provider-remote-client.ts'
import { ProvidersSection } from './ProvidersSection.tsx'
import type {} from '../mcp-types.ts'
import mcpRemote from '../mcp-remote-client.ts'
import type {} from '../mcp-types.ts'
import { McpSection } from './McpSection.tsx'
import type {} from '../websearch-types.ts'
import websearchRemote from '../websearch-remote-client.ts'
import { WebSearchSection } from './WebSearchSection.tsx'
import type {} from '../file-processing-types.ts'
import fileProcessingRemote from '../file-processing-remote-client.ts'
import { ProcessorSection } from './ProcessorSection.tsx'
import type {} from '../usage-types.ts'
import usageRemote from '../usage-remote-client.ts'
import { UsageSection } from './UsageSection.tsx'
import type { UsageSectionInjected } from './UsageSection.tsx'
import type {} from '../data-types.ts'
import dataRemote from '../data-remote-client.ts'
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
import { LocalModelsSection } from './LocalModelsSection.tsx'
import type { LocalModelsSectionInjected } from './LocalModelsSection.tsx'
import { UpdateSection } from './UpdateSection.tsx'
import type { UpdateSectionInjected } from './UpdateSection.tsx'
import { CapabilityGateSection } from './CapabilityGateSection.tsx'
import type { CapabilityGateSectionProps } from './CapabilityGateSection.tsx'
import { SettingsRoot } from './SettingsRoot.tsx'
import type { SettingsOnboardingStep, SettingsRootInjected, SettingsSectionRow } from './shell-contract.ts'
import { CloseLabel, HeaderContent, TriggerContent } from './chrome.tsx'
import { GeneralSection } from './GeneralSection.tsx'
import { AppearanceSection } from './AppearanceSection.tsx'
import type { AppearanceSectionInjected } from './AppearanceSection.tsx'
import { NotificationSection } from './NotificationSection.tsx'
import { ShortcutSection } from './ShortcutSection.tsx'
import { SelectionAssistantSection } from './SelectionAssistantSection.tsx'
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
import { en as modelsEn, zh as modelsZh, type ModelsKey } from './locales.ts'
import { WELCOME_NOTICE_SETTINGS_NAMESPACE } from '../onboarding-copy.ts'
import { ProductWorkspaceNavItem } from './ProductWorkspaceNavItem.tsx'
import { ProductWorkspaceSurface } from './ProductWorkspaceSurface.tsx'
import { TranslationWorkspace } from './TranslationWorkspace.tsx'
import type { ProductWorkspaceId } from './product-workspace-contract.ts'

export type { ModelsSettingsState, ProviderRow } from './store.ts'
export type { ModelSelectionState } from './ModelSelectionPanel.tsx'

const SHELL_NS = 'control-center'
const MODELS_NS = 'control-center.models'
const KNOWN_NATIVE = new Set(['general', 'agent-presets', 'plugins'])

/** Cherry settings group mapping: models are core, capabilities/personal get
 * their own groups, DSH-owned sections stay native. */
function groupOf(id: string): SettingsSectionRow['group'] {
  if (id === 'models') return 'core'
  if (id === 'general') return 'personal'
  if (id === 'skills' || id === 'providers' || id === 'mcp' || id === 'websearch' || id === 'file-processing' || id === 'ocr') return 'capabilities'
  if (id === 'usage' || id === 'data' || id === 'appearance' || id === 'notifications') return 'personal'
  if (id === 'about' || id === 'dependencies') return 'system'
  if (id === 'tasks' || id === 'shortcuts' || id === 'quick-assistant' || id === 'selection-assistant' || id === 'screenshot' || id === 'channels') return 'automation'
  if (id === 'local-models' || id === 'update') return 'system'
  if (KNOWN_NATIVE.has(id)) return 'native'
  return 'other'
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'control-center': SettingsKey
    'control-center.models': ModelsKey
  }
}

export const inject = ['slots', 'locale', 'connection', 'remote', 'sessions']

/** Register the settings shell, Provider/Model page, and onboarding steps. */
export function apply(ctx: ClientContext): void {
  const remote = ctx.remote
  let translation: NonNullable<typeof remote.controlCenterTranslation> | undefined
  const translationReadySource: HostObservable<boolean> = {
    getSnapshot: () => translation !== undefined,
    subscribe: (listener) => {
      const timer = window.setInterval(() => {
        if (translation === undefined) return
        window.clearInterval(timer)
        listener()
      }, 25)
      return () => { window.clearInterval(timer) }
    },
  }
  let painting: NonNullable<typeof remote.controlCenterPainting> | undefined
  const paintingReadySource: HostObservable<boolean> = {
    getSnapshot: () => painting !== undefined,
    subscribe: (listener) => {
      const timer = window.setInterval(() => {
        if (painting === undefined) return
        window.clearInterval(timer)
        listener()
      }, 25)
      return () => { window.clearInterval(timer) }
    },
  }
  let knowledge: NonNullable<typeof remote.controlCenterKnowledge> | undefined
  const knowledgeReadySource: HostObservable<boolean> = {
    getSnapshot: () => knowledge !== undefined,
    subscribe: (listener) => {
      const timer = window.setInterval(() => {
        if (knowledge === undefined) return
        window.clearInterval(timer)
        listener()
      }, 25)
      return () => { window.clearInterval(timer) }
    },
  }
  let skills: NonNullable<typeof remote.controlCenterSkills> | undefined
  let providers: NonNullable<typeof remote.controlCenterProviders> | undefined
  let mcp: NonNullable<typeof remote.controlCenterMcp> | undefined
  let websearch: NonNullable<typeof remote.controlCenterWebSearch> | undefined
  let fileProcessing: NonNullable<typeof remote.controlCenterFileProcessing> | undefined
  let usage: NonNullable<typeof remote.controlCenterUsage> | undefined
  let data: NonNullable<typeof remote.controlCenterData> | undefined
  let system: NonNullable<typeof remote.controlCenterSystem> | undefined
  let tasks: NonNullable<typeof remote.controlCenterTasks> | undefined
  let localModels: NonNullable<typeof remote.controlCenterLocalModels> | undefined
  let update: NonNullable<typeof remote.controlCenterUpdate> | undefined
  const localModelsReadySource: HostObservable<boolean> = {
    getSnapshot: () => localModels !== undefined,
    subscribe: (listener) => {
      const timer = window.setInterval(() => {
        if (localModels === undefined) return
        window.clearInterval(timer)
        listener()
      }, 25)
      return () => { window.clearInterval(timer) }
    },
  }
  const updateReadySource: HostObservable<boolean> = {
    getSnapshot: () => update !== undefined,
    subscribe: (listener) => {
      const timer = window.setInterval(() => {
        if (update === undefined) return
        window.clearInterval(timer)
        listener()
      }, 25)
      return () => { window.clearInterval(timer) }
    },
  }
  const alwaysReadySource: HostObservable<boolean> = {
    getSnapshot: () => true,
    subscribe: () => () => {},
  }
  const tasksReadySource: HostObservable<boolean> = {
    getSnapshot: () => tasks !== undefined,
    subscribe: (listener) => {
      const timer = window.setInterval(() => {
        if (tasks === undefined) return
        window.clearInterval(timer)
        listener()
      }, 25)
      return () => { window.clearInterval(timer) }
    },
  }
  const systemReadySource: HostObservable<boolean> = {
    getSnapshot: () => system !== undefined,
    subscribe: (listener) => {
      const timer = window.setInterval(() => {
        if (system === undefined) return
        window.clearInterval(timer)
        listener()
      }, 25)
      return () => { window.clearInterval(timer) }
    },
  }
  const usageReadySource: HostObservable<boolean> = {
    getSnapshot: () => usage !== undefined,
    subscribe: (listener) => {
      const timer = window.setInterval(() => {
        if (usage === undefined) return
        window.clearInterval(timer)
        listener()
      }, 25)
      return () => { window.clearInterval(timer) }
    },
  }
  const dataReadySource: HostObservable<boolean> = {
    getSnapshot: () => data !== undefined,
    subscribe: (listener) => {
      const timer = window.setInterval(() => {
        if (data === undefined) return
        window.clearInterval(timer)
        listener()
      }, 25)
      return () => { window.clearInterval(timer) }
    },
  }
  ctx.effect(async () => {
    // The client Remote registry keys contributions by package, so every
    // namespace must be mounted through one merged contribution.
    const controlCenterRemote: typeof translationRemote = {
      package: '@dsh-control-center/control-center',
      descriptors: [
        ...translationRemote.descriptors,
        ...paintingRemote.descriptors,
        ...knowledgeRemote.descriptors,
        ...skillsRemote.descriptors,
        ...providersRemote.descriptors,
        ...mcpRemote.descriptors,
        ...websearchRemote.descriptors,
        ...fileProcessingRemote.descriptors,
        ...usageRemote.descriptors,
        ...dataRemote.descriptors,
        ...systemRemote.descriptors,
        ...tasksRemote.descriptors,
        ...localModelsRemote.descriptors,
        ...updateRemote.descriptors
      ],
    }
    const dispose = await remote.$mount(controlCenterRemote)
    translation = ctx.get('remote.controlCenterTranslation') as NonNullable<typeof remote.controlCenterTranslation>
    painting = ctx.get('remote.controlCenterPainting') as NonNullable<typeof remote.controlCenterPainting>
    knowledge = ctx.get('remote.controlCenterKnowledge') as NonNullable<typeof remote.controlCenterKnowledge>
    skills = ctx.get('remote.controlCenterSkills') as NonNullable<typeof remote.controlCenterSkills>
    providers = ctx.get('remote.controlCenterProviders') as NonNullable<typeof remote.controlCenterProviders>
    mcp = ctx.get('remote.controlCenterMcp') as NonNullable<typeof remote.controlCenterMcp>
    websearch = ctx.get('remote.controlCenterWebSearch') as NonNullable<typeof remote.controlCenterWebSearch>
    fileProcessing = ctx.get('remote.controlCenterFileProcessing') as NonNullable<typeof remote.controlCenterFileProcessing>
    usage = ctx.get('remote.controlCenterUsage') as NonNullable<typeof remote.controlCenterUsage>
    data = ctx.get('remote.controlCenterData') as NonNullable<typeof remote.controlCenterData>
    system = ctx.get('remote.controlCenterSystem') as NonNullable<typeof remote.controlCenterSystem>
    tasks = ctx.get('remote.controlCenterTasks') as NonNullable<typeof remote.controlCenterTasks>
    localModels = ctx.get('remote.controlCenterLocalModels') as NonNullable<typeof remote.controlCenterLocalModels>
    update = ctx.get('remote.controlCenterUpdate') as NonNullable<typeof remote.controlCenterUpdate>
    return dispose
  }, 'control-center: control-center Remote namespaces')
  ctx.effect(() => ctx.locale.register(SHELL_NS, { zh: shellZh, en: shellEn }), 'control-center: shell dictionaries')
  ctx.effect(() => ctx.locale.register(MODELS_NS, { zh: modelsZh, en: modelsEn }), 'control-center: model dictionaries')
  const shellT = ctx.locale.bind(SHELL_NS)
  const modelT = ctx.locale.bind(MODELS_NS) as ModelsSectionInjected['t']
  const connection = ctx.get('connection') as ConnectionHandle
  const documentController = connection.isLoopback ? new SettingsDocumentStore(connection.api) : undefined
  const documentInjected = documentController === undefined
    ? undefined
    : (() => {
        const useSnapshot = bindSnapshotSelector(documentController.store)
        return (): SettingsDocumentActionInjected => ({ controller: documentController, useSnapshot })
      })()

  const modelsController = new ModelsSettingsStore(connection.api)
  const useModels = bindSnapshotSelector(modelsController.store)
  const selectionController = new ModelSelectionStore(connection.api)
  const useSelection = bindSnapshotSelector(selectionController.store)
  const welcomeController = new WelcomeNoticeStore(connection.api, connection.isLoopback ? 'host' : 'memory')

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
    },
  })

  const modelSelection = {
    controller: selectionController,
    useSnapshot: useSelection,
    useSessions: bindSnapshotSelector(ctx.sessions.list as unknown as HostObservable<SessionListState>) as unknown as (<T>(selector: (state: SessionListState) => T) => T),
    load: (sessionId: SessionId | undefined, addressed: boolean) => { void selectionController.load(sessionId, addressed) },
    t: modelT,
  }
  const modelsInjected = (): ModelsSectionInjected => ({
    controller: modelsController,
    useSnapshot: useModels,
    api: connection.api,
    modelSelection,
    t: modelT,
  })
  const skillsInjected = () => ({
    skills: skills!,
  })
  const providersInjected = () => ({
    providers: providers!,
  })
  const mcpInjected = () => ({
    mcp: mcp!,
  })
  const websearchInjected = () => ({
    websearch: websearch!,
  })
  const deepSeekOnboardingInjected = (): DeepSeekOnboardingInjected => ({
    controller: modelsController,
    hooks: { models: modelsController.store },
    api: connection.api,
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
    const current = (ctx.sessions.list as unknown as HostObservable<SessionListState>).getSnapshot().current
    void selectionController.load(current)
  }), 'control-center: connection invalidations')

  ctx.effect(() => {
    const refreshModels = (): void => { refreshIfLoaded(modelsController) }
    const disposers = [
      ctx.remote.$on('settings/document-updated', (namespace) => {
        refreshModels()
        if (namespace === WELCOME_NOTICE_SETTINGS_NAMESPACE) refreshWelcomeIfLoaded(welcomeController)
      }),
      ctx.remote.$on('credentials/updated', refreshModels),
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
          listModels: async () => {
            const result = await connection.api.llm.models({})
            if (!result.result.ok) throw new Error(result.result.error.message)
            return result.result.value.groups
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
            const result = await connection.api.llm.models({})
            if (!result.result.ok) throw new Error(result.result.error.message)
            return result.result.value.groups
          },
        }),
      }, KnowledgeWorkspace))
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
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: 'models', order: 10, label: () => modelT('nav'), inject: modelsInjected,
  }, ModelsSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'skills',
    order: 20,
    label: () => 'Skills',
    inject: skillsInjected,
  }, SkillsSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'providers',
    order: 30,
    label: () => shellT('providersNav'),
    inject: providersInjected,
  }, ProvidersSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'mcp',
    order: 40,
    label: () => 'MCP',
    inject: mcpInjected,
  }, McpSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'websearch',
    order: 50,
    label: () => shellT('webSearchNav'),
    inject: websearchInjected,
  }, WebSearchSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'file-processing',
    order: 55,
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
    order: 60,
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
    order: 70,
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
    order: 80,
    label: () => shellT('dataNav'),
    inject: (): DataSectionInjected => ({
      getData: () => {
        if (data === undefined) throw new Error('data Remote namespace is not mounted')
        return data
      },
      hooks: { dataReady: dataReadySource },
    }),
  }, DataSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'appearance',
    order: 85,
    label: () => shellT('appearanceNav'),
    inject: (): AppearanceSectionInjected => ({ api: connection.api }),
  }, AppearanceSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'notifications',
    order: 86,
    label: () => shellT('notificationsNav'),
  }, NotificationSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'dependencies',
    order: 90,
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
    order: 100,
    label: () => shellT('aboutNav'),
    inject: (): SystemSectionInjected => ({
      getSystem: () => {
        if (system === undefined) throw new Error('system Remote namespace is not mounted')
        return system
      },
      hooks: { systemReady: systemReadySource },
    }),
  }, AboutSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'tasks',
    order: 200,
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
    order: 105,
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
    id: 'update',
    order: 110,
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
    order: 220,
    label: () => shellT('shortcutsNav'),
  }, ShortcutSection))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'selection-assistant',
    order: 240,
    label: () => shellT('selectionAssistantNav'),
  }, SelectionAssistantSection))
  const gated: ReadonlyArray<{ id: string; order: number; label: string; props: Omit<CapabilityGateSectionProps, 'title' | 'description'> }> = [
    { id: 'channels', order: 210, label: shellT('channelsNav'), props: {
      supported: ['会话消息推送', '通知类计划任务'],
      unavailable: ['Webhook/Channel 绑定（需要桌面伴生进程）'],
      note: 'Web 版不附带独立伴生程序；Channel 绑定与消息推送需要桌面环境支持。',
    } },

    { id: 'quick-assistant', order: 230, label: shellT('quickAssistantNav'), props: {
      supported: ['计划任务触发的通知动作'],
      unavailable: ['全局唤起 Quick Assistant（需要桌面伴生进程）'],
      note: 'Quick Assistant 的全局唤起依赖系统级热键与悬浮窗，Web 版不可用。',
    } },

    { id: 'screenshot', order: 250, label: shellT('screenshotNav'), props: {
      supported: ['文件导入（图片/文档）到知识库与 OCR'],
      unavailable: ['屏幕截图（需要桌面截屏能力）'],
      note: '浏览器受限无法实现全屏截图；图片处理通过文件导入进行。',
    } },
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
