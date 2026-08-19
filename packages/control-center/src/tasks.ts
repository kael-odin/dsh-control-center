/**
 * Scheduled Tasks Host service.
 *
 * Persisted cron tasks (settings namespace) with a per-minute host scheduler.
 * Action kinds:
 * - `command`: execute a shell command through the DSH subprocess service
 *   (capability-gated: reports a precise error when subprocess is absent)
 * - `notification`: record a run entry in the task history (self-contained)
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { settingsNamespace, type SettingsScope } from '@deepseek-ai/dsh-settings'
import Schema from '@deepseek-ai/schemastery'

const TASKS_NAMESPACE = settingsNamespace('control-center-tasks')
const TICK_MS = 60 * 1000

export type TaskActionKind = 'command' | 'notification'

export interface ScheduledTask {
  id: string
  name: string
  /** 5-field cron: minute hour day-of-month month day-of-week. */
  schedule: string
  action: TaskAction
  enabled: boolean
  lastRunAt: string | null
  createdAt: string
}

export type TaskAction =
  | { kind: 'command'; command: string }
  | { kind: 'notification'; message: string }

export interface TaskRunEntry {
  taskId: string
  ranAt: string
  ok: boolean
  detail: string
}

interface TasksSettings {
  tasks: ScheduledTask[]
  /** Recent run history, newest first. */
  history: TaskRunEntry[]
}

const MAX_HISTORY = 50

export class TasksService extends Service {
  static inject = ['settings'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterTasks')
  private scope: SettingsScope<TasksSettings>
  private timer: NodeJS.Timeout | undefined
  private ranThisMinute = new Set<string>()
  private lastTickMinute: string | undefined

  constructor(ctx: Context, _config?: { logger?: Context['logger'] }) {
    super(ctx, 'controlCenterTasks')
    this.scope = ctx.settings.register(TASKS_NAMESPACE, Schema.object({
      tasks: Schema.array(Schema.object({
        id: Schema.string(),
        name: Schema.string(),
        schedule: Schema.string(),
        action: Schema.union([
          Schema.object({ kind: Schema.const('command' as const), command: Schema.string() }),
          Schema.object({ kind: Schema.const('notification' as const), message: Schema.string() })
        ]),
        enabled: Schema.boolean().default(true),
        lastRunAt: Schema.string(),
        createdAt: Schema.string()
      })).default([]),
      history: Schema.array(Schema.object({
        taskId: Schema.string(),
        ranAt: Schema.string(),
        ok: Schema.boolean(),
        detail: Schema.string()
      })).default([])
    }), {
      base: { tasks: [], history: [] }
    })
    this.timer = setInterval(() => { void this.tick() }, TICK_MS)
  }

  async list(): Promise<ScheduledTask[]> {
    return this.scope.get().tasks
  }

  async listHistory(): Promise<TaskRunEntry[]> {
    return this.scope.get().history
  }

  async create(input: { name: string; schedule: string; action: TaskAction }): Promise<ScheduledTask> {
    if (!isValidCron(input.schedule)) {
      throw new Error(`Invalid cron schedule: ${input.schedule} (expected 5 fields: minute hour day month weekday)`)
    }
    const task: ScheduledTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: input.name,
      schedule: input.schedule,
      action: input.action,
      enabled: true,
      lastRunAt: null,
      createdAt: new Date().toISOString(),
    }
    await this.scope.update({ tasks: [...this.scope.get().tasks, task] })
    this.ctx.logger.info('Created scheduled task', { id: task.id, name: task.name, schedule: task.schedule })
    return task
  }

  async update(taskId: string, patch: { name?: string; schedule?: string; action?: TaskAction; enabled?: boolean }): Promise<ScheduledTask> {
    const tasks = this.scope.get().tasks
    const index = tasks.findIndex(task => task.id === taskId)
    if (index === -1) throw new Error(`Task not found: ${taskId}`)
    const task = tasks[index]
    if (task === undefined) throw new Error(`Task not found: ${taskId}`)
    if (patch.schedule !== undefined && !isValidCron(patch.schedule)) {
      throw new Error(`Invalid cron schedule: ${patch.schedule}`)
    }
    const updated: ScheduledTask = {
      ...task,
      name: patch.name ?? task.name,
      schedule: patch.schedule ?? task.schedule,
      action: patch.action ?? task.action,
      enabled: patch.enabled ?? task.enabled,
    }
    const next = [...tasks]
    next[index] = updated
    await this.scope.update({ tasks: next })
    return updated
  }

