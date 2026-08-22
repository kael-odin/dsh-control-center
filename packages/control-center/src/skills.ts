/**
 * Skills vertical Host service.
 *
 * SQLite catalog at <dshHome>/control-center/skills.sqlite with append-only
 * migrations. Skill files are stored in <dshHome>/skills/ and registered
 * with DSH's skill runtime.
 *
 * AGPL-3.0-only – adapted from Cherry Studio's SkillService architecture.
 */

import { readFileSync, existsSync, readdirSync, statSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, basename, relative, sep as pathSep } from 'node:path'
import { createHash } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { markRemoteMethods } from './knowledge/remote-methods.ts'
import { searchSkillMarketplaces, SKILL_SEARCH_FAILED } from './skill-marketplace.ts'
import type {
  InstalledSkill,
  ListSkillsQuery,
  UpdateSkillDto,
  SkillInstallOptions,
  MarketplaceSkillItem,
  MarketplaceSearchQuery,
  MarketplaceSearchResponse
} from './skills-types.ts'

const DB_VERSION = 1

const SCHEMA_INIT = `
  CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    folder_name TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL,
    source_url TEXT,
    namespace TEXT,
    author TEXT,
    version TEXT,
    source_tags TEXT NOT NULL DEFAULT '[]',
    content_hash TEXT NOT NULL,
    is_global_enabled INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  ) STRICT;

  CREATE INDEX IF NOT EXISTS skills_source_idx ON skills(source);
  CREATE INDEX IF NOT EXISTS skills_enabled_idx ON skills(is_global_enabled);
  CREATE INDEX IF NOT EXISTS skills_folder_idx ON skills(folder_name);

  CREATE TABLE IF NOT EXISTS _migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  ) STRICT;
` as const

/**
 * Parse SKILL.md frontmatter and extract metadata.
 *
 * Simplified from Cherry's markdownParser – extracts name, description,
 * namespace, author, version, and tags from YAML-like frontmatter.
 */
