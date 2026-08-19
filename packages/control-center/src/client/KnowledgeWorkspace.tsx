import { useEffect, useMemo, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type {
  KnowledgeBaseView, KnowledgeChunkView, KnowledgeRetrievalHit, KnowledgeSourceView,
} from '../knowledge-types.ts'
import css from './KnowledgeWorkspace.module.css'

export interface KnowledgeWorkspaceInjected {
  getKnowledge: () => NonNullable<ClientRemote['controlCenterKnowledge']>
  hooks: { knowledgeReady: HostObservable<boolean> }
}

export type KnowledgeWorkspaceProps = PropsRuntime<'application.surface', 'knowledge'> & InjectFace<KnowledgeWorkspaceInjected>

/** Full Knowledge Base workspace over the real Control Center knowledge service. */
export function KnowledgeWorkspace({ getKnowledge, useKnowledgeReady, close }: KnowledgeWorkspaceProps) {
  const knowledgeReady = useKnowledgeReady(value => value)
  const knowledge = knowledgeReady ? getKnowledge() : undefined
  const [bases, setBases] = useState<KnowledgeBaseView[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [sources, setSources] = useState<KnowledgeSourceView[]>([])
  const [chunks, setChunks] = useState<KnowledgeChunkView[]>([])
  const [nextChunkCursor, setNextChunkCursor] = useState<string | null>(null)
  const [indexing, setIndexing] = useState<string | null>(null)
  const [indexResult, setIndexResult] = useState<string | null>(null)

  const [baseName, setBaseName] = useState('')
  const [baseDescription, setBaseDescription] = useState('')

  const [textName, setTextName] = useState('')
  const [textBody, setTextBody] = useState('')
  const [urlText, setUrlText] = useState('')
  const [fileName, setFileName] = useState('')

  const [query, setQuery] = useState('')
  const [topK, setTopK] = useState(8)
  const [hits, setHits] = useState<KnowledgeRetrievalHit[]>([])
  const [retrievalProvider, setRetrievalProvider] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const selected = useMemo(() => bases.find(base => base.id === selectedId) ?? null, [bases, selectedId])

  const refreshBases = (): void => {
    if (knowledge === undefined) return
    void knowledge.listBases().then(result => {
      if (!result.ok) { setError(result.error.message); return }
      setBases(result.value.bases)
      if (result.value.bases.length === 0) {
        setSelectedId('')
        setSources([])
        setChunks([])
      } else if (!result.value.bases.some(base => base.id === selectedId)) {
        setSelectedId(result.value.bases[0]!.id)
      }
    }).catch(reason => setError(reason instanceof Error ? reason.message : String(reason)))
  }

  useEffect(() => {
    if (!knowledgeReady || knowledge === undefined) return
    refreshBases()
  }, [knowledgeReady, knowledge])

  useEffect(() => {
    if (!knowledgeReady || knowledge === undefined || selectedId === '') return
    let active = true
    void knowledge.listSources(selectedId).then(result => {
      if (!active || !result.ok) return
      setSources(result.value.sources)
    })
    void knowledge.listChunks(selectedId, null, 50).then(result => {
      if (!active || !result.ok) return
      setChunks(result.value.chunks)
      setNextChunkCursor(result.value.nextCursor ?? null)
    })
    return () => { active = false }
  }, [knowledgeReady, knowledge, selectedId])

  const createBase = async (): Promise<void> => {
    if (knowledge === undefined || baseName.trim() === '') return
    setError(null)
    const result = await knowledge.createBase({ name: baseName, description: baseDescription, embeddingProvider: 'local-hash' })
    if (!result.ok) { setError(result.error.message); return }
    setBaseName('')
    setBaseDescription('')
    setSelectedId(result.value.id)
    refreshBases()
  }

  const deleteBase = async (id: string): Promise<void> => {
    if (knowledge === undefined) return
    setError(null)
    const result = await knowledge.deleteBase(id)
    if (!result.ok) { setError(result.error.message); return }
    refreshBases()
  }

  const addText = async (): Promise<void> => {
    if (knowledge === undefined || selectedId === '' || textBody.trim() === '') return
    setError(null)
    const result = await knowledge.addText({ baseId: selectedId, name: textName.trim() || `text-${Date.now()}`, text: textBody })
    if (!result.ok) { setError(result.error.message); return }
    setTextName('')
    setTextBody('')
    void reloadSources()
  }

  const addUrl = async (): Promise<void> => {
    if (knowledge === undefined || selectedId === '' || urlText.trim() === '') return
    setError(null)
    setBusy(true)
    try {
      const result = await knowledge.addUrl({ baseId: selectedId, url: urlText.trim() })
      if (!result.ok) { setError(result.error.message); return }
      setUrlText('')
      void reloadSources()
    } finally {
      setBusy(false)
    }
  }

  const addFile = async (file: File): Promise<void> => {
    if (knowledge === undefined || selectedId === '') return
    setError(null)
    const dataBase64 = await file.arrayBuffer().then(buffer => {
      const bytes = new Uint8Array(buffer)
      let binary = ''
      for (const byte of bytes) binary += String.fromCharCode(byte)
      return btoa(binary)
    })
    const result = await knowledge.addFile({
      baseId: selectedId,
      name: fileName.trim() || file.name,
      dataBase64,
      mediaType: file.type || 'text/plain',
    })
    if (!result.ok) { setError(result.error.message); return }
    setFileName('')
    void reloadSources()
  }

  const reloadSources = (): void => {
    if (knowledge === undefined || selectedId === '') return
    void knowledge.listSources(selectedId).then(result => {
      if (result.ok) setSources(result.value.sources)
    })
  }

  const deleteSource = async (id: string): Promise<void> => {
    if (knowledge === undefined || selectedId === '') return
    setError(null)
    const result = await knowledge.deleteSource(selectedId, id)
    if (!result.ok) { setError(result.error.message); return }
    void reloadSources()
    void knowledge.listChunks(selectedId, null, 50).then(listResult => {
      if (listResult.ok) { setChunks(listResult.value.chunks); setNextChunkCursor(listResult.value.nextCursor ?? null) }
    })
  }

  const indexBase = async (): Promise<void> => {
    if (knowledge === undefined || selectedId === '') return
    setError(null)
    setIndexing(selectedId)
    try {
      const result = await knowledge.indexBase(selectedId)
      if (!result.ok) { setError(result.error.message); return }
      setIndexResult(`已索引 ${result.value.sourcesIndexed} 个来源，写入 ${result.value.chunksWritten} 个分块`)
      void reloadSources()
      void knowledge.listChunks(selectedId, null, 50).then(listResult => {
        if (listResult.ok) { setChunks(listResult.value.chunks); setNextChunkCursor(listResult.value.nextCursor ?? null) }
      })
    } finally {
      setIndexing(null)
    }
  }

  const recall = async (): Promise<void> => {
    if (knowledge === undefined || selectedId === '' || query.trim() === '') return
    setError(null)
    const result = await knowledge.retrieve({ baseId: selectedId, query: query.trim(), topK })
    if (!result.ok) { setError(result.error.message); return }
    setHits(result.value.hits)
    setRetrievalProvider(result.value.embeddingProvider)
  }

  const loadMoreChunks = (): void => {
    if (knowledge === undefined || selectedId === '' || nextChunkCursor === null) return
    void knowledge.listChunks(selectedId, nextChunkCursor, 50).then(result => {
      if (!result.ok) { setError(result.error.message); return }
      setChunks(current => [...current, ...result.value.chunks])
      setNextChunkCursor(result.value.nextCursor ?? null)
    })
  }

  if (!knowledgeReady) {
    return <main className={css.root}><p role="status">正在连接知识库服务…</p></main>
  }

  return (
    <main className={css.root}>
      <header className={css.header}>
        <div><p className={css.eyebrow}>DSH Control Center</p><h1>知识库</h1></div>
        <button type="button" className={css.secondary} onClick={close}>返回对话</button>
      </header>
      {error === null ? null : <p role="alert" className={css.error}>{error}</p>}

      <section className={css.panel} aria-label="新建知识库">
        <h2>新建知识库</h2>
        <div className={css.row}>
          <input aria-label="知识库名称" placeholder="名称（必填）" value={baseName} onChange={event => { setBaseName(event.target.value) }} />
          <input aria-label="知识库描述" placeholder="描述（可选）" value={baseDescription} onChange={event => { setBaseDescription(event.target.value) }} />
          <button type="button" disabled={baseName.trim() === ''} onClick={() => { void createBase() }}>创建</button>
        </div>
      </section>

      <section className={css.bases} aria-label="知识库列表">
        <h2>知识库（{bases.length}）</h2>
        {bases.length === 0 ? <p className={css.empty}>暂无知识库，先创建一个。</p> : bases.map(base => (
          <article key={base.id} className={css.baseCard}>
            <div className={css.baseMeta}>
              <strong>{base.name}</strong>
              <span>{base.embedding.providerId === 'local-hash' ? '本地 Hash Embedding' : `${base.embedding.providerId} · ${base.embedding.model ?? ''}`}</span>
              <span>{base.sourceCount} 个来源 · {base.chunkCount} 个分块</span>
            </div>
            <div className={css.baseActions}>
              <button type="button" className={selected?.id === base.id ? css.primary : css.secondary}
                onClick={() => { setSelectedId(base.id); setHits([]) }}>打开</button>
              <button type="button" className={css.link} onClick={() => { void deleteBase(base.id) }}>删除</button>
            </div>
          </article>
        ))}
      </section>

      {selected !== null && (
        <>
          <section className={css.panel} aria-label="添加来源">
            <h2>向「{selected.name}」添加来源</h2>
            <div className={css.sourceTabs}>
              <div className={css.row}>
                <input aria-label="文本名称" placeholder="名称（可选）" value={textName} onChange={event => { setTextName(event.target.value) }} />
                <textarea aria-label="文本内容" placeholder="粘贴文本内容" value={textBody} onChange={event => { setTextBody(event.target.value) }} />
                <button type="button" disabled={textBody.trim() === ''} onClick={() => { void addText() }}>添加文本</button>
              </div>
              <div className={css.row}>
                <input aria-label="网页地址" placeholder="https://…" value={urlText} onChange={event => { setUrlText(event.target.value) }} />
                <button type="button" disabled={urlText.trim() === '' || busy} onClick={() => { void addUrl() }}>{busy ? '抓取中…' : '抓取网页'}</button>
              </div>
              <div className={css.row}>
                <input aria-label="文件名称" placeholder="文件显示名（可选）" value={fileName} onChange={event => { setFileName(event.target.value) }} />
                <label className={css.fileButton}>
                  选择文本文件
                  <input type="file" accept=".txt,.md,.html,.csv,.json,.yaml,.yml,text/plain,text/markdown,text/html,application/json,application/xml"
                    onChange={event => {
                      const file = event.target.files?.[0]
                      if (file !== undefined) void addFile(file)
                      event.target.value = ''
                    }} />
                </label>
              </div>
            </div>
          </section>

          <section className={css.panel} aria-label="索引与检索">
            <h2>索引与检索</h2>
            <div className={css.row}>
              <button type="button" disabled={indexing !== null} onClick={() => { void indexBase() }}>
                {indexing !== null ? '索引中…' : '建立索引'}
              </button>
              <input aria-label="检索查询" placeholder="输入查询，回车检索" value={query}
                onChange={event => { setQuery(event.target.value) }}
                onKeyDown={event => { if (event.key === 'Enter') void recall() }} />
              <select aria-label="返回条数" value={String(topK)} onChange={event => { setTopK(Number(event.target.value)) }}>
                {[4, 8, 16].map(n => <option key={n} value={String(n)}>{n}</option>)}
              </select>
              <button type="button" className={css.primary} disabled={query.trim() === ''} onClick={() => { void recall() }}>检索</button>
            </div>
            {indexResult === null ? null : <p className={css.muted}>{indexResult}</p>}
            {retrievalProvider === null ? null : <p className={css.muted}>检索模式：{retrievalProvider}</p>}
            {hits.length === 0 ? null : (
              <ol className={css.hits} aria-label="检索结果">
                {hits.map(hit => (
                  <li key={hit.chunkId} className={css.hit}>
                    <div className={css.hitMeta}><strong>{hit.sourceName}</strong><span>得分 {hit.score.toFixed(3)}</span></div>
                    <p>{hit.text}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className={css.panel} aria-label="来源与分块">
            <h2>来源（{sources.length}）</h2>
            {sources.length === 0 ? <p className={css.empty}>还没有来源。</p> : sources.map(source => (
              <article key={source.id} className={css.sourceItem}>
                <div className={css.sourceMeta}>
                  <strong>{source.name}</strong>
                  <span>{source.kind} · {source.chunks} 个分块 · {source.tokens} tokens · {source.status}</span>
                </div>
                <button type="button" className={css.link} onClick={() => { void deleteSource(source.id) }}>删除</button>
              </article>
            ))}
            <h2>分块（{chunks.length}）</h2>
            {chunks.length === 0 ? <p className={css.empty}>索引后才会生成分块。</p> : (
              <>
                {chunks.map(chunk => (
                  <details key={chunk.id} className={css.chunk}>
                    <summary>{chunk.sourceName} · #{chunk.position} · {chunk.tokens} tokens</summary>
                    <p>{chunk.text}</p>
                  </details>
                ))}
                {nextChunkCursor === null ? null : (
                  <button type="button" className={css.secondary} onClick={loadMoreChunks}>加载更多分块</button>
                )}
              </>
            )}
          </section>
        </>
      )}
    </main>
  )
}
