/**
 * Notes workspace (Cherry NotesPage parity, v2): Markdown file tree, full-text
 * search, and a Tiptap rich-text editor that round-trips Markdown. Files stay
 * on disk under `<dsh home>/notes/` — the file IS the source of truth, exactly
 * like Cherry. The editor loads Markdown through a markdown Tiptap extension
 * set and serializes back to Markdown on save.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { Markdown } from 'tiptap-markdown'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import type { NotesEntry, NotesTree, NoteSearchHit } from '../notes-types.ts'
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
    search(params: { query: string; limit?: number }): Promise<{ ok: true; value: NoteSearchHit[] }>
    continueText(params: { path: string; content: string; maxTokens?: number }): Promise<
      { ok: true; value: { text: string; model: string } } | { ok: false; error: { code: string; message: string; details: object } }
    >
  }
}

/** The tiptap-markdown storage slot; typed loosely because the plugin's
 * declaration merge is not always visible to tsc under pnpm's layout. */
function getMarkdown(editor: { storage: object }): string {
  const markdown = (editor.storage as Record<string, unknown>).markdown as { getMarkdown?: () => unknown } | undefined
  return typeof markdown?.getMarkdown === 'function' ? String(markdown.getMarkdown() ?? '') : ''
}

export function NotesWorkspace({ notes }: NotesWorkspaceInjected): ReactNode {
  const [tree, setTree] = useState<NotesTree | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<NoteSearchHit[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const saveTimer = useRef<number | null>(null)
  const markdownRef = useRef<string>('')

  const refreshTree = useCallback(async (): Promise<void> => {
    const result = await notes.tree()
    if (result.ok) setTree(result.value)
  }, [notes])

  useEffect(() => { void refreshTree() }, [refreshTree])

  // Search with a light debounce; clears when the box empties.
  useEffect(() => {
    if (query.trim() === '') { setHits(null); setSearching(false); return }
    setSearching(true)
    const timer = window.setTimeout(() => {
      void notes.search({ query: query.trim() }).then((result) => {
        if (result.ok) setHits(result.value)
        setSearching(false)
      }).catch(() => { setSearching(false) })
    }, 250)
    return () => { window.clearTimeout(timer) }
  }, [query, notes])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Markdown,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: '开始写作…' }),
      TaskList, TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }), TableRow, TableHeader, TableCell,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: '',
    editable: true,
    onUpdate: ({ editor }) => {
      markdownRef.current = getMarkdown(editor)
      setDirty(true)
      if (active === null) return
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
      const path = active
      saveTimer.current = window.setTimeout(() => { void save(path) }, 800)
    },
  })

  const [dirty, setDirty] = useState(false)
  const [continuing, setContinuing] = useState(false)

  const openNote = async (path: string): Promise<void> => {
    setError(null)
    const result = await notes.read({ path })
    if (!result.ok) { setError(result.error); return }
    setActive(path)
    setDirty(false)
    // Load Markdown into the Tiptap editor.
    if (editor !== null) {
      markdownRef.current = result.value.content
      editor.commands.setContent(result.value.content, { emitUpdate: false })
    }
  }

  const save = useCallback(async (path: string): Promise<void> => {
    const content = markdownRef.current
    const result = await notes.write({ path, content })
    if (result.ok) setDirty(false)
    else setError(result.error)
  }, [notes])

  /** AI 续写：把当前笔记交给模型续写，结果插入光标处并立即保存。 */
  const continueNote = async (): Promise<void> => {
    if (editor === null || active === null) return
    setContinuing(true)
    setError(null)
    try {
      // Flush any pending autosave so disk matches the editor before we continue.
      if (saveTimer.current !== null) { window.clearTimeout(saveTimer.current); saveTimer.current = null }
      const content = markdownRef.current
      await save(active)
      const result = await notes.continueText({ path: active, content })
      if (!result.ok) { setError(result.error.message); return }
      const text = result.value.text
      if (text.trim().length === 0) { setError('模型未生成任何内容，请重试'); return }
      editor.commands.insertContent(text)
      markdownRef.current = getMarkdown(editor)
      setDirty(true)
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => { void save(active) }, 800)
    } finally {
      setContinuing(false)
    }
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
    if (active === entry.path) { setActive(null); setDirty(false); editor?.commands.clearContent(true) }
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

  const files = useMemo(() => tree?.entries.filter(entry => entry.type === 'file') ?? [], [tree])
  const starred = files.filter(entry => entry.starred)

  return (
    // Notes is a standalone application.surface, so it must establish the
    // Cherry token scope itself the way the sibling workspaces do — the shell
    // alone only carries layout, and the host never supplies the unprefixed
    // contract this stylesheet consumes.
    <SettingsPageShell className="cc-surface">
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
          <input
            className={css.searchBox}
            type="search"
            placeholder="搜索笔记内容…"
            value={query}
            onChange={event => { setQuery(event.target.value) }}
          />
          {searching && <div className={css.searchHint}>搜索中…</div>}
          {hits !== null && (
            <div className={css.searchResults}>
              {hits.length === 0 && <div className={css.searchHint}>无匹配</div>}
              {hits.map(hit => (
                <button key={hit.path} type="button" className={css.searchItem} onClick={() => { void openNote(hit.path) }}>
                  <div className={css.searchTitle}>{hit.path}</div>
                  <div className={css.searchSnippet}>{hit.snippet}</div>
                </button>
              ))}
            </div>
          )}
          {hits === null && (
            <>
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
            </>
          )}
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
                <button type="button" className={css.miniBtn} disabled={continuing} onClick={() => { void continueNote() }}>
                  {continuing ? '续写中…' : 'AI 续写'}
                </button>
                <button type="button" className={css.miniBtn} onClick={() => { if (active !== null) void save(active) }}>立即保存</button>
              </div>
              <EditorContent editor={editor} className={css.editor} />
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
