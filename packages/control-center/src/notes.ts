/**
 * Notes host service — Cherry NotesPage parity, v2 (full-text search).
 *
 * Cherry stores notes as plain Markdown files on disk (a root directory plus
 * relative paths; SQLite only carries tree metadata). We keep that philosophy:
 * files live under `<dsh home>/notes/`, readable by any tool, and the tree
 * metadata (starred flags) rides a settings namespace.
 * v2 adds a FlexSearch full-text index, maintained incrementally on every
 * write/create/rename/remove so search never needs a full rebuild.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { Index } from 'flexsearch'

export interface NotesEntry {
  /** Forward-slash path relative to the notes root; directories have no extension. */
  path: string
  type: 'file' | 'directory'
  starred: boolean
}

export interface NotesTree {
  root: string
  entries: NotesEntry[]
}

export interface NoteSearchHit {
  path: string
  snippet: string
}

const NOTES_NAMESPACE = settingsNamespace('control-center-notes')

declare module '@deepseek-ai/cordis' {
  interface Context {
    controlCenterNotes: NotesService
  }
}

export class NotesService extends Service {
  static inject = ['settings'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterNotes')

  /** FlexSearch index for full-text search over Markdown content. The default
   * latin encoder leaves CJK text unsearchable, so a custom encoder emits
   * latin words plus CJK unigrams and bigrams. */
  private readonly searchIndex = new Index({
    resolution: 9,
    context: false,
    encode: (str: string): string[] => {
      const cjk = str.match(/[一-鿿]/g) ?? []
      const latin = str.toLowerCase().match(/[a-z0-9]+/g) ?? []
      const grams: string[] = []
      for (let i = 0; i < cjk.length; i++) {
        const current = cjk[i]
        if (current === undefined) continue
        const previous = cjk[i - 1]
        if (previous !== undefined) grams.push(previous + current)
        grams.push(current)
      }
      return [...latin, ...grams]
    },
  })

  constructor(ctx: Context) {
    super(ctx, 'controlCenterNotes')
    // Build once at mount: the index is in-memory and must reflect the tree.
    // Subsequent mutations stay in sync via indexNote/removeFromIndex.
    void this.rebuildIndex().catch(() => { /* best effort; search degrades to empty */ })
  }

  private notesRoot(): string {
    const root = join(resolveDshHome(), 'notes')
    mkdirSync(root, { recursive: true })
    return root
  }

  /** Rejects traversal: the relative path must stay inside the notes root. */
  private safePath(relativePath: string): string {
    const normalized = relativePath.replaceAll('\\', '/').replace(/^\/+/, '')
    const abs = join(this.notesRoot(), normalized)
    const rel = relative(this.notesRoot(), abs)
    if (rel.startsWith('..') || rel === '' || rel.split(sep).includes('..')) {
      throw new Error(`笔记路径越界: ${relativePath}`)
    }
    return abs
  }

  private starredSet(): Set<string> {
    try {
      const value = this.ctx.settings.get(NOTES_NAMESPACE) as { starred?: unknown }
      return Array.isArray(value?.starred) ? new Set(value.starred.map(String)) : new Set()
    } catch {
      return new Set()
    }
  }

  private async writeStarred(set: Set<string>): Promise<void> {
    await this.ctx.settings.update(NOTES_NAMESPACE, { starred: [...set] } as never)
  }

  private isDirectory(abs: string): boolean {
    try { readdirSync(abs); return true } catch { return false }
  }

  /** Whole tree, depth-capped, newest-file order per directory. */
  async tree(): Promise<{ ok: true; value: NotesTree }> {
    const root = this.notesRoot()
    const starred = this.starredSet()
    const entries: NotesEntry[] = []
    const walk = (abs: string, depth: number): void => {
      if (depth > 8) return
      let names: string[]
      try { names = readdirSync(abs) } catch { return }
      for (const name of names.sort()) {
        if (name.startsWith('.')) continue
        const childAbs = join(abs, name)
        const rel = relative(root, childAbs).replaceAll('\\', '/')
        const isDir = this.isDirectory(childAbs)
        entries.push({ path: rel, type: isDir ? 'directory' : 'file', starred: starred.has(rel) })
        if (isDir) walk(childAbs, depth + 1)
      }
    }
    walk(root, 0)
    return { ok: true, value: { root, entries } }
  }

  async read(params: { path: string }): Promise<{ ok: true; value: { content: string } } | { ok: false; error: string }> {
    try {
      const abs = this.safePath(params.path)
      if (this.isDirectory(abs)) throw new Error('目录无法按笔记读取')
      return { ok: true, value: { content: readFileSync(abs, 'utf8') } }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async write(params: { path: string; content: string }): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: string }> {
    try {
      const abs = this.safePath(params.path)
      mkdirSync(join(abs, '..'), { recursive: true })
      writeFileSync(abs, params.content, 'utf8')
      this.indexNote(params.path, params.content)
      return { ok: true, value: { absent: true } }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async create(params: { path: string; directory?: boolean }): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: string }> {
    try {
      const abs = this.safePath(params.path)
      if (params.directory === true) {
        mkdirSync(abs, { recursive: true })
      } else {
        mkdirSync(join(abs, '..'), { recursive: true })
        const initialContent = `# ${params.path.replace(/\.md$/i, '').split('/').pop() ?? '笔记'}\n\n`
        writeFileSync(abs, initialContent, 'utf8')
        this.indexNote(params.path, initialContent)
      }
      return { ok: true, value: { absent: true } }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async rename(params: { from: string; to: string }): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: string }> {
    try {
      const from = this.safePath(params.from)
      const to = this.safePath(params.to)
      mkdirSync(join(to, '..'), { recursive: true })
      renameSync(from, to)
      // Starred flags follow the rename on the exact-entry match.
      const starred = this.starredSet()
      if (starred.delete(params.from)) starred.add(params.to)
      await this.writeStarred(starred)
      // Re-index under the new path (files only).
      if (!this.isDirectory(to)) {
        this.searchIndex.remove(params.from)
        this.indexNote(params.to, readFileSync(to, 'utf8'))
      }
      return { ok: true, value: { absent: true } }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async remove(params: { path: string; directory?: boolean }): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: string }> {
    try {
      const abs = this.safePath(params.path)
      rmSync(abs, { recursive: params.directory === true })
      if (params.directory !== true) this.searchIndex.remove(params.path)
      const starred = this.starredSet()
      if (starred.delete(params.path)) await this.writeStarred(starred)
      return { ok: true, value: { absent: true } }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async toggleStar(params: { path: string }): Promise<{ ok: true; value: { starred: boolean } }> {
    const starred = this.starredSet()
    if (starred.has(params.path)) starred.delete(params.path)
    else starred.add(params.path)
    await this.writeStarred(starred)
    return { ok: true, value: { starred: starred.has(params.path) } }
  }

  /** Full-text search over note content; returns paths with a matching-line snippet. */
  async search(params: { query: string; limit?: number }): Promise<{ ok: true; value: NoteSearchHit[] }> {
    const query = params.query.trim()
    if (query.length === 0) return { ok: true, value: [] }
    const limit = params.limit ?? 20
    const ids = this.searchIndex.search(query, { limit }) as string[]
    return {
      ok: true,
      value: ids.map(path => ({ path, snippet: this.extractSnippet(path, query) })),
    }
  }

  /** Rebuild the index from every .md file under the root. */
  private async rebuildIndex(): Promise<void> {
    this.searchIndex.clear()
    const walk = (abs: string): void => {
      let names: string[]
      try { names = readdirSync(abs) } catch { return }
      for (const name of names) {
        if (name.startsWith('.')) continue
        const childAbs = join(abs, name)
        if (this.isDirectory(childAbs)) {
          walk(childAbs)
        } else if (name.endsWith('.md')) {
          const rel = relative(this.notesRoot(), childAbs).replaceAll('\\', '/')
          try { this.indexNote(rel, readFileSync(childAbs, 'utf8')) } catch { /* unreadable file */ }
        }
      }
    }
    walk(this.notesRoot())
  }

  private indexNote(path: string, content: string): void {
    this.searchIndex.add(path, content)
  }

  private extractSnippet(path: string, query: string): string {
    try {
      const content = readFileSync(this.safePath(path), 'utf8')
      const lowerQuery = query.toLowerCase()
      for (const line of content.split('\n')) {
        if (line.toLowerCase().includes(lowerQuery)) {
          return line.trim().slice(0, 160)
        }
      }
      return content.slice(0, 160)
    } catch {
      return ''
    }
  }
}
