/** Cherry-style document processing and OCR provider settings. */

import { useCallback, useEffect, useState } from 'react'
import type { TypertClientRemote } from '@deepseek-ai/dsh-typert-protocol'
import type {
  FileProcessingConfigView,
  FileProcessingTaskView,
  FileProcessorCredentialView,
  FileProcessorEntry,
  FileProcessorFeature,
  FileProcessorId,
  FileProcessorOverrideInput,
  FileProcessorOverrideView,
  FileProcessorStatus,
} from '../file-processing-types.ts'
import css from './ProcessorSection.module.css'

export interface ProcessorSectionProps {
  feature: FileProcessorFeature
  title: string
  description: string
  service: NonNullable<TypertClientRemote['controlCenterFileProcessing']>
}

type RemoteResult<T> = { ok: true; value: T } | { ok: false; error: { code: string; message: string; details: object } }

function unwrap<T>(result: RemoteResult<T>): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

function featureConfig(
  processor: FileProcessorEntry,
  override: FileProcessorOverrideView | undefined,
  feature: FileProcessorFeature,
): { apiHost: string; modelId: string } {
  const persisted = override?.capabilities?.[feature]
  return {
    apiHost: persisted?.apiHost ?? override?.apiHost ?? processor.apiHostDefaults?.[feature] ?? '',
    modelId: persisted?.modelId ?? override?.model ?? processor.modelDefaults?.[feature] ?? '',
  }
}

function selectedLanguages(override: FileProcessorOverrideView | undefined): string[] {
  return override?.options?.langs ?? override?.languages ?? []
}

function statusCopy(status: FileProcessorStatus | undefined): string {
  if (status === undefined) return '状态未知'
  switch (status.code) {
    case 'ready': return '可用'
    case 'needs-credential': return '需要密钥'
    case 'needs-runtime': return '需要本地运行时'
    case 'unsupported-platform': return '当前平台不支持'
    case 'unavailable': return '暂不可用'
  }
}

const PADDLE_MODELS: Record<FileProcessorFeature, readonly string[]> = {
  image_to_text: ['PP-OCRv6', 'PP-OCRv5'],
  document_to_markdown: ['PaddleOCR-VL-1.6', 'PaddleOCR-VL-1.5', 'PP-StructureV3'],
}

const TERMINAL_TASK_STATUSES = new Set<FileProcessingTaskView['status']>([
  'completed', 'failed', 'cancelled', 'interrupted',
])

function taskStatusCopy(status: FileProcessingTaskView['status']): string {
  switch (status) {
    case 'queued': return '排队中'
    case 'running': return '处理中'
    case 'completed': return '已完成'
    case 'failed': return '失败'
    case 'cancelled': return '已取消'
    case 'interrupted': return '已中断'
  }
}

