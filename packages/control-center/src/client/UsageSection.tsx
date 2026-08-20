/**
 * Usage Analytics — Cherry UsageSettings parity: window tabs, metric strip
 * with deltas, insight strip, daily heatmap, distribution chart, entries
 * table. Data comes from the Control Center usage record store (translation/
 * painting/embedding calls record real tokens).
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { UsageEntriesPage, UsageRecord, UsageStats, UsageTimelinePoint } from '../usage-types.ts'
import { IconSparkles } from './cherry-icons.tsx'
import css from './UsageSection.module.css'

export interface UsageSectionInjected {
  getUsage: () => NonNullable<ClientRemote['controlCenterUsage']>
  hooks: { usageReady: HostObservable<boolean> }
}

export type UsageSectionProps = PropsRuntime<'settings.section'> & InjectFace<UsageSectionInjected>

const WINDOW_KEYS = [
  { value: 30, label: '最近 30 天' },
  { value: 90, label: '最近 90 天' },
  { value: 365, label: '最近一年' },
] as const

const CHART_COLORS = ['#3ecf8e', '#6ba6ff', '#f5b544', '#ef6f8e', '#9b8afb', '#4fc3d6', '#8bd450', '#f0886b']

/** Rough input/output price per 1M tokens (USD), matched by model prefix. */
const PRICE_TABLE: ReadonlyArray<{ match: RegExp; input: number; output: number }> = [
  { match: /deepseek-v4-flash/i, input: 0.28, output: 0.42 },
  { match: /deepseek-v4-pro/i, input: 2, output: 8 },
  { match: /deepseek-v3/i, input: 0.27, output: 1.1 },
  { match: /deepseek-reasoner/i, input: 0.55, output: 2.19 },
  { match: /gpt-4o/i, input: 2.5, output: 10 },
  { match: /gpt-4\.1/i, input: 2, output: 8 },
  { match: /gpt-4/i, input: 30, output: 60 },
  { match: /gpt-5/i, input: 1.25, output: 10 },
  { match: /o1/i, input: 15, output: 60 },
  { match: /claude-4/i, input: 3, output: 15 },
  { match: /claude-3\.5/i, input: 3, output: 15 },
  { match: /claude-3/i, input: 3, output: 15 },
  { match: /gemini-2\.5/i, input: 1.25, output: 10 },
  { match: /gemini-1\.5/i, input: 1.25, output: 5 },
  { match: /qwen/i, input: 0.4, output: 1.2 },
  { match: /glm/i, input: 0.5, output: 2 },
  { match: /moonshot|kimi/i, input: 1, output: 4 },
  { match: /llama-3/i, input: 0.25, output: 1 },
]

function priceOf(model: string): { input: number; output: number } | null {
  for (const entry of PRICE_TABLE) {
    if (entry.match.test(model)) return { input: entry.input, output: entry.output }
  }
  return null
}

function estimateCost(record: UsageRecord): number {
  const price = priceOf(record.model)
  if (price === null) return 0
  return (record.inputTokens + record.cacheReadTokens + record.cacheWriteTokens) / 1_000_000 * price.input
    + record.outputTokens / 1_000_000 * price.output
}

function rangeOf(days: number): { from: number; to: number; previousFrom: number } {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const to = startOfDay + 86_400_000
  const from = startOfDay - (days - 1) * 86_400_000
  return { from, to, previousFrom: from - days * 86_400_000 }
}

function dateKeyOf(timestamp: number): string {
  const date = new Date(timestamp)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

function formatCost(value: number): string {
  if (value === 0) return '—'
  return `$${value < 0.01 ? value.toFixed(4) : value.toFixed(2)}`
}

function totalTokensOf(point: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number }): number {
  return point.inputTokens + point.outputTokens + point.cacheReadTokens + point.cacheWriteTokens
}

