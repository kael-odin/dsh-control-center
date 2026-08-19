/**
 * Usage Analytics settings section: service counts from the Control Center
 * catalog plus the DSH session store (client side).
 */

import { useEffect, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { UsageOverview } from '../usage-types.ts'
import css from './UsageSection.module.css'

export interface UsageSectionInjected {
  getUsage: () => NonNullable<ClientRemote['controlCenterUsage']>
  hooks: { usageReady: HostObservable<boolean> }
}

export type UsageSectionProps = PropsRuntime<'settings.section'> & InjectFace<UsageSectionInjected>

export function UsageSection({ getUsage, useUsageReady }: UsageSectionProps) {
  const usageReady = useUsageReady(value => value)
  const usage = usageReady ? getUsage() : undefined
  const [overview, setOverview] = useState<UsageOverview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (usage === undefined) return
    void usage.getOverview().then(result => {
      if (!result.ok) { setError(result.error.message); return }
      setOverview(result.value)
    }).catch(reason => setError(reason instanceof Error ? reason.message : String(reason)))
  }, [usage !== undefined]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error !== null) return <div className="cc-settings-column"><div className="cc-notice-error">{error}</div></div>
  if (overview === null) return <div className={css.loading}>Loading...</div>

  const metrics: ReadonlyArray<{ label: string; value: number }> = [
    { label: '提供商', value: overview.providers },
    { label: '已启用模型', value: overview.enabledModels },
    { label: '模型总数', value: overview.totalModels },
    { label: '代码仓库', value: overview.repos },
    { label: 'Skills', value: overview.skills },
    { label: 'MCP 服务器', value: overview.mcpServers },
    { label: 'MCP 启用中', value: overview.mcpActive },
    { label: '翻译历史', value: overview.translationHistory },
    { label: '知识库', value: overview.knowledgeBases },
    { label: '知识库来源', value: overview.knowledgeSources },
  ]

  return (
    <div className={css.root}>
      <div>
        <h2 className={css.pageTitle}>用量分析</h2>
        <p className={css.pageDescription}>Control Center 各服务的实时统计（{new Date(overview.collectedAt).toLocaleString()}）</p>
      </div>

      <div className={css.card}>
        <div className={css.cardTitle}>概览</div>
        <div className={css.grid}>
          {metrics.map(metric => (
            <div key={metric.label} className={css.metric}>
              <span className={css.metricValue}>{metric.value}</span>
              <span className={css.metricLabel}>{metric.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
