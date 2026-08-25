/**
 * Scheduled Tasks settings section: cron tasks with a real host scheduler.
 */

import { useCallback, useEffect, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { ScheduledTask, TaskAction, TaskRunEntry } from '../tasks-types.ts'
import css from './TasksSection.module.css'

export interface TasksSectionInjected {
  getTasks: () => NonNullable<ClientRemote['controlCenterTasks']>
  hooks: { tasksReady: HostObservable<boolean> }
}

export type TasksSectionProps = PropsRuntime<'settings.section'> & InjectFace<TasksSectionInjected>

function unwrap<T>(result: { ok: true; value: T } | { ok: false; error: { code: string; message: string; details: object } }): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

export function TasksSection({ getTasks, useTasksReady }: TasksSectionProps) {
  const tasksReady = useTasksReady(value => value)
  const tasks = tasksReady ? getTasks() : undefined
  const [list, setList] = useState<ScheduledTask[]>([])
  const [history, setHistory] = useState<TaskRunEntry[]>([])
  const [name, setName] = useState('')
  const [schedule, setSchedule] = useState('0 9 * * *')
  const [actionKind, setActionKind] = useState<'command' | 'notification'>('notification')
  const [actionText, setActionText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback((): void => {
    if (tasks === undefined) return
    void Promise.all([tasks.list(), tasks.listHistory()]).then(([t, h]) => {
      setList(unwrap(t))
      setHistory(unwrap(h))
    }).catch(reason => setError(reason instanceof Error ? reason.message : String(reason)))
  }, [tasks])

  useEffect(() => {
    refresh()
  }, [refresh, tasks !== undefined]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (): Promise<void> => {
    if (tasks === undefined || name.trim() === '' || actionText.trim() === '') return
    setError(null)
    const action: TaskAction = actionKind === 'command'
      ? { kind: 'command', command: actionText.trim() }
      : { kind: 'notification', message: actionText.trim() }
    try {
      unwrap(await tasks.create({ name: name.trim(), schedule: schedule.trim(), action }))
      setName('')
      setActionText('')
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleToggle = async (taskId: string, enabled: boolean): Promise<void> => {
    if (tasks === undefined) return
    try {
      unwrap(await tasks.update(taskId, { enabled }))
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleRemove = async (taskId: string, taskName: string): Promise<void> => {
    if (tasks === undefined) return
    if (!window.confirm(`删除任务 "${taskName}" 吗？`)) return
    try {
      unwrap(await tasks.removeTask(taskId))
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className={css.root}>
      <div>
        <h2 className={css.pageTitle}>定时任务</h2>
        <p className={css.pageDescription}>按 cron 计划执行通知或命令，任务每分钟自动调度。</p>
      </div>

      {error !== null && <div className="cc-notice-error">{error}</div>}

      <div className={css.card}>
        <div className={css.cardTitle}>新建任务</div>
        <div className="cc-field-row">
          <div className="cc-field-label">名称</div>
          <input className={css.input} value={name} placeholder="例如：每日早晨提醒" onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="cc-field-row">
          <div className="cc-field-label">
            Cron 表达式
            <div className="cc-field-hint">5 字段：分 时 日 月 周（如 0 9 * * * = 每天 09:00）</div>
          </div>
          <input className={css.input} value={schedule} onChange={(e) => setSchedule(e.target.value)} />
        </div>
        <div className="cc-field-row">
          <div className="cc-field-label">动作类型</div>
          <select className={css.select} value={actionKind} onChange={(e) => setActionKind(e.target.value as 'command' | 'notification')}>
            <option value="notification">通知（记录运行历史）</option>
            <option value="command">命令（通过 DSH subprocess 执行）</option>
          </select>
        </div>
        <div className="cc-field-row">
          <div className="cc-field-label">{actionKind === 'command' ? '命令' : '消息'}</div>
          <input
            className={css.input}
            value={actionText}
            placeholder={actionKind === 'command' ? '例如：echo hello' : '例如：该休息一下了'}
            onChange={(e) => setActionText(e.target.value)}
          />
        </div>
        <div>
          <button type="button" className="cc-btn cc-btn-primary" onClick={() => void handleCreate()}>
            创建任务
          </button>
        </div>
      </div>

      <div className={css.card}>
        <div className={css.cardTitle}>任务列表（{list.length}）</div>
        {list.length === 0 ? (
          <div className="cc-empty">
            <div className="cc-empty-title">暂无计划任务</div>
            <div className="cc-empty-description">在上方创建第一个任务</div>
          </div>
        ) : list.map(task => (
          <div key={task.id} className={css.taskRow}>
            <div className={css.taskMain}>
              <div className={css.taskName}>{task.name}</div>
              <div className={css.taskMeta}>
                {task.schedule} · {task.action.kind === 'command' ? '命令' : '通知'} · 上次运行：{task.lastRunAt === null ? '从未' : new Date(task.lastRunAt).toLocaleString()}
              </div>
            </div>
            <label className={css.select} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={task.enabled}
                onChange={(e) => void handleToggle(task.id, e.target.checked)}
                className="cc-checkbox"
              />
              {task.enabled ? '启用' : '停用'}
            </label>
            <button type="button" className="cc-btn cc-btn-danger" onClick={() => void handleRemove(task.id, task.name)}>
              删除
            </button>
          </div>
        ))}
      </div>

      <div className={css.card}>
        <div className={css.cardTitle}>运行历史</div>
        {history.length === 0 ? (
          <div className="cc-empty"><div className="cc-empty-description">暂无运行记录</div></div>
        ) : history.slice(0, 10).map((entry, index) => (
          <div key={`${entry.ranAt}-${index}`} className={css.runRow}>
            <span className={entry.ok ? css.runOk : css.runFail}>{entry.ok ? '✓' : '✗'}</span>
            <span className={css.runTime}>{new Date(entry.ranAt).toLocaleString()}</span>
            <span className={css.runDetail}>{entry.detail}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