export function UsageSection({ getUsage, useUsageReady }: UsageSectionProps) {
  const usageReady = useUsageReady(value => value)
  const usage = usageReady ? getUsage() : undefined
  const [windowDays, setWindowDays] = useState(30)
  const [timeline, setTimeline] = useState<UsageTimelinePoint[]>([])
  const [previous, setPrevious] = useState<UsageStats | null>(null)
  const [statsByProvider, setStatsByProvider] = useState<UsageStats | null>(null)
  const [statsByModel, setStatsByModel] = useState<UsageStats | null>(null)
  const [entries, setEntries] = useState<UsageRecord[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<'provider' | 'model'>('provider')
  const [chartMode, setChartMode] = useState<'total' | 'day'>('total')
  const [error, setError] = useState<string | null>(null)

  const range = useMemo(() => rangeOf(windowDays), [windowDays])

  const loadAll = useCallback(async (): Promise<void> => {
    if (usage === undefined) return
    setError(null)
    const currentRange = rangeOf(windowDays)
    const previousRange = rangeOf(windowDays)
    const results = await Promise.allSettled([
      usage.timeline({ from: currentRange.from, to: currentRange.to, groupBy: 'day' }),
      usage.stats({ from: previousRange.previousFrom, to: currentRange.from, groupBy: 'provider' }),
      usage.stats({ from: currentRange.from, to: currentRange.to, groupBy: 'provider' }),
      usage.stats({ from: currentRange.from, to: currentRange.to, groupBy: 'model' }),
      usage.entries({ from: currentRange.from, to: currentRange.to, limit: 50 }),
    ])
    const [timelineResult, previousResult, providerResult, modelResult, entriesResult] = results
    if (timelineResult.status === 'fulfilled' && timelineResult.value.ok) setTimeline(timelineResult.value.value)
    if (previousResult.status === 'fulfilled' && previousResult.value.ok) setPrevious(previousResult.value.value)
    if (providerResult.status === 'fulfilled' && providerResult.value.ok) setStatsByProvider(providerResult.value.value)
    if (modelResult.status === 'fulfilled' && modelResult.value.ok) setStatsByModel(modelResult.value.value)
    if (entriesResult.status === 'fulfilled' && entriesResult.value.ok) {
      const page: UsageEntriesPage = entriesResult.value.value
      setEntries(page.items)
      setNextCursor(page.nextCursor ?? null)
    }
  }, [usage, windowDays])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const loadMore = async (): Promise<void> => {
    if (usage === undefined || nextCursor === null) return
    const result = await usage.entries({ from: range.from, to: range.to, limit: 50, cursor: nextCursor })
    if (!result.ok) { setError(result.error.message); return }
    setEntries(current => [...current, ...result.value.items])
    setNextCursor(result.value.nextCursor ?? null)
  }

  const stats = groupBy === 'provider' ? statsByProvider : statsByModel
  const hasUsage = stats !== null && stats.totalRequests > 0

  const currentCost = useMemo(() => entries.reduce((sum, entry) => sum + estimateCost(entry), 0), [entries])

  const cacheTotals = useMemo(() => {
    let noCache = 0
    let cacheRead = 0
    let cacheWrite = 0
    for (const point of timeline) {
      noCache += point.inputTokens
      cacheRead += point.cacheReadTokens
      cacheWrite += point.cacheWriteTokens
    }
    return { noCache, cacheRead, cacheWrite }
  }, [timeline])

  const cacheHitRate = cacheTotals.noCache + cacheTotals.cacheRead + cacheTotals.cacheWrite === 0
    ? null
    : cacheTotals.cacheRead / (cacheTotals.noCache + cacheTotals.cacheRead + cacheTotals.cacheWrite)

  const totalTokens = timeline.reduce((sum, point) => sum + totalTokensOf(point), 0)
  const totalRequests = timeline.reduce((sum, point) => sum + point.requests, 0)

  // Insight metrics.
  const activeDays = timeline.filter(point => point.requests > 0).length
  const peakDay = [...timeline].sort((left, right) => totalTokensOf(right) - totalTokensOf(left))[0]
  const topModel = statsByModel?.groups[0]
  const dailyAverage = windowDays === 0 ? 0 : Math.round(totalTokens / windowDays)

  // Sparkline data (last 64 days of the current window).
  const spark = useMemo(() => timeline.slice(-64).map(point => totalTokensOf(point)), [timeline])

  // Heatmap: 7 rows x N weeks ending this week.
  const heatmap = useMemo(() => {
    const cells: Array<{ timestamp: number; tokens: number; requests: number }> = []
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const today = start.getTime()
    const weekStart = today - ((start.getDay() + 6) % 7) * 86_400_000
    const byDay = new Map<string, UsageTimelinePoint>()
    for (const point of timeline) byDay.set(point.dateKey, point)
    for (let offset = 0; offset < 7 * 53; offset++) {
      const timestamp = weekStart - offset * 86_400_000
      if (timestamp < range.from) break
      const point = byDay.get(dateKeyOf(timestamp))
      cells.unshift({ timestamp, tokens: point === undefined ? 0 : totalTokensOf(point), requests: point?.requests ?? 0 })
    }
    return cells
  }, [timeline, range.from])

  const heatmapMax = Math.max(1, ...heatmap.map(cell => cell.tokens))
  const heatLevel = (tokens: number): number => {
    if (tokens === 0) return 0
    const ratio = tokens / heatmapMax
    if (ratio > 0.6) return 4
    if (ratio > 0.3) return 3
    if (ratio > 0.12) return 2
    return 1
  }
  const HEAT_COLORS = ['transparent', 'rgba(16,185,129,0.35)', 'rgba(16,185,129,0.55)', 'rgba(16,185,129,0.8)', 'rgba(5,150,105,1)']

  // Distribution chart.
  const chartGroups = stats?.groups ?? []
  const chartTotal = stats?.totalTokens ?? 0
  const chartData = chartMode === 'day'
    ? timeline
    : chartGroups.map((group, index) => ({ key: group.key, value: group.tokens, color: CHART_COLORS[index % CHART_COLORS.length]! }))

  const donutSegments = chartMode === 'total' ? chartData as Array<{ key: string; value: number; color: string }> : []
  const donutCircumference = 2 * Math.PI * 56
  let donutOffset = 0

  const formatEntryTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    const pad = (value: number): string => String(value).padStart(2, '0')
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  return (
    <div className={css.root}>
      <div className={css.pageHeader}>
        <div>
          <h2 className={css.pageTitle}>用量统计</h2>
          <p className={css.pageDescription}>Control Center 各服务的实时统计（翻译 / 绘画 / 知识库嵌入调用）</p>
        </div>
        <div className={css.windowTabs} role="tablist">
          {WINDOW_KEYS.map(option => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={option.value === windowDays}
              className={`${css.windowTab} ${option.value === windowDays ? css.active : ''}`}
              onClick={() => { setWindowDays(option.value) }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error !== null ? <div className="cc-notice-error">{error}</div> : null}

      {!hasUsage ? (
        <div className={css.usageEmpty}>
          <IconSparkles size={26} />
          <div>暂无用量</div>
          <div>支持的 AI 请求产生用量记录后，这里会显示数据。在翻译、绘画或知识库中发起真实调用即可。</div>
        </div>
      ) : (
        <>
          <section aria-label="概览">
            <div className={css.metricStrip}>
              <div className={css.metricCell}>
                <div className={css.metricLabel}>请求数</div>
                <div className={css.metricValue}>{totalRequests}</div>
                <div className={css.metricDelta}>{previous === null ? '较上期 —' : previous.totalRequests === 0 ? '较上期 新增' : `较上期 ${Math.round((totalRequests - previous.totalRequests) / previous.totalRequests * 100)}%`}</div>
                <Sparkline values={timeline.slice(-64).map(point => point.requests)} />
              </div>
              <div className={css.metricCell}>
                <div className={css.metricLabel}>总 Token 数</div>
                <div className={css.metricValue}>{formatTokens(totalTokens)}</div>
                <div className={css.metricDelta}>{previous === null ? '较上期 —' : `较上期 ${Math.round(totalTokens / Math.max(1, previous.totalTokens) * 100)}%`}</div>
                <Sparkline values={spark} />
              </div>
              <div className={css.metricCell}>
                <div className={css.metricLabel}>输入 Token</div>
                <div className={css.metricValue}>{formatTokens(timeline.reduce((sum, point) => sum + point.inputTokens, 0))}</div>
                <div className={css.metricDelta}>输出 {formatTokens(timeline.reduce((sum, point) => sum + point.outputTokens, 0))}</div>
                <Sparkline values={timeline.slice(-64).map(point => point.inputTokens)} />
              </div>
              <div className={css.metricCell}>
                <div className={css.metricLabel}>缓存命中率</div>
                <div className={css.metricValue}>{cacheHitRate === null ? '—' : `${Math.round(cacheHitRate * 100)}%`}</div>
                <div className={css.metricDelta}>{cacheHitRate === null ? '发送新请求后开始统计' : `可观测输入：${formatTokens(cacheTotals.cacheRead + cacheTotals.cacheWrite)}`}</div>
                <Sparkline values={timeline.slice(-64).map(point => point.cacheReadTokens)} />
              </div>
            </div>

            <div className={css.insightStrip} style={{ marginTop: 12 }}>
              <div className={css.insightItem}>
                <div className={css.insightLabel}>活跃天数</div>
                <div className={css.insightValue}>{activeDays} 天</div>
              </div>
              <div className={css.insightItem}>
                <div className={css.insightLabel}>高峰日</div>
                <div className={css.insightValue}>{peakDay === undefined ? '—' : `${formatDate(new Date(peakDay.dateKey).getTime())} (${formatTokens(totalTokensOf(peakDay))})`}</div>
              </div>
              <div className={css.insightItem}>
                <div className={css.insightLabel}>用量最高模型</div>
                <div className={css.insightValue} style={{ maxWidth: 260 }}>{topModel?.key ?? '—'}</div>
              </div>
              <div className={css.insightItem}>
                <div className={css.insightLabel}>日均</div>
                <div className={css.insightValue}>{formatTokens(dailyAverage)} tokens</div>
              </div>
              <div className={css.insightItem}>
                <div className={css.insightLabel}>估算成本（参考价）</div>
                <div className={css.insightValue}>{formatCost(currentCost)}</div>
              </div>
            </div>

            <div className={css.heatmapSection} style={{ marginTop: 16 }}>
              <div className={css.heatmapTitle}>
                <span>每日活动</span>
                <span style={{ fontWeight: 400, color: 'var(--foreground-tertiary)', fontSize: 12 }}>Token</span>
              </div>
              <div className={css.heatmapScroll}>
                <div className={css.heatmap} role="img" aria-label="每日活动热力图">
                  {heatmap.map(cell => (
                    <button
                      key={cell.timestamp}
                      type="button"
                      className={css.heatmapCell}
                      style={{ background: HEAT_COLORS[heatLevel(cell.tokens)] }}
                      title={`${dateKeyOf(cell.timestamp)} · ${cell.requests} 个请求 · ${formatTokens(cell.tokens)} tokens`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section aria-label="探索">
            <div className={css.exploreCard}>
              <div className={css.exploreHeader}>
                <span className={css.exploreTitle}>探索</span>
                <span className={css.controlRow}>
                  <span className={css.controlLabel}>分组</span>
                  <select className={css.controlSelect} value={groupBy} onChange={event => { setGroupBy(event.target.value as 'provider' | 'model') }}>
                    <option value="provider">供应商</option>
                    <option value="model">模型</option>
                  </select>
                </span>
                <span className={css.controlRow}>
                  <span className={css.controlLabel}>汇总</span>
                  <select className={css.controlSelect} value={chartMode} onChange={event => { setChartMode(event.target.value as 'total' | 'day') }}>
                    <option value="total">总计</option>
                    <option value="day">按天</option>
                  </select>
                </span>
              </div>
              <div className={css.exploreBody}>
                <p className={css.summaryLine}>
                  {groupBy === 'provider' ? '供应商' : '模型'} / Token / {chartMode === 'total' ? '总计' : '按天'} / 汇总
                  <span style={{ float: 'right', color: 'var(--foreground)' }}>{formatTokens(chartTotal)}</span>
                </p>
                {chartMode === 'total' ? (
                  <div className={css.donutWrap}>
                    <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="用量分布图">
                      <circle cx="80" cy="80" r="56" fill="none" stroke="var(--muted)" strokeWidth="22" />
                      {donutSegments.map(segment => {
                        const fraction = segment.value / Math.max(1, chartTotal)
                        const dash = fraction * donutCircumference
                        const offset = donutOffset
                        donutOffset -= dash
                        if (fraction === 0) return null
                        return (
                          <circle
                            key={segment.key}
                            cx="80"
                            cy="80"
                            r="56"
                            fill="none"
                            stroke={segment.color}
                            strokeWidth="22"
                            strokeDasharray={`${dash} ${donutCircumference - dash}`}
                            strokeDashoffset={offset}
                            transform="rotate(-90 80 80)"
                          >
                            <title>{`${segment.key}: ${formatTokens(segment.value)} tokens`}</title>
                          </circle>
                        )
                      })}
                    </svg>
                    <div className={css.donutLegend}>
                      {donutSegments.slice(0, 8).map(segment => (
                        <div key={segment.key} className={css.donutLegendRow} title={segment.key}>
                          <span className={css.donutSwatch} style={{ background: segment.color }} />
                          <span className={css.donutLegendKey}>{segment.key}</span>
                          <span className={css.donutLegendValue}>{formatTokens(segment.value)} ({Math.round(segment.value / Math.max(1, chartTotal) * 100)}%)</span>
                        </div>
                      ))}
                      {donutSegments.length > 8 && <div className={css.donutLegendRow}>… 其余 {donutSegments.length - 8} 项</div>}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className={css.barChart}>
                      {timeline.map(point => (
                        <div key={point.dateKey} className={css.barColumn} title={`${point.dateKey} · ${point.requests} 个请求 · ${formatTokens(totalTokensOf(point))} tokens`}>
                          <span className={css.barSegment} style={{ background: CHART_COLORS[0], height: `${Math.max(1, Math.round(totalTokensOf(point) / Math.max(1, chartTotal) * 100))}%` }} />
                        </div>
                      ))}
                    </div>
                    <div className={css.barAxis}>
                      <span>{timeline[0]?.dateKey ?? ''}</span>
                      <span>{timeline[timeline.length - 1]?.dateKey ?? ''}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={css.exploreCard} style={{ marginTop: 12 }}>
              <div className={css.exploreHeader}>
                <span className={css.exploreTitle}>请求</span>
                <span style={{ color: 'var(--foreground-tertiary)', fontSize: 12 }}>{entries.length} 条记录</span>
              </div>
              {entries.length === 0 ? (
                <div className={css.tableEmpty}>暂无记录</div>
              ) : (
                <>
                  <div className={css.tableWrap}>
                    <table className={css.entriesTable}>
                      <thead>
                        <tr>
                          <th>模型</th>
                          <th>来源</th>
                          <th>日期</th>
                          <th className={css.tdRight}>Token</th>
                          <th className={css.tdRight}>成本</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map(entry => (
                          <tr key={entry.id}>
                            <td>
                              <div className={css.modelCell}>
                                <span className={css.modelName}>{entry.model}</span>
                                <span className={css.modelProvider}>{entry.provider}</span>
                              </div>
                            </td>
                            <td>{entry.kind === 'translation' ? '翻译' : entry.kind === 'painting' ? '绘画' : '知识库'}</td>
                            <td>{formatEntryTime(entry.createdAt)}</td>
                            <td className={css.tdRight}>{formatTokens(entry.inputTokens + entry.outputTokens + entry.cacheReadTokens + entry.cacheWriteTokens)}</td>
                            <td className={css.tdRight}>{formatCost(estimateCost(entry))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {nextCursor === null ? null : (
                    <button type="button" className={css.loadMoreBtn} onClick={() => { void loadMore() }}>加载更多</button>
                  )}
                </>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

/** Tiny SVG polyline sparkline (last values, 48x32). */
function Sparkline({ values }: { values: readonly number[] }) {
  const max = Math.max(1, ...values)
  const points = values.slice(-48).map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * 48
    const y = 30 - (value / max) * 26
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg className={css.metricSparkline} width="48" height="32" viewBox="0 0 48 32" aria-hidden>
      {points === '' ? null : <polyline points={points} fill="none" stroke="var(--foreground-tertiary)" strokeWidth="1.5" />}
    </svg>
  )
}
