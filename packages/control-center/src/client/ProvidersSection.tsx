/**
 * Provider Management - Split-pane layout with 100% UI parity to Cherry Studio.
 * Left sidebar: provider list with search/filter. Right detail: provider settings + model list.
 */

import { useCallback, useEffect, useState, useMemo } from 'react'
import type { ProviderView, CreateProviderDto, UpdateProviderDto, UpdateModelDto, ModelView } from '../provider-types.ts'
import { ProviderAuthentication } from './ProviderAuthentication.tsx'
import { ProviderModelList } from './ProviderModelList.tsx'
import { ProviderDialog } from './ProviderDialog.tsx'
import css from './ProvidersSection.module.css'

/** Wire envelope of a strict-mode Typert remote call (same shape as translation-types). */
type RemoteResult<T> = { ok: true; value: T } | { ok: false; error: { code: string; message: string; details: object } }

interface ProvidersService {
  list(): Promise<RemoteResult<ProviderView[]>>
  create(dto: CreateProviderDto): Promise<RemoteResult<ProviderView>>
  update(providerId: string, dto: UpdateProviderDto): Promise<RemoteResult<ProviderView>>
  delete(providerId: string): Promise<RemoteResult<{ absent: true }>>
  testConnection(providerId: string): Promise<RemoteResult<{ success: boolean; latencyMs?: number; error?: string }>>
  discoverModels(providerId: string): Promise<RemoteResult<{ models: any[]; error?: string }>>
  updateModel(providerId: string, modelId: string, dto: UpdateModelDto): Promise<RemoteResult<ModelView>>
}

export interface ProvidersSectionProps {
  providers?: ProvidersService
}

