/**
 * Channel instances (频道) authority: the `control-center-channels` settings
 * namespace. The desktop bridge reads the same section from settings.yaml to
 * bind bots, so a channel configured here is exactly what a desktop deploy
 * picks up — no second store, no sync.
 *
 * When the running host predates the namespace the store degrades to
 * ready/unavailable, and the section falls back to browser-local persistence
 * with an honest notice (same contract as the model-preferences store).
 */

import type { ClientRemote, JsonValue } from '@deepseek-ai/dsh-api-remotes/client'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import { messageOf } from './store.ts'

export const CHANNELS_NAMESPACE = 'control-center-channels'

/** One configured channel instance (shape owned by the section). */
export interface ChannelInstance {
  id: string
  type: string
  name: string
  config: Record<string, unknown>
  permissionMode: string
  isActive: boolean
  createdAt: number
}

export interface ChannelsState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  /** False when the running host does not register the namespace. */
  available: boolean
  writable: boolean
  revision: number | null
  instances: readonly ChannelInstance[]
}

/** The shared controller (one per client surface). */
export class ChannelsStore {
  readonly store: SnapshotStore<ChannelsState> = createSnapshotStore<ChannelsState>({
    status: 'idle', error: null, available: true, writable: false, revision: null, instances: [],
  })

  private generation = 0

  constructor(private readonly api: Pick<ClientRemote, 'settings'>) {}

  async load(): Promise<void> {
    const generation = ++this.generation
    this.store.update((state) => { state.status = 'loading'; state.error = null })
    try {
      const response = await this.api.settings.describe()
      const settings = response
      if (!settings.ok) throw new Error(settings.error.message)
      if (generation !== this.generation) return
      const namespace = settings.value.namespaces.find(view => view.ns === CHANNELS_NAMESPACE)
      if (namespace === undefined) {
        this.store.update((state) => {
          state.status = 'ready'
          state.available = false
          state.writable = settings.value.writable
          state.revision = null
        })
        return
      }
      const raw = this.readInstances(namespace.value)
      this.store.update((state) => {
        state.status = 'ready'
        state.available = true
        state.writable = settings.value.writable
        state.revision = namespace.revision
        state.instances = raw
      })
    } catch (error) {
      if (generation !== this.generation) return
      this.store.update((state) => {
        state.status = 'error'
        state.error = messageOf(error)
      })
    }
  }

  /** The instances array, tolerant of a host that stored anything unexpected. */
  private readInstances(value: unknown): readonly ChannelInstance[] {
    const raw = typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>).instances
      : undefined
    if (!Array.isArray(raw)) return []
    return raw.filter((entry): entry is ChannelInstance =>
      typeof entry === 'object' && entry !== null
      && typeof (entry as ChannelInstance).id === 'string'
      && typeof (entry as ChannelInstance).type === 'string')
  }

  /** Persist the whole instance list (small by construction). */
  async save(instances: readonly ChannelInstance[]): Promise<boolean> {
    const snapshot = this.store.getSnapshot()
    if (!snapshot.available || snapshot.revision === null) return false
    this.store.update((state) => { state.status = 'loading'; state.error = null })
    const response = await this.api.settings.mutate(CHANNELS_NAMESPACE, [{ op: 'set', path: ['instances'], value: structuredClone(instances.map(instance => ({ ...instance }))) as unknown as JsonValue }], snapshot.revision)
    if (!response.ok) {
      const failure = response
      this.store.update((state) => {
        state.status = 'error'
        state.error = failure.error.message
      })
      return false
    }
    this.store.update((state) => {
      state.status = 'ready'
      state.revision = response.ok ? response.value.revision : state.revision
      state.instances = [...instances]
    })
    return true
  }
}

/**
 * One-time import of the pre-settings localStorage list. Runs at most once
 * per browser (flagged), and only merges when the authority is empty — a
 * configured settings.yaml always wins over browser leftovers.
 */
export async function importLegacyChannels(store: ChannelsStore): Promise<boolean> {
  const MIGRATED_KEY = 'cc.settings.channels.imported'
  try {
    if (window.localStorage.getItem(MIGRATED_KEY) !== null) return false
    const snapshot = store.store.getSnapshot()
    if (!snapshot.available || snapshot.instances.length > 0) {
      window.localStorage.setItem(MIGRATED_KEY, '1')
      return false
    }
    const raw = window.localStorage.getItem('cc.settings.channels')
    const legacy: unknown = raw === null ? [] : JSON.parse(raw)
    if (!Array.isArray(legacy) || legacy.length === 0) {
      window.localStorage.setItem(MIGRATED_KEY, '1')
      return false
    }
    const saved = await store.save(legacy as ChannelInstance[])
    window.localStorage.setItem(MIGRATED_KEY, '1')
    return saved
  } catch {
    return false
  }
}
