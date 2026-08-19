/**
 * Code Repository workspace types (shared between Host and Client).
 */

/** One registered repository in the Control Center catalog. */
export interface RepoRecord {
  id: string
  name: string
  path: string
  addedAt: string
}

/** Directory entry from the repo file tree. */
export interface RepoTreeEntry {
  name: string
  kind: 'file' | 'dir'
  /** File size in bytes (directories omit). */
  size?: number
}

/** Read-file result: text content with a truncation marker. */
export interface RepoFileView {
  content: string
  truncated: boolean
  bytes: number
}

/** Git branch read from .git/HEAD, or null when not a git repo. */
export type RepoBranch = string | null

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    controlCenterRepos: {
      list(): Promise<{ ok: true; value: RepoRecord[] } | { ok: false; error: { code: string; message: string; details: object } }>
      add(path: string): Promise<{ ok: true; value: RepoRecord } | { ok: false; error: { code: string; message: string; details: object } }>
      removeRepo(repoId: string): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
      tree(path: string, dir?: string): Promise<{ ok: true; value: RepoTreeEntry[] } | { ok: false; error: { code: string; message: string; details: object } }>
      readFile(path: string): Promise<{ ok: true; value: RepoFileView } | { ok: false; error: { code: string; message: string; details: object } }>
      getBranch(path: string): Promise<{ ok: true; value: RepoBranch } | { ok: false; error: { code: string; message: string; details: object } }>
    }
  }
}

export {}
