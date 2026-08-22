/**
 * 数据 (Data management) section — Cherry DataSettings parity.
 *
 * - 本地备份（桌面桥）: save dialog → host writes the full snapshot to the
 *   granted path; restore reads a picked file back through the same confined
 *   bridge. The bridge cannot touch any file the user did not just pick.
 * - 快照导出/导入（浏览器下载/上传）: the web fallback, same snapshot format.
 * - WebDAV / S3 / 第三方笔记同步: honestly labeled unsupported on this
 *   platform rather than rendered as dead switches (Cherry offers them; DSH
 *   has no such service yet).
 *
 * The snapshot covers every Control Center settings namespace; API keys stay
 * in the DSH credentials store and never leave it.
 */

import { useEffect, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { DataExport } from '../data-types.ts'
import css from './UsageSection.module.css'

export interface DataSectionInjected {
  getData: () => NonNullable<ClientRemote['controlCenterData']>
  getDesktop: () => NonNullable<ClientRemote['controlCenterDesktop']>
  hooks: { dataReady: HostObservable<boolean>; desktopReady: HostObservable<boolean> }
}

export type DataSectionProps = PropsRuntime<'settings.section'> & InjectFace<DataSectionInjected>

function snapshotName(): string {
  return `dsh-control-center-${new Date().toISOString().slice(0, 10)}.json`
}

/** UTF-8 text → base64 (browser-safe; the bridge speaks base64 for file bytes). */
function textToBase64(text: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(text)))
}

function base64ToText(base64: string): string {
  return new TextDecoder().decode(Uint8Array.from(atob(base64), character => character.charCodeAt(0)))
}

