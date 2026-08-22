/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConversationNotificationRuntime } from '../src/client/notification-runtime.ts'
import type { SessionListState } from '@deepseek-ai/dsh-client-runtime/client'

function state(running: boolean, title = '测试对话'): SessionListState {
  const id = 'session-1' as never
  return {
    ids: [id],
    byId: { [id]: { id, displayTitle: title, running, blank: false, updatedAt: 1 } },
    current: undefined,
    phase: 'ready',
    subagentsByParent: {},
    jobsBySession: {},
    currentAddress: undefined,
  }
}

function source(initial: SessionListState) {
  let snapshot = initial
  let listener = () => {}
  return {
    getSnapshot: () => snapshot,
    subscribe: (next: () => void) => { listener = next; return () => { listener = () => {} } },
    publish: (next: SessionListState) => { snapshot = next; listener() },
  }
}

function api(assistant: boolean) {
  return {
    settings: {
      describe: vi.fn(async () => ({
        result: { ok: true, value: { namespaces: [{ ns: 'control-center-notifications', value: { assistant }, revision: 1 }] } },
      })),
    },
  } as never
}

describe('ConversationNotificationRuntime', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(document, 'hasFocus', { configurable: true, value: () => false })
  })

  it('notifies only after a real running to idle transition when enabled', async () => {
    const notifications: Array<{ title: string; body?: string }> = []
    class FakeNotification {
      static permission = 'granted'
      constructor(title: string, options?: NotificationOptions) {
        notifications.push({ title, body: options?.body })
      }
    }
    vi.stubGlobal('Notification', FakeNotification)
    const sessions = source(state(true))
    const runtime = new ConversationNotificationRuntime(api(true), sessions, () => undefined)
    const stop = runtime.start()
    await runtime.refreshPreferences()

    sessions.publish(state(false))

    expect(notifications).toEqual([{ title: 'DSH Control Center', body: '测试对话 已完成' }])
    stop()
  })

  it('stays silent when the assistant preference is disabled', async () => {
    const notification = vi.fn()
    Object.assign(notification, { permission: 'granted' })
    vi.stubGlobal('Notification', notification)
    const sessions = source(state(true))
    const runtime = new ConversationNotificationRuntime(api(false), sessions, () => undefined)
    runtime.start()
    await runtime.refreshPreferences()

    sessions.publish(state(false))

    expect(notification).not.toHaveBeenCalled()
  })
})
