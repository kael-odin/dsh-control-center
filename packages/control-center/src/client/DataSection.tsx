/**
 * Data management settings section: export / import / clear the Control
 * Center data (credentials stay in the DSH credentials store).
 */

import { useEffect, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { DataExport } from '../data-types.ts'
import css from './UsageSection.module.css'

export interface DataSectionInjected {
  getData: () => NonNullable<ClientRemote['controlCenterData']>
  hooks: { dataReady: HostObservable<boolean> }
}

export type DataSectionProps = PropsRuntime<'settings.section'> & InjectFace<DataSectionInjected>

export function DataSection({ getData, useDataReady }: DataSectionProps) {
  const dataReady = useDataReady(value => value)
  const data = dataReady ? getData() : undefined
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (data === undefined) return
  }, [data !== undefined]) // eslint-disable-line react-hooks/exhaustive-deps

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
      link.download = `dsh-control-center-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      setStatus('已导出，请保存下载的文件')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatus(null)
    }
  }

  const handleImport = async (file: File | undefined): Promise<void> => {
    if (data === undefined || file === undefined) return
    setError(null)
    setStatus('导入中…')
    try {
      const text = await file.text()
      const snapshot = JSON.parse(text) as DataExport
      const result = await data.importControlCenter(snapshot)
      if (!result.ok) throw new Error(result.error.message)
      setStatus('已导入，相关设置已恢复')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatus(null)
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
      setStatus('已清空')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatus(null)
    }
  }

  return (
    <div className={css.root}>
      <div>
        <h2 className={css.pageTitle}>数据</h2>
        <p className={css.pageDescription}>导出、导入或清空 Control Center 的配置数据（API 密钥保存在 DSH 凭据库中，不参与导出）</p>
      </div>

      {error !== null && <div className="cc-notice-error">{error}</div>}
      {status !== null && <div className="cc-notice-error" style={{ borderColor: 'var(--success-border)', background: 'var(--success-subtle)', color: 'var(--success-subtle-foreground)' }}>{status}</div>}

      <div className="cc-card">
        <div className="cc-card-title">导出</div>
        <p className="cc-card-description">将提供商、仓库、MCP、网络搜索等配置导出为一个 JSON 快照文件</p>
        <div>
          <button type="button" className="cc-btn cc-btn-primary" onClick={() => void handleExport()}>
            导出配置
          </button>
        </div>
      </div>

      <div className="cc-card">
        <div className="cc-card-title">导入</div>
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