export function ProvidersSection(props: ProvidersSectionProps) {
  const { providers: providersService } = props
  const [providers, setProviders] = useState<ProviderView[]>([])
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isDiscoveringModels, setIsDiscoveringModels] = useState(false)
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; latencyMs?: number; error?: string } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingProvider, setEditingProvider] = useState<ProviderView | undefined>(undefined)

  const loadProviders = useCallback(async () => {
    if (!providersService) {
      setError('Providers service not available')
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const result = await providersService.list()
      if (!result.ok) throw new Error(result.error.message)
      const list = result.value
      setProviders(list)
      if (list.length > 0 && !selectedId && list[0] !== undefined) {
        setSelectedId(list[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers')
    } finally {
      setLoading(false)
    }
  }, [providersService, selectedId])

  useEffect(() => {
    void loadProviders()
  }, [loadProviders])

  const filteredProviders = useMemo(() => {
    if (!search) return providers
    const keywords = search.toLowerCase().split(/\s+/).filter(Boolean)
    return providers.filter(p =>
      keywords.every(kw =>
        p.name.toLowerCase().includes(kw) ||
        p.type.toLowerCase().includes(kw) ||
        p.baseURL.toLowerCase().includes(kw)
      )
    )
  }, [providers, search])

  const selectedProvider = useMemo(
    () => filteredProviders.find(p => p.id === selectedId),
    [filteredProviders, selectedId]
  )

  const handleUpdateProvider = useCallback(async (updates: { apiKey?: string; baseURL?: string; customHeaders?: Record<string, string> }) => {
    if (!providersService || !selectedId) return
    try {
      const result = await providersService.update(selectedId, updates)
      if (!result.ok) throw new Error(result.error.message)
      await loadProviders()
    } catch (err) {
      console.error('Failed to update provider:', err)
    }
  }, [providersService, selectedId, loadProviders])

  const handleTestConnection = useCallback(async () => {
    if (!providersService || !selectedId) return
    try {
      setIsTestingConnection(true)
      setConnectionTestResult(null)
      const result = await providersService.testConnection(selectedId)
      if (!result.ok) throw new Error(result.error.message)
      setConnectionTestResult(result.value)
    } catch (err) {
      setConnectionTestResult({ success: false, error: err instanceof Error ? err.message : 'Connection test failed' })
    } finally {
      setIsTestingConnection(false)
    }
  }, [providersService, selectedId])

  const handleDiscoverModels = useCallback(async () => {
    if (!providersService || !selectedId) return
    try {
      setIsDiscoveringModels(true)
      const result = await providersService.discoverModels(selectedId)
      if (!result.ok) throw new Error(result.error.message)
      await loadProviders()
    } catch (err) {
      console.error('Failed to discover models:', err)
    } finally {
      setIsDiscoveringModels(false)
    }
  }, [providersService, selectedId, loadProviders])

  const handleToggleEnable = useCallback(
    async (providerId: string, currentEnabled: boolean) => {
      if (!providersService) return
      try {
        const result = await providersService.update(providerId, { enabled: !currentEnabled })
        if (!result.ok) throw new Error(result.error.message)
        await loadProviders()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update provider')
      }
    },
    [providersService, loadProviders]
  )

  const handleDelete = useCallback(
    async (providerId: string, providerName: string) => {
      if (!providersService) return
      if (!window.confirm(`确定要删除 "${providerName}" 提供商吗？`)) return

      try {
        const result = await providersService.delete(providerId)
        if (!result.ok) throw new Error(result.error.message)
        await loadProviders()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete provider')
      }
    },
    [providersService, loadProviders]
  )

  const handleOpenCreateDialog = useCallback(() => {
    setDialogMode('create')
    setEditingProvider(undefined)
    setDialogOpen(true)
  }, [])

  const handleOpenEditDialog = useCallback((provider: ProviderView) => {
    setDialogMode('edit')
    setEditingProvider(provider)
    setDialogOpen(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false)
    setEditingProvider(undefined)
  }, [])

  const handleDialogSuccess = useCallback(async () => {
    await loadProviders()
  }, [loadProviders])

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
          <button className={css.secondaryButton} onClick={() => void loadProviders()}>
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={css.splitRoot}>
      {/* Left sidebar: provider list */}
      <aside className={css.providerList}>
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
              placeholder="搜索提供商..."
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

        {/* Provider list scroller */}
        <div className={css.listScroller}>
          {filteredProviders.length === 0 ? (
            <div className={css.emptyState}>
              {search ? '没有找到匹配的提供商' : '暂无配置的提供商'}
            </div>
          ) : (
            <div className={css.listItems}>
              {filteredProviders.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  className={`${css.listItem} ${provider.id === selectedId ? css.listItemSelected : css.listItemIdle}`}
                  onClick={() => setSelectedId(provider.id)}
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
                    <span className={css.listItemLabel}>{provider.name}</span>
                  </div>
                  {provider.enabled && <span className={css.enabledDot} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add provider footer */}
        <div className={css.addFooter}>
          <button
            type="button"
            className={css.addButton}
            onClick={handleOpenCreateDialog}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 3V11M3 7H11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span>添加提供商</span>
          </button>
        </div>
      </aside>

      {/* Right detail pane */}
      {selectedProvider ? (
        <main className={css.providerDetail}>
          {/* Provider header */}
          <div className={css.detailHeader}>
            <div className={css.detailHeaderContent}>
              <h2 className={css.detailTitle}>{selectedProvider.name}</h2>
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
                  {selectedProvider.type}
                </span>
                <span className={css.detailMetaItem}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M6 3V6L8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  {selectedProvider.models.length} 模型
                </span>
              </div>
            </div>
            <button
              type="button"
              className={css.editButton}
              onClick={() => handleOpenEditDialog(selectedProvider)}
              title="编辑提供商"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.33301 13.3334L2.66634 14L3.33301 11.3334L11.333 2.00004Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Provider detail content */}
          <div className={css.detailScroll}>
            <div className={css.detailContentMaxWidth}>
              {/* Authentication section */}
              <ProviderAuthentication
                provider={selectedProvider}
                onUpdateProvider={handleUpdateProvider}
                onTestConnection={handleTestConnection}
                onDiscoverModels={handleDiscoverModels}
                isTestingConnection={isTestingConnection}
                isDiscoveringModels={isDiscoveringModels}
                connectionTestResult={connectionTestResult}
              />

              {/* Model list section */}
              <ProviderModelList
                provider={selectedProvider}
                onToggleModel={async (modelId: string, enabled: boolean) => {
                  if (!providersService) return
                  try {
                    const result = await providersService.updateModel(selectedProvider.id, modelId, { enabled })
                    if (!result.ok) throw new Error(result.error.message)
                    await loadProviders()
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to update model')
                  }
                }}
              />

              {/* Danger zone */}
              <section className={css.section}>
                <h3 className={css.sectionHeading}>危险操作</h3>
                <div className={css.sectionBody}>
                  <div className={css.dangerZone}>
                    <div className={css.dangerZoneText}>
                      <div className={css.dangerZoneTitle}>删除提供商</div>
                      <div className={css.dangerZoneDescription}>
                        此操作不可撤销。删除后，所有关联的模型配置也将被移除。
                      </div>
                    </div>
                    <button
                      type="button"
                      className={css.dangerButton}
                      onClick={() => handleDelete(selectedProvider.id, selectedProvider.name)}
                    >
                      删除
                    </button>
                  </div>
                  <div className={css.dangerZone}>
                    <div className={css.dangerZoneText}>
                      <div className={css.dangerZoneTitle}>
                        {selectedProvider.enabled ? '禁用' : '启用'}提供商
                      </div>
                      <div className={css.dangerZoneDescription}>
                        {selectedProvider.enabled
                          ? '禁用后，此提供商的所有模型将无法使用。'
                          : '启用后，此提供商的模型将可以在对话中使用。'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={css.secondaryButton}
                      onClick={() => handleToggleEnable(selectedProvider.id, selectedProvider.enabled)}
                    >
                      {selectedProvider.enabled ? '禁用' : '启用'}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      ) : (
        <main className={css.providerDetail}>
          <div className={css.emptyDetailState}>
            <svg className={css.emptyIcon} viewBox="0 0 64 64" fill="none">
              <rect x="12" y="12" width="40" height="40" rx="4" stroke="currentColor" strokeWidth="2" />
              <path d="M24 28H40M24 32H36M24 36H40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className={css.emptyTitle}>选择一个提供商</div>
            <div className={css.emptyDescription}>
              在左侧列表中选择一个提供商以查看和管理其配置
            </div>
          </div>
        </main>
      )}

      {/* Provider Add/Edit Dialog */}
      <ProviderDialog
        open={dialogOpen}
        mode={dialogMode}
        provider={editingProvider}
        providersService={providersService}
        onClose={handleCloseDialog}
        onSuccess={handleDialogSuccess}
      />
    </div>
  )
}
