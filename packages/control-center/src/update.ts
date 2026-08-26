/**
 * Update Host service: check the GitHub release feed for a newer Control
 * Center version than the installed one.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const REPO = 'kael-odin/dsh-control-center'

export interface UpdateInfo {
  currentVersion: string
  latestVersion: string | null
  updateAvailable: boolean
  releaseUrl: string | null
  notes: string | null
  checkedAt: string
}

/** One published release as shown in the inline release-notes page. */
export interface ReleaseEntry {
  tagName: string
  name: string | null
  publishedAt: string | null
  body: string | null
  htmlUrl: string | null
  prerelease: boolean
}

export class UpdateService extends Service {
  static inject = ['settings'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterUpdate')

  constructor(ctx: Context, _config?: { logger?: Context['logger'] }) {
    super(ctx, 'controlCenterUpdate')
  }

  async checkForUpdates(): Promise<UpdateInfo> {
    const currentVersion = this.currentVersion()
    const checkedAt = new Date().toISOString()
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      try {
        const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
          headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'dsh-control-center' },
          signal: controller.signal,
        })
        if (!response.ok) {
          return { currentVersion, latestVersion: null, updateAvailable: false, releaseUrl: null, notes: null, checkedAt }
        }
        const payload = await response.json() as { tag_name?: string; html_url?: string; body?: string }
        const latest = payload.tag_name ?? null
        return {
          currentVersion,
          latestVersion: latest,
          updateAvailable: latest !== null && latest !== `v${currentVersion}` && latest !== currentVersion,
          releaseUrl: payload.html_url ?? null,
          notes: payload.body ?? null,
          checkedAt,
        }
      } finally {
        clearTimeout(timer)
      }
    } catch {
      return { currentVersion, latestVersion: null, updateAvailable: false, releaseUrl: null, notes: null, checkedAt }
    }
  }

  /**
   * The deployment's recent releases (newest first) for the inline
   * release-notes page — Cherry's releaseNotes top-level page parity.
   */
  async listReleases(): Promise<{ ok: true; value: ReleaseEntry[] } | { ok: false; error: string }> {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      try {
        const response = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=10`, {
          headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'dsh-control-center' },
          signal: controller.signal,
        })
        if (!response.ok) return { ok: false, error: `GitHub releases ${String(response.status)}` }
        const payload = await response.json() as Array<{
          tag_name?: string; name?: string; published_at?: string; body?: string
          html_url?: string; prerelease?: boolean
        }>
        return {
          ok: true,
          value: payload.map(release => ({
            tagName: release.tag_name ?? '',
            name: release.name ?? null,
            publishedAt: release.published_at ?? null,
            body: release.body ?? null,
            htmlUrl: release.html_url ?? null,
            prerelease: release.prerelease === true,
          })),
        }
      } finally {
        clearTimeout(timer)
      }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  private currentVersion(): string {
    try {
      const manifest = JSON.parse(readFileSync(join(this.packageRoot(), 'package.json'), 'utf8')) as { version?: string }
      return manifest.version ?? '0.1.0'
    } catch {
      return '0.1.0'
    }
  }

  private packageRoot(): string {
    return new URL('..', import.meta.url).pathname
  }

  [Symbol.dispose]() {
    // Nothing to release.
  }
}