export function DataSection({ getData, getDesktop, useDataReady, useDesktopReady }: DataSectionProps) {
  const dataReady = useDataReady(value => value)
  const desktopReady = useDesktopReady(value => value)
  const data = dataReady ? getData() : undefined
  const desktop = desktopReady ? getDesktop() : undefined
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (data === undefined) return
  }, [data !== undefined]) // eslint-disable-line react-hooks/exhaustive-deps

  const report = (message: string): void => {
    setStatus(message)
    setError(null)
  }
  const fail = (err: unknown): void => {
    setError(err instanceof Error ? err.message : String(err))
    setStatus(null)
  }

  /** Desktop 本地备份: native save dialog → host writes the snapshot there. */
  const handleBackupToFile = async (): Promise<void> => {
    if (data === undefined || desktop === undefined) return
    setError(null)
    setStatus('选择保存位置…')
    try {
      const picked = await desktop.pickSaveFile(snapshotName())
      if (!picked.ok) throw new Error(picked.error.message)
      if (picked.value.canceled === true || picked.value.filePath === undefined) {
        setStatus(null)
        return
      }
      const snapshot = await data.exportControlCenter()
      if (!snapshot.ok) throw new Error(snapshot.error.message)
      const written = await desktop.writeFile(picked.value.filePath, textToBase64(JSON.stringify(snapshot.value, null, 2)))
      if (!written.ok) throw new Error(written.error.message)
      report(`已备份到 ${picked.value.filePath}`)
    } catch (err) {
      fail(err)
    }
  }

  /** Desktop restore: native open dialog → read → import. */
  const handleRestoreFromFile = async (): Promise<void> => {
    if (data === undefined || desktop === undefined) return
    setError(null)
    setStatus('选择备份文件…')
    try {
      const picked = await desktop.pickFile(['openFile'])
      if (!picked.ok) throw new Error(picked.error.message)
      const path = picked.value.filePaths?.[0]
      if (picked.value.canceled === true || path === undefined) {
        setStatus(null)
        return
      }
      const read = await desktop.readFile(path)
      if (!read.ok) throw new Error(read.error.message)
      await importSnapshot(JSON.parse(base64ToText(read.value.contentBase64 ?? '')) as DataExport)
    } catch (err) {
      fail(err)
    }
  }

  const importSnapshot = async (snapshot: DataExport): Promise<void> => {
    setStatus('导入中…')
    const result = await data!.importControlCenter(snapshot)
    if (!result.ok) throw new Error(result.error.message)
    report('已导入，相关设置已恢复')
  }

  const handleExport = async (): Promise<void> => {
    if (data === undefined) return
    setError(null)
    setStatus('导出中…')
    try {
      const result = await data.exportControlCenter()
      if (!result.ok) throw new Error(result.error.message)
      const blob = new Blob([JSON.stringify(result.value, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = snapshotName()
      link.click()
      URL.revokeObjectURL(url)
      report('已导出，请保存下载的文件')
    } catch (err) {
      fail(err)
    }
  }

  const handleImport = async (file: File | undefined): Promise<void> => {
    if (data === undefined || file === undefined) return
    setError(null)
    try {
      await importSnapshot(JSON.parse(await file.text()) as DataExport)
    } catch (err) {
      fail(err)
    }
  }

  const handleClear = async (): Promise<void> => {
    if (data === undefined) return
    if (!window.confirm('确定清空 Control Center 的所有数据吗？此操作不可撤销（凭据保留）。')) return
    setError(null)
    setStatus('清空中…')
    try {
      const result = await data.clearControlCenter()
      if (!result.ok) throw new Error(result.error.message)
      report('已清空')
    } catch (err) {
      fail(err)
    }
  }

  return (
    <div className={css.root}>
      <div>
        <h2 className={css.pageTitle}>数据</h2>
        <p className={css.pageDescription}>备份、恢复或清空 Control Center 的全部配置数据（API 密钥保存在 DSH 凭据库中，不参与备份）</p>
      </div>

      {error !== null && <div className="cc-notice-error">{error}</div>}
      {status !== null && <div className="cc-notice-error" style={{ borderColor: 'var(--success-border)', background: 'var(--success-subtle)', color: 'var(--success-subtle-foreground)' }}>{status}</div>}

      <div className="cc-card">
        <div className="cc-card-title">本地备份</div>
        <p className="cc-card-description">把完整配置快照保存为本地 JSON 文件，或从备份文件恢复（通过桌面桥的文件对话框，桥只能读写你刚选择的那个文件）</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="cc-btn cc-btn-primary"
            disabled={desktop === undefined}
            title={desktop === undefined ? '需要桌面版桌面桥' : undefined}
            onClick={() => void handleBackupToFile()}
          >
            备份到本地文件
          </button>
          <button
            type="button"
            className="cc-btn cc-btn-secondary"
            disabled={desktop === undefined}
            title={desktop === undefined ? '需要桌面版桌面桥' : undefined}
            onClick={() => void handleRestoreFromFile()}
          >
            从本地文件恢复
          </button>
        </div>
        {desktop === undefined && (
          <p className={css.pageDescription} style={{ marginTop: 8, color: 'var(--muted-foreground)' }}>
            当前是浏览器环境，没有本地文件对话框；请使用下方的快照导出/导入。
          </p>
        )}
      </div>

      <div className="cc-card">
        <div className="cc-card-title">快照导出</div>
        <p className="cc-card-description">将供应商、模型偏好、仓库、技能、MCP、网络搜索、文档处理、翻译、频道、任务等全部配置导出为一个 JSON 快照文件</p>
        <div>
          <button type="button" className="cc-btn cc-btn-primary" onClick={() => void handleExport()}>
            导出快照
          </button>
        </div>
      </div>

      <div className="cc-card">
        <div className="cc-card-title">快照导入</div>
        <p className="cc-card-description">从之前导出的 JSON 快照恢复配置</p>
        <div>
          <label className="cc-btn cc-btn-secondary" style={{ cursor: 'pointer' }}>
            选择文件导入
            <input
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={(e) => void handleImport(e.target.files?.[0])}
            />
          </label>
        </div>
      </div>

      <div className="cc-card">
        <div className="cc-card-title">云同步与第三方</div>
        <p className="cc-card-description">
          Cherry 的 WebDAV / S3 / 坚果云备份与 Notion / Obsidian / Joplin / 思源 / 语雀 导出，当前平台暂不支持——DSH 尚未提供对应服务，此处不做假开关。
        </p>
      </div>

      <div className="cc-card">
        <div className="cc-card-title">清空数据</div>
        <p className="cc-card-description">重置所有 Control Center 配置（API 密钥凭据保留）。此操作不可撤销。</p>
        <div>
          <button type="button" className="cc-btn cc-btn-danger" onClick={() => void handleClear()}>
            清空数据
          </button>
        </div>
      </div>
    </div>
  )
}
