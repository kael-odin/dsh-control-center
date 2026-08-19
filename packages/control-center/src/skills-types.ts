/**
 * Skills vertical types (shared between Host and Client).
 *
 * AGPL-3.0-only – adapted from Cherry Studio insofar as Skills types are
 * derived from their `InstalledSkillSchema` and skill management contracts.
 */

/** Installed skill record in the Control Center catalog. */
export interface InstalledSkill {
  id: string
  name: string
  description: string | null
  folderName: string
  source: string
  sourceUrl: string | null
  namespace: string | null
  author: string | null
  version: string | null
  sourceTags: string[]
  contentHash: string
  isGlobalEnabled: boolean
  createdAt: string
  updatedAt: string
}

/** List skills query parameters. */
export interface ListSkillsQuery {
  search?: string
}

/** Update skill payload. */
export interface UpdateSkillDto {
  isGlobalEnabled: boolean
}

/**
 * Install source types.
 *
 * - `directory`: install from a local directory containing SKILL.md
 * - `zip`: install from a local ZIP archive
 * - `url`: install from a GitHub repository URL or clone URL
 * - `marketplace`: install from a marketplace by ID/slug
 */
export type SkillInstallSource = 'directory' | 'zip' | 'url' | 'marketplace'

/** Install from local directory options. */
export interface SkillInstallFromDirectoryOptions {
  source: 'directory'
  path: string
}

/** Install from local ZIP file options. */
export interface SkillInstallFromZipOptions {
  source: 'zip'
  path: string
}

/** Install from URL (GitHub repository). */
export interface SkillInstallFromUrlOptions {
  source: 'url'
  url: string
}

/** Install from marketplace by ID/slug. */
export interface SkillInstallFromMarketplaceOptions {
  source: 'marketplace'
  marketplaceId: string
  marketplace: 'claude-plugins.dev' | 'skills.sh' | 'clawhub.ai'
}

export type SkillInstallOptions =
  | SkillInstallFromDirectoryOptions
  | SkillInstallFromZipOptions
  | SkillInstallFromUrlOptions
  | SkillInstallFromMarketplaceOptions

/** Uninstall skill options. */
export interface SkillUninstallOptions {
  skillId: string
}

/** Update skill from its source. */
export interface SkillUpdateOptions {
  skillId: string
}

/**
 * Marketplace search result from claude-plugins.dev.
 */
export interface MarketplaceSkillItem {
  id: string
  name: string
  namespace: string
  sourceUrl: string | null
  description: string | null
  version: string | null
  author: string | null
  stars?: number
  installs?: number
  metadata?: {
    repoOwner?: string
    repoName?: string
    directoryPath?: string
    rawFileUrl?: string
  } | null
  createdAt?: string
  updatedAt?: string
}

export interface MarketplaceSearchQuery {
  query: string
  limit?: number
  offset?: number
}

export interface MarketplaceSearchResponse {
  skills: MarketplaceSkillItem[]
  total?: number
  limit?: number
  offset?: number
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    controlCenterSkills: {
      list(query?: ListSkillsQuery): Promise<{ ok: true; value: InstalledSkill[] } | { ok: false; error: { code: string; message: string; details: object } }>
      getById(skillId: string): Promise<{ ok: true; value: InstalledSkill | null } | { ok: false; error: { code: string; message: string; details: object } }>
      update(skillId: string, dto: UpdateSkillDto): Promise<{ ok: true; value: InstalledSkill } | { ok: false; error: { code: string; message: string; details: object } }>
      installSkill(options: SkillInstallOptions): Promise<{ ok: true; value: InstalledSkill } | { ok: false; error: { code: string; message: string; details: object } }>
      uninstall(skillId: string): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
      searchMarketplace(query: MarketplaceSearchQuery): Promise<{ ok: true; value: MarketplaceSearchResponse } | { ok: false; error: { code: string; message: string; details: object } }>
    }
  }
}
