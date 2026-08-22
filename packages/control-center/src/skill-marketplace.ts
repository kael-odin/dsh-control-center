/**
 * Skill marketplace search — ported from Cherry Studio
 * `src/shared/utils/skillMarketplace.ts`: three public registries searched in
 * parallel, partial failures tolerated (only an all-source failure rejects),
 * de-duplicated by display name.
 *
 * Transport is injected so tests can stub responses; production passes the
 * host `fetch`.
 */

export type SkillSearchSource = 'skills.sh' | 'claude-plugins.dev' | 'clawhub.ai' | 'github'

/** One installable search hit. `installUrl` is what the installer consumes. */
export interface SkillSearchResult {
  slug: string
  name: string
  description: string | null
  author: string | null
  stars: number
  downloads: number
  sourceRegistry: SkillSearchSource
  sourceUrl: string | null
  /** GitHub tree URL of the skill directory — resolvable by the URL installer. */
  installUrl: string | null
}

interface MarketplaceSource {
  name: SkillSearchSource
  buildUrl: (query: string) => string
  normalize: (raw: unknown) => Array<Omit<SkillSearchResult, 'installUrl'>> & { length: number }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null
}

function str(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

function num(record: Record<string, unknown>, key: string): number {
  const value = record[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/**
 * Resolve the installable GitHub directory for one claude-plugins entry:
 * prefer metadata.directoryPath, else derive it from a github.com tree URL on
 * the same repo/main branch (Cherry's rule — fail closed when ambiguous).
 */
function claudePluginsEntries(raw: unknown): Array<Omit<SkillSearchResult, 'installUrl'>> {
  const root = asRecord(raw)
  const skills = Array.isArray(root?.skills) ? root!.skills : []
  const out: Array<Omit<SkillSearchResult, 'installUrl'>> = []
  for (const itemRaw of skills) {
    const item = asRecord(itemRaw)
    if (item === null) continue
    const meta = asRecord(item.metadata) ?? {}
    const repoOwner = str(meta, 'repoOwner')
    const repoName = str(meta, 'repoName')
    let dir = str(meta, 'directoryPath')
    if (dir === null && typeof item.sourceUrl === 'string') {
      // Derive from a main-branch tree URL: /{owner}/{repo}/tree/main/{dir}
      try {
        const url = new URL(item.sourceUrl)
        const parts = url.pathname.split('/').filter(Boolean)
        if (url.hostname === 'github.com' && parts.length >= 5
          && parts[0]!.toLowerCase() === repoOwner?.toLowerCase()
          && parts[1]!.toLowerCase() === repoName?.toLowerCase()
          && parts[2] === 'tree' && (parts[3] === 'main' || parts[3] === 'master')) {
          dir = parts.slice(4).map(decodeURIComponent).filter(Boolean).join('/')
        }
      } catch { /* leave dir null */ }
    }
    if (repoOwner === null || repoName === null || dir === null || dir.length === 0) continue
    out.push({
      slug: str(item, 'id') ?? `${repoOwner}/${repoName}/${dir}`,
      name: str(item, 'name') ?? dir,
      description: str(item, 'description'),
      author: str(item, 'author') ?? str(item, 'namespace') ?? repoOwner,
      stars: num(item, 'stars'),
      downloads: num(item, 'installs'),
      sourceRegistry: 'claude-plugins.dev',
      sourceUrl: item.sourceUrl === null || typeof item.sourceUrl !== 'string'
        ? `https://github.com/${repoOwner}/${repoName}/tree/main/${dir}`
        : item.sourceUrl,
    })
  }
  return out
}

function skillsShEntries(raw: unknown): Array<Omit<SkillSearchResult, 'installUrl'>> {
  const root = asRecord(raw)
  const skills = Array.isArray(root?.skills) ? root!.skills : []
  const out: Array<Omit<SkillSearchResult, 'installUrl'>> = []
  for (const itemRaw of skills) {
    const item = asRecord(itemRaw)
    if (item === null) continue
    const id = str(item, 'id')
    if (id === null) continue
    out.push({
      slug: id,
      name: str(item, 'name') ?? id,
      description: null,
      author: id.includes('/') ? id.split('/')[0]! : null,
      stars: 0,
      downloads: num(item, 'installs'),
      sourceRegistry: 'skills.sh',
      sourceUrl: `https://skills.sh/${id}`,
    })
  }
  return out
}

function clawhubEntries(raw: unknown): Array<Omit<SkillSearchResult, 'installUrl'>> {
  const root = asRecord(raw)
  const results = Array.isArray(root?.results) ? root!.results : []
  const out: Array<Omit<SkillSearchResult, 'installUrl'>> = []
  for (const itemRaw of results) {
    const item = asRecord(itemRaw)
    if (item === null) continue
    const owner = str(item, 'ownerHandle')
    const slug = str(item, 'slug')
    if (owner === null || slug === null) continue
    out.push({
      slug,
      name: str(item, 'displayName') ?? slug,
      description: str(item, 'summary'),
      author: owner,
      stars: 0,
      downloads: 0,
      sourceRegistry: 'clawhub.ai',
      sourceUrl: `https://clawhub.ai/${owner}/skills/${slug}`,
    })
  }
  return out
}

const MARKETPLACE_SOURCES: readonly MarketplaceSource[] = [
  {
    name: 'skills.sh',
    buildUrl: (query) => {
      const url = new URL('https://skills.sh/api/search')
      url.searchParams.set('q', query)
      return url.toString()
    },
    normalize: skillsShEntries,
  },
  {
    name: 'claude-plugins.dev',
    buildUrl: (query) => {
      const url = new URL('https://claude-plugins.dev/api/skills')
      url.searchParams.set('q', query)
      url.searchParams.set('limit', '20')
      return url.toString()
    },
    normalize: claudePluginsEntries,
  },
  {
    name: 'clawhub.ai',
    buildUrl: (query) => {
      const url = new URL('https://clawhub.ai/api/v1/search')
      url.searchParams.set('q', query)
      return url.toString()
    },
    normalize: clawhubEntries,
  },
]

export const SKILL_SEARCH_FAILED = 'skill_search_failed'

/**
 * Search every supported registry. Only an all-source failure rejects;
 * per-source failures are reported through {@param onSourceFailure}.
 */
export async function searchSkillMarketplaces(
  query: string,
  fetchJson: (url: string) => Promise<unknown>,
  onSourceFailure?: (source: SkillSearchSource, error: unknown) => void,
): Promise<SkillSearchResult[]> {
  const trimmed = query.trim()
  if (trimmed.length === 0) return []

  const settled = await Promise.allSettled(
    MARKETPLACE_SOURCES.map(async (source) => source.normalize(await fetchJson(source.buildUrl(trimmed)))),
  )

  const combined: Array<Omit<SkillSearchResult, 'installUrl'>> = []
  let failed = 0
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      combined.push(...result.value)
    } else {
      failed += 1
      onSourceFailure?.(MARKETPLACE_SOURCES[index]!.name, result.reason)
    }
  })
  if (failed === MARKETPLACE_SOURCES.length) throw new Error(SKILL_SEARCH_FAILED)

  const seen = new Set<string>()
  return combined
    .filter(result => {
      const key = result.name.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(result => ({
      ...result,
      // claude-plugins entries carry a github.com tree sourceUrl the URL
      // installer resolves directly; other registries link their pages.
      installUrl: result.sourceRegistry === 'claude-plugins.dev' && result.sourceUrl !== null
        ? result.sourceUrl
        : null,
    }))
}
