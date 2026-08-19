/**
 * Providers management section component.
 *
 * Cherry-style providers management UI over the controlCenterProviders Remote service.
 * Displays configured providers in a card grid with search, enable/disable, test, and delete actions.
 *
 * AGPL-3.0-only – adapted from Cherry Studio provider management pattern.
 */

import { useCallback, useEffect, useState } from 'react'
import type { ProviderView, CreateProviderDto, UpdateProviderDto, TestConnectionResult, DiscoverModelsResult } from '../provider-types.ts'
import css from './ProvidersSection.module.css'

interface ProvidersService {
  list(): Promise<ProviderView[]>
  create(params: { dto: CreateProviderDto }): Promise<ProviderView>
  update(params: { providerId: string; dto: UpdateProviderDto }): Promise<ProviderView>
  delete(params: { providerId: string }): Promise<void>
  testConnection(params: { providerId: string }): Promise<TestConnectionResult>
  discoverModels(params: { providerId: string }): Promise<DiscoverModelsResult>
}

export interface ProvidersSectionProps {
  providers?: ProvidersService
}

export function ProvidersSection(props: ProvidersSectionProps) {
  const { providers: providersService } = props
  const [providers, setProviders] = useState<ProviderView[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null)
  const [discoveringId, setDiscoveringId] = useState<string | null>(null)

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
      setProviders(result)
      if (result.length > 0 && !selectedId && result[0] !== undefined) {
        setSelectedId(result[0].id)
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

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
    setTestResult(null)
  }, [])

  const handleToggleEnable = useCallback(
    async (providerId: string, currentEnabled: boolean) => {
      if (!providersService) return
      try {
        await providersService.update({
          providerId,
          dto: { enabled: !currentEnabled }
        })
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
        await providersService.delete({ providerId })
        if (selectedId === providerId) {
          setSelectedId(null)
        }
        await loadProviders()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete provider')
      }
    },
    [providersService, loadProviders, selectedId]
  )

  const handleTestConnection = useCallback(
    async (providerId: string) => {
      if (!providersService) return
      setTestingId(providerId)
      setTestResult(null)
      try {
        const result = await providersService.testConnection({ providerId })
        setTestResult(result)
        await loadProviders()
      } catch (err) {
        setTestResult({
          success: false,
          error: err instanceof Error ? err.message : 'Test failed',
          testedAt: new Date().toISOString()
        })
      } finally {
        setTestingId(null)
      }
    },
    [providersService, loadProviders]
  )

  const handleDiscoverModels = useCallback(
    async (providerId: string) => {
      if (!providersService) return
      setDiscoveringId(providerId)
      try {
        const result = await providersService.discoverModels({ providerId })
        if (result.error) {
          setError(result.error)
        }
        await loadProviders()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to discover models')
      } finally {
        setDiscoveringId(null)
      }
    },
    [providersService, loadProviders]
  )

  const filteredProviders = search
    ? providers.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.type.toLowerCase().includes(search.toLowerCase())
      )
    : providers

  const selectedProvider = selectedId ? providers.find(p => p.id === selectedId) : null

  return (
    <div className={css.root}>
      <div className={css.splitPane}>
        {/* Left sidebar: Provider list */}
        <div className={css.sidebar}>
          <div className={css.sidebarHeader}>
            <input
              type="text"
              className={css.searchInput}
              placeholder="搜索提供商..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              className={css.addButton}
              onClick={() => alert('添加提供商功能开发中')}
              disabled
              title="添加提供商"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M14 7H9V2C9 1.45 8.55 1 8 1C7.45 1 7 1.45 7 2V7H2C1.45 7 1 7.45 1 8C1 8.55 1.45 9 2 9H7V14C7 14.55 7.45 15 8 15C8.55 15 9 14.55 9 14V9H14C14.55 9 15 8.55 15 8C15 7.45 14.55 7 14 7Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>

          <div className={css.providerList}>
            {loading ? (
              <div className={css.listLoading}>加载中...</div>
            ) : error ? (
              <div className={css.listError}>
                <p>{error}</p>
                <button className={css.retryButton} onClick={() => loadProviders()}>
                  重试
                </button>
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className={css.listEmpty}>
                {search ? '没有找到匹配的提供商' : '暂无配置的提供商'}
              </div>
            ) : (
              filteredProviders.map((provider) => (
                <div
                  key={provider.id}
                  className={`${css.providerItem} ${selectedId === provider.id ? css.providerItemSelected : ''}`}
                  onClick={() => handleSelect(provider.id)}
                >
                  <div className={css.providerItemHeader}>
                    <span className={css.providerItemName}>{provider.name}</span>
                    {provider.enabled ? (
                      <span className={css.providerItemBadgeEnabled}>启用</span>
                    ) : (
                      <span className={css.providerItemBadgeDisabled}>禁用</span>
                    )}
                  </div>
                  <div className={css.providerItemMeta}>
                    <span className={css.providerItemType}>{provider.type}</span>
                    <span className={css.providerItemModels}>{provider.models.length} 模型</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right panel: Provider settings */}
        <div className={css.detailPanel}>
          {!selectedProvider ? (
            <div className={css.detailEmpty}>
              <svg className={css.detailEmptyIcon} viewBox="0 0 64 64" fill="none">
                <rect x="12" y="12" width="40" height="40" rx="4" stroke="currentColor" strokeWidth="2" />
                <path d="M24 28H40M24 32H36M24 36H40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className={css.detailEmptyText}>选择提供商以查看详情</p>
            </div>
          ) : (
            <>
              <div className={css.detailHeader}>
                <div className={css.detailHeaderLeft}>
                  <h2 className={css.detailTitle}>{selectedProvider.name}</h2>
                  <p className={css.detailSubtitle}>{selectedProvider.type}</p>
                </div>
                <div className={css.detailHeaderActions}>
                  <button
                    type="button"
                    className={css.headerActionButton}
                    onClick={() => handleToggleEnable(selectedProvider.id, selectedProvider.enabled)}
                    title={selectedProvider.enabled ? '禁用提供商' : '启用提供商'}
                  >
                    {selectedProvider.enabled ? '禁用' : '启用'}
                  </button>
                  <button
                    type="button"
                    className={css.headerActionButton}
                    onClick={() => handleDelete(selectedProvider.id, selectedProvider.name)}
                    title="删除提供商"
                  >
                    删除
                  </button>
                </div>
              </div>

              <div className={css.detailContent}>
                {/* Connection section */}
                <section className={css.section}>
                  <h3 className={css.sectionTitle}>连接配置</h3>
                  <div className={css.formGroup}>
                    <label className={css.formLabel}>Base URL</label>
                    <div className={css.formValue}>{selectedProvider.baseURL}</div>
                  </div>
                  <div className={css.formGroup}>
                    <label className={css.formLabel}>API Key</label>
                    <div className={css.formValue}>
                      {selectedProvider.hasApiKey ? '••••••••••••••••' : '未配置'}
                    </div>
                  </div>
                  {selectedProvider.customHeaders && Object.keys(selectedProvider.customHeaders).length > 0 && (
                    <div className={css.formGroup}>
                      <label className={css.formLabel}>自定义请求头</label>
                      <div className={css.formValue}>
                        {Object.entries(selectedProvider.customHeaders).map(([key, value]) => (
                          <div key={key} className={css.headerEntry}>
                            <span className={css.headerKey}>{key}:</span>
                            <span className={css.headerValue}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedProvider.lastTestedAt && (
                    <div className={css.formGroup}>
                      <label className={css.formLabel}>最后测试时间</label>
                      <div className={css.formValue}>
                        {new Date(selectedProvider.lastTestedAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  )}
                  <div className={css.formActions}>
                    <button
                      type="button"
                      className={css.primaryButton}
                      onClick={() => handleTestConnection(selectedProvider.id)}
                      disabled={testingId === selectedProvider.id}
                    >
                      {testingId === selectedProvider.id ? '测试中...' : '测试连接'}
                    </button>
                  </div>
                  {testResult && (
                    <div className={`${css.testResult} ${testResult.success ? css.testResultSuccess : css.testResultError}`}>
                      {testResult.success ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M8 2C4.7 2 2 4.7 2 8C2 11.3 4.7 14 8 14C11.3 14 14 11.3 14 8C14 4.7 11.3 2 8 2ZM6.5 11L3 7.5L4.4 6.1L6.5 8.2L11.6 3.1L13 4.5L6.5 11Z"
                              fill="currentColor"
                            />
                          </svg>
                          <span>连接成功</span>
                          {testResult.latencyMs !== undefined && (
                            <span className={css.testLatency}>({testResult.latencyMs}ms)</span>
                          )}
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M8 2C4.7 2 2 4.7 2 8C2 11.3 4.7 14 8 14C11.3 14 14 11.3 14 8C14 4.7 11.3 2 8 2ZM9 11H7V9H9V11ZM9 7H7V5H9V7Z"
                              fill="currentColor"
                            />
                          </svg>
                          <span>{testResult.error || '连接失败'}</span>
                        </>
                      )}
                    </div>
                  )}
                </section>

                {/* Models section */}
                <section className={css.section}>
                  <div className={css.sectionHeader}>
                    <h3 className={css.sectionTitle}>模型列表</h3>
                    <button
                      type="button"
                      className={css.secondaryButton}
                      onClick={() => handleDiscoverModels(selectedProvider.id)}
                      disabled={discoveringId === selectedProvider.id}
                    >
                      {discoveringId === selectedProvider.id ? '获取中...' : '获取模型列表'}
                    </button>
                  </div>
                  {selectedProvider.lastDiscoveredAt && (
                    <p className={css.sectionHint}>
                      最后获取时间: {new Date(selectedProvider.lastDiscoveredAt).toLocaleString('zh-CN')}
                    </p>
                  )}
                  {selectedProvider.models.length === 0 ? (
                    <div className={css.modelsEmpty}>
                      <p>暂无模型</p>
                      <p className={css.modelsEmptyHint}>点击"获取模型列表"按钮从提供商获取可用模型</p>
                    </div>
                  ) : (
                    <div className={css.modelsList}>
                      {selectedProvider.models.map((model) => (
                        <div key={model.id} className={css.modelItem}>
                          <div className={css.modelItemHeader}>
                            <span className={css.modelItemName}>{model.name}</span>
                            {model.enabled ? (
                              <span className={css.modelItemBadgeEnabled}>启用</span>
                            ) : (
                              <span className={css.modelItemBadgeDisabled}>禁用</span>
                            )}
                          </div>
                          <div className={css.modelItemMeta}>
                            <span className={css.modelItemId}>{model.id}</span>
                          </div>
                          {(model.contextWindow || model.maxOutputTokens) && (
                            <div className={css.modelItemCapabilities}>
                              {model.contextWindow && (
                                <span className={css.capabilityItem}>
                                  上下文: {(model.contextWindow / 1000).toFixed(0)}K
                                </span>
                              )}
                              {model.maxOutputTokens && (
                                <span className={css.capabilityItem}>
                                  输出: {(model.maxOutputTokens / 1000).toFixed(0)}K
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
