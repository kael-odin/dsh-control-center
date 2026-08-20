/**
 * Code Repository workspace: browse any local repository registered in the
 * catalog — file tree with lazy directory expansion and text-file preview.
 */

import { useEffect, useMemo, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { RepoRecord, RepoTreeEntry, RepoFileView } from '../repo-types.ts'
import css from './RepoWorkspace.module.css'

export interface RepoWorkspaceInjected {
  getRepos: () => NonNullable<ClientRemote['controlCenterRepos']>
  hooks: { reposReady: HostObservable<boolean> }
}

export type RepoWorkspaceProps = PropsRuntime<'application.surface', 'repo'> & InjectFace<RepoWorkspaceInjected>

interface TreeState {
  /** Expanded directories by absolute path. */
  expanded: ReadonlySet<string>
  /** Loaded children by directory path. */
  children: ReadonlyMap<string, readonly RepoTreeEntry[]>
  /** Directory currently loading (path). */
  loadingDir: string | null
  /** Open file path + cached view. */
  openFile: { path: string; view: RepoFileView } | null
}

export function RepoWorkspace({ getRepos, useReposReady }: RepoWorkspaceProps) {
  const reposReady = useReposReady(value => value)
  const repos = reposReady ? getRepos() : undefined
  const [catalog, setCatalog] = useState<RepoRecord[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [addPath, setAddPath] = useState('')
  const [adding, setAdding] = useState(false)
  const [branch, setBranch] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tree, setTree] = useState<TreeState>({ expanded: new Set(), children: new Map(), loadingDir: null, openFile: null })

  const selected = useMemo(() => catalog.find(repo => repo.id === selectedId) ?? null, [catalog, selectedId])

  const refreshCatalog = (): void => {
    if (repos === undefined) return
    void repos.list().then(result => {
      if (!result.ok) { setError(result.error.message); return }
      setCatalog(result.value)
      if (result.value.length === 0) {
        setSelectedId('')
      } else if (!result.value.some(repo => repo.id === selectedId)) {
        setSelectedId(result.value[0]!.id)
      }
    }).catch(reason => setError(reason instanceof Error ? reason.message : String(reason)))
  }

  // Load catalog on mount and when the service appears.
  useEffect(() => {
    refreshCatalog()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repos !== undefined])

  // Load the selected repo's root tree + branch.
  const selectedPath = selected?.path
  useEffect(() => {
    if (repos === undefined || selectedPath === undefined) return
    void repos.getBranch(selectedPath).then(result => {
      if (result.ok) setBranch(result.value)
    }).catch(() => setBranch(null))
    void loadDir(selectedPath, selectedPath)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath, repos !== undefined])

  const loadDir = (repoPath: string, dir: string): void => {
    if (repos === undefined) return
    setTree(prev => ({ ...prev, loadingDir: dir }))
    void repos.tree(repoPath, dir).then(result => {
      if (!result.ok) { setError(result.error.message); return }
      setTree(prev => ({
        ...prev,
        loadingDir: null,
        children: new Map(prev.children).set(dir, result.value),
        expanded: new Set(prev.expanded).add(dir),
      }))
    }).catch(reason => {
      setError(reason instanceof Error ? reason.message : String(reason))
      setTree(prev => ({ ...prev, loadingDir: null }))
    })
  }

  const toggleDir = (repoPath: string, dir: string): void => {
    if (tree.expanded.has(dir)) {
      setTree(prev => {
        const next = new Set(prev.expanded)
        next.delete(dir)
        return { ...prev, expanded: next }
      })
      return
    }
    if (tree.children.has(dir)) {
      setTree(prev => ({ ...prev, expanded: new Set(prev.expanded).add(dir) }))
      return
    }
    loadDir(repoPath, dir)
  }

  const openFile = (path: string): void => {
    if (repos === undefined) return
    setTree(prev => ({ ...prev, openFile: { path, view: { content: '', truncated: false, bytes: 0 } } }))
    void repos.readFile(path).then(result => {
      if (!result.ok) { setError(result.error.message); return }
      setTree(prev => prev.openFile?.path === path
        ? { ...prev, openFile: { path, view: result.value } }
        : prev)
    }).catch(reason => setError(reason instanceof Error ? reason.message : String(reason)))
  }

  const handleAdd = async (): Promise<void> => {
    const path = addPath.trim()
    if (path === '' || repos === undefined) return
    setAdding(true)
    setError(null)
    try {
      const result = await repos.add(path)
      if (!result.ok) throw new Error(result.error.message)
      setAddPath('')
      setSelectedId(result.value.id)
      refreshCatalog()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (repoId: string): Promise<void> => {
    if (repos === undefined) return
    const repo = catalog.find(item => item.id === repoId)
    if (repo === undefined) return
    if (!window.confirm(`从仓库列表移除 "${repo.name}" 吗？（不会删除磁盘上的文件）`)) return
    const result = await repos.removeRepo(repoId)
    if (!result.ok) { setError(result.error.message); return }
    setTree({ expanded: new Set(), children: new Map(), loadingDir: null, openFile: null })
    refreshCatalog()
  }

  // Recursive tree render.
  const renderDir = (repoPath: string, dir: string, depth: number): React.ReactNode[] => {
    const entries = tree.children.get(dir) ?? []
    return entries.map(entry => {
      const full = `${dir === repoPath ? repoPath : dir}${dir.endsWith('/') || dir.endsWith('\\') ? '' : '/'}${entry.name}`
      if (entry.kind === 'dir') {
        const expanded = tree.expanded.has(full)
        return (
          <div key={full}>
            <button
              type="button"
              className={css.treeRow}
              style={{ paddingLeft: 8 + depth * 14 }}
              onClick={() => toggleDir(repoPath, full)}
            >
              <span className={css.treeIcon}>
                {expanded
                  ? <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </span>
              <span className={css.treeName}>{entry.name}</span>
            </button>
            {expanded ? renderDir(repoPath, full, depth + 1) : null}
          </div>
        )
      }
      const open = tree.openFile?.path === full
      return (
        <button
          key={full}
          type="button"
          className={`${css.treeRow} ${open ? css.treeRowSelected : ''}`}
          style={{ paddingLeft: 8 + depth * 14 }}
          onClick={() => openFile(full)}
        >
          <span className={css.treeIcon}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 2h5l3 3v9H4V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
          </span>
          <span className={css.treeName}>{entry.name}</span>
          {entry.size !== undefined && entry.size > 0
            ? <span className={css.treeMeta}>{formatSize(entry.size)}</span>
            : null}
        </button>
      )
    })
  }

  return (
    <main className={`${css.root} cc-surface`}>
      <div className={css.header}>
        <h1 className={css.title}>代码仓库</h1>
        {selected !== null && branch !== null
          ? <span className={css.branch}>{branch}</span>
          : null}
      </div>

      {error !== null ? <div className="cc-notice-error">{error}</div> : null}

      <div className={css.split}>
        <aside className={css.sidebar}>
          <div className={css.sidebarTitle}>仓库列表</div>
          <div className={css.addRow}>
            <input
              type="text"
              className={css.addInput}
              placeholder="本地仓库路径…"
              value={addPath}
              onChange={(e) => setAddPath(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd() }}
            />
            <button type="button" className="cc-btn cc-btn-primary" disabled={adding} onClick={() => void handleAdd()}>
              添加
            </button>
          </div>
          <div className={css.repoList}>
            {catalog.length === 0 ? (
              <div className={css.empty}>
                <div className={css.emptyTitle}>暂无仓库</div>
                <div className={css.emptyDescription}>输入本地仓库路径后点击「添加」</div>
              </div>
            ) : catalog.map(repo => (
              <div
                key={repo.id}
                className={`${css.repoItem} ${repo.id === selectedId ? css.repoItemSelected : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(repo.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') setSelectedId(repo.id) }}
              >
                <div className={css.repoItemMain}>
                  <div className={css.repoItemName}>{repo.name}</div>
                  <div className={css.repoItemPath}>{repo.path}</div>
                </div>
                <button
                  type="button"
                  className="cc-icon-btn"
                  title="移除"
                  onClick={(e) => { e.stopPropagation(); void handleRemove(repo.id) }}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 5H13L12 14H4L3 5ZM6 2H10V3H6V2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className={css.main}>
          {selected === null ? (
            <div className={css.treePane}>
              <div className={css.empty}>
                <div className={css.emptyTitle}>选择一个仓库</div>
                <div className={css.emptyDescription}>在左侧选择或添加一个本地代码仓库以浏览文件</div>
              </div>
            </div>
          ) : (
            <>
              <div className={css.treePane}>
                <div className={css.treeHeader}>
                  <span className={css.treeTitle}>{selected.name}</span>
                  <span className={css.treeMeta}>{selected.path}</span>
                </div>
                <div className={css.treeScroll}>
                  {tree.loadingDir === selected.path && !tree.children.has(selected.path)
                    ? <div className={css.empty}><div className={css.emptyDescription}>加载中…</div></div>
                    : renderDir(selected.path, selected.path, 0)}
                </div>
              </div>

              {tree.openFile !== null && (
                <div className={css.previewPane}>
                  <div className={css.previewHeader}>
                    <span>{tree.openFile.path}</span>
                    <span>{formatSize(tree.openFile.view.bytes)}</span>
                  </div>
                  <pre className={css.previewBody}>{tree.openFile.view.content || '加载中…'}</pre>
                  {tree.openFile.view.truncated && (
                    <div className={css.truncateNote}>文件过大，仅显示前 256 KB</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
