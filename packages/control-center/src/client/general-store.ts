/**
 * Desktop general preferences (启动行为 / 托盘) behind the 通用 page — Cherry
 * GeneralSettings parity for the parts DSH can honor: the preferences persist
 * in the shared `control-center-general` settings namespace, and the desktop
 * companion reads the same document at startup to apply 开机自启 and
 * 关闭到托盘. Proxy / context management / hardware acceleration are honest
 * platform notes on the page, not fake switches.
 */

import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import { messageOf } from './store.ts'

export const GENERAL_NAMESPACE = 'control-center-general'

export interface GeneralPrefs {
  launchOnBoot: boolean
  trayEnabled: boolean
  trayOnClose: boolean
  preventSleepWhenBusy: boolean
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
  preventSleepWhenBusy: false,
}

function readPrefs(value: unknown, schema: SettingsSchemaOperations): GeneralPrefs {
  const flag = (key: string, fallback: boolean): boolean => {
    const raw = schema.getPath(value, [key])
    return typeof raw === 'boolean' ? raw : fallback
  }
  return {
    launchOnBoot: flag('launchOnBoot', DEFAULT_PREFS.launchOnBoot),
    trayEnabled: flag('trayEnabled', DEFAULT_PREFS.trayEnabled),
    trayOnClose: flag('trayOnClose', DEFAULT_PREFS.trayOnClose),
    preventSleepWhenBusy: flag('preventSleepWhenBusy', DEFAULT_PREFS.preventSleepWhenBusy),
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

  /** Persist one preference; keeps the others untouched. */
  async save(key: keyof GeneralPrefs, value: boolean): Promise<boolean> {
    const snapshot = this.store.getSnapshot()
    if (snapshot.revision === null || !snapshot.available) return false
    this.store.update((state) => { state.writeError = null })
    const response = await this.api.settings.mutate({
      ns: GENERAL_NAMESPACE,
      expectedRevision: snapshot.revision,
      ops: [{ op: 'set', path: [key], value }],
    })
    if (!response.result.ok) {
      const failure = response.result
      this.store.update((state) => { state.writeError = failure.error.message })
      return false
    }
    await this.load()
    return true
  }
}
