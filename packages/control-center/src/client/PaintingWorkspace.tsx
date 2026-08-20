/**
 * Painting workspace — Cherry paintings page parity: session strip rail,
 * template showcase, artboard, prompt dock with params/quick-panel.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { PaintingCatalogModel, PaintingHistoryItem, PaintingImageRef, PaintingJobView } from '../painting-types.ts'
import css from './PaintingWorkspace.module.css'
import { PaintingArtboard } from './PaintingArtboard.tsx'
import {
  DEFAULT_PAINTING_PARAMS, loadPaintingPrompts, PaintingComposer, paramsSummary, savePaintingPrompts,
  type PaintingAttachment, type PaintingParams, type PaintingPromptEntry,
} from './PaintingComposer.tsx'
import { PaintingShowcase } from './PaintingShowcase.tsx'
import { PaintingStrip } from './PaintingStrip.tsx'

export interface PaintWorkspaceInjected {
  getPainting: () => NonNullable<ClientRemote['controlCenterPainting']>
  hooks: { paintingReady: HostObservable<boolean> }
}

export type PaintingWorkspaceProps = PropsRuntime<'application.surface', 'painting'> & InjectFace<PaintWorkspaceInjected>

interface CurrentSession {
  /** null = brand-new draft; otherwise the history row this session maps to. */
  historyId: string | null
  prompt: string
  images: readonly PaintingImageRef[]
  createdAt: number
}

function createDraft(): CurrentSession {
  return { historyId: null, prompt: '', images: [], createdAt: Date.now() }
}

