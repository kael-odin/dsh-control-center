/**
 * MCP protocol install dialog — Cherry McpProtocolInstallDialog parity.
 *
 * Confirms a batch install of protocol-based MCP servers parsed from a pasted
 * config (JSON array or `mcpServers` object). Each server shows its type badge
 * and a compact config preview; 安装 adds them all through the shared create
 * path.
 */

import { useState } from 'react'
import type { CreateMcpServerDto } from '../mcp-types.ts'
import type { ParsedServerSpec } from './mcp-import.ts'
import css from './AddMcpServerDialog.module.css'

interface McpProtocolInstallDialogProps {
  servers: ParsedServerSpec[]
  onClose: () => void
  onInstall: (server: ParsedServerSpec) => Promise<void>
}

function specToDto(spec: ParsedServerSpec): CreateMcpServerDto {
  return {
    name: spec.name ?? 'unnamed-server',
    type: spec.type,
    ...(spec.command !== undefined ? { command: spec.command } : {}),
    ...(spec.args !== undefined ? { args: spec.args } : {}),
    ...(spec.env !== undefined ? { env: spec.env } : {}),
    ...(spec.baseUrl !== undefined ? { baseUrl: spec.baseUrl } : {}),
  }
}

export function McpProtocolInstallDialog({ servers, onClose, onInstall }: McpProtocolInstallDialogProps) {
  const [installing, setInstalling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [installed, setInstalled] = useState<ReadonlySet<string>>(new Set())

  const handleInstall = async (): Promise<void> => {
    setInstalling(true)
    setError(null)
    try {
      for (const server of servers) {
        await onInstall(server)
        setInstalled(current => new Set(current).add(server.name ?? ''))
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '安装失败')
      setInstalling(false)
    }
  }

  const typeLabel = (spec: ParsedServerSpec): string =>
    spec.type === 'stdio' ? 'stdio' : spec.type === 'sse' ? 'SSE' : 'Streamable HTTP'

  const preview = (spec: ParsedServerSpec): string => {
    if (spec.command !== undefined) return `${spec.command}${spec.args !== undefined && spec.args.length > 0 ? ` ${spec.args.join(' ')}` : ''}`
    if (spec.baseUrl !== undefined) return spec.baseUrl
    return ''
  }

  return (
    <div className={css.overlay}>
      <div className={css.dialog} role="dialog" aria-modal="true" aria-label="安装 MCP 服务器">
        <div className={css.header}>
          <span className={css.title}>安装 MCP 服务器</span>
          <button type="button" className={css.closeButton} onClick={onClose} disabled={installing} aria-label="关闭">×</button>
        </div>
        <div className={css.form}>
          <p className={css.installIntro}>
            检测到 {servers.length} 个协议服务器待安装。确认后将逐一添加。
          </p>
          {error !== null && <div className={css.error}>{error}</div>}
          <ul className={css.installList}>
            {servers.map((server, index) => (
              <li key={`${server.name ?? index}-${index}`} className={css.installItem}>
                <div className={css.installMain}>
                  <span className={css.installName}>
                    {server.name ?? `服务器 ${index + 1}`}
                    {installed.has(server.name ?? '') ? ' ✓' : ''}
                  </span>
                  <span className={css.installMeta}>
                    <span className={css.installBadge}>{typeLabel(server)}</span>
                    <span className={css.installPreview}>{preview(server)}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className={css.footer}>
          <button type="button" className={css.cancelButton} onClick={onClose} disabled={installing}>
            取消
          </button>
          <button type="button" className={css.submitButton} onClick={() => void handleInstall()} disabled={installing}>
            {installing ? '安装中…' : '安装'}
          </button>
        </div>
      </div>
    </div>
  )
}

export { specToDto }
