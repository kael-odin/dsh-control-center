/** Shared notes types between the host service and the client workspace. */

export interface NotesEntry {
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

/** Editor AI continuation request: current note content, optionally the trailing context. */
export interface NoteContinueRequest {
  path: string
  content: string
  maxTokens?: number
}

export interface NoteContinueResult {
  text: string
  model: string
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    controlCenterNotes: {
      tree(): Promise<{ ok: true; value: NotesTree }>
      read(params: { path: string }): Promise<{ ok: true; value: { content: string } } | { ok: false; error: string }>
      write(params: { path: string; content: string }): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: string }>
      create(params: { path: string; directory?: boolean }): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: string }>
      rename(params: { from: string; to: string }): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: string }>
      remove(params: { path: string; directory?: boolean }): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: string }>
      toggleStar(params: { path: string }): Promise<{ ok: true; value: { starred: boolean } }>
      search(params: { query: string; limit?: number }): Promise<{ ok: true; value: NoteSearchHit[] }>
      continueText(params: NoteContinueRequest): Promise<{ ok: true; value: NoteContinueResult } | { ok: false; error: { code: string; message: string; details: object } }>
    }
  }
}
