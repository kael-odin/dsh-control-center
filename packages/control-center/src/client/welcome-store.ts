/** Welcome-notice state, durable when the browser may use Host settings. */

import type { ClientRemote, SettingsNamespaceView } from '@deepseek-ai/dsh-api-remotes/client'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import {
  WELCOME_NOTICE_ACK_FIELD, WELCOME_NOTICE_SETTINGS_NAMESPACE, WELCOME_NOTICE_VERSION,
} from '../onboarding-copy.ts'

/** State rendered by the welcome step. */
export interface WelcomeNoticeState {
  status: 'idle' | 'loading' | 'ready' | 'saving' | 'error'
  acknowledged: boolean
  error: string | null
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function acknowledgementOf(view: SettingsNamespaceView): string | undefined {
  if (typeof view.value !== 'object' || view.value === null) return undefined
  const value = (view.value as Record<string, unknown>)[WELCOME_NOTICE_ACK_FIELD]
  return typeof value === 'string' ? value : undefined
}

/** Coordinates durable Host acknowledgement or a process-local remote fallback. */
export class WelcomeNoticeStore {
  /** uSES-safe state source shared by the registered welcome step. */
  readonly store: SnapshotStore<WelcomeNoticeState> = createSnapshotStore({
    status: 'idle', acknowledged: false, error: null,
  })

  private generation = 0

  private failureCount = 0
  private readonly MAX_FAILURES = 2

  /**
   * @param api - settings wire face used for durable reads and writes.
   * @param persistence - remote browsers use memory because settings is loopback-only.
   */
  constructor(
    private readonly api: Pick<ClientRemote, 'settings'>,
    private persistence: 'host' | 'memory' = 'host',
  ) {}

  /** Load the acknowledgement from Host settings or initialize process-local state. */
  async load(): Promise<void> {
    const generation = ++this.generation
    if (this.persistence === 'memory') {
      this.store.update((state) => { state.status = 'ready'; state.error = null })
      return
    }
    this.store.update((state) => { state.status = 'loading'; state.error = null })
    try {
      // Guard: settings API must be available
      if (this.api.settings === undefined) {
        throw new Error('settings API not initialized')
      }
      const response = await this.api.settings.describe()
      if (!response.ok) throw new Error(response.error.message)
      const view = response.value.namespaces.find(
        candidate => candidate.ns === WELCOME_NOTICE_SETTINGS_NAMESPACE,
      )
      if (view === undefined) throw new Error('welcome acknowledgement settings are unavailable')
      if (generation !== this.generation) return
      this.store.update((state) => {
        state.status = 'ready'
        state.acknowledged = acknowledgementOf(view) === WELCOME_NOTICE_VERSION
        state.error = null
      })
    } catch (error) {
      if (generation !== this.generation) return
      this.store.update((state) => {
        state.status = 'error'
        state.acknowledged = false
        state.error = messageOf(error)
      })
    }
  }

  /**
   * Persist this copy version, or advance only this process for a remote browser.
   * @returns true when the selected persistence mode accepted the acknowledgement.
   */
  async acknowledge(): Promise<boolean> {
    const generation = ++this.generation
    if (this.persistence === 'memory') {
      this.store.update((state) => {
        state.status = 'ready'
        state.acknowledged = true
        state.error = null
      })
      return true
    }
    this.store.update((state) => { state.status = 'saving'; state.error = null })
    try {
      // Guard: settings API must be available
      if (this.api.settings === undefined) {
        throw new Error('settings API not initialized')
      }
      // First verify the namespace is available before attempting mutation
      const describeResponse = await this.api.settings.describe()
      if (!describeResponse.ok) throw new Error(describeResponse.error.message)
      const view = describeResponse.value.namespaces.find(
        candidate => candidate.ns === WELCOME_NOTICE_SETTINGS_NAMESPACE,
      )
      if (view === undefined) throw new Error('welcome acknowledgement settings are unavailable')

      // Now attempt the mutation
      const response = await this.api.settings.mutate(WELCOME_NOTICE_SETTINGS_NAMESPACE, [{ op: 'set', path: [WELCOME_NOTICE_ACK_FIELD], value: WELCOME_NOTICE_VERSION }], view.revision)
      if (!response.ok) throw new Error(response.error.message)
      if (generation === this.generation) {
        this.failureCount = 0
        this.store.update((state) => {
          state.status = 'ready'
          state.acknowledged = true
          state.error = null
        })
      }
      return true
    } catch (error) {
      this.failureCount++
      if (generation === this.generation) {
        // After MAX_FAILURES attempts, fall back to memory mode so user can proceed
        if (this.failureCount >= this.MAX_FAILURES) {
          this.persistence = 'memory'
          this.store.update((state) => {
            state.status = 'ready'
            state.acknowledged = true
            state.error = null
          })
          return true
        }
        this.store.update((state) => {
          state.status = 'error'
          state.acknowledged = false
          state.error = messageOf(error)
        })
      }
      return false
    }
  }
}

/**
 * Refresh only after welcome state has left idle. A memory-mode load retains
 * acknowledgement so reconnect does not reopen a process-local notice.
 * @param controller - welcome state owner whose current status decides whether to load.
 */
export function refreshWelcomeIfLoaded(controller: WelcomeNoticeStore): void {
  if (controller.store.getSnapshot().status === 'idle') return
  void controller.load()
}
