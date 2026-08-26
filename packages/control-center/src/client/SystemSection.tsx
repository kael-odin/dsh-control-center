/**
 * System settings pages: About (versions + diagnostics) and Dependencies.
 */

import { useEffect, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { DependencyEntry, EnvCheckEntry, SystemInfo } from '../system-types.ts'
import type { ChannelBridgeHandle } from './ChannelsSection.tsx'
import type { TypertClientRemote } from '@deepseek-ai/dsh-typert-protocol'
import css from './SystemSection.module.css'

type UpdateRemote = NonNullable<TypertClientRemote['controlCenterUpdate']>

export interface SystemSectionInjected {
  getSystem: () => NonNullable<ClientRemote['controlCenterSystem']>
  /** Lazy handle to the host channel bridge, for including channel runtime
   * status/logs in the diagnostic bundle (absent until the bridge mounts). */
  getBridge?: (() => ChannelBridgeHandle | undefined) | undefined
  /** Lazy handle to the update remote — inline release notes source. */
  getUpdate?: (() => UpdateRemote | undefined) | undefined
  hooks: { systemReady: HostObservable<boolean> }
}

export type SystemSectionProps = PropsRuntime<'settings.section'> & InjectFace<SystemSectionInjected>

function unwrap<T>(result: { ok: true; value: T } | { ok: false; error: { code: string; message: string; details: object } }): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

/** 关于: versions, compatibility, environment, diagnostics, release notes. */
export function AboutSection({ getSystem, getBridge, getUpdate, useSystemReady }: SystemSectionProps) {
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

      <ReleaseNotesCard getUpdate={getUpdate} />
    </div>
  )
}

interface ReleaseEntryView {
  tagName: string
  name: string | null
  publishedAt: string | null
  body: string | null
  htmlUrl: string | null
  prerelease: boolean
}

/**
 * Inline release notes (Cherry's releaseNotes page parity): lazily fetched
 * from the host's listReleases on first expand; a small markdown subset is
 * rendered — headings, lists, code spans, bold, links.
 */
function ReleaseNotesCard({ getUpdate }: { getUpdate?: (() => UpdateRemote | undefined) | undefined }): JSX.Element {
  const [open, setOpen] = useState(false)
  const [releases, setReleases] = useState<ReleaseEntryView[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || releases !== null) return
    const update = getUpdate?.()
    if (update === undefined) {
      setError('更新服务未挂载')
      return
    }
    let stopped = false
    void update.listReleases().then((result) => {
      if (stopped) return
      if (result.ok) setReleases([...result.value])
      else setError(result.error)
    }, (reason: unknown) => { if (!stopped) setError(reason instanceof Error ? reason.message : String(reason)) })
    return () => { stopped = true }
  }, [open, releases, getUpdate])

  return (
    <div className={css.card}>
      <div className={css.cardTitle}>发布说明</div>
      <button type="button" className="cc-btn cc-btn-secondary" onClick={() => { setOpen(previous => !previous) }}>
        {open ? '收起' : '查看最近发布'}
      </button>
      {open && error !== null && <p className="cc-notice-error">{error}</p>}
      {open && releases !== null && releases.length === 0 && <p className={css.loading}>暂无发布记录</p>}
      {open && releases !== null && releases.slice(0, 5).map(release => (
        <div key={release.tagName} className={css.releaseBlock}>
          <div className={css.releaseTitle}>
            {release.name ?? release.tagName}
            <span className={css.badge}>{release.tagName}</span>
            {release.prerelease && <span className={css.badge}>预发布</span>}
            {release.publishedAt !== null && (
              <span className={css.releaseDate}>{release.publishedAt.slice(0, 10)}</span>
            )}
          </div>
          {release.body !== null && renderMarkdownLite(release.body)}
          {release.htmlUrl !== null && (
            <a className={css.infoLink} href={release.htmlUrl} target="_blank" rel="noreferrer">在 GitHub 查看</a>
          )}
        </div>
      ))}
    </div>
  )
}

