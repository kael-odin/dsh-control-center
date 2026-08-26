/** General settings store for desktop behavior and Cherry-compatible context preferences. */

import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import { messageOf } from './store.ts'

export const GENERAL_NAMESPACE = 'control-center-general'

export type ProxyMode = 'off' | 'system' | 'static'

export interface GeneralPrefs {
  launchOnBoot: boolean
  trayEnabled: boolean
  trayOnClose: boolean
  trayOnLaunch: boolean
  preventSleepWhenBusy: boolean
  developerMode: boolean
  proxyMode: ProxyMode
  proxyUrl: string
  proxyBypass: string
  allowPrivateNetwork: boolean
  disableHardwareAcceleration: boolean
  contextEnabled: boolean
  contextMaxMessages: number | null
  contextToolOutputThreshold: number
  contextAutoCompress: boolean
  contextCompressionProvider: string
  contextCompressionModel: string
}

export interface GeneralState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  writeError: string | null
  available: boolean
  writable: boolean
  revision: number | null
  prefs: GeneralPrefs
}

const DEFAULT_PREFS: GeneralPrefs = {
  launchOnBoot: false,
  trayEnabled: true,
  trayOnClose: false,
  trayOnLaunch: false,
  preventSleepWhenBusy: false,
  developerMode: false,
  proxyMode: 'off',
  proxyUrl: '',
  proxyBypass: '',
  allowPrivateNetwork: false,
  disableHardwareAcceleration: false,
  contextEnabled: true,
  contextMaxMessages: null,
  contextToolOutputThreshold: 50_000,
  contextAutoCompress: true,
  contextCompressionProvider: '',
  contextCompressionModel: '',
}

function readPrefs(value: unknown, schema: SettingsSchemaOperations): GeneralPrefs {
  const flag = (key: string, fallback: boolean): boolean => {
    const raw = schema.getPath(value, [key])
    return typeof raw === 'boolean' ? raw : fallback
  }
  const integerOrNull = (key: string, fallback: number | null): number | null => {
    const raw = schema.getPath(value, [key])
    return raw === null ? null : typeof raw === 'number' && Number.isSafeInteger(raw) && raw > 0 ? raw : fallback
  }
  const positiveInteger = (key: string, fallback: number): number => {
    const raw = schema.getPath(value, [key])
    return typeof raw === 'number' && Number.isInteger(raw) && raw >= 2_000 ? raw : fallback
  }
  const text = (key: string, fallback: string): string => {
    const raw = schema.getPath(value, [key])
    return typeof raw === 'string' ? raw : fallback
  }
  const proxyModeRaw = schema.getPath(value, ['proxyMode'])
  const proxyMode: ProxyMode = proxyModeRaw === 'system' || proxyModeRaw === 'static' ? proxyModeRaw : 'off'
  return {
    launchOnBoot: flag('launchOnBoot', DEFAULT_PREFS.launchOnBoot),
    trayEnabled: flag('trayEnabled', DEFAULT_PREFS.trayEnabled),
    trayOnClose: flag('trayOnClose', DEFAULT_PREFS.trayOnClose),
    trayOnLaunch: flag('trayOnLaunch', DEFAULT_PREFS.trayOnLaunch),
    preventSleepWhenBusy: flag('preventSleepWhenBusy', DEFAULT_PREFS.preventSleepWhenBusy),
    developerMode: flag('developerMode', DEFAULT_PREFS.developerMode),
    proxyMode,
    proxyUrl: text('proxyUrl', DEFAULT_PREFS.proxyUrl),
    proxyBypass: text('proxyBypass', DEFAULT_PREFS.proxyBypass),
    allowPrivateNetwork: flag('allowPrivateNetwork', DEFAULT_PREFS.allowPrivateNetwork),
    disableHardwareAcceleration: flag('disableHardwareAcceleration', DEFAULT_PREFS.disableHardwareAcceleration),
    contextEnabled: flag('contextEnabled', DEFAULT_PREFS.contextEnabled),
    contextMaxMessages: integerOrNull('contextMaxMessages', DEFAULT_PREFS.contextMaxMessages),
    contextToolOutputThreshold: positiveInteger('contextToolOutputThreshold', DEFAULT_PREFS.contextToolOutputThreshold),
    contextAutoCompress: flag('contextAutoCompress', DEFAULT_PREFS.contextAutoCompress),
    contextCompressionProvider: text('contextCompressionProvider', DEFAULT_PREFS.contextCompressionProvider),
    contextCompressionModel: text('contextCompressionModel', DEFAULT_PREFS.contextCompressionModel),
  }
}

export class GeneralSettingsStore {
  readonly store: SnapshotStore<GeneralState> = createSnapshotStore<GeneralState>({
    status: 'idle', error: null, writeError: null, available: true, writable: false, revision: null,
    prefs: DEFAULT_PREFS,
  })

  private generation = 0

  constructor(
    private readonly api: Pick<IApiClient, 'settings'>,
    private readonly schema: SettingsSchemaOperations,
  ) {}

  async load(): Promise<void> {
    const generation = ++this.generation
    this.store.update((state) => { state.status = 'loading'; state.error = null })
    try {
      const response = await this.api.settings.describe({})
      const described = response.result
      if (!described.ok) throw new Error(described.error.message)
      if (generation !== this.generation) return
      const namespace = described.value.namespaces.find(view => view.ns === GENERAL_NAMESPACE)
      this.store.update((state) => {
        state.status = 'ready'
        state.available = namespace !== undefined
        state.writable = described.value.writable
        state.revision = namespace === undefined ? null : namespace.revision
        state.prefs = namespace === undefined ? DEFAULT_PREFS : readPrefs(namespace.value, this.schema)
      })
    } catch (error) {
      if (generation !== this.generation) return
      this.store.update((state) => { state.status = 'error'; state.error = messageOf(error) })
    }
  }

  /** Persist one preference; keeps every other setting unchanged. */
  async save<K extends keyof GeneralPrefs>(key: K, value: GeneralPrefs[K]): Promise<boolean> {
    const snapshot = this.store.getSnapshot()
    if (snapshot.revision === null || !snapshot.available) return false
    this.store.update((state) => { state.writeError = null })
    const response = await this.api.settings.mutate({
      ns: GENERAL_NAMESPACE,
      expectedRevision: snapshot.revision,
      ops: [{ op: 'set', path: [key], value }],
    })
    const result = response.result
    if (!result.ok) {
      this.store.update((state) => { state.writeError = result.error.message })
      return false
    }
    await this.load()
    return true
  }
}
