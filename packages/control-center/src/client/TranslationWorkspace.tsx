import { useEffect, useMemo, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote, ModelProviderGroup } from '@deepseek-ai/dsh-api-remotes/client'
import type { TranslationHistoryItem, TranslationJobView, TranslationLanguage, TranslationModelSelection } from '../translation-types.ts'
import css from './TranslationWorkspace.module.css'

export interface TranslationWorkspaceInjected {
  getTranslation: () => NonNullable<ClientRemote['controlCenterTranslation']>
  listModels: () => Promise<readonly ModelProviderGroup[]>
  hooks: { translationReady: HostObservable<boolean> }
}

export type TranslationWorkspaceProps = PropsRuntime<'application.surface', 'translation'> & InjectFace<TranslationWorkspaceInjected>

function modelOptions(groups: readonly ModelProviderGroup[]) {
  return groups.flatMap(group => group.models.map(model => ({
    value: `${group.id}/${model.id}`,
    label: `${group.name} · ${model.name}`,
    selection: {
      provider: group.id,
      model: model.id,
      ...(model.reasoning?.defaultEffort === undefined ? {} : { reasoningEffort: model.reasoning.defaultEffort }),
    } satisfies TranslationModelSelection,
  })))
}

/** Full Translation product workspace over the Control Center Host service. */
export function TranslationWorkspace({ getTranslation, listModels, useTranslationReady, close }: TranslationWorkspaceProps) {
  const translationReady = useTranslationReady(value => value)
  const translation = translationReady ? getTranslation() : undefined
  const [languages, setLanguages] = useState<TranslationLanguage[]>([])
  const [sourceLanguage, setSourceLanguage] = useState('auto')
  const [targetLanguage, setTargetLanguage] = useState('zh-CN')
  const [models, setModels] = useState<readonly ModelProviderGroup[]>([])
  const [selection, setSelection] = useState<TranslationModelSelection | null>(null)
  const [input, setInput] = useState('')
  const [job, setJob] = useState<TranslationJobView | null>(null)
  const [history, setHistory] = useState<TranslationHistoryItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const options = useMemo(() => modelOptions(models), [models])

  const refreshHistory = async (cursor: string | null, append = false): Promise<void> => {
    const result = await translation!.history(cursor, 20)
    if (!result.ok) throw new Error(result.error.message)
    setHistory(previous => append ? [...previous, ...result.value.items] : result.value.items)
    setNextCursor(result.value.nextCursor ?? null)
  }

  useEffect(() => {
    if (!translationReady) return
    let active = true
    void listModels().then((groups) => {
      if (!active) return
      setModels(groups)
      setSelection(current => current ?? modelOptions(groups)[0]?.selection ?? null)
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : String(reason)) })
    void Promise.all([translation!.languages(), translation!.history(null, 20)])
      .then(([languageResult, historyResult]) => {
        if (!active) return
        if (!languageResult.ok) throw new Error(languageResult.error.message)
        if (!historyResult.ok) throw new Error(historyResult.error.message)
        setLanguages(languageResult.value.source)
        setHistory(historyResult.value.items)
        setNextCursor(historyResult.value.nextCursor ?? null)
      })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : String(reason)) })
    return () => { active = false }
  }, [listModels, translation, translationReady])

  useEffect(() => {
    if (job?.status !== 'running') return
    const timer = window.setInterval(() => {
      void translation!.get(job.jobId).then((result) => {
        if (!result.ok) { setError(result.error.message); return }
        setJob(result.value)
        if (result.value.status === 'completed') void refreshHistory(null).catch(reason => { setError(String(reason)) })
      })
    }, 250)
    return () => { window.clearInterval(timer) }
  }, [job?.jobId, job?.status, translation])

  const translate = async (): Promise<void> => {
    if (selection === null || input.trim() === '') return
    setError(null)
    const result = await translation!.start({ sourceLanguage, targetLanguage, text: input, selection })
    if (!result.ok) { setError(result.error.message); return }
    const view = await translation!.get(result.value.jobId)
    if (!view.ok) { setError(view.error.message); return }
    setJob(view.value)
  }

  const addLanguage = async (): Promise<void> => {
    const id = window.prompt('Language id')?.trim()
    if (!id) return
    const label = window.prompt('Language label', id)?.trim()
    if (!label) return
    const result = await translation!.putLanguage(id, label)
    if (!result.ok) { setError(result.error.message); return }
    setLanguages(current => [...current, result.value].sort((left, right) => left.label.localeCompare(right.label)))
  }

  if (!translationReady) {
    return <main className={` cc-surface`}><p role="status">正在连接翻译服务…</p></main>
  }

  return (
    <main className={` cc-surface`}>
      <header className={css.header}>
        <div><p className={css.eyebrow}>DSH Control Center</p><h1>翻译</h1></div>
        <button type="button" className={css.secondary} onClick={close}>返回对话</button>
      </header>
      {error === null ? null : <p role="alert" className={css.error}>{error}</p>}
      <div className={css.toolbar}>
        <select aria-label="源语言" value={sourceLanguage} onChange={event => { setSourceLanguage(event.target.value) }}>
          {languages.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <button type="button" className={css.swap} onClick={() => {
          if (sourceLanguage === 'auto') return
          setSourceLanguage(targetLanguage); setTargetLanguage(sourceLanguage)
        }}>⇄</button>
        <select aria-label="目标语言" value={targetLanguage} onChange={event => { setTargetLanguage(event.target.value) }}>
          {languages.filter(item => item.id !== 'auto').map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <button type="button" className={css.secondary} onClick={() => { void addLanguage() }}>管理语言</button>
        <select aria-label="翻译模型" value={selection === null ? '' : `${selection.provider}/${selection.model}`} onChange={event => {
          setSelection(options.find(item => item.value === event.target.value)?.selection ?? null)
        }}>
          {options.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      <div className={css.panes}>
        <section className={css.pane}>
          <textarea aria-label="待翻译文本" value={input} onChange={event => { setInput(event.target.value) }} placeholder="输入要翻译的内容" />
          <div className={css.actions}><span>{input.length} 字符</span><button type="button" disabled={selection === null || input.trim() === '' || job?.status === 'running'} onClick={() => { void translate() }}>翻译</button></div>
        </section>
        <section className={css.pane}>
          <textarea aria-label="翻译结果" readOnly value={job?.output ?? ''} placeholder="翻译结果将在这里流式显示" />
          {job?.failure === undefined ? null : <p role="alert" className={css.error}>{job.failure.message}</p>}
          <div className={css.actions}>
            <span>{job?.status === 'running' ? '翻译中…' : job?.status === 'error' ? '失败' : job?.status === 'cancelled' ? '已取消' : ''}</span>
            {job?.status === 'running' ? <button type="button" className={css.secondary} onClick={() => { void translation!.cancel(job.jobId).then(result => { if (result.ok) setJob(result.value) }) }}>取消</button> : null}
            <button type="button" className={css.secondary} disabled={!job?.output} onClick={() => { void navigator.clipboard.writeText(job?.output ?? '') }}>复制</button>
            <button type="button" className={css.secondary} disabled={!job?.output} onClick={() => { setInput(job?.output ?? '') }}>替换原文</button>
          </div>
        </section>
      </div>
      <aside className={css.history}>
        <h2>翻译历史</h2>
        {history.length === 0 ? <p className={css.empty}>暂无历史</p> : history.map(item => <article key={item.id} className={css.historyItem}>
          <div><strong>{item.sourceLanguage} → {item.targetLanguage}</strong><time>{new Date(item.createdAt).toLocaleString()}</time></div>
          <p>{item.sourceText}</p><p>{item.translatedText}</p>
          <button type="button" className={css.link} onClick={() => { setInput(item.sourceText); setSourceLanguage(item.sourceLanguage); setTargetLanguage(item.targetLanguage) }}>复用</button>
          <button type="button" className={css.link} onClick={() => { void translation!.deleteHistory(item.id).then(result => { if (result.ok) setHistory(current => current.filter(row => row.id !== item.id)) }) }}>删除</button>
        </article>)}
        {nextCursor === null ? null : <button type="button" className={css.secondary} onClick={() => { void refreshHistory(nextCursor, true).catch(reason => { setError(String(reason)) }) }}>加载更多</button>}
      </aside>
    </main>
  )
}