  async remove(taskId: string): Promise<{ absent: true }> {
    const tasks = this.scope.get().tasks
    const next = tasks.filter(task => task.id !== taskId)
    if (next.length === tasks.length) return { absent: true }
    await this.scope.update({ tasks: next })
    return { absent: true }
  }

  /** Fire every due enabled task (per-minute scheduler tick). */
  async tick(): Promise<void> {
    const now = new Date()
    const settings = this.scope.get()
    const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`
    if (this.lastTickMinute !== minuteKey) {
      this.ranThisMinute.clear()
      this.lastTickMinute = minuteKey
    }
    const due = settings.tasks.filter(task => task.enabled && cronMatches(task.schedule, now))
    for (const task of due) {
      if (this.ranThisMinute.has(task.id)) continue
      this.ranThisMinute.add(task.id)
      void this.runTask(task.id)
    }
  }

  private async runTask(taskId: string): Promise<void> {
    const task = this.scope.get().tasks.find(candidate => candidate.id === taskId)
    if (task === undefined) return

    const ranAt = new Date().toISOString()
    let ok = true
    let detail = 'ok'
    try {
      if (task.action.kind === 'notification') {
        detail = `notification: ${task.action.message}`
      } else {
        const subprocess = this.ctx.get('subprocess') as { run?: (options: unknown) => Promise<{ ok: boolean; stderr?: string }> } | undefined
        if (subprocess === undefined) {
          throw new Error('subprocess service is not available in this runtime')
        }
        const result = await subprocess.run?.({ command: task.action.command, timeout: 60_000 })
        if (result === undefined || !result.ok) {
          throw new Error(`command failed: ${result?.stderr ?? 'no result'}`)
        }
      }
    } catch (error) {
      ok = false
      detail = error instanceof Error ? error.message : String(error)
      this.ctx.logger.error('Scheduled task failed', { taskId: task.id, error: detail })
    }

    const tasks = this.scope.get().tasks
    const index = tasks.findIndex(candidate => candidate.id === taskId)
    if (index !== -1 && tasks[index] !== undefined) {
      const next = [...tasks]
      next[index] = { ...tasks[index]!, lastRunAt: ranAt }
      const history = [
        { taskId, ranAt, ok, detail },
        ...this.scope.get().history,
      ].slice(0, MAX_HISTORY)
      await this.scope.update({ tasks: next, history })
    }
  }

  [Symbol.dispose]() {
    if (this.timer !== undefined) {
      clearInterval(this.timer)
      this.timer = undefined
    }
  }
}

/** Match a 5-field cron (minute hour dom month dow) against a date. */
export function cronMatches(cron: string, date: Date): boolean {
  const fields = cron.trim().split(/\s+/)
  if (fields.length !== 5) return false
  const minute = fields[0] ?? ''
  const hour = fields[1] ?? ''
  const dom = fields[2] ?? ''
  const month = fields[3] ?? ''
  const dow = fields[4] ?? ''
  if (!fieldMatches(minute, date.getMinutes())) return false
  if (!fieldMatches(hour, date.getHours())) return false
  if (!fieldMatches(dom, date.getDate())) return false
  if (!fieldMatches(month, date.getMonth() + 1)) return false
  if (!fieldMatches(dow, date.getDay())) return false
  return true
}

function fieldMatches(field: string, value: number): boolean {
  if (field === '*') return true
  for (const part of field.split(',')) {
    const segments = part.split('/')
    const base = segments[0] ?? ''
    const stepRaw = segments[1]
    const step = stepRaw === undefined ? 1 : Number.parseInt(stepRaw, 10)
    if (!Number.isFinite(step) || step < 1) continue
    if (base === '*') {
      if (value % step === 0) return true
      continue
    }
    const segments2 = base.split('-')
    const startRaw = segments2[0] ?? ''
    const endRaw = segments2[1]
    const start = Number.parseInt(startRaw, 10)
    const end = endRaw === undefined ? start : Number.parseInt(endRaw, 10)
    if (Number.isFinite(start) && Number.isFinite(end) && value >= start && value <= end && (value - start) % step === 0) {
      return true
    }
  }
  return false
}

function isValidCron(cron: string): boolean {
  const fields = cron.trim().split(/\s+/)
  return fields.length === 5 && fields.every(field => field.length > 0)
}