/** Full Painting workspace over the real Control Center painting service. */
export function PaintingWorkspace({ getPainting, usePaintingReady, close }: PaintingWorkspaceProps) {
  const paintingReady = usePaintingReady(value => value)
  const painting = paintingReady ? getPainting() : undefined
  const [catalog, setCatalog] = useState<readonly PaintingCatalogModel[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [current, setCurrent] = useState<CurrentSession>(createDraft)
  const [history, setHistory] = useState<PaintingHistoryItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [job, setJob] = useState<PaintingJobView | null>(null)
  const [params, setParams] = useState<PaintingParams>(DEFAULT_PAINTING_PARAMS)
  const [attachments, setAttachments] = useState<PaintingAttachment[]>([])
  const [prompts, setPrompts] = useState<PaintingPromptEntry[]>(loadPaintingPrompts)
  const [error, setError] = useState<string | null>(null)

  const running = job?.status === 'running'

  const modelOptions = useMemo(() => {
    const seen = new Map<string, PaintingCatalogModel>()
    for (const model of catalog) {
      const key = `${model.providerId}/${model.id}`
      if (!seen.has(key)) seen.set(key, model)
    }
    return [...seen.values()].map(model => ({
      value: `${model.providerId}/${model.id}`,
      label: `${model.providerId} · ${model.label}`,
    }))
  }, [catalog])

  const refreshHistory = useCallback(async (cursor: string | null, append = false): Promise<void> => {
    if (painting === undefined) return
    const result = await painting.history(cursor, 30)
    if (!result.ok) { setError(result.error.message); return }
    setHistory(previous => append ? [...previous, ...result.value.items] : result.value.items)
    setNextCursor(result.value.nextCursor ?? null)
  }, [painting])

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
    void refreshHistory(null)
    return () => { active = false }
  }, [paintingReady, painting, selectedModel, refreshHistory])

  // Poll the running job.
  useEffect(() => {
    if (job?.status !== 'running' || painting === undefined) return
    const timer = window.setInterval(() => {
      void painting.get(job.jobId).then(result => {
        if (!result.ok) { setError(result.error.message); return }
        const view = result.value
        setJob(view)
        if (view.status === 'completed') {
          setCurrent(session => ({
            historyId: view.historyId ?? session.historyId,
            prompt: view.prompt,
            images: view.createdImages,
            createdAt: Date.now(),
          }))
          void refreshHistory(null)
        }
      })
    }, 250)
    return () => { window.clearInterval(timer) }
  }, [job?.jobId, job?.status, painting, refreshHistory])

  const generate = useCallback(async (): Promise<void> => {
    if (painting === undefined || selectedModel === '' || current.prompt.trim() === '') return
    setError(null)
    const [providerId, model] = selectedModel.split('/') as [string, string]
    const requestParams: Record<string, unknown> = {}
    if (params.size !== 'auto') requestParams.size = params.size
    if (params.quality !== 'auto') requestParams.quality = params.quality
    if (params.background !== 'auto') requestParams.background = params.background
    if (attachments.length > 0) requestParams.images = attachments.map(attachment => attachment.dataUrl)
    const result = await painting.start({
      providerId, model,
      prompt: current.prompt,
      params: requestParams,
      sampleCount: params.count,
    })
    if (!result.ok) { setError(result.error.message); return }
    const view = await painting.get(result.value.jobId)
    if (!view.ok) { setError(view.error.message); return }
    setJob(view.value)
    setAttachments([])
  }, [painting, selectedModel, current.prompt, params, attachments])

  const pause = useCallback(async (): Promise<void> => {
    if (job === null || !running) return
    const result = await painting!.cancel(job.jobId)
    if (!result.ok) { setError(result.error.message); return }
    setJob(result.value)
  }, [job, running, painting])

  const selectSession = useCallback((id: string): void => {
    const item = history.find(row => row.id === id)
    if (item === undefined) return
    setJob(null)
    setCurrent({ historyId: item.id, prompt: item.prompt, images: item.images, createdAt: item.createdAt })
  }, [history])

  const newSession = useCallback((): void => {
    setJob(null)
    setCurrent(createDraft())
  }, [])

  const deleteSession = useCallback(async (id: string): Promise<void> => {
    if (painting === undefined) return
    const result = await painting.deleteHistory(id)
    if (!result.ok) { setError(result.error.message); return }
    setHistory(current => current.filter(item => item.id !== id))
    if (current.historyId === id) setCurrent(createDraft())
  }, [painting, current.historyId])

  const addAttachment = useCallback((file: File): void => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      setAttachments(current => [...current, { name: file.name, dataUrl: String(reader.result) }])
    }
    reader.readAsDataURL(file)
  }, [])

  const addPrompt = useCallback((title: string, content: string): void => {
    setPrompts(current => {
      const next = [...current, { id: `prompt-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, title, content }]
      savePaintingPrompts(next)
      return next
    })
  }, [])

  const deletePrompt = useCallback((id: string): void => {
    setPrompts(current => {
      const next = current.filter(entry => entry.id !== id)
      savePaintingPrompts(next)
      return next
    })
  }, [])

  const showShowcase = current.historyId === null && current.images.length === 0 && attachments.length === 0 && !running && job === null

  if (!paintingReady) {
    return <main className=" cc-surface"><p role="status" style={{ padding: 24 }}>正在连接绘画服务…</p></main>
  }

  return (
    <main className={`${css.root} cc-surface`}>
      <div className={css.frame}>
        <div className={css.surface}>
          <PaintingStrip
            history={history}
            selectedId={current.historyId}
            generating={running}
            hasMore={nextCursor !== null}
            onNew={newSession}
            onSelect={selectSession}
            onDelete={(id) => { void deleteSession(id) }}
            onLoadMore={() => { void refreshHistory(nextCursor, true) }}
            onClose={close}
          />
          <div className={css.centerPane}>
            <div className={css.centerStage}>
              {showShowcase ? (
                <PaintingShowcase onSelect={(prompt) => { setCurrent(session => ({ ...session, prompt })) }} />
              ) : (
                <PaintingArtboard
                  prompt={current.prompt}
                  images={current.images}
                  sizeLabel={paramsSummary(params).split(' · ').pop() ?? ''}
                  generating={running}
                  progress={job?.progress ?? 0}
                />
              )}
            </div>
            <div className={css.promptDock}>
              <div className={css.promptDockInner}>
                {error === null ? null : <div className={css.errorBanner} role="alert">{error}</div>}
                <PaintingComposer
                  models={modelOptions}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  prompt={current.prompt}
                  onPromptChange={(value) => { setCurrent(session => ({ ...session, prompt: value })) }}
                  attachments={attachments}
                  onAddAttachment={addAttachment}
                  onRemoveAttachment={(index) => { setAttachments(current => current.filter((_, itemIndex) => itemIndex !== index)) }}
                  params={params}
                  onParamsChange={(patch) => { setParams(current => ({ ...current, ...patch })) }}
                  prompts={prompts}
                  onAddPrompt={addPrompt}
                  onDeletePrompt={deletePrompt}
                  running={running}
                  canSend={selectedModel !== '' && (current.prompt.trim() !== '' || attachments.length > 0)}
                  onSend={() => { void generate() }}
                  onPause={() => { void pause() }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
