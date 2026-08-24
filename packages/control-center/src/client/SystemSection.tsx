/**
 * System settings pages: About (versions + diagnostics) and Dependencies.
 */

import { useEffect, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { SystemInfo, DependencyEntry } from '../system-types.ts'
import type { ChannelBridgeHandle } from './ChannelsSection.tsx'
import css from './SystemSection.module.css'

export interface SystemSectionInjected {
  getSystem: () => NonNullable<ClientRemote['controlCenterSystem']>
  /** Lazy handle to the host channel bridge, for including channel runtime
   * status/logs in the diagnostic bundle (absent until the bridge mounts). */
  getBridge?: (() => ChannelBridgeHandle | undefined) | undefined
  hooks: { systemReady: HostObservable<boolean> }
}

export type SystemSectionProps = PropsRuntime<'settings.section'> & InjectFace<SystemSectionInjected>

function unwrap<T>(result: { ok: true; value: T } | { ok: false; error: { code: string; message: string; details: object } }): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

/** 关于: versions, compatibility, environment, diagnostics. */
export function AboutSection({ getSystem, getBridge, useSystemReady }: SystemSectionProps) {
  const systemReady = useSystemReady(value => value)
  const system = systemReady ? getSystem() : undefined
  const [info, setInfo] = useState<SystemInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [bundling, setBundling] = useState(false)

  useEffect(() => {
    if (system === undefined) return
    void system.getInfo().then(result => {
      try { setInfo(unwrap(result)) } catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    }).catch(reason => setError(reason instanceof Error ? reason.message : String(reason)))
  }, [system !== undefined]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error !== null) return <div className="cc-settings-column"><div className="cc-notice-error">{error}</div></div>
  if (info === null) return <div className={css.loading}>Loading...</div>

  const diagnostic = [
    `Control Center: ${info.controlCenterVersion}`,
    `DSH supported: ${info.dshSupportedVersion}`,
    `DSH source baseline: ${info.dshSourceBaseline}`,
    `Platform: ${info.platform} ${info.arch} (${info.release})`,
    `Node: ${info.nodeVersion}`,
    `DSH home: ${info.dshHome}`,
  ].join('\n')

  const copyDiagnostics = async (): Promise<void> => {
    await navigator.clipboard.writeText(diagnostic)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  /** Assemble a downloadable diagnostic bundle: system info + browser env +
   * channel runtime status/logs (no secrets: logs carry status/reply text). */
  const downloadDiagnostics = async (): Promise<void> => {
    if (info === null) return
    setBundling(true)
    const bridge = getBridge?.()
    let channels: { status: Array<Record<string, unknown>>; logs: Record<string, string[]> } | undefined
    if (bridge !== undefined) {
      try {
        const statusResult = await bridge.status()
        const logsResult: Record<string, string[]> = {}
        if (statusResult.ok) {
          for (const entry of statusResult.value) {
            const log = await bridge.getLog(entry.channelId, 50)
            if (log.ok) logsResult[`${entry.type}/${entry.channelId}`] = log.value
          }
          channels = { status: statusResult.value.map(entry => ({ ...entry })), logs: logsResult }
        }
      } catch {
        // Diagnostics are best-effort; a bridge hiccup must not fail the bundle.
      }
    }
    const bundle = {
      generatedAt: new Date().toISOString(),
      app: {
        controlCenterVersion: info.controlCenterVersion,
        dshSupportedVersion: info.dshSupportedVersion,
        dshSourceBaseline: info.dshSourceBaseline,
      },
      environment: {
        platform: info.platform,
        arch: info.arch,
        release: info.release,
        nodeVersion: info.nodeVersion,
        dshHome: info.dshHome,
      },
      browser: {
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        devicePixelRatio: window.devicePixelRatio,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      channels,
      diagnostic,
    }
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dsh-control-center-diagnostics-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setBundling(false)
  }

  return (
    <div className={css.root}>
      <div>
        <h2 className={css.pageTitle}>关于</h2>
        <p className={css.pageDescription}>DSH Control Center — Cherry Studio Web Edition 移植</p>
      </div>

      <div className={css.card}>
        <div className={css.cardTitle}>
          DSH Control Center <span className={css.badge}>v{info.controlCenterVersion}</span>
        </div>
        <div className={css.infoRow}>
          <span className={css.infoLabel}>支持 DSH 版本</span>
          <span className={css.infoValue}>{info.dshSupportedVersion}</span>
        </div>
        <div className={css.infoRow}>
          <span className={css.infoLabel}>DSH 源码基线</span>
          <span className={css.infoValue}>{info.dshSourceBaseline.slice(0, 12)}</span>
        </div>
        <div className={css.infoRow}>
          <span className={css.infoLabel}>来源</span>
          <span className={css.infoValue}>Cherry Studio（AGPL-3.0）改编</span>
        </div>
      </div>

      <div className={css.card}>
        <div className={css.cardTitle}>链接</div>
        <div className={css.infoRow}>
          <span className={css.infoLabel}>发布说明</span>
          <a className={css.infoLink} href="https://github.com/kael-odin/dsh-control-center/releases" target="_blank" rel="noreferrer">GitHub Releases</a>
        </div>
        <div className={css.infoRow}>
          <span className={css.infoLabel}>文档</span>
          <a className={css.infoLink} href="https://github.com/kael-odin/dsh-control-center" target="_blank" rel="noreferrer">GitHub 仓库</a>
        </div>
        <div className={css.infoRow}>
          <span className={css.infoLabel}>反馈</span>
          <a className={css.infoLink} href="https://github.com/kael-odin/dsh-control-center/issues" target="_blank" rel="noreferrer">提交 Issue</a>
        </div>
      </div>

      <div className={css.card}>
        <div className={css.cardTitle}>诊断</div>
        <div className={css.infoRow}>
          <span className={css.infoLabel}>平台</span>
          <span className={css.infoValue}>{info.platform} {info.arch} · {info.release}</span>
        </div>
        <div className={css.infoRow}>
          <span className={css.infoLabel}>Node</span>
          <span className={css.infoValue}>{info.nodeVersion}</span>
        </div>
        <div className={css.infoRow}>
          <span className={css.infoLabel}>DSH 主目录</span>
          <span className={css.infoValue}>{info.dshHome}</span>
        </div>
        <div>
          <button type="button" className="cc-btn cc-btn-secondary" onClick={() => void copyDiagnostics()}>
            {copied ? '已复制' : '复制诊断信息'}
          </button>
          <button type="button" className="cc-btn cc-btn-secondary" style={{ marginLeft: 8 }} disabled={bundling} onClick={() => void downloadDiagnostics()}>
            {bundling ? '打包中…' : '导出诊断包'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** 依赖: resolved DSH contract package versions. */
export function DependenciesSection({ getSystem, useSystemReady }: SystemSectionProps) {
  const systemReady = useSystemReady(value => value)
  const system = systemReady ? getSystem() : undefined
  const [deps, setDeps] = useState<DependencyEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (system === undefined) return
    void system.listDependencies().then(result => {
      try { setDeps(unwrap(result)) } catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    }).catch(reason => setError(reason instanceof Error ? reason.message : String(reason)))
  }, [system !== undefined]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error !== null) return <div className="cc-settings-column"><div className="cc-notice-error">{error}</div></div>
  if (deps === null) return <div className={css.loading}>Loading...</div>

  return (
    <div className={css.root}>
      <div>
        <h2 className={css.pageTitle}>依赖</h2>
        <p className={css.pageDescription}>DSH 兼容契约包的解析版本（必须匹配受支持版本，否则插件拒绝激活）</p>
      </div>

      <div className={css.card}>
        <div className={css.cardTitle}>契约包</div>
        {deps.map(dep => (
          <div key={dep.name} className={css.infoRow}>
            <span className={css.infoLabel}>{dep.name}{dep.client ? ' · client' : ''}</span>
            <span className={css.infoValue}>{dep.version}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
