/**
 * Usage Analytics Host service: aggregates Control Center service counts
 * into one overview (session-level analytics stay client-side, where the
 * DSH session store lives).
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import type { ProvidersService } from './providers.ts'
import type { ReposService } from './repos.ts'
import type { SkillsService } from './skills.ts'
import type { McpService } from './mcp.ts'
import type { TranslationService } from './translation.ts'
import type { KnowledgeService } from './knowledge.ts'

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

  constructor(ctx: Context, _config?: { logger?: Context['logger'] }) {
    super(ctx, 'controlCenterUsage')
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
