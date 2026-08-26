/**
 * API gateway settings — Cherry ApiGatewaySettings parity for the CONFIG
 * half (port / API key / auth header, persisted locally so a future gateway
 * process can consume them). The gateway RUNTIME itself is not implemented
 * yet: no fake start/stop buttons — the status card says so honestly
 * (migration principle 2: 未实现的能力不展示假开关).
 */
import { useEffect, useState } from 'react'
import { IconCopyOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import {
  SettingDivider, SettingGroup, SettingRow, SettingRowTitle, SettingsPageShell,
} from './SettingsPages.tsx'
import css from './ApiGatewaySection.module.css'

const GATEWAY_KEY = 'cc.settings.apiGateway'

interface GatewayPrefs {
  port: number
  apiKey: string
}

function loadPrefs(): GatewayPrefs {
  try {
    const raw = localStorage.getItem(GATEWAY_KEY)
    if (raw === null) return { port: 3000, apiKey: '' }
    const parsed = JSON.parse(raw) as Partial<GatewayPrefs>
    return { port: parsed.port ?? 3000, apiKey: parsed.apiKey ?? '' }
  } catch {
    return { port: 3000, apiKey: '' }
  }
}

export function ApiGatewaySection() {
  const [prefs, setPrefs] = useState<GatewayPrefs>(loadPrefs)
  const [copied, setCopied] = useState<'url' | 'key' | null>(null)

  useEffect(() => {
    try { localStorage.setItem(GATEWAY_KEY, JSON.stringify(prefs)) } catch { /* best effort */ }
  }, [prefs])

  const update = (patch: Partial<GatewayPrefs>): void => {
    setPrefs(current => ({ ...current, ...patch }))
  }

  const gatewayUrl = `http://127.0.0.1:${prefs.port}/v1`

  const copy = (text: string, kind: 'url' | 'key'): void => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(kind)
      window.setTimeout(() => { setCopied(null) }, 1400)
    }).catch(() => {})
  }

  const regenerateKey = (): void => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
    let key = 'sk-'
    for (let i = 0; i < 32; i++) key += chars[Math.floor(Math.random() * chars.length)]
    update({ apiKey: key })
  }

  return (
    <SettingsPageShell>
      <div className={css.notice}>
        通过 OpenAI 和 Anthropic 兼容的 HTTP API 暴露 Control Center 的 AI 功能。
        网关运行时尚未实装——下方端口与密钥为预存配置，实装后将直接生效。
      </div>

      <SettingGroup>
        <div className={css.groupHeaderRow}>
          <span>API 网关</span>
          <div className={css.statusRow}>
            <span className={`${css.statusDot} ${css.statusStopped}`} />
            <span className={css.statusText}>未实装</span>
          </div>
        </div>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>URL</SettingRowTitle>
          <div className={css.inputGroup}>
            <input className={css.input} readOnly value={gatewayUrl} />
            <button type="button" className={css.iconBtn} title="复制 URL" onClick={() => { copy(gatewayUrl, 'url') }}>
              <IconCopyOutline16 size={13} />
            </button>
          </div>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>端口</SettingRowTitle>
          <input
            className={css.inputSmall}
            type="number"
            min={1}
            max={65535}
            value={prefs.port}
            onChange={event => { update({ port: Math.min(65535, Math.max(1, Number(event.target.value) || 3000)) }) }}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>API 密钥</SettingRowTitle>
          <div className={css.inputGroup}>
            <input className={css.input} readOnly value={prefs.apiKey || 'API 密钥将自动生成'} />
            {prefs.apiKey !== '' && (
              <button type="button" className={css.iconBtn} title="复制 API 密钥" onClick={() => { copy(prefs.apiKey, 'key') }}>
                <IconCopyOutline16 size={13} />
              </button>
            )}
            <button type="button" className={css.outlineBtn} onClick={regenerateKey}>重新生成</button>
          </div>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>授权标头</SettingRowTitle>
          <div className={css.headerBox}>
            <code>Authorization: Bearer {prefs.apiKey === '' ? 'sk-…' : prefs.apiKey.slice(0, 16)}…</code>
            {copied !== null && <span className={css.copied}>已复制</span>}
          </div>
        </SettingRow>
        {/* API 文档链接随网关实装一并提供 */}
      </SettingGroup>
    </SettingsPageShell>
  )
}
