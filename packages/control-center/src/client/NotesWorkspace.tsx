/**
 * Notes workspace (Cherry NotesPage parity, v1): a Markdown file tree on the
 * left, a plain-text editor on the right with autosave. Files live on disk
 * under `<dsh home>/notes/` — the file IS the source of truth, exactly like
 * Cherry. The rich (Tiptap-style) editing layer is a later increment on the
 * same storage; v1 ships the full CRUD + star + autosave loop.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { NotesEntry, NotesTree } from '../notes-types.ts'
import { SettingsPageShell } from './SettingsPages.tsx'
import css from './NotesWorkspace.module.css'

export interface NotesWorkspaceInjected {
  notes: {
    tree(): Promise<{ ok: true; value: NotesTree }>
    read(params: { path: string }): Promise<{ ok: true; value: { content: string } } | { ok: false; error: string }>
    write(params: { path: string; content: string }): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: string }>
    create(params: { path: string; directory?: boolean }): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: string }>
    rename(params: { from: string; to: string }): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: string }>
    remove(params: { path: string; directory?: boolean }): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: string }>
    toggleStar(params: { path: string }): Promise<{ ok: true; value: { starred: boolean } }>
  }
}

export function NotesWorkspace({ notes }: NotesWorkspaceInjected): ReactNode {
  const [tree, setTree] = useState<NotesTree | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const saveTimer = useRef<number | null>(null)

  const refreshTree = useCallback(async (): Promise<void> => {
    const result = await notes.tree()
    if (result.ok) setTree(result.value)
  }, [notes])

  useEffect(() => { void refreshTree() }, [refreshTree])

  const openNote = async (path: string): Promise<void> => {
    setError(null)
    const result = await notes.read({ path })
    if (result.ok) {
      setActive(path)
      setDraft(result.value.content)
      setDirty(false)
    } else {
      setError(result.error)
    }
  }

  const save = useCallback(async (path: string, content: string): Promise<void> => {
    const result = await notes.write({ path, content })
    if (result.ok) setDirty(false)
    else setError(result.error)
  }, [notes])

  const onDraftChange = (value: string): void => {
    setDraft(value)
    setDirty(true)
    if (active === null) return
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
    const path = active
    saveTimer.current = window.setTimeout(() => { void save(path, value) }, 800)
  }

  const createNote = async (): Promise<void> => {
    const name = window.prompt('新笔记名称', '未命名.md')
    if (name === null || name.trim() === '') return
    const path = name.trim().endsWith('.md') ? name.trim() : `${name.trim()}.md`
    const result = await notes.create({ path })
    if (!result.ok) { setError(result.error); return }
    await refreshTree()
    await openNote(path)
  }

  const createFolder = async (): Promise<void> => {
    const name = window.prompt('新文件夹名称', '新建文件夹')
    if (name === null || name.trim() === '') return
    const result = await notes.create({ path: name.trim(), directory: true })
    if (!result.ok) { setError(result.error); return }
    await refreshTree()
  }

  const removeEntry = async (entry: NotesEntry): Promise<void> => {
    if (!window.confirm(`删除「${entry.path}」？${entry.type === 'directory' ? '文件夹内全部内容将一并删除。' : ''}`)) return
    const result = await notes.remove({ path: entry.path, directory: entry.type === 'directory' })
    if (!result.ok) { setError(result.error); return }
    if (active === entry.path || (entry.type === 'directory' && active !== null && active.startsWith(`${entry.path}/`))) {
      setActive(null)
      setDraft('')
      setDirty(false)
    }
    await refreshTree()
  }

  const renameEntry = async (entry: NotesEntry): Promise<void> => {
    const next = window.prompt('重命名为', entry.path.split('/').pop() ?? entry.path)
    if (next === null || next.trim() === '' || next.trim() === entry.path.split('/').pop()) return
    const to = entry.path.includes('/')
      ? `${entry.path.slice(0, entry.path.lastIndexOf('/'))}/${next.trim()}`
      : next.trim()
    const result = await notes.rename({ from: entry.path, to })
    if (!result.ok) { setError(result.error); return }
    if (active === entry.path) setActive(to)
    await refreshTree()
  }

  const toggleStar = async (entry: NotesEntry): Promise<void> => {
    await notes.toggleStar({ path: entry.path })
    await refreshTree()
  }

  const files = tree?.entries.filter(entry => entry.type === 'file') ?? []
  const starred = files.filter(entry => entry.starred)

  return (
    <SettingsPageShell>
      <div className={css.layout}>
        <aside className={css.sidebar}>
          <div className={css.sidebarHeader}>
            <span>笔记</span>
            <span className={css.headerActions}>
              <button type="button" className={css.miniBtn} title="新建笔记" onClick={() => { void createNote() }}>＋</button>
              <button type="button" className={css.miniBtn} title="新建文件夹" onClick={() => { void createFolder() }}>📁</button>
              <button type="button" className={css.miniBtn} title="刷新" onClick={() => { void refreshTree() }}>↻</button>
            </span>
          </div>
          {starred.length > 0 && (
            <>
              <div className={css.sectionLabel}>收藏</div>
              {starred.map(entry => (
                <NoteRow key={`star-${entry.path}`} entry={entry} active={active === entry.path}
                  onOpen={() => { void openNote(entry.path) }} onStar={() => { void toggleStar(entry) }}
                  onRename={() => { void renameEntry(entry) }} onRemove={() => { void removeEntry(entry) }} />
              ))}
            </>
          )}
          <div className={css.sectionLabel}>全部笔记</div>
          {files.map(entry => (
            <NoteRow key={entry.path} entry={entry} active={active === entry.path}
              onOpen={() => { void openNote(entry.path) }} onStar={() => { void toggleStar(entry) }}
              onRename={() => { void renameEntry(entry) }} onRemove={() => { void removeEntry(entry) }} />
          ))}
        </aside>
        <section className={css.editorPane}>
          {error !== null && <div className="cc-notice-error">{error}</div>}
          {active === null ? (
            <div className={css.empty}>选择或新建一篇笔记</div>
          ) : (
            <>
              <div className={css.editorHeader}>
                <span className={css.activePath}>{active}</span>
                <span className={css.dirtyHint}>{dirty ? '编辑中…（自动保存）' : '已保存'}</span>
                <button type="button" className={css.miniBtn} onClick={() => { void save(active, draft) }}>立即保存</button>
              </div>
              <textarea
                className={css.editor}
                value={draft}
                spellCheck={false}
                onChange={event => { onDraftChange(event.target.value) }}
                placeholder="Markdown…"
              />
            </>
          )}
        </section>
      </div>
    </SettingsPageShell>
  )
}

function NoteRow({ entry, active, onOpen, onStar, onRename, onRemove }: {
  entry: NotesEntry
  active: boolean
  onOpen: () => void
  onStar: () => void
  onRename: () => void
  onRemove: () => void
}): ReactNode {
  return (
    <div className={`${css.row} ${active ? css.rowActive : ''}`}>
      <button type="button" className={css.rowName} title={entry.path} onClick={onOpen}>
        {entry.starred ? '★ ' : ''}{entry.path.split('/').pop()}
      </button>
      <span className={css.rowActions}>
        <button type="button" className={css.miniBtn} title="收藏" onClick={onStar}>{entry.starred ? '☆' : '★'}</button>
        <button type="button" className={css.miniBtn} title="重命名" onClick={onRename}>✎</button>
        <button type="button" className={css.miniBtn} title="删除" onClick={onRemove}>✕</button>
      </span>
    </div>
  )
}
