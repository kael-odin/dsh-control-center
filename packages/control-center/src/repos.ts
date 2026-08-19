/**
 * Code Repository workspace Host service.
 *
 * Persists a catalog of local repositories (settings namespace) and exposes
 * read-only file-tree browsing confined to the registered repo roots: every
 * tree/readFile call is resolved and verified to stay inside a registered
 * repository before any filesystem access.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { settingsNamespace, type SettingsScope } from '@deepseek-ai/dsh-settings'
import Schema from '@deepseek-ai/schemastery'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, relative, resolve, sep } from 'node:path'
import type { RepoRecord, RepoTreeEntry, RepoFileView, RepoBranch } from './repo-types.ts'

const REPOS_NAMESPACE = settingsNamespace('control-center-repos')

/** Skip these entries in the tree (workspace noise). */
const SKIPPED_NAMES = new Set(['node_modules', '.git', '.DS_Store', 'dist', 'build', 'out', '.next', '.turbo', 'coverage'])

const DEFAULT_READ_LIMIT = 256 * 1024

interface ReposSettings {
  repos: RepoRecord[]
}

export class ReposService extends Service {
  static inject = ['settings'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterRepos')
  private scope: SettingsScope<ReposSettings>

  constructor(ctx: Context, _config?: { logger?: Context['logger'] }) {
    super(ctx, 'controlCenterRepos')
    this.scope = ctx.settings.register(REPOS_NAMESPACE, Schema.object({
      repos: Schema.array(Schema.object({
        id: Schema.string(),
        name: Schema.string(),
        path: Schema.string(),
        addedAt: Schema.string()
      })).default([])
    }), {
      base: { repos: [] }
    })
  }

  /** Registered repo roots, resolved to absolute paths. */
  private roots(): ReadonlyArray<{ id: string; root: string }> {
    return this.scope.get().repos.map(repo => ({ id: repo.id, root: resolve(repo.path) }))
  }

  /** Assert `candidate` stays inside one of the registered repo roots. */
  private confine(candidate: string): { id: string; root: string } {
    const resolved = resolve(candidate)
    const matched = this.roots().find(({ root }) => {
      const rel = relative(root, resolved)
      return rel === '' || (!rel.startsWith('..') && !rel.includes(`..${sep}`) && !isAbsolutePath(rel))
    })
    if (matched === undefined) throw new Error('Path is outside the registered repositories')
    return matched
  }

  async list(): Promise<RepoRecord[]> {
    return this.scope.get().repos
  }

  async add(path: string): Promise<RepoRecord> {
    const resolvedPath = resolve(path)
    if (!existsSync(resolvedPath) || !statSync(resolvedPath).isDirectory()) {
      throw new Error(`Not a directory: ${resolvedPath}`)
    }
    const current = this.scope.get().repos
    if (current.some(repo => resolve(repo.path) === resolvedPath)) {
      throw new Error('This repository is already registered')
    }
    const record: RepoRecord = {
      id: `repo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: basename(resolvedPath) || resolvedPath,
      path: resolvedPath,
      addedAt: new Date().toISOString()
    }
    await this.scope.update({ repos: [...current, record] })
    this.ctx.logger.info('Registered code repository', { id: record.id, path })
    return record
  }

  async remove(repoId: string): Promise<{ absent: true }> {
    const current = this.scope.get().repos
    const next = current.filter(repo => repo.id !== repoId)
    if (next.length === current.length) return { absent: true }
    await this.scope.update({ repos: next })
    return { absent: true }
  }

  async tree(path: string, dir?: string): Promise<RepoTreeEntry[]> {
    this.confine(path)
    const target = resolve(dir ?? path)
    this.confine(target)
    if (!existsSync(target) || !statSync(target).isDirectory()) {
      throw new Error(`Not a directory: ${target}`)
    }
    const entries: RepoTreeEntry[] = []
    for (const name of readdirSync(target)) {
      if (SKIPPED_NAMES.has(name)) continue
      const full = join(target, name)
      const stat = statSync(full)
      entries.push(stat.isDirectory()
        ? { name, kind: 'dir' }
        : { name, kind: 'file', size: stat.size })
    }
    entries.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    return entries
  }

  async readFile(path: string, maxBytes?: number): Promise<RepoFileView> {
    this.confine(path)
    const file = resolve(path)
    const stat = statSync(file)
    if (!stat.isFile()) throw new Error(`Not a file: ${file}`)
    const limit = maxBytes ?? DEFAULT_READ_LIMIT
    const fd = readFileSync(file)
    const truncated = fd.length > limit
    const slice = truncated ? fd.subarray(0, limit) : fd
    // Binary guard: NUL byte in the first chunk marks non-text content.
    if (slice.includes(0)) throw new Error('Binary file preview is not supported')
    return { content: slice.toString('utf8'), truncated, bytes: stat.size }
  }

  async getBranch(path: string): Promise<RepoBranch> {
    this.confine(path)
    const head = join(resolve(path), '.git', 'HEAD')
    if (!existsSync(head)) return null
    const raw = readFileSync(head, 'utf8').trim()
    const ref = /^ref:\s*refs\/heads\/(.+)$/.exec(raw)
    return ref?.[1] ?? raw
  }

  [Symbol.dispose]() {
    // Settings scope owns its lifecycle; nothing else to release.
  }
}

function isAbsolutePath(rel: string): boolean {
  return /^([a-zA-Z]:)?[\\/]/.test(rel)
}