function formatTaskTime(value: string): string {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

export function ProcessorSection({ feature, title, description, service }: ProcessorSectionProps) {
  const [processors, setProcessors] = useState<FileProcessorEntry[]>([])
  const [config, setConfig] = useState<FileProcessingConfigView | null>(null)
  const [keyDrafts, setKeyDrafts] = useState<Record<string, string>>({})
  const [slotCounts, setSlotCounts] = useState<Record<FileProcessorId, number>>({} as Record<FileProcessorId, number>)
  const [tasks, setTasks] = useState<FileProcessingTaskView[]>([])
  const [taskError, setTaskError] = useState<string | null>(null)
  const [taskResult, setTaskResult] = useState<{ taskId: string; text: string } | null>(null)
  const [taskBusy, setTaskBusy] = useState<Record<string, 'cancel' | 'result'>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [processorResult, configResult] = await Promise.all([service.listProcessors(), service.getConfig()])
      setProcessors(unwrap(processorResult))
      setConfig(unwrap(configResult))
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setLoading(false)
    }
  }, [service])

  useEffect(() => { void load() }, [load])

  const refreshTasks = useCallback(async (): Promise<void> => {
    if (feature !== 'document_to_markdown') return
    try {
      const next = unwrap(await service.listTasks())
      setTasks(next)
      setTaskError(null)
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : String(err))
    }
  }, [feature, service])

  useEffect(() => {
    if (feature !== 'document_to_markdown') return
    void refreshTasks()
    const timer = window.setInterval(() => { void refreshTasks() }, 2_000)
    return () => { window.clearInterval(timer) }
  }, [feature, refreshTasks])

  const setOverride = async (processor: FileProcessorId, override: FileProcessorOverrideInput): Promise<void> => {
    try {
      unwrap(await service.setOverride(processor, override))
      setConfig(previous => previous === null ? previous : {
        ...previous,
        overrides: { ...previous.overrides, [processor]: { ...previous.overrides[processor], ...override } },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const setDefault = async (processor: FileProcessorId): Promise<void> => {
    try {
      unwrap(await service.setDefault(feature, processor))
      setConfig(previous => previous === null ? previous : {
        ...previous,
        ...(feature === 'image_to_text' ? { defaultImageProcessor: processor } : { defaultDocumentProcessor: processor }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const setKeyDraft = (processor: FileProcessorId, slot: number, value: string): void => {
    setKeyDrafts(current => ({ ...current, [`${processor}:${slot}`]: value }))
  }

  const saveKey = async (processor: FileProcessorId, slot: number): Promise<void> => {
    const key = `${processor}:${slot}`
    const value = keyDrafts[key]?.trim() ?? ''
    if (value === '') return
    try {
      unwrap(await service.setApiKey(processor, slot, value))
      setKeyDrafts(current => ({ ...current, [key]: '' }))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const clearKey = async (processor: FileProcessorId, slot: number): Promise<void> => {
    try {
      unwrap(await service.clearApiKey(processor, slot))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const cancelTask = async (taskId: string): Promise<void> => {
    setTaskBusy(current => ({ ...current, [taskId]: 'cancel' }))
    try {
      unwrap(await service.cancelTask(taskId))
      await refreshTasks()
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : String(err))
    } finally {
      setTaskBusy(current => {
        const next = { ...current }
        delete next[taskId]
        return next
      })
    }
  }

  const showTaskResult = async (taskId: string): Promise<void> => {
    setTaskBusy(current => ({ ...current, [taskId]: 'result' }))
    try {
      const result = unwrap(await service.getTaskResult(taskId))
      if (result.text === undefined) {
        setTaskError(result.task.detail ?? '该任务暂时没有可读取的结果。')
        return
      }
      setTaskResult({ taskId, text: result.text })
      setTaskError(null)
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : String(err))
    } finally {
      setTaskBusy(current => {
        const next = { ...current }
        delete next[taskId]
        return next
      })
    }
  }

  if (loading) return <div className={css.loading}>加载中...</div>
  if (error !== null || config === null) return <div className={css.root}><div className="cc-notice-error">{error ?? '加载失败'}</div></div>

  const entries = processors.filter(processor => processor.features.includes(feature))
  const defaultId = feature === 'image_to_text' ? config.defaultImageProcessor : config.defaultDocumentProcessor
  const selectedId = entries.some(processor => processor.id === defaultId) ? defaultId : entries[0]?.id ?? ''

  return (
    <div className={css.root}>
      <div><h2 className={css.pageTitle}>{title}</h2><p className={css.pageDescription}>{description}</p></div>
      <div className={css.card}>
        <div className={css.cardTitle}>默认处理器</div>
        <div className={css.fieldRow}>
          <div className={css.fieldLabel}>用于{feature === 'image_to_text' ? '图片文字识别' : '文档转 Markdown'}的处理器</div>
          <select value={selectedId} onChange={event => { void setDefault(event.target.value as FileProcessorId) }} className={css.select}>
            {entries.map(processor => <option key={processor.id} value={processor.id}>{processor.name}</option>)}
          </select>
        </div>
      </div>

      {feature === 'document_to_markdown' && (
        <div className={css.taskCard}>
          <div className={css.providerHead}>
            <div>
              <div className={css.cardTitle}>远程处理任务</div>
              <div className={css.cardDescription}>远程文档解析会在主机后台继续运行，任务状态和结果保存在 DSH 运行时。</div>
            </div>
            <button type="button" className={css.linkButton} onClick={() => { void refreshTasks() }}>刷新</button>
          </div>
          {taskError !== null && <div className="cc-notice-error">{taskError}</div>}
          {tasks.length === 0 ? (
            <div className={css.taskEmpty}>暂无远程处理任务</div>
          ) : (
            <div className={css.taskList}>
              {tasks.map(task => {
                const processor = processors.find(entry => entry.id === task.processor)
                const busy = taskBusy[task.taskId]
                const terminal = TERMINAL_TASK_STATUSES.has(task.status)
                return (
                  <div key={task.taskId} className={css.taskRow}>
                    <div className={css.taskMain}>
                      <div className={css.taskName}>{processor?.name ?? task.processor}</div>
                      <div className={css.taskMeta}>
                        {taskStatusCopy(task.status)} · {task.progress}% · 更新于 {formatTaskTime(task.updatedAt)}
                      </div>
                      {task.detail !== undefined && <div className={css.taskDetail}>{task.detail}</div>}
                      <div className={`${css.taskStatus} ${css[`taskStatus_${task.status}`]}`}>{task.taskId}</div>
                    </div>
                    <div className={css.taskActions}>
                      {!terminal && (
                        <button type="button" className={css.iconButton} disabled={busy !== undefined} onClick={() => { void cancelTask(task.taskId) }}>
                          {busy === 'cancel' ? '取消中...' : '取消'}
                        </button>
                      )}
                      {task.resultAvailable && (
                        <button type="button" className={css.iconButton} disabled={busy !== undefined} onClick={() => { void showTaskResult(task.taskId) }}>
                          {busy === 'result' ? '读取中...' : '查看结果'}
                        </button>
                      )}
                    </div>
                    {taskResult?.taskId === task.taskId && (
                      <pre className={css.taskResult}>{taskResult.text}</pre>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {entries.map(processor => {
        const override = config.overrides[processor.id]
        const settings = featureConfig(processor, override, feature)
        const languages = selectedLanguages(override)
        const hasEndpoint = settings.apiHost !== '' || settings.modelId !== ''
        const languageSelection = languages.length === 0 ? ['auto'] : languages
        const status = processor.status[feature]
        const credentialViews = config.credentials[processor.id] ?? []
        const slotCount = Math.max(credentialViews.length, slotCounts[processor.id] ?? 1)
        const slots = Array.from({ length: slotCount }, (_, index) => credentialViews[index] ?? ({
          ref: '', configured: false, writable: true,
        } satisfies FileProcessorCredentialView))
        return (
          <div key={processor.id} className={css.card}>
            <div className={css.providerHead}>
              <div>
                <div className={css.cardTitle}>{processor.name}</div>
                <div className={css.cardDescription}>{processor.description}</div>
              </div>
              {processor.apiKeyWebsite !== null && <a className={css.providerLink} href={processor.apiKeyWebsite} target="_blank" rel="noreferrer">获取密钥</a>}
            </div>
            <div className={`${css.status} ${css[`status_${status?.code ?? 'unavailable'}`]}`}>
              <span>{statusCopy(status)}</span><span>{status?.message ?? '此处理器尚未报告运行时状态。'}</span>
            </div>

            {processor.requiresLocalModel && (
              <div className={css.localModelNotice}>
                本地 OCR 仅在已安装实际模型运行时的桌面环境可用；浏览器设置不会模拟下载状态。
              </div>
            )}

            {processor.requiresApiKey && (
              <div className={css.apiKeyStack}>
                <div className={css.fieldLabel}>API 密钥</div>
                {slots.map((slot, index) => {
                  const key = `${processor.id}:${index}`
                  return (
                    <div key={key} className={css.apiKeyRow}>
                      <input
                        type="password"
                        value={keyDrafts[key] ?? ''}
                        placeholder={slot.configured ? '已配置，输入新值以替换' : '输入 API 密钥'}
                        disabled={!slot.writable}
                        onChange={event => { setKeyDraft(processor.id, index, event.target.value) }}
                        onBlur={() => { void saveKey(processor.id, index) }}
                        className={css.input}
                      />
                      <span className={slot.configured ? css.keyConfigured : css.keyMissing}>{slot.configured ? '已配置' : '未配置'}</span>
                      {slot.configured && slot.writable && <button type="button" className={css.iconButton} onClick={() => { void clearKey(processor.id, index) }}>清除</button>}
                    </div>
                  )
                })}
                <button type="button" className={css.iconButton} onClick={() => {
                  setSlotCounts(current => ({ ...current, [processor.id]: slotCount + 1 }))
                }}>添加密钥槽</button>
              </div>
            )}

            {hasEndpoint && (
              <>
                <div className={css.fieldRow}>
                  <div className={css.fieldLabel}>API 地址</div>
                  <input
                    type="url"
                    defaultValue={settings.apiHost}
                    placeholder={processor.apiHostDefaults?.[feature] ?? 'https://example.com'}
                    onBlur={event => { void setOverride(processor.id, {
                      capabilities: { ...override?.capabilities, [feature]: { ...override?.capabilities?.[feature], apiHost: event.target.value.trim() } },
                    }) }}
                    className={css.input}
                  />
                </div>
                {settings.modelId !== '' && (
                  <div className={css.fieldRow}>
                    <div className={css.fieldLabel}>模型</div>
                    {processor.id === 'paddleocr' ? (
                      <select
                        defaultValue={settings.modelId}
                        onChange={event => { void setOverride(processor.id, {
                          capabilities: { ...override?.capabilities, [feature]: { ...override?.capabilities?.[feature], modelId: event.target.value } },
                        }) }}
                        className={css.select}
                      >
                        {PADDLE_MODELS[feature].map(model => <option key={model} value={model}>{model}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        defaultValue={settings.modelId}
                        placeholder={processor.modelDefaults?.[feature] ?? '模型 ID'}
                        onBlur={event => { void setOverride(processor.id, {
                          capabilities: { ...override?.capabilities, [feature]: { ...override?.capabilities?.[feature], modelId: event.target.value.trim() } },
                        }) }}
                        className={css.input}
                      />
                    )}
                  </div>
                )}
              </>
            )}

            {processor.languageOptions.length > 0 && (
              <div className={css.languageGroup}>
                <div className={css.fieldLabel}>识别语言</div>
                <div className={css.languageOptions}>
                  {processor.languageOptions.map(language => {
                    const checked = languageSelection.includes(language)
                    return <label key={language} className={css.languageOption}><input type="checkbox" checked={checked} onChange={event => {
                      const next = event.target.checked
                        ? [...new Set([...languageSelection.filter(value => value !== 'auto'), language])]
                        : languageSelection.filter(value => value !== language)
                      void setOverride(processor.id, { options: { ...override?.options, langs: next.length === 0 ? ['auto'] : next } })
                    }} />{language}</label>
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
