/**
 * Usage Analytics Host service: aggregates Control Center service counts
 * into one overview (session-level analytics stay client-side, where the
 * DSH session store lives).
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import type { ProvidersService } from './providers.ts'
import type { ReposService } from './repos.ts'
import type { SkillsService } from './skills.ts'
import type { McpService } from './mcp.ts'
import type { TranslationService } from './translation.ts'
import type { KnowledgeService } from './knowledge.ts'
import { usageStoreFor, type UsageStore } from './usage-store.ts'
import type {
  UsageEntriesPage, UsageEntriesRequest, UsageRecord, UsageStats, UsageStatsGroup, UsageStatsRequest,
  UsageTimelinePoint, UsageTimelineRequest,
} from './usage-types.ts'

const MAX_STATS_GROUPS = 50
const MAX_ENTRIES_PAGE = 200

/** Local-day date key (YYYY-MM-DD) for bucketing. */
function dateKey(timestamp: number): string {
  const date = new Date(timestamp)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function totalTokensOf(record: UsageRecord): number {
  return record.inputTokens + record.outputTokens + record.cacheReadTokens + record.cacheWriteTokens
}

/** ISO week-of-month (1-5) for weekly buckets. */
function weekOf(timestamp: number): number {
  const date = new Date(timestamp)
  return Math.floor((date.getDate() - 1) / 7) + 1
}

export interface UsageServiceConfig {
  logger?: Context['logger']
  /** Override the DSH home (tests). */
  dshHome?: string
}

export interface UsageOverview {
  providers: number
  enabledModels: number
  totalModels: number
  repos: number
  skills: number
  mcpServers: number
  mcpActive: number
  translationHistory: number
  knowledgeBases: number
  knowledgeSources: number
  collectedAt: string
}

export class UsageService extends Service {
  static inject = ['settings'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterUsage')
  private readonly store: UsageStore

  constructor(ctx: Context, config: UsageServiceConfig = {}) {
    super(ctx, 'controlCenterUsage')
    this.store = usageStoreFor(resolveDshHome(config.dshHome))
  }

  /** Record one AI call (invoked by translation/painting/knowledge services). */
  record(input: Omit<UsageRecord, 'id' | 'createdAt'>): UsageRecord {
    return this.store.record(input)
  }

  timeline(request: UsageTimelineRequest): UsageTimelinePoint[] {
    const { from, to } = request
    const mode = request.groupBy ?? 'day'
    const records = this.store.all().filter(record => record.createdAt >= from && record.createdAt < to)
    const buckets = new Map<string, UsageTimelinePoint>()
    for (const record of records) {
      const key = mode === 'month' ? dateKey(record.createdAt).slice(0, 7) : mode === 'week' ? `${dateKey(record.createdAt).slice(0, 7)}-w${weekOf(record.createdAt)}` : dateKey(record.createdAt)
      const bucket = buckets.get(key) ?? { dateKey: key, requests: 0, tokens: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }
      bucket.requests += 1
      bucket.tokens += record.inputTokens + record.outputTokens + record.cacheReadTokens + record.cacheWriteTokens
      bucket.inputTokens += record.inputTokens + record.cacheReadTokens + record.cacheWriteTokens
      bucket.outputTokens += record.outputTokens
      bucket.cacheReadTokens += record.cacheReadTokens
      bucket.cacheWriteTokens += record.cacheWriteTokens
      buckets.set(key, bucket)
    }
    return [...buckets.values()].sort((left, right) => left.dateKey.localeCompare(right.dateKey))
  }

  stats(request: UsageStatsRequest): UsageStats {
    const { from, to } = request
    const groupBy = request.groupBy ?? 'provider'
    const limit = Math.min(MAX_STATS_GROUPS, Math.max(1, request.limit ?? 10))
    const records = this.store.all().filter(record => record.createdAt >= from && record.createdAt < to)
    const groups = new Map<string, UsageStatsGroup>()
    for (const record of records) {
      const key = groupBy === 'model' ? `${record.provider}/${record.model}` : groupBy === 'kind' ? record.kind : record.provider
      const group = groups.get(key) ?? { key, requests: 0, tokens: 0, inputTokens: 0, outputTokens: 0 }
      group.requests += 1
      group.tokens += record.inputTokens + record.outputTokens + record.cacheReadTokens + record.cacheWriteTokens
      group.inputTokens += record.inputTokens + record.cacheReadTokens + record.cacheWriteTokens
      group.outputTokens += record.outputTokens
      groups.set(key, group)
    }
    const ordered = [...groups.values()].sort((left, right) => right.tokens - left.tokens).slice(0, limit)
    return {
      groups: ordered,
      totalRequests: records.length,
      totalTokens: records.reduce((sum, record) => sum + record.inputTokens + record.outputTokens + record.cacheReadTokens + record.cacheWriteTokens, 0),
      totalInputTokens: records.reduce((sum, record) => sum + record.inputTokens + record.cacheReadTokens + record.cacheWriteTokens, 0),
      totalOutputTokens: records.reduce((sum, record) => sum + record.outputTokens, 0),
    }
  }

  entries(request: UsageEntriesRequest): UsageEntriesPage {
    const { from, to } = request
    const limit = Math.min(MAX_ENTRIES_PAGE, Math.max(1, request.limit ?? 50))
    const sortBy = request.sortBy ?? 'createdAt'
    const offset = request.cursor === undefined || request.cursor === null ? 0 : Number.parseInt(request.cursor, 10)
    if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('invalid usage entries cursor')
    const ordered = this.store.all()
      .filter(record => record.createdAt >= from && record.createdAt < to)
      .sort((left, right) => {
        if (sortBy === 'createdAt') return right.createdAt - left.createdAt
        if (sortBy === 'tokens') return totalTokensOf(right) - totalTokensOf(left)
        return right[sortBy] - left[sortBy]
      })
    const items = ordered.slice(offset, offset + limit).map(record => ({ ...record }))
    const next = offset + items.length
    return { items, ...(next < ordered.length ? { nextCursor: String(next) } : {}) }
  }

  async getOverview(): Promise<UsageOverview> {
    const overview: UsageOverview = {
      providers: 0,
      enabledModels: 0,
      totalModels: 0,
      repos: 0,
      skills: 0,
      mcpServers: 0,
      mcpActive: 0,
      translationHistory: 0,
      knowledgeBases: 0,
      knowledgeSources: 0,
      collectedAt: new Date().toISOString(),
    }

    const providers = this.ctx.get('controlCenterProviders') as ProvidersService | undefined
    if (providers !== undefined) {
      const list = await providers.list()
      overview.providers = list.length
      for (const provider of list) {
        const models = provider.models ?? []
        overview.totalModels += models.length
        overview.enabledModels += models.filter(model => model.enabled).length
      }
    }

    const repos = this.ctx.get('controlCenterRepos') as ReposService | undefined
    if (repos !== undefined) {
      overview.repos = (await repos.list()).length
    }

    const skills = this.ctx.get('controlCenterSkills') as SkillsService | undefined
    if (skills !== undefined) {
      overview.skills = (await skills.list()).length
    }

    const mcp = this.ctx.get('controlCenterMcp') as McpService | undefined
    if (mcp !== undefined) {
      const servers = await mcp.list()
      overview.mcpServers = servers.length
      overview.mcpActive = servers.filter(server => server.isActive).length
    }

    const translation = this.ctx.get('controlCenterTranslation') as TranslationService | undefined
    if (translation !== undefined) {
      overview.translationHistory = translation.countHistory()
    }

    const knowledge = this.ctx.get('controlCenterKnowledge') as KnowledgeService | undefined
    if (knowledge !== undefined) {
      const bases = knowledge.listBases().bases
      overview.knowledgeBases = bases.length
      overview.knowledgeSources = bases.reduce((sum, base) => sum + (base.sourceCount ?? 0), 0)
    }

    return overview
  }

  [Symbol.dispose]() {
    // Nothing to release.
  }
}
