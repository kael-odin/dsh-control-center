/**
 * MCP Discover views — Cherry McpSettingsPage 内置服务器 / 市场 parity.
 *
 * Cherry shows these as real subnav pages, not dialog tabs. The presets and
 * market sites are the same data the Add dialog uses; both views add servers
 * directly through the shared create path (no dialog hop).
 */

import { useState } from 'react'
import type { CreateMcpServerDto, McpNpxPackage } from '../mcp-types.ts'
import { BUILTIN_MCP_PRESETS, MCP_MARKET_SITES } from './mcp-builtin.ts'
import css from './AddMcpServerDialog.module.css'

interface DiscoverProps {
  onAdd: (dto: CreateMcpServerDto) => Promise<void>
  /** Host npx-market search; absent until the remote mounts. */
  searchNpx?: ((scope: string) => Promise<McpNpxPackage[]>) | undefined
}

/** 内置服务器 — wire-reachable presets from Cherry's mcpServers.ts. */
export function McpBuiltinView({ onAdd }: DiscoverProps) {
  const [busyName, setBusyName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const add = async (dto: CreateMcpServerDto): Promise<void> => {
    setBusyName(dto.name)
    setError(null)
    try {
      await onAdd(dto)
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败')
    } finally {
      setBusyName(null)
    }
  }

  return (
    <div className={css.marketPage}>
      <h2 className={css.marketHeading}>内置服务器</h2>
      <p className={css.marketIntro}>
        预设 MCP 服务器（移植自 Cherry mcpServers.ts），可直接安装。
        Cherry 另有 9 个内置服务器运行在其自有运行时内（memory、fetch、filesystem 等），本宿主暂无对应实现，故未列出。
      </p>
      {error !== null && <p className={css.marketError}>{error}</p>}
      <ul className={css.marketList}>
        {BUILTIN_MCP_PRESETS.map(preset => (
          <li key={preset.name} className={css.marketItem}>
            <div className={css.marketMain}>
              <span className={css.marketName}>{preset.name}</span>
              <span className={css.marketDesc}>
                {preset.description}
                {preset.shouldConfig === true ? ' · 需配置凭据' : ''}
              </span>
            </div>
            <button
              type="button"
              className={css.submitButton}
              disabled={busyName !== null}
              onClick={() => {
                void add({
                  name: preset.name,
                  type: preset.type,
                  description: preset.description,
                  ...(preset.baseUrl !== undefined ? { baseUrl: preset.baseUrl } : {}),
                  ...(preset.command !== undefined ? { command: preset.command } : {}),
                  ...(preset.args !== undefined ? { args: preset.args } : {}),
                  ...(preset.env !== undefined && Object.keys(preset.env).length > 0 ? { env: preset.env } : {}),
                  ...(preset.headers !== undefined ? { headers: preset.headers } : {}),
                })
              }}
            >
              {busyName === preset.name ? '添加中…' : '添加'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 市场 — npx scope search + external market site links (Cherry 市场页 parity). */
export function McpMarketView({ onAdd, searchNpx }: DiscoverProps) {
  const [scope, setScope] = useState('@modelcontextprotocol')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [results, setResults] = useState<McpNpxPackage[]>([])
  const [busyName, setBusyName] = useState<string | null>(null)

  const handleSearch = async (): Promise<void> => {
    if (searchNpx === undefined || searching) return
    setSearching(true)
    setSearchError('')
    try {
      const found = await searchNpx(scope.trim())
      setResults(found)
      if (found.length === 0) setSearchError('该 scope 下没有找到包')
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : String(err))
    } finally {
      setSearching(false)
    }
  }

  const add = async (dto: CreateMcpServerDto): Promise<void> => {
    setBusyName(dto.name)
    try {
      await onAdd(dto)
      setResults(current => current.filter(pkg => pkg.fullName !== dto.name))
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : '添加失败')
    } finally {
      setBusyName(null)
    }
  }

  return (
    <div className={css.marketPage}>
      <h2 className={css.marketHeading}>MCP 市场</h2>
      <div className={css.marketSearchRow}>
        <input
          type="text"
          className={css.marketSearchInput}
          value={scope}
          onChange={event => { setScope(event.target.value) }}
          onKeyDown={event => { if (event.key === 'Enter') void handleSearch() }}
          placeholder="npm scope，例如 @modelcontextprotocol"
        />
        <button
          type="button"
          className={css.submitButton}
          disabled={searching || searchNpx === undefined}
          onClick={() => void handleSearch()}
        >
          {searching ? '搜索中…' : '搜索'}
        </button>
      </div>
      {searchNpx === undefined && (
        <p className={css.marketIntro}>市场搜索需要 MCP 服务就绪；以下外部市场站点始终可用。</p>
      )}
      {searchError !== '' && <p className={css.marketError}>{searchError}</p>}
      {results.length > 0 && (
        <>
          <h3 className={css.marketSectionTitle}>搜索结果</h3>
          <ul className={css.marketList}>
            {results.map(pkg => (
              <li key={pkg.fullName} className={css.marketItem}>
                <div className={css.marketMain}>
                  <span className={css.marketName}>{pkg.name}</span>
                  <span className={css.marketDesc}>
                    {pkg.description || pkg.fullName}
                    {pkg.version !== undefined && pkg.version !== '' ? ` · v${pkg.version}` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  className={css.submitButton}
                  disabled={busyName !== null}
                  onClick={() => {
                    void add({
                      name: pkg.fullName,
                      type: 'stdio',
                      description: pkg.description,
                      command: 'npx',
                      args: ['-y', pkg.fullName],
                    })
                  }}
                >
                  {busyName === pkg.fullName ? '添加中…' : '添加'}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <h3 className={css.marketSectionTitle}>更多市场</h3>
      <ul className={css.marketList}>
        {MCP_MARKET_SITES.map(site => (
          <li key={site.name} className={css.marketItem}>
            <div className={css.marketMain}>
              <span className={css.marketName}>{site.name}</span>
              <span className={css.marketDesc}>{site.description}</span>
            </div>
            <a className={css.marketLink} href={site.url} target="_blank" rel="noreferrer">
              访问
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
