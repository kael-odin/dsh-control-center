/**
 * Update settings section: check the GitHub release feed for a newer
 * Control Center version.
 */

import { useEffect, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { UpdateInfo } from '../local-models-types.ts'
import css from './UsageSection.module.css'

export interface UpdateSectionInjected {
  getUpdate: () => NonNullable<ClientRemote['controlCenterUpdate']>
  hooks: { updateReady: HostObservable<boolean> }
}

export type UpdateSectionProps = PropsRuntime<'settings.section'> & InjectFace<UpdateSectionInjected>

export function UpdateSection({ getUpdate, useUpdateReady }: UpdateSectionProps) {
  const ready = useUpdateReady(value => value)
  const service = ready ? getUpdate() : undefined
  const [info, setInfo] = useState<UpdateInfo | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const check = async (): Promise<void> => {
    if (service === undefined) return
    setChecking(true)
    setError(null)
    try {
      const result = await service.checkForUpdates()
      if (!result.ok) throw new Error(result.error.message)
      setInfo(result.value)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    void check()
  }, [service !== undefined]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={css.root}>
      <div>
        <h2 className={css.pageTitle}>更新</h2>
        <p className={css.pageDescription}>检查 DSH Control Center 的新版本</p>
      </div>

      {error !== null && <div className="cc-notice-error">{error}</div>}

      <div className="cc-card">
        <div className="cc-card-title">版本状态</div>
        {info === null ? (
          <div className="cc-loading" style={{ minHeight: 80 }}>检查中…</div>
        ) : (
          <>
            <div className="cc-field-row">
              <span className="cc-field-label">当前版本</span>
              <span className="cc-field-label" style={{ fontFamily: 'var(--ds-font-family-code), monospace' }}>v{info.currentVersion}</span>
            </div>
            <div className="cc-field-row">
              <span className="cc-field-label">最新版本</span>
              <span className="cc-field-label" style={{ fontFamily: 'var(--ds-font-family-code), monospace' }}>
                {info.latestVersion ?? '无法获取'}
              </span>
            </div>
            {info.updateAvailable && info.latestVersion !== null && (
              <div className="cc-notice-error" style={{ borderColor: 'var(--success-border)', background: 'var(--success-subtle)', color: 'var(--success-subtle-foreground)' }}>
                发现新版本 {info.latestVersion}
                {info.releaseUrl !== null && (
                  <a href={info.releaseUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 8, color: 'var(--link, var(--primary))' }}>
                    前往下载
                  </a>
                )}
              </div>
            )}
            {!info.updateAvailable && (
              <div className="cc-notice-error" style={{ borderColor: 'var(--success-border)', background: 'var(--success-subtle)', color: 'var(--success-subtle-foreground)' }}>
                已是最新版本
              </div>
            )}
          </>
        )}
        <div>
          <button type="button" className="cc-btn cc-btn-secondary" disabled={checking} onClick={() => void check()}>
            {checking ? '检查中…' : '重新检查'}
          </button>
        </div>
      </div>
    </div>
  )
}
