/** Deliver Cherry-compatible conversation-complete notifications from DSH session state. */
import type { IApiClient } from '@deepseek-ai/dsh-client-connection/client'
import type { SessionListState } from '@deepseek-ai/dsh-client-runtime/client'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '../desktop-types.ts'

export const NOTIFICATION_SETTINGS_NAMESPACE = 'control-center-notifications'

export type DesktopRemote = NonNullable<ClientRemote['controlCenterDesktop']>

interface SnapshotSource<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

function browserCanNotify(): boolean {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted'
}

/**
 * Deliver via the desktop service (Electron Notification, when the shell bridge
 * is reachable); fall back to the browser Notification API otherwise.
 */
async function notifyConversationComplete(getDesktop: () => DesktopRemote | undefined, title: string): Promise<void> {
  const body = title.trim() === '' ? '对话已完成' : `${title} 已完成`
  const desktop = getDesktop()
  if (desktop !== undefined) {
    try {
      const result = await desktop.notify('DSH Control Center', body)
      if (result.ok && result.value.ok) return
    } catch {
      // Fall through to the browser Notification below.
    }
  }
  if (browserCanNotify()) new Notification('DSH Control Center', { body })
}

/**
 * Watches real host session transitions and emits a system notification only
 * when a previously-running conversation becomes idle while this window is not
 * focused. The returned disposer owns the sole list subscription.
 */
export class ConversationNotificationRuntime {
  private assistantEnabled = false
  private running = new Map<string, boolean>()
  private stop: (() => void) | undefined

  constructor(
    private readonly api: IApiClient,
    private readonly sessions: SnapshotSource<SessionListState>,
    private readonly getDesktop: () => DesktopRemote | undefined,
  ) {}

  async refreshPreferences(): Promise<void> {
    const response = await this.api.settings.describe({})
    if (!response.result.ok) return
    const namespace = response.result.value.namespaces.find(view => view.ns === NOTIFICATION_SETTINGS_NAMESPACE)
    const value = namespace?.value
    this.assistantEnabled = typeof value === 'object' && value !== null
      && (value as { assistant?: unknown }).assistant === true
  }

  start(): () => void {
    const initial = this.sessions.getSnapshot()
    this.running = new Map(initial.ids.map(id => [String(id), initial.byId[id]?.running === true]))
    this.stop = this.sessions.subscribe(() => { this.onSnapshot(this.sessions.getSnapshot()) })
    void this.refreshPreferences()
    return () => {
      this.stop?.()
      this.stop = undefined
    }
  }

  private onSnapshot(snapshot: SessionListState): void {
    const next = new Map<string, boolean>()
    for (const id of snapshot.ids) {
      const row = snapshot.byId[id]
      if (row === undefined) continue
      const key = String(id)
      next.set(key, row.running)
      if (this.running.get(key) === true && !row.running && this.assistantEnabled && !document.hasFocus()) {
        void notifyConversationComplete(this.getDesktop, row.displayTitle)
      }
    }
    this.running = next
  }
}
