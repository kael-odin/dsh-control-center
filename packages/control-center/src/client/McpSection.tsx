/**
 * MCP Section - Split-pane layout matching Cherry Studio MCP management.
 * Left sidebar: server list with search/filter. Right detail: server settings + logs.
 */

import { useCallback, useEffect, useState, useMemo } from 'react'
import type { CreateMcpServerDto, McpServerView, UpdateMcpServerDto, McpServerCapabilities } from '../mcp-types.ts'
import { AddMcpServerDialog } from './AddMcpServerDialog.tsx'
import css from './McpSection.module.css'

type TabKey = 'settings' | 'description' | 'logs' | 'tools' | 'prompts' | 'resources'

/** Wire envelope of a strict-mode Typert remote call (same shape as translation-types). */
type RemoteResult<T> = { ok: true; value: T } | { ok: false; error: { code: string; message: string; details: object } }

interface McpService {
  list(): Promise<RemoteResult<McpServerView[]>>
  create(params: { dto: CreateMcpServerDto }): Promise<RemoteResult<McpServerView>>
  update(params: { serverId: string; dto: UpdateMcpServerDto }): Promise<RemoteResult<McpServerView>>
  delete(params: { serverId: string }): Promise<RemoteResult<null>>
  stopServer(params: { serverId: string }): Promise<RemoteResult<null>>
  refreshTools(params: { serverId: string }): Promise<RemoteResult<null>>
  getServerLogs(params: { serverId: string; lines?: number }): Promise<RemoteResult<string[]>>
  getCapabilities(params: { serverId: string }): Promise<RemoteResult<McpServerCapabilities | null>>
}

export interface McpSectionProps {
  mcp?: McpService
}

