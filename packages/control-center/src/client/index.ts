/** Browser half of DSH Control Center. */
import type { ClientContext, SessionListState } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle, SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-web-react'
import { resolveSlotLabel } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import { SettingsRoot } from './SettingsRoot.tsx'
import type { SettingsOnboardingStep, SettingsRootInjected, SettingsSectionRow } from './shell-contract.ts'
import { CloseLabel, HeaderContent, TriggerContent } from './chrome.tsx'
import { GeneralSection } from './GeneralSection.tsx'
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

export type { ModelsSettingsState, ProviderRow } from './store.ts'
export type { ModelSelectionState } from './ModelSelectionPanel.tsx'

const SHELL_NS = 'control-center'
const MODELS_NS = 'control-center.models'
const KNOWN_NATIVE = new Set(['general', 'agent-presets', 'plugins'])

function groupOf(id: string): SettingsSectionRow['group'] {
  if (id === 'models') return 'core'
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
      native: shellT('nativeGroup'),
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
    useSessions: bindSnapshotSelector(ctx.sessions.list) as unknown as (<T>(selector: (state: SessionListState) => T) => T),
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
    const current = ctx.sessions.list.getSnapshot().current
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
