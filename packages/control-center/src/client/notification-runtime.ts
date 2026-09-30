/** Deliver Cherry-compatible conversation-complete notifications from DSH session state. */
import type { ControlCenterSettingsRemote } from '../settings-store.ts'
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'

export const NOTIFICATION_SETTINGS_NAMESPACE = 'control-center-notifications'

interface SnapshotSource<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

function browserCanNotify(): boolean {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted'
}

/** Deliver through the browser Notification API (the only channel on the web profile). */
async function notifyConversationComplete(title: string): Promise<void> {
  const body = title.trim() === '' ? '对话已完成' : `${title} 已完成`
  if (browserCanNotify()) new Notification('DSH Control Center', { body })
}

/**
 * Watches real host session transitions and emits a system notification only
 * when a previously-running conversation becomes idle while this window is not
 * focused. The returned disposer owns the sole list subscription.
 */
export class ConversationNotificationRuntime {
  private conversationEnabled = false
  private running = new Map<string, boolean>()
  private stop: (() => void) | undefined

  constructor(
    private readonly settings: ControlCenterSettingsRemote,
    private readonly sessions: SnapshotSource<SessionListState>,
  ) {}

  async refreshPreferences(): Promise<void> {
    const response = await this.settings.describe()
    if (!response.ok) return
    const namespace = response.value.namespaces.find(view => view.ns === NOTIFICATION_SETTINGS_NAMESPACE)
    const value = namespace?.value
    this.conversationEnabled = typeof value === 'object' && value !== null
      && (value as { conversation?: unknown }).conversation === true
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
      if (this.running.get(key) === true && !row.running && this.conversationEnabled && !document.hasFocus()) {
        void notifyConversationComplete(row.displayTitle)
      }
    }
    this.running = next
  }
}
