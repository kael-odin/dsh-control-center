/**
 * API gateway settings — Cherry ApiGatewaySettings parity with a REAL runtime.
 * The gateway is a local loopback HTTP service (OpenAI/Anthropic compatible,
 * routed onto the host LLM runtime); this page drives its start/stop, edits
 * its port and API key (persisted in the control-center-gateway namespace,
 * shared with the runtime), and shows the auth header for copy-paste.
 */
import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import { IconCopyOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import {
  SettingDivider, SettingGroup, SettingRow, SettingRowTitle, SettingsPageShell,
} from './SettingsPages.tsx'
import css from './ApiGatewaySection.module.css'

const GATEWAY_NAMESPACE = 'control-center-gateway'

export interface ApiGatewaySectionInjected {
  gateway: {
    status(): Promise<{ running: boolean; port: number; url: string | null }>
    start(): Promise<{ ok: true; value: { running: boolean; port: number; url: string | null } } | { ok: false; error: string }>
    stop(): Promise<{ ok: true; value: { running: boolean; port: number; url: string | null } }>
  }
  api: Pick<IApiClient, 'settings'>
}

export type ApiGatewaySectionProps = Partial<ApiGatewaySectionInjected>

interface GatewayPrefs {
  port: number
  apiKey: string
}

export function ApiGatewaySection(props: ApiGatewaySectionProps): ReactNode {
  const { gateway, api } = props
  if (gateway === undefined || api === undefined) return null
  return <Loaded gateway={gateway} api={api} />
}

function Loaded({ gateway, api }: { gateway: NonNullable<ApiGatewaySectionInjected['gateway']> ; api: NonNullable<ApiGatewaySectionInjected['api']> }): ReactNode {
  const [status, setStatus] = useState<{ running: boolean; port: number; url: string | null } | null>(null)
  const [prefs, setPrefs] = useState<GatewayPrefs>({ port: 23333, apiKey: '' })
  const [copied, setCopied] = useState<'url' | 'key' | 'header' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPrefs = useCallback(async (): Promise<void> => {
    try {
      const described = await api.settings.describe({})
      const result = described.result
      if (!result.ok) return
      const namespace = result.value.namespaces.find(view => view.ns === GATEWAY_NAMESPACE)
      const value = (namespace?.value ?? {}) as Record<string, unknown>
      setPrefs({
        port: typeof value.port === 'number' ? value.port : 23333,
        apiKey: typeof value.apiKey === 'string' ? value.apiKey : '',
      })
    } catch { /* defaults are fine */ }
  }, [api])

  const savePrefs = useCallback(async (next: GatewayPrefs): Promise<void> => {
    setPrefs(next)
    try {
      const described = await api.settings.describe({})
      const result = described.result
      if (!result.ok) return
      const namespace = result.value.namespaces.find(view => view.ns === GATEWAY_NAMESPACE)
      if (namespace === undefined) return
      await api.settings.mutate({
        ns: GATEWAY_NAMESPACE,
        expectedRevision: namespace.revision,
        ops: [{ op: 'set', path: ['port'], value: next.port }, { op: 'set', path: ['apiKey'], value: next.apiKey }],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [api])

  const refresh = useCallback(async (): Promise<void> => {
    try { setStatus(await gateway.status()) } catch { /* honest default below */ }
  }, [gateway])

  useEffect(() => {
    void loadPrefs()
    void refresh()
  }, [loadPrefs, refresh])

  const toggle = async (): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      if (status?.running === true) {
        const stopped = await gateway.stop()
        if (stopped.ok) setStatus(stopped.value)
      } else {
        const result = await gateway.start()
        if (result.ok) setStatus(result.value)
        else setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const copy = (text: string, kind: 'url' | 'key' | 'header'): void => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(kind)
      window.setTimeout(() => { setCopied(null) }, 1400)
    }).catch(() => {})
  }

  const regenerateKey = (): void => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
    let key = 'sk-'
    for (let i = 0; i < 32; i++) key += chars[Math.floor(Math.random() * chars.length)]
    void savePrefs({ ...prefs, apiKey: key })
  }

  const running = status?.running === true
  const gatewayUrl = `http://127.0.0.1:${String(status?.port ?? prefs.port)}/v1`

  return (
    <SettingsPageShell>
      <div className={css.notice}>
        通过 OpenAI 和 Anthropic 兼容的 HTTP API 暴露 Control Center 的 AI 功能。网关仅监听 127.0.0.1，供本机应用接入。
      </div>

      <SettingGroup>
        <div className={css.groupHeaderRow}>
          <span>API 网关</span>
          <div className={css.statusRow}>
            <span className={`${css.statusDot} ${running ? css.statusRunning : css.statusStopped}`} />
            <span className={css.statusText}>{running ? '运行中' : '已停止'}</span>
            {running && status?.url !== null && (
              <a className={css.docLink} href={`${status.url}/docs`} target="_blank" rel="noreferrer">API 文档</a>
            )}
            <button type="button" className={running ? css.ghostBtn : css.outlineBtn} disabled={busy} onClick={() => { void toggle() }}>
              {busy ? '切换中…' : running ? '停止' : '启动'}
            </button>
          </div>
        </div>
        {running && (
          <>
            <SettingDivider />
            <SettingRow>
              <SettingRowTitle>URL</SettingRowTitle>
              <div className={css.inputGroup}>
                <input className={css.input} readOnly value={gatewayUrl} />
                <button type="button" className={css.iconBtn} title="复制 URL" onClick={() => { copy(gatewayUrl, 'url') }}>
                  <IconCopyOutline16 size={13} />
                </button>
                {copied === 'url' && <span className={css.copied}>已复制</span>}
              </div>
            </SettingRow>
          </>
        )}
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>端口</SettingRowTitle>
          <input
            className={css.inputSmall}
            type="number"
            min={1}
            max={65535}
            value={prefs.port}
            disabled={running}
            onChange={event => { void savePrefs({ ...prefs, port: Math.min(65535, Math.max(1, Number(event.target.value) || 23333)) }) }}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>API 密钥</SettingRowTitle>
          <div className={css.inputGroup}>
            <input className={css.input} readOnly value={prefs.apiKey === '' ? '生成后可接入第三方应用' : `${prefs.apiKey.slice(0, 6)}${'•'.repeat(20)}`} />
            {prefs.apiKey !== '' && (
              <button type="button" className={css.iconBtn} title="复制 API 密钥" onClick={() => { copy(prefs.apiKey, 'key') }}>
                <IconCopyOutline16 size={13} />
              </button>
            )}
            <button type="button" className={css.outlineBtn} onClick={regenerateKey}>重新生成</button>
            {copied === 'key' && <span className={css.copied}>已复制</span>}
          </div>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>授权标头</SettingRowTitle>
          <div className={css.headerBox}>
            <code>Authorization: Bearer {prefs.apiKey === '' ? 'sk-…' : `${prefs.apiKey.slice(0, 10)}…`}</code>
            {prefs.apiKey !== '' && (
              <button type="button" className={css.iconBtn} title="复制授权标头" onClick={() => { copy(`Authorization: Bearer ${prefs.apiKey}`, 'header') }}>
                <IconCopyOutline16 size={13} />
              </button>
            )}
            {copied === 'header' && <span className={css.copied}>已复制</span>}
          </div>
        </SettingRow>
      </SettingGroup>
      {error !== null && <div className="cc-notice-error">{error}</div>}
    </SettingsPageShell>
  )
}
