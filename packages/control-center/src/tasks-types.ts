/**
 * Scheduled Tasks types (shared between Host and Client).
 */

import type { ScheduledTask, TaskAction, TaskRunEntry } from './tasks.ts'

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    controlCenterTasks: {
      list(): Promise<{ ok: true; value: ScheduledTask[] } | { ok: false; error: { code: string; message: string; details: object } }>
      listHistory(): Promise<{ ok: true; value: TaskRunEntry[] } | { ok: false; error: { code: string; message: string; details: object } }>
      create(input: { name: string; schedule: string; action: TaskAction }): Promise<{ ok: true; value: ScheduledTask } | { ok: false; error: { code: string; message: string; details: object } }>
      update(taskId: string, patch: { name?: string; schedule?: string; action?: TaskAction; enabled?: boolean }): Promise<{ ok: true; value: ScheduledTask } | { ok: false; error: { code: string; message: string; details: object } }>
      removeTask(taskId: string): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
    }
  }
}

export type { ScheduledTask, TaskAction, TaskRunEntry }
export {}