function parseSkillMetadata(skillMdContent: string): {
  name: string
  description: string | null
  namespace: string | null
  author: string | null
  version: string | null
  tags: string[]
} {
  // Default values
  let name = 'Unnamed Skill'
  let description: string | null = null
  let namespace: string | null = null
  let author: string | null = null
  let version: string | null = null
  const tags: string[] = []

  // Extract frontmatter between --- markers
  const frontmatterMatch = skillMdContent.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!frontmatterMatch || !frontmatterMatch[1]) {
    // No frontmatter, use first # heading as name
    const headingMatch = skillMdContent.match(/^#\s+(.+)$/m)
    if (headingMatch?.[1]) name = headingMatch[1].trim()
    return { name, description, namespace, author, version, tags }
  }

  const frontmatter = frontmatterMatch[1]

  // Simple YAML-like parser for common fields
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m)
  if (nameMatch?.[1]) name = nameMatch[1].trim().replace(/^['"]|['"]$/g, '')

  const descMatch = frontmatter.match(/^description:\s*(.+)$/m)
  if (descMatch?.[1]) description = descMatch[1].trim().replace(/^['"]|['"]$/g, '')

  const nsMatch = frontmatter.match(/^namespace:\s*(.+)$/m)
  if (nsMatch?.[1]) namespace = nsMatch[1].trim().replace(/^['"]|['"]$/g, '')

  const authorMatch = frontmatter.match(/^author:\s*(.+)$/m)
  if (authorMatch?.[1]) author = authorMatch[1].trim().replace(/^['"]|['"]$/g, '')

  const versionMatch = frontmatter.match(/^version:\s*(.+)$/m)
  if (versionMatch?.[1]) version = versionMatch[1].trim().replace(/^['"]|['"]$/g, '')

  // Parse tags array
  const tagsMatch = frontmatter.match(/^tags:\s*\[(.+)\]$/m)
  if (tagsMatch?.[1]) {
    const tagList = tagsMatch[1].split(',').map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
    tags.push(...tagList)
  }

  return { name, description, namespace, author, version, tags }
}

/**
 * Compute content hash for a skill directory.
 *
 * Hashes SKILL.md and all other files in sorted order.
 */
function computeContentHash(skillDir: string): string {
  const hash = createHash('sha256')
  const files: string[] = []

  function collect(dir: string) {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)
      if (stat.isDirectory()) {
        if (entry !== 'node_modules' && entry !== '.git') {
          collect(fullPath)
        }
      } else {
        files.push(fullPath)
      }
    }
  }

  collect(skillDir)
  files.sort()

  for (const file of files) {
    const relPath = relative(skillDir, file)
    hash.update(relPath)
    hash.update(readFileSync(file))
  }

  return hash.digest('hex')
}

export interface SkillsServiceConfig {
  dshHome: string
  logger: Context['logger']
}

export class SkillsService extends Service {
  static inject = [] as const
  readonly typertRemote = bindTypertRemote(this, 'controlCenterSkills')

  private readonly db: DatabaseSync
  private readonly skillsDir: string

  constructor(ctx: Context, config?: SkillsServiceConfig) {
    super(ctx, 'controlCenterSkills')
    const dshHome = config?.dshHome ?? resolveDshHome()
    const ccDir = join(dshHome, 'control-center')
    if (!existsSync(ccDir)) mkdirSync(ccDir, { recursive: true })

    const dbPath = join(ccDir, 'skills.sqlite')
    this.db = new DatabaseSync(dbPath)
    this.db.exec('PRAGMA foreign_keys = ON')

    this.skillsDir = join(dshHome, 'skills')
    if (!existsSync(this.skillsDir)) mkdirSync(this.skillsDir, { recursive: true })

    this.migrate()
    markRemoteMethods(this, [
      ['list', 'list'],
      ['getById', 'getById'],
      ['update', 'update'],
      // Wire name differs from the method name: the client Remote namespace
      // service rejects a method literally named `install` (it collides with
      // RemoteNamespaceService.prototype.install), which would fail $mount.
      ['install', 'installSkill'],
      ['uninstall', 'uninstall'],
      ['searchMarketplace', 'searchMarketplace']
    ])
  }

  private migrate() {
    this.db.exec(SCHEMA_INIT)

    const row = this.db.prepare('SELECT COALESCE(MAX(version), 0) as version FROM _migrations').get() as
      | { version: number }
      | undefined
    const currentVersion = row?.version ?? 0

    if (currentVersion < DB_VERSION) {
      // Future migrations go here
      this.db.exec(`INSERT INTO _migrations (version) VALUES (${DB_VERSION})`)
    }
  }

  /**
   * List installed skills with optional search filter.
   */
  async list(query: ListSkillsQuery = {}): Promise<InstalledSkill[]> {
    let sql = `
      SELECT
        id, name, description, folder_name as folderName, source, source_url as sourceUrl,
        namespace, author, version, source_tags as sourceTags, content_hash as contentHash,
        is_global_enabled as isGlobalEnabled, created_at as createdAt, updated_at as updatedAt
      FROM skills
    `
    const params: string[] = []

    if (query.search) {
      sql += ` WHERE name LIKE ? OR description LIKE ?`
      const searchPattern = `%${query.search}%`
      params.push(searchPattern, searchPattern)
    }

    sql += ` ORDER BY name ASC`

    const stmt = this.db.prepare(sql)
    const rows = params.length > 0 ? stmt.all(...params) : stmt.all()

    return (rows as any[]).map((row) => ({
      ...row,
      sourceTags: JSON.parse(row.sourceTags as string),
      isGlobalEnabled: Boolean(row.isGlobalEnabled)
    }))
  }

  /**
   * Get skill by ID.
   */
  async getById(skillId: string): Promise<InstalledSkill | null> {
    const stmt = this.db.prepare(`
      SELECT
        id, name, description, folder_name as folderName, source, source_url as sourceUrl,
        namespace, author, version, source_tags as sourceTags, content_hash as contentHash,
        is_global_enabled as isGlobalEnabled, created_at as createdAt, updated_at as updatedAt
      FROM skills
      WHERE id = ?
    `)
    const row = stmt.get(skillId) as any
    if (!row) return null

    return {
      ...row,
      sourceTags: JSON.parse(row.sourceTags),
      isGlobalEnabled: Boolean(row.isGlobalEnabled)
    }
  }

  /**
   * Update skill (currently only global enable/disable).
   */
  async update(skillId: string, dto: UpdateSkillDto): Promise<InstalledSkill> {
    const existing = await this.getById(skillId)
    if (!existing) throw new Error(`Skill not found: ${skillId}`)

    this.db
      .prepare(`
        UPDATE skills
        SET is_global_enabled = ?, updated_at = datetime('now')
        WHERE id = ?
      `)
      .run(dto.isGlobalEnabled ? 1 : 0, skillId)

    const updated = await this.getById(skillId)
    if (!updated) throw new Error('Failed to retrieve updated skill')
    return updated
  }

  /**
   * Install a skill from various sources.
   */
  async install(options: SkillInstallOptions): Promise<InstalledSkill> {

    // Dispatch based on source type
    switch (options.source) {
      case 'directory':
        return this.installFromDirectory(options.path)
      case 'zip':
        throw new Error('ZIP installation not yet implemented')
      case 'url':
        return this.installFromUrl(options.url)
      case 'marketplace':
        throw new Error('Marketplace installation not yet implemented')
      default:
        throw new Error(`Unknown install source: ${(options as any).source}`)
    }
  }

  private installFromDirectory(sourcePath: string): InstalledSkill {
    const absPath = resolve(sourcePath)
    if (!existsSync(absPath)) throw new Error(`Source path does not exist: ${absPath}`)
    if (!statSync(absPath).isDirectory()) throw new Error(`Source path is not a directory: ${absPath}`)

    // Find SKILL.md
    const skillMdPath = join(absPath, 'SKILL.md')
    if (!existsSync(skillMdPath)) throw new Error(`SKILL.md not found in: ${absPath}`)

    const skillMdContent = readFileSync(skillMdPath, 'utf-8')
    const metadata = parseSkillMetadata(skillMdContent)
    const contentHash = computeContentHash(absPath)

    // Generate folder name from source basename
    const folderName = basename(absPath).replace(/[^a-zA-Z0-9_-]/g, '-')
    if (folderName.length === 0) throw new Error('Invalid folder name generated')

    // Check if skill with same folder already exists
    const existing = this.db.prepare('SELECT id FROM skills WHERE folder_name = ?').get(folderName)

    if (existing) {
      throw new Error(`A skill with folder name "${folderName}" is already installed`)
    }

    // Copy skill to managed directory
    const targetDir = join(this.skillsDir, folderName)
    if (existsSync(targetDir)) {
      rmSync(targetDir, { recursive: true, force: true })
    }
    this.copyDirectory(absPath, targetDir)

    // Generate UUID for the skill
    const id = `skill-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    // Insert into database
    const now = new Date().toISOString()
    this.db
      .prepare(`
        INSERT INTO skills (
          id, name, description, folder_name, source, source_url, namespace, author, version,
          source_tags, content_hash, is_global_enabled, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        id,
        metadata.name,
        metadata.description,
        folderName,
        'directory',
        absPath,
        metadata.namespace,
        metadata.author,
        metadata.version,
        JSON.stringify(metadata.tags),
        contentHash,
        0, // not enabled by default
        now,
        now
      )

    this.ctx.logger.info('Installed skill from directory', { id, name: metadata.name, folderName })

    // Synchronously retrieve the installed skill
    const installed = this.db
      .prepare(`
        SELECT
          id, name, description, folder_name as folderName, source, source_url as sourceUrl,
          namespace, author, version, source_tags as sourceTags, content_hash as contentHash,
          is_global_enabled as isGlobalEnabled, created_at as createdAt, updated_at as updatedAt
        FROM skills
        WHERE id = ?
      `)
      .get(id) as any

    if (!installed) throw new Error('Failed to retrieve installed skill')

    return {
      ...installed,
      sourceTags: JSON.parse(installed.sourceTags),
      isGlobalEnabled: Boolean(installed.isGlobalEnabled)
    }
  }

  /**
   * Install one skill directory from a github.com tree URL
   * (`/{owner}/{repo}/tree/{branch}/{dir}`): the Git Trees API lists the
   * subtree, each blob downloads from raw.githubusercontent.com, and the
   * staged copy re-enters the ordinary directory installer — validation,
   * hashing, and dedupe stay in exactly one code path.
   */
  private async installFromUrl(sourceUrl: string): Promise<InstalledSkill> {
    let url: URL
    try { url = new URL(sourceUrl.trim()) } catch { throw new Error(`无效 URL：${sourceUrl}`) }
    const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent)
    if (url.hostname.replace(/^www\./, '') !== 'github.com'
      || parts.length < 5 || parts[2] !== 'tree') {
      throw new Error('目前仅支持 GitHub 目录链接（github.com/{owner}/{repo}/tree/{分支}/{目录}）')
    }
    const [owner, repo, , ref, ...dirParts] = parts as [string, string, string, string, ...string[]]
    const dirPath = dirParts.join('/')
    if (dirPath.length === 0) throw new Error('链接未指向技能子目录')

    const api = `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`
    const treeResponse = await fetch(api, { headers: { accept: 'application/vnd.github+json' } })
    if (!treeResponse.ok) throw new Error(`GitHub Trees API 返回 ${String(treeResponse.status)}`)
    const tree = await treeResponse.json() as { tree?: Array<{ path?: unknown; type?: unknown }> }
    const entries = (Array.isArray(tree.tree) ? tree.tree : [])
      .map(entry => typeof entry.path === 'string' ? entry : null)
      .filter((entry): entry is { path: string } => entry !== null && (entry.type ?? 'blob') === 'blob')
      .filter(entry => entry.path === dirPath || entry.path.startsWith(`${dirPath}/`))
    if (entries.length === 0) throw new Error(`仓库分支 ${ref} 下不存在目录 ${dirPath}`)

    // Stage into a temp folder named after the skill directory so the
    // directory installer's dedupe keeps working unchanged.
    const stageRoot = join(tmpdir(), `dsh-skill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
    const stageDir = join(stageRoot, basename(dirPath))
    try {
      for (const entry of entries) {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(ref)}/${entry.path.split('/').map(encodeURIComponent).join('/')}`
        const fileResponse = await fetch(rawUrl)
        if (!fileResponse.ok) throw new Error(`下载 ${entry.path} 失败（${String(fileResponse.status)}）`)
        const content = Buffer.from(await fileResponse.arrayBuffer())
        const target = join(stageDir, entry.path.slice(dirPath.length).replace(/^\//, ''))
        mkdirSync(target.slice(0, target.lastIndexOf(pathSep)), { recursive: true })
        writeFileSync(target, content)
      }
      return this.installFromDirectory(stageDir)
    } finally {
      rmSync(stageRoot, { recursive: true, force: true })
    }
  }



  private copyDirectory(src: string, dest: string) {
    mkdirSync(dest, { recursive: true })
    const entries = readdirSync(src)

    for (const entry of entries) {
      if (entry === 'node_modules' || entry === '.git') continue

      const srcPath = join(src, entry)
      const destPath = join(dest, entry)
      const stat = statSync(srcPath)

      if (stat.isDirectory()) {
        this.copyDirectory(srcPath, destPath)
      } else {
        const content = readFileSync(srcPath)
        writeFileSync(destPath, content)
      }
    }
  }

  /**
   * Uninstall a skill.
   */
  async uninstall(skillId: string): Promise<void> {
    const skill = await this.getById(skillId)
    if (!skill) throw new Error(`Skill not found: ${skillId}`)

    // Remove from filesystem
    const targetDir = join(this.skillsDir, skill.folderName)
    if (existsSync(targetDir)) {
      rmSync(targetDir, { recursive: true, force: true })
    }

    // Remove from database
    this.db.prepare('DELETE FROM skills WHERE id = ?').run(skillId)

    this.ctx.logger.info('Uninstalled skill', { id: skillId, name: skill.name })
  }

  /**
   * Search marketplace.
   *
   * Not yet implemented: the claude-plugins.dev search endpoint has not been
   * wired. Throws loudly rather than silently returning an empty result set,
   * so callers cannot mistake an unimplemented capability for "no matches".
   */
  /**
   * Search the three public skill registries (Cherry's set) in parallel via
   * host fetch — browser CORS never gates it. Results are installable
   * through {@link install} with `{ source: 'url', url: sourceUrl }` when the
   * entry carries a GitHub directory.
   */
  async searchMarketplace(query: MarketplaceSearchQuery): Promise<MarketplaceSearchResponse> {
    const results = await searchSkillMarketplaces(
      query.query,
      async (url) => {
        const response = await fetch(url, { headers: { accept: 'application/json' } })
        if (!response.ok) throw new Error(`registry answered ${String(response.status)}`)
        return await response.json()
      },
      (source, error) => {
        this.ctx.logger.warn(`skill marketplace "${String(source)}" failed: ${error instanceof Error ? error.message : String(error)}`)
      },
    )
    const skills: MarketplaceSkillItem[] = results.map(result => ({
      id: result.slug,
      name: result.name,
      namespace: result.sourceRegistry,
      sourceUrl: result.sourceUrl,
      description: result.description,
      version: null,
      author: result.author,
      stars: result.stars,
      installs: result.downloads,
    }))
    if (skills.length === 0 && query.query.trim().length > 0) {
      // Distinguish "no hits anywhere" from an all-registry transport failure
      // so the UI can show an actionable message either way.
      try {
        await searchSkillMarketplaces('', async () => ({ skills: [] }))
      } catch {
        throw new Error(SKILL_SEARCH_FAILED)
      }
    }
    return { skills, total: skills.length, limit: query.limit ?? skills.length, offset: query.offset ?? 0 }
  }

  [Symbol.dispose]() {
    this.db.close()
  }
}
