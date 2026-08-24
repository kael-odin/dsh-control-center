/**
 * MCP Discover views — Cherry McpSettingsPage 内置服务器 / 市场 parity.
 *
 * Cherry shows these as real subnav pages, not dialog tabs. The presets and
 * market sites are the same data the Add dialog uses; both views add servers
 * directly through the shared create path (no dialog hop).
 */

import { useState } from 'react'
import type { CreateMcpServerDto, McpDiscoverProvider, McpHostedServer, McpNpxPackage } from '../mcp-types.ts'
import { BUILTIN_MCP_PRESETS, BUILTIN_MEMORY_SERVERS, MCP_MARKET_SITES } from './mcp-builtin.ts'
import css from './AddMcpServerDialog.module.css'

interface DiscoverProps {
  onAdd: (dto: CreateMcpServerDto) => Promise<void>
  /** Host npx-market search; absent until the remote mounts. */
  searchNpx?: ((scope: string) => Promise<McpNpxPackage[]>) | undefined
  /** Host hosted-MCP discovery; absent until the remote mounts. */
  discover?: ((provider: McpDiscoverProvider, token: string) => Promise<McpHostedServer[]>) | undefined
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
        Cherry 预设与进程内内置服务器的集合：协议预设直接安装，内置运行时在本进程内运行。
      </p>
      {error !== null && <p className={css.marketError}>{error}</p>}
      <h3 className={css.marketSectionTitle}>内置运行时</h3>
      <p className={css.marketIntro}>
        Cherry 的 9 个 inMemory 内置服务器中，运行在本进程内的实现（无需外部进程）。
      </p>
      <ul className={css.marketList}>
        {BUILTIN_MEMORY_SERVERS.map(preset => (
          <li key={preset.name} className={css.marketItem}>
            <div className={css.marketMain}>
              <span className={css.marketName}>{preset.name}</span>
              <span className={css.marketDesc}>
                {preset.description}
                {preset.available ? '' : ' · 未内置'}
              </span>
            </div>
            {preset.available ? (
              <button
                type="button"
                className={css.submitButton}
                disabled={busyName !== null}
                onClick={() => {
                  void add({
                    name: preset.name,
                    type: 'inMemory',
                    description: preset.description,
                    command: preset.runtimeKey,
                    // Our own in-process runtime is inherently trusted; the
                    // trust gate exists for third-party wire servers.
                    isTrusted: true,
                  })
                }}
              >
                {busyName === preset.name ? '添加中…' : '添加'}
              </button>
            ) : (
              <span className={css.marketUnavailable}>—</span>
            )}
          </li>
        ))}
      </ul>
      <h3 className={css.marketSectionTitle}>协议预设</h3>
      <p className={css.marketIntro}>
        以下预设可通过外部协议直接安装（移植自 Cherry mcpServers.ts）。
      </p>
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

/** 提供商配置 — hosted-MCP discovery (Cherry McpProviderSettings parity). */
const PROVIDERS: ReadonlyArray<{
  key: McpDiscoverProvider
  name: string
  desc: string
  tokenPlaceholder: string
}> = [
  { key: 'bailian', name: '阿里云百炼', desc: '发现并添加百炼（DashScope）托管的 MCP 服务器。Token 在阿里云百炼控制台获取。', tokenPlaceholder: '百炼 API Token（sk-…）' },
  { key: 'modelscope', name: 'ModelScope 魔搭', desc: '发现并添加魔搭社区托管的 MCP 服务器。Token 在 ModelScope 设置页获取。', tokenPlaceholder: 'ModelScope Token' },
]

export function McpProviderSettingsView({ onAdd, discover }: DiscoverProps) {
  const [tokens, setTokens] = useState<Record<McpDiscoverProvider, string>>({ bailian: '', modelscope: '' })
  const [discovering, setDiscovering] = useState<McpDiscoverProvider | null>(null)
  const [servers, setServers] = useState<Record<McpDiscoverProvider, McpHostedServer[]>>({ bailian: [], modelscope: [] })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busyName, setBusyName] = useState<string | null>(null)

  const discoverNow = async (provider: McpDiscoverProvider): Promise<void> => {
    if (discover === undefined || discovering !== null) return
    setDiscovering(provider)
    setErrors(current => ({ ...current, [provider]: '' }))
    try {
      const found = await discover(provider, tokens[provider] ?? '')
      setServers(current => ({ ...current, [provider]: found }))
      if (found.length === 0) setErrors(current => ({ ...current, [provider]: '没有发现可用的 MCP 服务器' }))
    } catch (err) {
      setErrors(current => ({ ...current, [provider]: err instanceof Error ? err.message : '发现失败' }))
    } finally {
      setDiscovering(null)
    }
  }

  const add = async (server: McpHostedServer): Promise<void> => {
    setBusyName(server.id)
    try {
      await onAdd({
        name: server.name,
        type: server.type,
        ...(server.description !== undefined ? { description: server.description } : {}),
        baseUrl: server.operationalUrl,
      })
    } catch (err) {
      setErrors(current => ({ ...current, [server.id]: err instanceof Error ? err.message : '添加失败' }))
    } finally {
      setBusyName(null)
    }
  }

  return (
    <div className={css.marketPage}>
      <h2 className={css.marketHeading}>提供商配置</h2>
      <p className={css.marketIntro}>
        发现并添加云服务商托管的 MCP 服务器（Cherry McpProviderSettings parity）。需要有效的平台 Token。
      </p>
      {PROVIDERS.map(provider => (
        <div key={provider.key} className={css.providerCard}>
          <div className={css.providerHeader}>
            <span className={css.providerName}>{provider.name}</span>
            <span className={css.providerDesc}>{provider.desc}</span>
          </div>
          <div className={css.marketSearchRow}>
            <input
              type="password"
              className={css.marketSearchInput}
              value={tokens[provider.key] ?? ''}
              onChange={event => { setTokens(current => ({ ...current, [provider.key]: event.target.value })) }}
              onKeyDown={event => { if (event.key === 'Enter') void discoverNow(provider.key) }}
              placeholder={provider.tokenPlaceholder}
            />
            <button
              type="button"
              className={css.submitButton}
              disabled={discovering !== null || discover === undefined}
              onClick={() => void discoverNow(provider.key)}
            >
              {discovering === provider.key ? '发现中…' : '获取服务器列表'}
            </button>
          </div>
          {errors[provider.key] !== undefined && errors[provider.key] !== '' && (
            <p className={css.marketError}>{errors[provider.key]}</p>
          )}
          {servers[provider.key] !== undefined && servers[provider.key]!.length > 0 && (
            <ul className={css.marketList}>
              {servers[provider.key]!.map(server => (
                <li key={server.id} className={css.marketItem}>
                  <div className={css.marketMain}>
                    <span className={css.marketName}>{server.name}</span>
                    <span className={css.marketDesc}>
                      {server.description ?? server.operationalUrl}
                      {server.type === 'sse' ? ' · SSE' : ' · Streamable HTTP'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={css.submitButton}
                    disabled={busyName !== null}
                    onClick={() => { void add(server) }}
                  >
                    {busyName === server.id ? '添加中…' : '添加'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
