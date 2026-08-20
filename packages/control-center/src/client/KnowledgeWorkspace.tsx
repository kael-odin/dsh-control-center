/**
 * Knowledge workspace — Cherry knowledge page parity: left navigator with
 * create/rename/delete, right detail with data-source grid (files/notes/
 * directories/links), recall-test drawer.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import {
  IconCheckOutline16, IconChevronLeftOutline14, IconSearchOutline16, IconPlusOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { ModelProviderGroup } from '@deepseek-ai/dsh-api-remotes/client'
import type {
  KnowledgeBaseConfig, KnowledgeBaseView, KnowledgeRetrievalHit, KnowledgeSourceView,
} from '../knowledge-types.ts'
import css from './KnowledgeWorkspace.module.css'
import {
  IconCircleAlert, IconCopy, IconFileText, IconFlaskConical, IconFolder, IconLink2,
  IconMoreHorizontal, IconPlus, IconRefreshCw, IconSlidersHorizontal, IconStickyNote, IconZap,
} from './cherry-icons.tsx'
import { ConfirmDialog, PanelShell, Switch, useCopy } from './panel-ui.tsx'

export interface KnowledgeWorkspaceInjected {
  getKnowledge: () => NonNullable<ClientRemote['controlCenterKnowledge']>
  hooks: { knowledgeReady: HostObservable<boolean> }
  listModels: () => Promise<readonly ModelProviderGroup[]>
}

export type KnowledgeWorkspaceProps = PropsRuntime<'application.surface', 'knowledge'> & InjectFace<KnowledgeWorkspaceInjected>

type AddSourceType = 'file' | 'note' | 'directory' | 'url'

const SOURCE_TYPE_LABELS: Record<AddSourceType, string> = { file: '文件', note: '笔记', directory: '目录', url: '链接' }

function relativeTime(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60_000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} 个月前`
  return `${Math.floor(months / 12)} 年前`
}

function sourceIcon(kind: KnowledgeSourceView['kind']): { icon: React.ReactNode; color: string } {
  switch (kind) {
    case 'file': return { icon: <IconFileText size={14} />, color: '#3b82f6' }
    case 'directory': return { icon: <IconFolder size={14} />, color: '#8b5cf6' }
    case 'url': return { icon: <IconLink2 size={14} />, color: '#06b6d4' }
    default: return { icon: <IconStickyNote size={14} />, color: '#f59e0b' }
  }
}

function kindLabel(kind: KnowledgeSourceView['kind']): string {
  return kind === 'file' ? '文件' : kind === 'text' ? '笔记' : kind === 'directory' ? '目录' : '链接'
}

interface DirectoryFile {
  name: string
  dataBase64: string
  mediaType: string
}

async function pickDirectoryFiles(): Promise<DirectoryFile[] | null> {
  const picker = (window as unknown as { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker
  if (picker === undefined) return null
  let handle: FileSystemDirectoryHandle
  try {
    handle = await picker()
  } catch {
    return [] // cancelled
  }
  const files: DirectoryFile[] = []
  const walk = async (dir: FileSystemDirectoryHandle, prefix: string): Promise<void> => {
    for await (const entry of dir.values()) {
      if (files.length >= 200) return
      if (entry.kind === 'directory') {
        await walk(entry as FileSystemDirectoryHandle, `${prefix}${entry.name}/`)
      } else {
        const file = await (entry as FileSystemFileHandle).getFile()
        if (!file.type.startsWith('text/') && !/\.(txt|md|markdown|html|htm|csv|json|yaml|yml|xml)$/i.test(file.name)) continue
        const bytes = new Uint8Array(await file.arrayBuffer())
        let binary = ''
        for (const byte of bytes) binary += String.fromCharCode(byte)
        files.push({ name: `${prefix}${file.name}`, dataBase64: btoa(binary), mediaType: file.type || 'text/plain' })
      }
    }
  }
  await walk(handle, '')
  return files
}

/** Full Knowledge Base workspace over the real Control Center knowledge service. */
export function KnowledgeWorkspace({ getKnowledge, useKnowledgeReady, listModels, close }: KnowledgeWorkspaceProps) {
  const knowledgeReady = useKnowledgeReady(value => value)
  const knowledge = knowledgeReady ? getKnowledge() : undefined
  const [bases, setBases] = useState<KnowledgeBaseView[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [sources, setSources] = useState<KnowledgeSourceView[]>([])
  const [indexing, setIndexing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Dialogs & popovers.
  const [createOpen, setCreateOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<KnowledgeBaseView | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeBaseView | null>(null)
  const [deleteSourceTarget, setDeleteSourceTarget] = useState<KnowledgeSourceView | null>(null)
  const [navMenuFor, setNavMenuFor] = useState<string | null>(null)
  const [rowMenuFor, setRowMenuFor] = useState<string | null>(null)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [addDialog, setAddDialog] = useState<AddSourceType | null>(null)
  const [recallOpen, setRecallOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [config, setConfig] = useState<KnowledgeBaseConfig | null>(null)
  const [configDraft, setConfigDraft] = useState<KnowledgeBaseConfig | null>(null)

  // Form states.
  const [baseName, setBaseName] = useState('')
  const [baseDescription, setBaseDescription] = useState('')
  const [embeddingOptions, setEmbeddingOptions] = useState<Array<{ value: string; label: string; provider?: string; model?: string }>>([])
  const [embeddingChoice, setEmbeddingChoice] = useState('local-hash')
  const [draftTopK, setDraftTopK] = useState(8)
  const [draftChunkSize, setDraftChunkSize] = useState(600)
  const [draftChunkOverlap, setDraftChunkOverlap] = useState(60)
  const [draftStrategy, setDraftStrategy] = useState<'structured' | 'delimiter'>('structured')
  const [draftSeparators, setDraftSeparators] = useState('')
  const [noteName, setNoteName] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [urlText, setUrlText] = useState('')
  const [recallQuery, setRecallQuery] = useState('')
  const [recallSearching, setRecallSearching] = useState(false)
  const [hits, setHits] = useState<KnowledgeRetrievalHit[]>([])
  const [retrievalProvider, setRetrievalProvider] = useState<string | null>(null)
  const [recallMs, setRecallMs] = useState(0)

  const fileRef = useRef<HTMLInputElement | null>(null)
  const { copied, copy } = useCopy()

  const selected = useMemo(() => bases.find(base => base.id === selectedId) ?? null, [bases, selectedId])

  const refreshBases = useCallback((): void => {
    if (knowledge === undefined) return
    void knowledge.listBases().then(result => {
      if (!result.ok) { setError(result.error.message); return }
      setBases(result.value.bases)
      if (result.value.bases.length === 0) {
        setSelectedId('')
        setSources([])
      } else if (!result.value.bases.some(base => base.id === selectedId)) {
        setSelectedId(result.value.bases[0]!.id)
      }
    }).catch(reason => setError(reason instanceof Error ? reason.message : String(reason)))
  }, [knowledge, selectedId])

  useEffect(() => {
    if (!knowledgeReady || knowledge === undefined) return
    refreshBases()
    void listModels().then(groups => {
      // Cherry's embedding picker only shows embedding-capable models.
      const options: Array<{ value: string; label: string; provider?: string; model?: string }> = [
        { value: 'local-hash', label: '本地 Hash Embedding（离线可用）' },
      ]
      for (const group of groups) {
        for (const model of group.models) {
          if (!/(embed|bge|m3e|gte|e5)/i.test(model.name)) continue
          options.push({
            value: `${group.id}/${model.id}`,
            label: `${group.name} · ${model.name}`,
            provider: group.id,
            model: model.id,
          })
        }
      }
      setEmbeddingOptions(options)
    }).catch(() => {})
  }, [knowledgeReady, knowledge, refreshBases, listModels])

  useEffect(() => {
    if (!knowledgeReady || knowledge === undefined || selectedId === '') return
    let active = true
    void knowledge.listSources(selectedId).then(result => {
      if (!active || !result.ok) return
      setSources(result.value.sources)
    })
    void knowledge.getBaseConfig(selectedId).then(result => {
      if (!active || !result.ok) return
      setConfig(result.value)
      setConfigDraft(result.value)
    })
    return () => { active = false }
  }, [knowledgeReady, knowledge, selectedId])

  const createBase = async (): Promise<void> => {
    if (knowledge === undefined || baseName.trim() === '') return
    setError(null)
    const [embeddingProvider, embeddingModel] = embeddingChoice === 'local-hash'
      ? ['local-hash', undefined]
      : embeddingChoice.split('/') as [string, string | undefined]
    const result = await knowledge.createBase({
      name: baseName,
      description: baseDescription,
      embeddingProvider,
      ...(embeddingModel === undefined ? {} : { embeddingModel }),
    })
    if (!result.ok) { setError(result.error.message); return }
    // Apply the RAG tuning chosen at creation time (Cherry create dialog parity).
    const configResult = await knowledge.setBaseConfig(result.value.id, {
      chunkSize: Math.min(8000, Math.max(100, Math.trunc(draftChunkSize))),
      chunkOverlap: Math.min(4000, Math.max(0, Math.trunc(draftChunkOverlap))),
      topK: Math.min(50, Math.max(1, Math.trunc(draftTopK))),
      strategy: draftStrategy,
      separators: draftSeparators.slice(0, 200),
    })
    if (!configResult.ok) { setError(configResult.error.message); return }
    setBaseName('')
    setBaseDescription('')
    setCreateOpen(false)
    setSelectedId(result.value.id)
    refreshBases()
  }

  const renameBase = async (): Promise<void> => {
    if (knowledge === undefined || renameTarget === null || baseName.trim() === '') return
    const result = await knowledge.renameBase(renameTarget.id, baseName.trim())
    if (!result.ok) { setError(result.error.message); return }
    setRenameTarget(null)
    setBaseName('')
    refreshBases()
  }

  const deleteBase = async (): Promise<void> => {
    if (knowledge === undefined || deleteTarget === null) return
    const result = await knowledge.deleteBase(deleteTarget.id)
    if (!result.ok) { setError(result.error.message); return }
    setDeleteTarget(null)
    refreshBases()
  }

  const addFile = async (file: File): Promise<void> => {
    if (knowledge === undefined || selectedId === '') return
    const dataBase64 = await file.arrayBuffer().then(buffer => {
      const bytes = new Uint8Array(buffer)
      let binary = ''
      for (const byte of bytes) binary += String.fromCharCode(byte)
      return btoa(binary)
    })
    const result = await knowledge.addFile({ baseId: selectedId, name: file.name, dataBase64, mediaType: file.type || 'text/plain' })
    if (!result.ok) { setError(result.error.message); return }
    reloadSources()
  }

  const addNote = async (): Promise<void> => {
    if (knowledge === undefined || selectedId === '' || noteBody.trim() === '') return
    const result = await knowledge.addText({ baseId: selectedId, name: noteName.trim() || `笔记-${Date.now()}`, text: noteBody })
    if (!result.ok) { setError(result.error.message); return }
    setNoteName('')
    setNoteBody('')
    setAddDialog(null)
    reloadSources()
  }

  const addUrl = async (): Promise<void> => {
    if (knowledge === undefined || selectedId === '' || urlText.trim() === '') return
    setError(null)
    const result = await knowledge.addUrl({ baseId: selectedId, url: urlText.trim() })
    if (!result.ok) { setError(result.error.message); return }
    setUrlText('')
    setAddDialog(null)
    reloadSources()
  }

  const addDirectory = async (): Promise<void> => {
    if (knowledge === undefined || selectedId === '') return
    setError(null)
    const files = await pickDirectoryFiles()
    if (files === null) {
      setAddDialog(null)
      fileRef.current?.click()
      return
    }
    if (files.length === 0) { setAddDialog(null); return } // cancelled
    const result = await knowledge.addDirectory({
      baseId: selectedId,
      name: files[0]!.name.split('/')[0] ?? '目录',
      files,
    })
    if (!result.ok) { setError(result.error.message); return }
    setAddDialog(null)
    reloadSources()
  }

  const reloadSources = (): void => {
    if (knowledge === undefined || selectedId === '') return
    void knowledge.listSources(selectedId).then(result => {
      if (result.ok) setSources(result.value.sources)
    })
  }

  const deleteSource = async (): Promise<void> => {
    if (knowledge === undefined || selectedId === '' || deleteSourceTarget === null) return
    const result = await knowledge.deleteSource(selectedId, deleteSourceTarget.id)
    if (!result.ok) { setError(result.error.message); return }
    setDeleteSourceTarget(null)
    reloadSources()
  }

  const indexBase = async (): Promise<void> => {
    if (knowledge === undefined || selectedId === '') return
    setError(null)
    setIndexing(true)
    try {
      const result = await knowledge.indexBase(selectedId)
      if (!result.ok) { setError(result.error.message); return }
      setNotice(`已索引 ${result.value.sourcesIndexed} 个来源，写入 ${result.value.chunksWritten} 个分块`)
      reloadSources()
    } finally {
      setIndexing(false)
    }
  }

  const recall = async (): Promise<void> => {
    if (knowledge === undefined || selectedId === '' || recallQuery.trim() === '') return
    setError(null)
    setRecallSearching(true)
    const startedAt = Date.now()
    try {
      const result = await knowledge.retrieve({ baseId: selectedId, query: recallQuery.trim(), topK: 8 })
      if (!result.ok) { setError(result.error.message); return }
      setHits(result.value.hits)
      setRetrievalProvider(result.value.embeddingProvider)
      setRecallMs(Date.now() - startedAt)
    } finally {
      setRecallSearching(false)
    }
  }

  const saveConfig = async (): Promise<void> => {
    if (knowledge === undefined || selectedId === '' || configDraft === null) return
    const result = await knowledge.setBaseConfig(selectedId, {
      ...configDraft,
      chunkSize: Math.min(8000, Math.max(100, Math.trunc(configDraft.chunkSize))),
      chunkOverlap: Math.min(4000, Math.max(0, Math.trunc(configDraft.chunkOverlap))),
      topK: Math.min(50, Math.max(1, Math.trunc(configDraft.topK))),
    })
    if (!result.ok) { setError(result.error.message); return }
    setConfig(result.value)
    setConfigDraft(result.value)
    setNotice('知识库设置已保存')
  }

  const openAdd = (type: AddSourceType): void => {
    setAddMenuOpen(false)
    if (type === 'file') {
      setAddDialog('file')
      fileRef.current?.click()
      return
    }
    if (type === 'directory') {
      setAddDialog('directory')
      void addDirectory()
      return
    }
    setAddDialog(type)
  }

  if (!knowledgeReady) {
    return <main className=" cc-surface"><p role="status" style={{ padding: 24 }}>正在连接知识库服务…</p></main>
  }

  return (
    <main className={`${css.root} cc-surface`}>
      <div className={css.split}>
        <aside className={css.navigator} data-ui="knowledge.navigation">
          <button type="button" className={css.navCreate} onClick={() => { setCreateOpen(true) }}>
            <IconPlusOutline16 size={16} />
            <span>新建知识库</span>
          </button>
          <div className={css.navScroll}>
            {bases.length === 0
              ? <div className={css.navEmpty}>暂无知识库<br />点击上方「新建知识库」开始</div>
              : bases.map(base => (
                <div key={base.id} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className={`${css.navRow} ${base.id === selectedId ? css.active : ''}`}
                    onClick={() => { setSelectedId(base.id); setHits([]) }}
                  >
                    <span className={css.navRowName}>{base.name}</span>
                    <span
                      className={css.navRowMenu}
                      role="button"
                      title="更多"
                      onClick={(event) => { event.stopPropagation(); setNavMenuFor(navMenuFor === base.id ? null : base.id) }}
                    >
                      <IconMoreHorizontal size={14} />
                    </span>
                  </button>
                  {navMenuFor === base.id && (
                    <div className={css.menuPopover} style={{ top: '100%', left: 4, right: 4 }}>
                      <button
                        type="button"
                        className={css.menuItem}
                        onClick={() => { setNavMenuFor(null); setBaseName(base.name); setRenameTarget(base) }}
                      >
                        <IconPenLineInline />
                        <span>重命名</span>
                      </button>
                      <button
                        type="button"
                        className={`${css.menuItem} ${css.destructive}`}
                        onClick={() => { setNavMenuFor(null); setDeleteTarget(base) }}
                      >
                        <IconTrashInline />
                        <span>删除</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </aside>

        <main className={css.detail} data-ui="knowledge.content">
          {selected === null ? (
            <div className={css.detailEmpty}>
              <div className={css.detailEmptyTitle}>暂无知识库</div>
              <div className={css.detailEmptyDescription}>与 AI 一起积累知识</div>
              <div className={css.detailEmptyHint}>创建知识库后，即可上传文件 / 笔记 / 目录 / 链接，进行召回测试与知识库设置</div>
              <button type="button" className={`${css.btn} ${css.btnPrimary}`} style={{ marginTop: 8 }} onClick={() => { setCreateOpen(true) }}>
                创建知识库
              </button>
            </div>
          ) : (
            <>
              <header className={css.detailHeader}>
                <span className={css.detailHeaderTitle}>{selected.name}</span>
                <div className={css.detailHeaderActions}>
                  <button type="button" className={css.ghostButton} onClick={() => { setRecallOpen(true) }}>
                    <IconFlaskConical size={14} />
                    <span>召回测试</span>
                  </button>
                  <button
                    type="button"
                    className={css.ghostButton}
                    title="知识库设置"
                    aria-label="知识库设置"
                    onClick={() => { setConfigOpen(true) }}
                  >
                    <IconSlidersHorizontal size={14} />
                    <span>知识库设置</span>
                  </button>
                  <button type="button" className={css.ghostButton} title="返回对话" onClick={close}>
                    <IconChevronLeftOutline14 size={16} />
                  </button>
                </div>
              </header>

              {error === null ? null : <div className={css.errorBanner} role="alert">{error}</div>}
              {notice === null ? null : <div className={css.notice}>{notice}</div>}

              <div className={css.dataPanel}>
                <div className={css.dataHeader}>
                  <span className={css.dataHeaderLeft}>更新于 {relativeTime(selected.updatedAt)}</span>
                  <div className={css.dataHeaderActions}>
                    <button
                      type="button"
                      className={css.indexButton}
                      disabled={indexing || sources.length === 0}
                      onClick={() => { void indexBase() }}
                    >
                      {indexing ? '索引中…' : '建立索引'}
                    </button>
                    <div style={{ position: 'relative' }}>
                      <button type="button" className={css.addSourceButton} onClick={() => { setAddMenuOpen(open => !open) }}>
                        <IconPlus size={12} />
                        <span>添加数据源</span>
                      </button>
                      {addMenuOpen && (
                        <div className={css.menuPopover} style={{ top: 'calc(100% + 4px)', right: 0 }}>
                          {(Object.keys(SOURCE_TYPE_LABELS) as AddSourceType[]).map(type => (
                            <button key={type} type="button" className={css.menuItem} onClick={() => { openAdd(type) }}>
                              <span style={{ color: sourceIcon(type === 'note' ? 'text' : type).color, display: 'inline-flex' }}>
                                {sourceIcon(type === 'note' ? 'text' : type).icon}
                              </span>
                              <span>{SOURCE_TYPE_LABELS[type]}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {sources.length === 0 ? (
                  <div className={css.sourcesEmpty}>
                    <div className={css.sourcesEmptyTitle}>暂无数据源</div>
                    <div className={css.sourcesEmptyDesc}>上传第一个数据源</div>
                    <div className={css.sourceTypeCards}>
                      {(Object.keys(SOURCE_TYPE_LABELS) as AddSourceType[]).map(type => (
                        <button key={type} type="button" className={css.sourceTypeCard} onClick={() => { openAdd(type) }}>
                          <span className={css.sourceTypeCardIcon} style={{ color: sourceIcon(type === 'note' ? 'text' : type).color }}>
                            {sourceIcon(type === 'note' ? 'text' : type).icon}
                          </span>
                          <span>{SOURCE_TYPE_LABELS[type]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={css.gridHeader} role="row">
                      <span>名称</span>
                      <span>类型</span>
                      <span>状态</span>
                      <span>更新时间</span>
                      <span aria-label="操作" />
                    </div>
                    <div className={css.gridScroll} role="rowgroup">
                      {sources.map(source => {
                        const icon = sourceIcon(source.kind)
                        return (
                          <div key={source.id} className={css.gridRow} role="row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                              <span className={css.sourceIcon} style={{ color: icon.color }}>{icon.icon}</span>
                              <span className={css.sourceName} title={source.name}>{source.name}</span>
                            </div>
                            <span className={css.sourceType}>{kindLabel(source.kind)}</span>
                            <span className={css.statusBadge} title={source.error}>
                              {source.status === 'ready' && <span className={css.statusReady}><IconCheckOutline16 size={12} />就绪</span>}
                              {source.status === 'indexing' && <span className={css.statusIndexing}><span className={css.statusSpinner} />处理中</span>}
                              {source.status === 'failed' && <span className={css.statusFailed}><IconCircleAlert size={12} />错误</span>}
                            </span>
                            <span className={css.sourceUpdated}>{relativeTime(source.updatedAt)}</span>
                            <div style={{ position: 'relative' }}>
                              <button
                                type="button"
                                className={css.rowMenu}
                                title="更多"
                                onClick={() => { setRowMenuFor(rowMenuFor === source.id ? null : source.id) }}
                              >
                                <IconMoreHorizontal size={14} />
                              </button>
                              {rowMenuFor === source.id && (
                                <div className={css.menuPopover} style={{ top: 'calc(100% + 2px)', right: 0 }}>
                                  <button
                                    type="button"
                                    className={css.menuItem}
                                    onClick={() => { setRowMenuFor(null); void indexBase() }}
                                  >
                                    <IconRefreshCw size={13} />
                                    <span>重新索引</span>
                                  </button>
                                  <button
                                    type="button"
                                    className={`${css.menuItem} ${css.destructive}`}
                                    onClick={() => { setRowMenuFor(null); setDeleteSourceTarget(source) }}
                                  >
                                    <IconTrashInline />
                                    <span>删除</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept=".txt,.md,.markdown,.html,.htm,.csv,.json,.yaml,.yml,text/plain,text/markdown,text/html,application/json,application/xml"
        style={{ display: 'none' }}
        onChange={(event) => {
          const files = [...(event.target.files ?? [])]
          setAddDialog(null)
          for (const file of files) void addFile(file)
          event.target.value = ''
        }}
      />

      {configOpen && configDraft !== null && (
        <PanelShell title="知识库设置" onClose={() => { setConfigOpen(false) }}>
          <div className={css.ragBody}>
            <div className={css.ragSection}>
              <div className={css.ragTitle}>文档处理</div>
              <div className={css.ragReadonly}>未配置（DSH 原生文本解析）</div>
            </div>
            <div className={css.ragSection}>
              <div className={css.ragTitle}>嵌入模型</div>
              <div className={css.ragReadonly}>
                {selected?.embedding.providerId === 'local-hash'
                  ? '本地 Hash Embedding（离线可用）'
                  : `${selected?.embedding.providerId ?? ''} · ${selected?.embedding.model ?? ''}`}
              </div>
            </div>
            <div className={css.ragSection}>
              <div className={css.ragTitle}>重排模型</div>
              <div className={css.ragReadonly}>不使用</div>
            </div>
            <div className={css.ragSection}>
              <div className={css.ragTitle}>Top K</div>
              <div className={css.ragSliderRow}>
                <input
                  type="range"
                  className={css.ragSlider}
                  min={1}
                  max={50}
                  step={1}
                  value={configDraft.topK}
                  onChange={event => { setConfigDraft(current => current === null ? current : { ...current, topK: Number(event.target.value) }) }}
                />
                <input
                  type="number"
                  className={css.ragNumber}
                  min={1}
                  max={50}
                  value={configDraft.topK}
                  onChange={event => {
                    const value = Math.min(50, Math.max(1, Number(event.target.value) || 1))
                    setConfigDraft(current => current === null ? current : { ...current, topK: value })
                  }}
                />
              </div>
            </div>
            <div className={css.ragSection}>
              <div className={css.ragTitle}>高级设置</div>
              <div className={css.ragFieldRow}>
                <span className={css.ragLabel}>智能分段</span>
                <Switch
                  checked={configDraft.strategy === 'structured'}
                  onChange={next => { setConfigDraft(current => current === null ? current : { ...current, strategy: next ? 'structured' : 'delimiter' }) }}
                  label="智能分段"
                />
              </div>
              <div className={css.ragField}>
                <label className={css.ragLabel} htmlFor="cc-rag-separators">分隔符（\n 表示换行，留空使用默认段落分隔）</label>
                <input
                  id="cc-rag-separators"
                  className={css.ragNumberFull}
                  value={configDraft.separators}
                  onChange={event => { setConfigDraft(current => current === null ? current : { ...current, separators: event.target.value.slice(0, 200) }) }}
                  placeholder={"\n\n"}
                />
              </div>
              <div className={css.ragField}>
                <label className={css.ragLabel} htmlFor="cc-rag-chunk-size">分段大小（tokens）</label>
                <input
                  id="cc-rag-chunk-size"
                  type="number"
                  className={css.ragNumberFull}
                  min={100}
                  max={8000}
                  step={50}
                  value={configDraft.chunkSize}
                  onChange={event => {
                    const value = Math.min(8000, Math.max(100, Number(event.target.value) || 100))
                    setConfigDraft(current => current === null ? current : { ...current, chunkSize: value })
                  }}
                />
              </div>
              <div className={css.ragField}>
                <label className={css.ragLabel} htmlFor="cc-rag-overlap">重叠大小（tokens）</label>
                <input
                  id="cc-rag-overlap"
                  type="number"
                  className={css.ragNumberFull}
                  min={0}
                  max={4000}
                  step={10}
                  value={configDraft.chunkOverlap}
                  onChange={event => {
                    const value = Math.min(4000, Math.max(0, Number(event.target.value) || 0))
                    setConfigDraft(current => current === null ? current : { ...current, chunkOverlap: value })
                  }}
                />
              </div>
              <div className={css.ragHint}>分块设置的修改只针对新添加的内容有效</div>
            </div>
          </div>
          <div className={css.ragFooter}>
            <button
              type="button"
              className={css.btn}
              disabled={config === null || (configDraft.chunkSize === config.chunkSize && configDraft.chunkOverlap === config.chunkOverlap && configDraft.topK === config.topK && configDraft.strategy === config.strategy && configDraft.separators === config.separators)}
              onClick={() => { setConfigDraft(config) }}
            >
              恢复默认
            </button>
            <button type="button" className={`${css.btn} ${css.btnPrimary}`} onClick={() => { void saveConfig() }}>保存</button>
          </div>
        </PanelShell>
      )}

      {recallOpen && (
        <PanelShell title="召回测试" onClose={() => { setRecallOpen(false) }}>
          <div className={css.recallBar}>
            <div className={css.recallInputWrap}>
              <span style={{ display: 'inline-flex', color: 'var(--foreground-tertiary)' }}><IconSearchOutline16 size={14} /></span>
              <input
                className={css.recallInput}
                placeholder="输入测试 Query..."
                value={recallQuery}
                onChange={event => { setRecallQuery(event.target.value) }}
                onKeyDown={event => { if (event.key === 'Enter') void recall() }}
              />
            </div>
            <button type="button" className={css.recallSubmit} disabled={recallQuery.trim() === '' || recallSearching} onClick={() => { void recall() }}>
              <IconZap size={14} />
              <span>检索</span>
            </button>
          </div>
          <div className={css.recallResults}>
            {recallSearching ? (
              <div className={css.recallEmpty}>正在检索...</div>
            ) : hits.length === 0 ? (
              <div className={css.recallEmpty}>输入查询语句开始检索测试，结果将展示匹配的文档片段和分数</div>
            ) : (
              <>
                <div className={css.recallSummary}>
                  <span>{hits.length} 个结果</span>
                  <span>{recallMs}ms</span>
                  <span>最高: {hits[0]!.score.toFixed(3)}</span>
                  {retrievalProvider === null ? null : <span>检索模式：{retrievalProvider}</span>}
                </div>
                {hits.map((hit, index) => (
                  <div key={hit.chunkId} className={css.recallCard}>
                    <div className={css.recallCardHeader}>
                      <span className={css.recallRank}>{index + 1}</span>
                      <IconFileText size={14} style={{ color: 'var(--muted-foreground)', flex: 'none' }} />
                      <span className={css.recallSource}>{hit.sourceName}</span>
                      <span className={css.recallChunkIndex}></span>
                      <span className={css.recallScore}>{hit.score.toFixed(3)}</span>
                      <button
                        type="button"
                        className={`${css.recallCopy} ${copied ? css.success : ''}`}
                        title="复制片段"
                        onClick={() => { copy(hit.text) }}
                      >
                        {copied ? <IconCheckOutline16 size={12} /> : <IconCopy size={12} />}
                      </button>
                    </div>
                    <p className={css.recallBody} title={hit.text}>{hit.text}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </PanelShell>
      )}

      {createOpen && (
        <div className={css.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false) }}>
          <div className={css.dialogCard} role="dialog" aria-modal="true" aria-label="新建知识库">
            <h3>新建知识库</h3>
            <div className={css.dialogField}>
              <label htmlFor="cc-kb-name">名称</label>
              <input
                id="cc-kb-name"
                className={css.dialogInput}
                placeholder="名称"
                value={baseName}
                onChange={event => { setBaseName(event.target.value) }}
                autoFocus
              />
            </div>
            <div className={css.dialogField}>
              <label htmlFor="cc-kb-desc">描述（可选）</label>
              <input
                id="cc-kb-desc"
                className={css.dialogInput}
                placeholder="描述"
                value={baseDescription}
                onChange={event => { setBaseDescription(event.target.value) }}
              />
            </div>
            <div className={css.dialogField}>
              <label htmlFor="cc-kb-embedding">嵌入模型</label>
              <select
                id="cc-kb-embedding"
                className={`${css.dialogInput} ${css.dialogSelect}`}
                value={embeddingChoice}
                onChange={event => { setEmbeddingChoice(event.target.value) }}
              >
                {embeddingOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <div className={css.dialogHint}>{embeddingChoice === 'local-hash' ? '离线可用，无需配置' : '将使用所选模型的 embeddings 接口；索引与检索均走该模型'}</div>
            </div>
            <div className={css.dialogField}>
              <label htmlFor="cc-kb-topk">Top K</label>
              <div className={css.dialogSliderRow}>
                <input
                  type="range"
                  className={css.ragSlider}
                  min={1}
                  max={50}
                  value={draftTopK}
                  onChange={event => { setDraftTopK(Number(event.target.value)) }}
                />
                <input
                  type="number"
                  className={css.ragNumber}
                  min={1}
                  max={50}
                  value={draftTopK}
                  onChange={event => { setDraftTopK(Math.min(50, Math.max(1, Number(event.target.value) || 1))) }}
                />
              </div>
            </div>
            <div className={css.dialogField}>
              <label htmlFor="cc-kb-chunk-size">分段大小（tokens）</label>
              <input
                id="cc-kb-chunk-size"
                type="number"
                className={css.dialogInput}
                min={100}
                max={8000}
                step={50}
                value={draftChunkSize}
                onChange={event => { setDraftChunkSize(Math.min(8000, Math.max(100, Number(event.target.value) || 100))) }}
              />
            </div>
            <div className={css.dialogField}>
              <label htmlFor="cc-kb-overlap">重叠大小（tokens）</label>
              <input
                id="cc-kb-overlap"
                type="number"
                className={css.dialogInput}
                min={0}
                max={4000}
                step={10}
                value={draftChunkOverlap}
                onChange={event => { setDraftChunkOverlap(Math.min(4000, Math.max(0, Number(event.target.value) || 0))) }}
              />
            </div>
            <div className={css.dialogField}>
              <label htmlFor="cc-kb-separators">分隔符（\n 表示换行，留空使用默认段落分隔）</label>
              <input
                id="cc-kb-separators"
                className={css.dialogInput}
                value={draftSeparators}
                onChange={event => { setDraftSeparators(event.target.value.slice(0, 200)) }}
                placeholder={'\\n\\n'}
              />
            </div>
            <div className={css.dialogField}>
              <div className={css.dialogFieldRow}>
                <span className={css.ragLabel}>智能分段</span>
                <Switch
                  checked={draftStrategy === 'structured'}
                  onChange={next => { setDraftStrategy(next ? 'structured' : 'delimiter') }}
                  label="智能分段"
                />
              </div>
              <div className={css.dialogHint}>分块设置的修改只针对新添加的内容有效</div>
            </div>
            <div className={css.dialogActions}>
              <button type="button" className={css.btn} onClick={() => { setCreateOpen(false) }}>取消</button>
              <button type="button" className={`${css.btn} ${css.btnPrimary}`} disabled={baseName.trim() === ''} onClick={() => { void createBase() }}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {renameTarget !== null && (
        <div className={css.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setRenameTarget(null) }}>
          <div className={css.dialogCard} role="dialog" aria-modal="true" aria-label="重命名知识库">
            <h3>重命名知识库</h3>
            <div className={css.dialogField}>
              <label htmlFor="cc-kb-rename">名称</label>
              <input
                id="cc-kb-rename"
                className={css.dialogInput}
                placeholder="名称"
                value={baseName}
                onChange={event => { setBaseName(event.target.value) }}
                autoFocus
              />
            </div>
            <div className={css.dialogActions}>
              <button type="button" className={css.btn} onClick={() => { setRenameTarget(null) }}>取消</button>
              <button type="button" className={`${css.btn} ${css.btnPrimary}`} disabled={baseName.trim() === ''} onClick={() => { void renameBase() }}>
                重命名
              </button>
            </div>
          </div>
        </div>
      )}

      {addDialog === 'note' && (
        <div className={css.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setAddDialog(null) }}>
          <div className={css.dialogCard} role="dialog" aria-modal="true" aria-label="添加笔记">
            <h3>添加笔记</h3>
            <div className={css.dialogField}>
              <label htmlFor="cc-note-name">名称</label>
              <input
                id="cc-note-name"
                className={css.dialogInput}
                placeholder="为这篇笔记取个名字"
                value={noteName}
                onChange={event => { setNoteName(event.target.value) }}
                autoFocus
              />
            </div>
            <div className={css.dialogField}>
              <label htmlFor="cc-note-body">内容</label>
              <textarea
                id="cc-note-body"
                className={css.dialogTextarea}
                placeholder="在此输入笔记内容…"
                value={noteBody}
                onChange={event => { setNoteBody(event.target.value) }}
              />
            </div>
            <div className={css.dialogActions}>
              <button type="button" className={css.btn} onClick={() => { setAddDialog(null) }}>取消</button>
              <button type="button" className={`${css.btn} ${css.btnPrimary}`} disabled={noteBody.trim() === ''} onClick={() => { void addNote() }}>
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {addDialog === 'url' && (
        <div className={css.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setAddDialog(null) }}>
          <div className={css.dialogCard} role="dialog" aria-modal="true" aria-label="添加链接">
            <h3>添加链接</h3>
            <div className={css.dialogField}>
              <label htmlFor="cc-url-input">输入网页链接：</label>
              <input
                id="cc-url-input"
                className={css.dialogInput}
                placeholder="https://example.com"
                value={urlText}
                onChange={event => { setUrlText(event.target.value) }}
                autoFocus
              />
            </div>
            <div className={css.dialogHint}>将自动抓取页面文本并分块索引</div>
            <div className={css.dialogActions} style={{ marginTop: 16 }}>
              <button type="button" className={css.btn} onClick={() => { setAddDialog(null) }}>取消</button>
              <button type="button" className={`${css.btn} ${css.btnPrimary}`} disabled={urlText.trim() === ''} onClick={() => { void addUrl() }}>
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="确认删除知识库"
        description="删除后将无法恢复该知识库及其索引数据。"
        confirmText="删除"
        destructive
        onConfirm={() => { void deleteBase() }}
        onCancel={() => { setDeleteTarget(null) }}
      />
      <ConfirmDialog
        open={deleteSourceTarget !== null}
        title="确认删除数据源"
        description="删除后将无法恢复该数据源及其索引数据。"
        confirmText="删除"
        destructive
        onConfirm={() => { void deleteSource() }}
        onCancel={() => { setDeleteSourceTarget(null) }}
      />
    </main>
  )
}

function IconPenLineInline() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

function IconTrashInline() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}
