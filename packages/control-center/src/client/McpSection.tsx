/**
 * MCP Section - Split-pane layout matching Cherry Studio MCP management.
 * Left sidebar: server list with search/filter. Right detail: server settings + logs.
 */

import { useCallback, useEffect, useState, useMemo } from 'react'
import type { CreateMcpServerDto, McpServerView, UpdateMcpServerDto } from '../mcp-types.ts'
import css from './McpSection.module.css'

interface McpService {
  list(): Promise<McpServerView[]>
  create(params: { dto: CreateMcpServerDto }): Promise<McpServerView>
  update(params: { serverId: string; dto: UpdateMcpServerDto }): Promise<McpServerView>
  delete(params: { serverId: string }): Promise<void>
  stopServer(params: { serverId: string }): Promise<void>
  refreshTools(params: { serverId: string }): Promise<void>
  getServerLogs(params: { serverId: string; lines?: number }): Promise<string[]>
}

export interface McpSectionProps {
  mcp?: McpService
}

export function McpSection(props: McpSectionProps) {
  const { mcp: mcpService } = props
  const [servers, setServers] = useState<McpServerView[]>([])
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadServers = useCallback(async () => {
    if (!mcpService) {
      setError('MCP service not available')
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const result = await mcpService.list()
      setServers(result)
      if (result.length > 0 && !selectedId && result[0] !== undefined) {
        setSelectedId(result[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load MCP servers')
    } finally {
      setLoading(false)
    }
  }, [mcpService, selectedId])

  useEffect(() => {
    void loadServers()
  }, [loadServers])

  const filteredServers = useMemo(() => {
    if (!search) return servers
    const keywords = search.toLowerCase().split(/\s+/).filter(Boolean)
    return servers.filter(s =>
      keywords.every(kw =>
        s.name.toLowerCase().includes(kw) ||
        (s.description?.toLowerCase().includes(kw)) ||
        (s.type?.toLowerCase().includes(kw))
      )
    )
  }, [servers, search])

  const selectedServer = useMemo(
    () => filteredServers.find(s => s.id === selectedId),
    [filteredServers, selectedId]
  )

  const handleDelete = useCallback(
    async (serverId: string, serverName: string) => {
      if (!mcpService) return
      if (!window.confirm(`确定要删除 "${serverName}" MCP 服务器吗？`)) return

      try {
        await mcpService.delete({ serverId })
        await loadServers()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete server')
      }
    },
    [mcpService, loadServers]
  )

  if (loading) {
    return (
      <div className={css.splitRoot}>
        <div className={css.loading}>加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={css.splitRoot}>
        <div className={css.error}>
          <div className={css.emptyTitle}>加载失败</div>
          <div className={css.emptyDescription}>{error}</div>
          <button className={css.secondaryButton} onClick={() => void loadServers()}>
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={css.splitRoot}>
      {/* Left sidebar: server list */}
      <aside className={css.serverList}>
        {/* Search header */}
        <div className={css.searchRow}>
          <div className={css.searchWrap}>
            <svg className={css.searchIcon} viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              className={css.searchInput}
              placeholder="搜索 MCP 服务器..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className={css.searchClearButton}
                onClick={() => setSearch('')}
                aria-label="清除搜索"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M9 3L3 9M3 3L9 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Server list scroller */}
        <div className={css.listScroller}>
          {filteredServers.length === 0 ? (
            <div className={css.emptyState}>
              {search ? '没有找到匹配的服务器' : '暂无配置的 MCP 服务器'}
            </div>
          ) : (
            <div className={css.listItems}>
              {filteredServers.map((server) => (
                <button
                  key={server.id}
                  type="button"
                  className={`${css.listItem} ${server.id === selectedId ? css.listItemSelected : css.listItemIdle}`}
                  onClick={() => setSelectedId(server.id)}
                >
                  <div className={css.listItemMain}>
                    <div className={css.listItemAvatar}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <rect width="20" height="20" rx="4" fill="currentColor" opacity="0.1" />
                        <path
                          d="M6 8L10 12L14 8"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className={css.listItemLabel}>{server.name}</span>
                  </div>
                  {server.isActive && <span className={css.activeDot} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add server footer */}
        <div className={css.addFooter}>
          <button
            type="button"
            className={css.addButton}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 3V11M3 7H11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span>添加服务器</span>
          </button>
        </div>
      </aside>

      {/* Right detail pane */}
      {selectedServer ? (
        <main className={css.serverDetail}>
          {/* Server header */}
          <div className={css.detailHeader}>
            <div className={css.detailHeaderContent}>
              <h2 className={css.detailTitle}>{selectedServer.name}</h2>
              <div className={css.detailMeta}>
                <span className={css.detailMetaItem}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M6 2L3 4V8L6 10L9 8V4L6 2Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {selectedServer.type || 'stdio'}
                </span>
                {selectedServer.runtimeState && (
                  <span className={css.detailMetaItem}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    {selectedServer.runtimeState === 'connected' ? '已连接' :
                     selectedServer.runtimeState === 'connecting' ? '连接中' :
                     selectedServer.runtimeState === 'error' ? '错误' : '已禁用'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Server detail content */}
          <div className={css.detailScroll}>
            <div className={css.detailContentMaxWidth}>
              {/* TODO: Server configuration section */}
              <section className={css.section}>
                <h3 className={css.sectionHeading}>服务器配置</h3>
                <div className={css.sectionBody}>
                  <p className={css.placeholder}>配置界面开发中...</p>
                </div>
              </section>

              {/* Danger zone */}
              <section className={css.section}>
                <h3 className={css.sectionHeading}>危险操作</h3>
                <div className={css.sectionBody}>
                  <div className={css.dangerZone}>
                    <div className={css.dangerZoneText}>
                      <div className={css.dangerZoneTitle}>删除服务器</div>
                      <div className={css.dangerZoneDescription}>
                        此操作不可撤销。删除后，所有关联的工具和配置也将被移除。
                      </div>
                    </div>
                    <button
                      type="button"
                      className={css.dangerButton}
                      onClick={() => handleDelete(selectedServer.id, selectedServer.name)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      ) : (
        <main className={css.serverDetail}>
          <div className={css.emptyDetailState}>
            <svg className={css.emptyIcon} viewBox="0 0 64 64" fill="none">
              <rect x="12" y="12" width="40" height="40" rx="4" stroke="currentColor" strokeWidth="2" />
              <path d="M24 28H40M24 32H36M24 36H40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className={css.emptyTitle}>选择一个 MCP 服务器</div>
            <div className={css.emptyDescription}>
              在左侧列表中选择一个服务器以查看和管理其配置
            </div>
          </div>
        </main>
      )}
    </div>
  )
}
