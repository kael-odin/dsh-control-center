/**
 * Notes host service — Cherry NotesPage parity, v1.
 *
 * Cherry stores notes as plain Markdown files on disk (a root directory plus
 * relative paths; SQLite only carries tree metadata). We keep that philosophy:
 * files live under `<dsh home>/notes/`, readable by any tool, and the tree
 * metadata (starred flags) rides a settings namespace. Editing surface v1 is
 * plain-text Markdown; a rich editor is a later layer on the same storage.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

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

const NOTES_NAMESPACE = settingsNamespace('control-center-notes')

declare module '@deepseek-ai/cordis' {
  interface Context {
    controlCenterNotes: NotesService
  }
}

export class NotesService extends Service {
  static inject = ['settings'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterNotes')

  constructor(ctx: Context) {
    super(ctx, 'controlCenterNotes')
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

  /** One level of the tree (Cherry lists per root; v1 lists the whole root recursively, depth-capped). */
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
        let isDir: boolean
        try { isDir = readdirSync(childAbs) !== undefined } catch { isDir = false }
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
      if (abs.endsWith(sep)) throw new Error('目录无法按笔记读取')
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
        writeFileSync(abs, `# ${params.path.replace(/\.md$/i, '').split('/').pop() ?? '笔记'}\n\n`, 'utf8')
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
      return { ok: true, value: { absent: true } }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async remove(params: { path: string; directory?: boolean }): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: string }> {
    try {
      const abs = this.safePath(params.path)
      rmSync(abs, { recursive: params.directory === true })
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
}