/** Inline span renderer for `code`, **bold**, and [text](url). */
function inlineSpans(text: string, keyPrefix: string): Array<string | JSX.Element> {
  const parts: Array<string | JSX.Element> = []
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const token = match[0]
    const key = `${keyPrefix}-${String(match.index)}`
    if (token.startsWith('`')) {
      parts.push(<code key={key}>{token.slice(1, -1)}</code>)
    } else if (token.startsWith('**')) {
      parts.push(<strong key={key}>{token.slice(2, -2)}</strong>)
    } else {
      const split = token.indexOf('](')
      const label = token.slice(1, split)
      const href = token.slice(split + 2, -1)
      parts.push(<a key={key} href={href} target="_blank" rel="noreferrer">{label}</a>)
    }
    last = match.index + token.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

/** Block-level markdown subset: headings (#..####), bullets, numbered lists, paragraphs. */
function renderMarkdownLite(source: string): JSX.Element {
  const blocks: JSX.Element[] = []
  const lines = source.split('\n')
  let bullets: string[] = []
  let numbers: string[] = []

  const flushLists = (key: string): void => {
    if (bullets.length > 0) {
      blocks.push(<ul key={`${key}-ul`}>{bullets.map((item, index) => <li key={String(index)}>{inlineSpans(item, `${key}-ul-${String(index)}`)}</li>)}</ul>)
      bullets = []
    }
    if (numbers.length > 0) {
      blocks.push(<ol key={`${key}-ol`}>{numbers.map((item, index) => <li key={String(index)}>{inlineSpans(item, `${key}-ol-${String(index)}`)}</li>)}</ol>)
      numbers = []
    }
  }

  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.trimEnd()
    const key = String(index)
    const heading = /^(#{1,4})\s+(.*)$/.exec(line)
    const bullet = /^[-*]\s+(.*)$/.exec(line.trim())
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line.trim())
    if (heading !== null) {
      flushLists(key)
      const level = heading[1]!.length
      const content = inlineSpans(heading[2] ?? '', key)
      blocks.push(level <= 2 ? <h3 key={key}>{content}</h3> : <h4 key={key}>{content}</h4>)
    } else if (bullet !== null) {
      if (numbers.length > 0) flushLists(key)
      bullets.push(bullet[1] ?? '')
    } else if (numbered !== null) {
      if (bullets.length > 0) flushLists(key)
      numbers.push(numbered[1] ?? '')
    } else if (line.trim().length === 0) {
      flushLists(key)
    } else {
      flushLists(key)
      blocks.push(<p key={key}>{inlineSpans(line.trim(), key)}</p>)
    }
  }
  flushLists('end')
  return <div className={css.releaseBody}>{blocks}</div>
}

/** 依赖: resolved DSH contract package versions. */
export function DependenciesSection({ getSystem, useSystemReady }: SystemSectionProps) {
  const systemReady = useSystemReady(value => value)
  const system = systemReady ? getSystem() : undefined
  const [deps, setDeps] = useState<DependencyEntry[] | null>(null)
  const [env, setEnv] = useState<EnvCheckEntry[] | null>(null)
  const [nodeVersion, setNodeVersion] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (system === undefined) return
    void system.listDependencies().then(result => {
      try { setDeps(unwrap(result)) } catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    }).catch(reason => setError(reason instanceof Error ? reason.message : String(reason)))
    void system.checkDependencies().then(result => {
      try { setEnv(unwrap(result)) } catch { /* env check is best-effort */ }
    }).catch(() => { /* env check is best-effort */ })
    void system.getInfo().then(result => {
      try { setNodeVersion(unwrap(result).nodeVersion) } catch { /* best-effort */ }
    }).catch(() => { /* best-effort */ })
  }, [system !== undefined]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error !== null) return <div className="cc-settings-column"><div className="cc-notice-error">{error}</div></div>
  if (deps === null) return <div className={css.loading}>Loading...</div>

  return (
    <div className={css.root}>
      <div>
        <h2 className={css.pageTitle}>依赖</h2>
        <p className={css.pageDescription}>DSH 兼容契约包的解析版本（必须匹配受支持版本，否则插件拒绝激活）</p>
      </div>

      {env !== null && env.length > 0 && (
        <div className={css.card}>
          <div className={css.cardTitle}>环境工具</div>
          {nodeVersion !== undefined && (
            <div className={css.infoRow}>
              <span className={css.infoLabel}>node</span>
              <span className={`${css.infoValue} ${css.envOk}`}>v{nodeVersion}</span>
            </div>
          )}
          {env.map(entry => (
            <div key={entry.name} className={css.infoRow}>
              <span className={css.infoLabel}>{entry.name}{entry.hint === undefined ? '' : ` · ${entry.hint}`}</span>
              <span className={`${css.infoValue} ${entry.present ? css.envOk : css.envMissing}`}>
                {entry.present ? `已安装${entry.version === undefined ? '' : ` · ${entry.version}`}` : '未检测到'}
              </span>
            </div>
          ))}
        </div>
      )}

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