export function McpSection(props: McpSectionProps) {
  const { mcp: mcpService } = props
  const [servers, setServers] = useState<McpServerView[]>([])
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

  // Form state for editable fields
  const [formData, setFormData] = useState<{
    name: string
    command: string
    args: string
    env: string
    timeout: number
    longRunning: boolean
  } | null>(null)
  const [isFormChanged, setIsFormChanged] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('settings')
  const [logs, setLogs] = useState<string[]>([])
  const [capabilities, setCapabilities] = useState<McpServerCapabilities | null>(null)
  const [isRefreshingTools, setIsRefreshingTools] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

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
      if (!result.ok) throw new Error(result.error.message)
      const list = result.value
      setServers(list)
      if (list.length > 0 && !selectedId && list[0] !== undefined) {
        setSelectedId(list[0].id)
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

  // Fetch logs when logs tab is active
  useEffect(() => {
    if (activeTab === 'logs' && selectedId && mcpService) {
      void mcpService.getServerLogs({ serverId: selectedId, lines: 100 })
        .then((result) => { if (result.ok) setLogs(result.value) })
        .catch(() => setLogs([]))
    }
  }, [activeTab, selectedId, mcpService])

  // Real-time log polling when logs tab is active
  useEffect(() => {
    if (activeTab !== 'logs' || !selectedId || !mcpService) {
      return
    }

    const interval = setInterval(() => {
      void mcpService.getServerLogs({ serverId: selectedId, lines: 100 })
        .then((result) => { if (result.ok) setLogs(result.value) })
        .catch(() => {}) // Silently fail during polling
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [activeTab, selectedId, mcpService])

  // Fetch capabilities when selected server changes and is active
  useEffect(() => {
    if (selectedId && mcpService && selectedServer?.isActive) {
      void mcpService.getCapabilities({ serverId: selectedId })
        .then((result) => { if (result.ok) setCapabilities(result.value) })
        .catch(() => setCapabilities(null))
    } else {
      setCapabilities(null)
    }
  }, [selectedId, mcpService, selectedServer?.isActive])

  // Initialize form data when selected server changes
  useEffect(() => {
    if (selectedServer) {
      setFormData({
        name: selectedServer.name,
        command: selectedServer.command || '',
        args: selectedServer.args?.join('\n') || '',
        env: selectedServer.env
          ? Object.entries(selectedServer.env)
              .map(([key, value]) => `${key}=${value}`)
              .join('\n')
          : '',
        timeout: selectedServer.timeout || 30,
        longRunning: selectedServer.longRunning || false
      })
      setIsFormChanged(false)
    } else {
      setFormData(null)
      setIsFormChanged(false)
    }
  }, [selectedServer])

  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null)
    setIsFormChanged(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!mcpService || !selectedServer || !formData) return

    // Validate required fields for stdio transport
    if (!selectedServer.type || selectedServer.type === 'stdio') {
      if (!formData.command.trim()) {
        setError('命令字段不能为空')
        return
      }
    }

    setIsSaving(true)
    setError(null)

    try {
      const envParsed = formData.env
        ? Object.fromEntries(
            formData.env
              .split('\n')
              .filter(line => line.includes('='))
              .map(line => {
                const idx = line.indexOf('=')
                return [line.slice(0, idx), line.slice(idx + 1)]
              })
          )
        : {}

      const dto: UpdateMcpServerDto = {
        name: formData.name,
        command: formData.command,
        args: formData.args.split('\n').filter(arg => arg.trim() !== ''),
        timeout: formData.timeout,
        longRunning: formData.longRunning
      }

      // Only add env if it has entries
      if (Object.keys(envParsed).length > 0) {
        dto.env = envParsed
      }

      const updateResult = await mcpService.update({
        serverId: selectedServer.id,
        dto
      })
      if (!updateResult.ok) throw new Error(updateResult.error.message)

      // Restart server if active
      if (selectedServer.isActive) {
        const stopResult = await mcpService.stopServer({ serverId: selectedServer.id })
        if (!stopResult.ok) throw new Error(stopResult.error.message)
        const restartResult = await mcpService.update({
          serverId: selectedServer.id,
          dto: { isActive: true }
        })
        if (!restartResult.ok) throw new Error(restartResult.error.message)
      }

      await loadServers()
      setIsFormChanged(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setIsSaving(false)
    }
  }, [mcpService, selectedServer, formData, loadServers])

  const handleCancel = useCallback(() => {
    if (selectedServer) {
      setFormData({
        name: selectedServer.name,
        command: selectedServer.command || '',
        args: selectedServer.args?.join('\n') || '',
        env: selectedServer.env
          ? Object.entries(selectedServer.env)
              .map(([key, value]) => `${key}=${value}`)
              .join('\n')
          : '',
        timeout: selectedServer.timeout || 30,
        longRunning: selectedServer.longRunning || false
      })
      setIsFormChanged(false)
    }
  }, [selectedServer])

  const handleCreate = useCallback(async (dto: CreateMcpServerDto) => {
    if (!mcpService) return

    const result = await mcpService.create({ dto })
    if (!result.ok) throw new Error(result.error.message)
    await loadServers()
    setShowAddDialog(false)
  }, [mcpService, loadServers])

  const handleDelete = useCallback(
    async (serverId: string, serverName: string) => {
      if (!mcpService) return
      if (!window.confirm(`确定要删除 "${serverName}" MCP 服务器吗？`)) return

      try {
        const result = await mcpService.delete({ serverId })
        if (!result.ok) throw new Error(result.error.message)
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
            onClick={() => setShowAddDialog(true)}
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

          {/* Tab navigation */}
          <div className={css.tabBar}>
            <button
              className={activeTab === 'settings' ? css.tabActive : css.tab}
              onClick={() => setActiveTab('settings')}>
              设置
            </button>
            {selectedServer.description && (
              <button
                className={activeTab === 'description' ? css.tabActive : css.tab}
                onClick={() => setActiveTab('description')}>
                描述
              </button>
            )}
            <button
              className={activeTab === 'logs' ? css.tabActive : css.tab}
              onClick={() => setActiveTab('logs')}>
              日志
            </button>
            {selectedServer.isActive && capabilities?.tools && (
              <button
                className={activeTab === 'tools' ? css.tabActive : css.tab}
                onClick={() => setActiveTab('tools')}>
                工具 {capabilities.tools.length > 0 ? `(${capabilities.tools.length})` : ''}
              </button>
            )}
            {selectedServer.isActive && capabilities?.prompts && (
              <button
                className={activeTab === 'prompts' ? css.tabActive : css.tab}
                onClick={() => setActiveTab('prompts')}>
                提示词 {capabilities.prompts.length > 0 ? `(${capabilities.prompts.length})` : ''}
              </button>
            )}
            {selectedServer.isActive && capabilities?.resources && (
              <button
                className={activeTab === 'resources' ? css.tabActive : css.tab}
                onClick={() => setActiveTab('resources')}>
                资源 {capabilities.resources.length > 0 ? `(${capabilities.resources.length})` : ''}
              </button>
            )}
          </div>

          {/* Server detail content */}
          <div className={css.detailScroll}>
            <div className={css.detailContentMaxWidth}>
              {activeTab === 'settings' && (
                <>
                  {/* Active toggle section */}
                  <section className={css.section}>
                <div className={css.sectionHeader}>
                  <h3 className={css.sectionHeading}>状态</h3>
                </div>
                <div className={css.sectionBody}>
                  <div className={css.fieldRow}>
                    <label className={css.fieldLabel}>
                      <input
                        type="checkbox"
                        className={css.checkbox}
                        checked={selectedServer.isActive}
                        onChange={async (e) => {
                          if (!mcpService) return
                          try {
                            const result = await mcpService.update({
                              serverId: selectedServer.id,
                              dto: { isActive: e.target.checked }
                            })
                            if (!result.ok) throw new Error(result.error.message)
                            await loadServers()
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to update server')
                          }
                        }}
                      />
                      <span>启用此服务器</span>
                    </label>
                  </div>
                  {selectedServer.lastError && (
                    <div className={css.errorBox}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M7 4V7M7 9.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <span>{selectedServer.lastError}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Configuration section - stdio transport */}
              {(!selectedServer.type || selectedServer.type === 'stdio') && formData && (
                <section className={css.section}>
                  <div className={css.sectionHeader}>
                    <h3 className={css.sectionHeading}>命令配置</h3>
                  </div>
                  <div className={css.sectionBody}>
                    <div className={css.fieldGroup}>
                      <label className={css.fieldLabel}>服务器名称 *</label>
                      <input
                        type="text"
                        className={css.input}
                        value={formData.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        placeholder="例如: my-mcp-server"
                      />
                    </div>
                    <div className={css.fieldGroup}>
                      <label className={css.fieldLabel}>命令 *</label>
                      <input
                        type="text"
                        className={css.input}
                        value={formData.command}
                        onChange={(e) => handleFormChange('command', e.target.value)}
                        placeholder="例如: npx, uvx, python"
                      />
                    </div>
                    <div className={css.fieldGroup}>
                      <label className={css.fieldLabel}>参数</label>
                      <textarea
                        className={css.textarea}
                        value={formData.args}
                        onChange={(e) => handleFormChange('args', e.target.value)}
                        placeholder="每行一个参数&#10;例如:&#10;-m&#10;mcp_server"
                        rows={5}
                      />
                      <div className={css.fieldHint}>每行一个参数</div>
                    </div>
                  </div>
                </section>
              )}

              {/* Environment variables section */}
              {(!selectedServer.type || selectedServer.type === 'stdio') && formData && (
                <section className={css.section}>
                  <div className={css.sectionHeader}>
                    <h3 className={css.sectionHeading}>环境变量</h3>
                  </div>
                  <div className={css.sectionBody}>
                    <div className={css.fieldGroup}>
                      <label className={css.fieldLabel}>环境变量</label>
                      <textarea
                        className={css.textarea}
                        value={formData.env}
                        onChange={(e) => handleFormChange('env', e.target.value)}
                        placeholder="每行一个键值对&#10;例如:&#10;API_KEY=your_key&#10;DEBUG=true"
                        rows={5}
                      />
                      <div className={css.fieldHint}>格式: KEY=VALUE，每行一个</div>
                    </div>
                  </div>
                </section>
              )}

              {/* Timeout settings section */}
              {formData && (
                <section className={css.section}>
                  <div className={css.sectionHeader}>
                    <h3 className={css.sectionHeading}>超时设置</h3>
                  </div>
                  <div className={css.sectionBody}>
                    <div className={css.fieldGroup}>
                      <label className={css.fieldLabel}>连接超时（秒）</label>
                      <input
                        type="number"
                        className={css.input}
                        value={formData.timeout}
                        onChange={(e) => handleFormChange('timeout', parseInt(e.target.value) || 30)}
                        min={1}
                        max={300}
                      />
                    </div>
                    <div className={css.fieldRow}>
                      <label className={css.fieldLabel}>
                        <input
                          type="checkbox"
                          className={css.checkbox}
                          checked={formData.longRunning}
                          onChange={(e) => handleFormChange('longRunning', e.target.checked)}
                        />
                        <span>长时间运行</span>
                      </label>
                    </div>
                  </div>
                </section>
              )}

              {/* Save/Cancel buttons */}
              {formData && isFormChanged && (
                <section className={css.section}>
                  <div className={css.sectionBody}>
                    <div className={css.formActions}>
                      <button
                        type="button"
                        className={css.primaryButton}
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? '保存中...' : '保存更改'}
                      </button>
                      <button
                        type="button"
                        className={css.secondaryButton}
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </section>
              )}

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
                </>
              )}

              {activeTab === 'description' && selectedServer.description && (
                <section className={css.section}>
                  <div className={css.sectionBody}>
                    <div className={css.descriptionText}>{selectedServer.description}</div>
                  </div>
                </section>
              )}

              {activeTab === 'logs' && (
                <section className={css.section}>
                  <h3 className={css.sectionHeading}>服务器日志</h3>
                  <div className={css.sectionBody}>
                    {logs.length > 0 ? (
                      <>
                        <div className={css.logHeader}>
                          <span className={css.logInfo}>实时更新 (每3秒)</span>
                          <button
                            type="button"
                            className={css.secondaryButton}
                            onClick={() => {
                              if (selectedId && mcpService) {
                                void mcpService.getServerLogs({ serverId: selectedId, lines: 100 })
                                  .then((result) => { if (result.ok) setLogs(result.value) })
                                  .catch(() => setLogs([]))
                              }
                            }}
                          >
                            刷新
                          </button>
                        </div>
                        <div className={css.codeBlock}>
                          {logs.map((line, idx) => (
                            <div key={idx} className={css.codeLine}>{line}</div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className={css.emptyState}>暂无日志</div>
                    )}
                  </div>
                </section>
              )}

              {activeTab === 'tools' && capabilities?.tools && (
                <section className={css.section}>
                  <div className={css.sectionBody}>
                    {capabilities.tools.length > 0 ? (
                      <>
                        <div className={css.logHeader}>
                          <div className={css.logInfo}>
                            共 {capabilities.tools.length} 个工具
                          </div>
                          <button
                            type="button"
                            className={css.secondaryButton}
                            disabled={isRefreshingTools}
                            onClick={async () => {
                              if (!selectedId || !mcpService) return
                              setIsRefreshingTools(true)
                              try {
                                const refreshResult = await mcpService.refreshTools({ serverId: selectedId })
                                if (!refreshResult.ok) throw new Error(refreshResult.error.message)
                                const caps = await mcpService.getCapabilities({ serverId: selectedId })
                                if (!caps.ok) throw new Error(caps.error.message)
                                setCapabilities(caps.value)
                              } catch (error) {
                                console.error('Failed to refresh tools:', error)
                              } finally {
                                setIsRefreshingTools(false)
                              }
                            }}
                          >
                            {isRefreshingTools ? '刷新中...' : '刷新工具'}
                          </button>
                        </div>
                        <div className={css.toolsList}>
                          {capabilities.tools.map((tool, idx) => {
                            const isEnabled = !selectedServer.disabledTools?.includes(tool.name)
                            return (
                              <div key={idx} className={css.toolItem}>
                                <div className={css.toolHeader}>
                                  <span className={css.toolName}>{tool.name}</span>
                                  <label className={css.switchWrapper}>
                                    <input
                                      type="checkbox"
                                      className={css.switchInput}
                                      checked={isEnabled}
                                      onChange={async (e) => {
                                        if (!mcpService) return
                                        const checked = e.target.checked
                                        const disabledTools = [...(selectedServer.disabledTools || [])]

                                        try {
                                          if (checked) {
                                            // Enable: remove from disabledTools
                                            const filtered = disabledTools.filter(name => name !== tool.name)
                                            const result = await mcpService.update({
                                              serverId: selectedServer.id,
                                              dto: { disabledTools: filtered }
                                            })
                                            if (!result.ok) throw new Error(result.error.message)
                                          } else {
                                            // Disable: add to disabledTools
                                            if (!disabledTools.includes(tool.name)) {
                                              disabledTools.push(tool.name)
                                            }
                                            const result = await mcpService.update({
                                              serverId: selectedServer.id,
                                              dto: { disabledTools }
                                            })
                                            if (!result.ok) throw new Error(result.error.message)
                                          }

                                          await loadServers()
                                        } catch (err) {
                                          setError(err instanceof Error ? err.message : 'Failed to update server')
                                        }
                                      }}
                                    />
                                    <span className={css.switchSlider}></span>
                                  </label>
                                </div>
                                {tool.description && (
                                  <div className={css.toolDescription}>{tool.description}</div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </>
                    ) : (
                      <div className={css.emptyState}>暂无工具</div>
                    )}
                  </div>
                </section>
              )}

              {activeTab === 'prompts' && capabilities?.prompts && (
                <section className={css.section}>
                  <div className={css.sectionBody}>
                    {capabilities.prompts.length > 0 ? (
                      <div className={css.toolsList}>
                        {capabilities.prompts.map((prompt, idx) => (
                          <div key={idx} className={css.toolItem}>
                            <div className={css.toolHeader}>
                              <span className={css.toolName}>{prompt.name}</span>
                            </div>
                            {prompt.description && (
                              <div className={css.toolDescription}>{prompt.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={css.emptyState}>暂无提示词</div>
                    )}
                  </div>
                </section>
              )}

              {activeTab === 'resources' && capabilities?.resources && (
                <section className={css.section}>
                  <div className={css.sectionBody}>
                    {capabilities.resources.length > 0 ? (
                      <div className={css.toolsList}>
                        {capabilities.resources.map((resource, idx) => (
                          <div key={idx} className={css.toolItem}>
                            <div className={css.toolHeader}>
                              <span className={css.toolName}>{resource.name}</span>
                            </div>
                            <div className={css.resourceUri}>{resource.uri}</div>
                            {resource.description && (
                              <div className={css.toolDescription}>{resource.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={css.emptyState}>暂无资源</div>
                    )}
                  </div>
                </section>
              )}
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

      <AddMcpServerDialog
        visible={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleCreate}
      />
    </div>
  )
}
