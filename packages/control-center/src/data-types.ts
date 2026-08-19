/**
 * Data management types (shared between Host and Client).
 */

import type { DataExport } from './data.ts'

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    controlCenterData: {
      exportControlCenter(): Promise<{ ok: true; value: DataExport } | { ok: false; error: { code: string; message: string; details: object } }>
      importControlCenter(snapshot: DataExport): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
      clearControlCenter(): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
      exportToFile(path: string): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
      importFromFile(path: string): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
    }
  }
}

export type { DataExport }
export {}
