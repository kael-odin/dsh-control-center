/**
 * Data management types (shared between Host and Client).
 */

import type { DataExport, WebDavConfigUpdate, WebDavConfigView, WebDavVendor } from './data.ts'

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    controlCenterData: {
      exportControlCenter(): Promise<{ ok: true; value: DataExport } | { ok: false; error: { code: string; message: string; details: object } }>
      importControlCenter(snapshot: DataExport): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
      clearControlCenter(): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
      exportToFile(path: string): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
      importFromFile(path: string): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
      backupToDirectory(dir: string, maxBackups: number): Promise<{ ok: true; value: string } | { ok: false; error: { code: string; message: string; details: object } }>
      listBackupFiles(dir: string): Promise<{ ok: true; value: string[] } | { ok: false; error: { code: string; message: string; details: object } }>
      getWebdavConfig(vendor?: WebDavVendor): Promise<{ ok: true; value: WebDavConfigView } | { ok: false; error: { code: string; message: string; details: object } }>
      setWebdavConfig(config: WebDavConfigUpdate, vendor?: WebDavVendor): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
      testWebdavConnection(vendor?: WebDavVendor): Promise<{ ok: true; value: { ok: boolean; message: string } } | { ok: false; error: { code: string; message: string; details: object } }>
      webdavBackup(vendor?: WebDavVendor): Promise<{ ok: true; value: string } | { ok: false; error: { code: string; message: string; details: object } }>
      webdavRestore(fileName: string, vendor?: WebDavVendor): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
      listWebdavBackups(vendor?: WebDavVendor): Promise<{ ok: true; value: string[] } | { ok: false; error: { code: string; message: string; details: object } }>
    }
  }
}

export type { DataExport, WebDavConfigUpdate, WebDavConfigView, WebDavVendor }
