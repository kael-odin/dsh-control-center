import { useEffect, useMemo, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { PaintingCatalogModel, PaintingHistoryItem, PaintingImageRef, PaintingJobView } from '../painting-types.ts'
import css from './PaintingWorkspace.module.css'

export interface PaintWorkspaceInjected {
  getPainting: () => NonNullable<ClientRemote['controlCenterPainting']>
  hooks: { paintingReady: HostObservable<boolean> }
}

export type PaintingWorkspaceProps = PropsRuntime<'application.surface', 'painting'> & InjectFace<PaintWorkspaceInjected>

/** Full Painting workspace over the real Control Center painting service. */
export function PaintingWorkspace({ getPainting, usePaintingReady, close }: PaintingWorkspaceProps) {
  const paintingReady = usePaintingReady(value => value)
  const painting = paintingReady ? getPainting() : undefined
  const [catalog, setCatalog] = useState<PaintingCatalogModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [sampleCount, setSampleCount] = useState(1)
  const [job, setJob] = useState<PaintingJobView | null>(null)
  const [history, setHistory] = useState<PaintingHistoryItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const modelOptions = useMemo(() => {
    const seen = new Map<string, PaintingCatalogModel>()
    for (const model of catalog) {
      const key = `${model.providerId}/${model.id}`
      if (!seen.has(key)) seen.set(key, model)
    }
    return [...seen.values()].map(model => ({
      value: `${model.providerId}/${model.id}`,
      label: `${model.providerId} · ${model.label}`,
      providerId: model.providerId,
      id: model.id,
    }))
  }, [catalog])

  useEffect(() => {
    if (!paintingReady || painting === undefined) return
    let active = true
    void painting.catalog()
      .then((catalogResult) => {
        if (!active) return
        if (!catalogResult.ok) throw new Error(catalogResult.error.message)
        setCatalog(catalogResult.value.models)
        if (catalogResult.value.models.length > 0 && selectedModel === '') {
          const first = catalogResult.value.models[0]!
          setSelectedModel(`${first.providerId}/${first.id}`)
        }
      })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : String(reason)) })
    void painting.listHistory(null, 20)
      .then(historyResult => {
        if (!active) return
        if (!historyResult.ok) throw new Error(historyResult.error.message)
        setHistory(historyResult.value.items)
        setNextCursor(historyResult.value.nextCursor ?? null)
      })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : String(reason)) })
    return () => { active = false }
  }, [paintingReady, painting, selectedModel])

  useEffect(() => {
    if (job?.status !== 'running' || painting === undefined) return
    const timer = window.setInterval(() => {
      void painting.get(job.jobId).then(result => {
        if (!result.ok) { setError(result.error.message); return }
        setJob(result.value)
        if (result.value.status === 'completed') {
          void painting.listHistory(null, 20).then(historyResult => {
            if (historyResult.ok) {
              setHistory(historyResult.value.items)
              setNextCursor(historyResult.value.nextCursor ?? null)
            }
          })
        }
      })
    }, 250)
    return () => { window.clearInterval(timer) }
  }, [job?.jobId, job?.status, painting])

  const generate = async (): Promise<void> => {
    if (painting === undefined || selectedModel === '' || prompt.trim() === '') return
    setError(null)
    const [providerId, model] = selectedModel.split('/') as [string, string]
    const result = await painting.start({
      providerId, model,
      prompt,
      params: { size: '1024x1024' },
      sampleCount,
    })
    if (!result.ok) { setError(result.error.message); return }
    const view = await painting.get(result.value.jobId)
    if (!view.ok) { setError(view.error.message); return }
    setJob(view.value)
  }

  const cancel = async (): Promise<void> => {
    if (painting === undefined || job === null) return
    const result = await painting.cancel(job.jobId)
    if (!result.ok) { setError(result.error.message); return }
    setJob(result.value)
  }

  const download = (image: PaintingImageRef): void => {
    const anchor = document.createElement('a')
    anchor.href = image.dataUrl
    anchor.download = `generated-${image.attachmentId}.png`
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
  }

  const deleteHistoryItem = async (id: string): Promise<void> => {
    if (painting === undefined) return
    const result = await painting.deleteHistory(id)
    if (!result.ok) { setError(result.error.message); return }
    setHistory(current => current.filter(item => item.id !== id))
  }

  if (!paintingReady) {
    return <main className={css.root}><p role="status">正在连接绘画服务…</p></main>
  }

  return (
    <main className={css.root}>
      <header className={css.header}>
        <div><p className={css.eyebrow}>DSH Control Center</p><h1>绘画</h1></div>
        <button type="button" className={css.secondary} onClick={close}>返回对话</button>
      </header>
      {error === null ? null : <p role="alert" className={css.error}>{error}</p>}
      <div className={css.composer}>
        <textarea
          aria-label="绘画提示词"
          value={prompt}
          onChange={event => { setPrompt(event.target.value) }}
          placeholder="描述你想要生成的图像"
        />
        <div className={css.controls}>
          <select aria-label="图像模型" value={selectedModel} onChange={event => { setSelectedModel(event.target.value) }}>
            {modelOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select aria-label="图像数量" value={String(sampleCount)} onChange={event => { setSampleCount(Number(event.target.value)) }}>
            {[1, 2, 4].map(n => <option key={n} value={String(n)}>{n}</option>)}
          </select>
          {job?.status !== 'running'
            ? <button type="button" disabled={selectedModel === '' || prompt.trim() === ''} onClick={() => { void generate() }}>生成</button>
            : <button type="button" className={css.secondary} onClick={() => { void cancel() }}>取消</button>}
        </div>
        {job !== null && job.status === 'running' && <p role="status" className={css.progress}>生成中… {Math.round(job.progress * 100)}%</p>}
        {job !== null && job.status === 'error' && <p role="alert" className={css.error}>{job.error ?? '生成失败'}</p>}
      </div>
      {job?.createdImages.length !== undefined && job.createdImages.length > 0 && (
        <section className={css.gallery} aria-label="本次生成结果">
          {job.createdImages.map(image => (
            <figure key={image.attachmentId} className={css.figure}>
              <img src={image.dataUrl} alt={job.prompt} width={image.width} height={image.height} />
              <figcaption>
                <button type="button" className={css.link} onClick={() => { download(image) }}>下载</button>
                <button type="button" className={css.link} onClick={() => { setPrompt(job.prompt) }}>复用</button>
              </figcaption>
            </figure>
          ))}
        </section>
      )}
      <aside className={css.history}>
        <h2>绘画历史</h2>
        {history.length === 0 ? <p className={css.empty}>暂无历史</p> : history.map(item => (
          <article key={item.id} className={css.historyItem}>
            <div><strong>{item.prompt}</strong><time>{new Date(item.createdAt).toLocaleString()}</time></div>
            <div className={css.historyImages}>
              {item.images.map(image => (
                <figure key={image.attachmentId} className={css.figure}>
                  <img src={image.dataUrl} alt={item.prompt} width={image.width} height={image.height} />
                </figure>
              ))}
            </div>
            <button type="button" className={css.link} onClick={() => { setPrompt(item.prompt) }}>复用</button>
            <button type="button" className={css.link} onClick={() => { void deleteHistoryItem(item.id) }}>删除</button>
          </article>
        ))}
        {nextCursor === null ? null : (
          <button type="button" className={css.secondary} onClick={() => {
            if (painting === undefined) return
            void painting.listHistory(nextCursor, 20).then(result => {
              if (!result.ok) { setError(result.error.message); return }
              setHistory(current => [...current, ...result.value.items])
              setNextCursor(result.value.nextCursor ?? null)
            })
          }}>加载更多</button>
        )}
      </aside>
    </main>
  )
}
