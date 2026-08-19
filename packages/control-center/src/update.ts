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
