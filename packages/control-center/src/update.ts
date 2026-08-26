/**
 * Update Host service: check the GitHub release feed for a newer Control
 * Center version than the installed one, and (PLUGINIZATION §2.A) download a
 * release bundle into DSH storage so the operator can install it in one flow.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import type { DomainFacility, KvTable } from '@deepseek-ai/dsh-storage-domain'
import { z } from 'zod'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
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

/** Result of a successful prepareUpdate download. */
export interface PreparedUpdate {
  version: string
  assetName: string
  bytes: number
}

export interface UpdateInstallResult {
  version: string
  assetName: string
  exitCode: number
  stdoutTail: string
  stderrTail: string
}

const DOWNLOAD_LIMIT_BYTES = 64 * 1024 * 1024

const bundleSchema = z.object({
  version: z.string().min(1),
  assetName: z.string().min(1),
  bytes: z.number().int().nonnegative(),
  /** Base64 of the tarball — storage tables are JSON-shaped. */
  dataBase64: z.string().min(1),
  downloadedAt: z.string().min(1),
})

export type UpdateBundleRecord = z.infer<typeof bundleSchema>

const updateBundleDomain = defineDomain({
  name: 'control_center_update_bundles',
  version: 1,
  tables: { bundles: domainTable<string, UpdateBundleRecord>(bundleSchema) },
})

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

  /**
   * PLUGINIZATION §2.A: download the latest release's bundle tarball into DSH
   * storage so installation is a guided flow instead of a manual GitHub trip.
   * The asset must be a `.tgz` whose name mentions the control-center package;
   * anything else is refused (no blind execution of release attachments).
   */
  async prepareUpdate(): Promise<{ ok: true; value: PreparedUpdate } | { ok: false; error: string }> {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 30_000)
      let asset: { name: string; url: string; version: string } | undefined
      try {
        const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
          headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'dsh-control-center' },
          signal: controller.signal,
        })
        if (!response.ok) return { ok: false, error: `GitHub releases ${String(response.status)}` }
        const payload = await response.json() as {
          tag_name?: string
          assets?: Array<{ name?: string; browser_download_url?: string }>
        }
        asset = this.pickBundleAsset(payload.tag_name ?? '', payload.assets ?? [])
      } finally {
        clearTimeout(timer)
      }
      if (asset === undefined) {
        return { ok: false, error: '最新 Release 没有 Control Center 的 .tgz 安装包' }
      }

      const download = new AbortController()
      const downloadTimer = setTimeout(() => download.abort(), 120_000)
      let bytes: Uint8Array
      try {
        const response = await fetch(asset.url, {
          headers: { 'User-Agent': 'dsh-control-center' },
          signal: download.signal,
        })
        if (!response.ok) return { ok: false, error: `下载失败（HTTP ${String(response.status)}）` }
        const buffer = await response.arrayBuffer()
        if (buffer.byteLength > DOWNLOAD_LIMIT_BYTES) {
          return { ok: false, error: `安装包超出大小上限（${String(Math.round(DOWNLOAD_LIMIT_BYTES / 1024 / 1024))}MB）` }
        }
        bytes = new Uint8Array(buffer)
      } finally {
        clearTimeout(downloadTimer)
      }

      const record: UpdateBundleRecord = {
        version: asset.version,
        assetName: asset.name,
        bytes: bytes.byteLength,
        dataBase64: Buffer.from(bytes).toString('base64'),
        downloadedAt: new Date().toISOString(),
      }
      const store = await this.openBundleStore()
      await store.put('latest', record)
      return { ok: true, value: { version: record.version, assetName: record.assetName, bytes: record.bytes } }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  /** The stored prepared update, if one has been downloaded. */
  async getPreparedUpdate(): Promise<{ ok: true; value: PreparedUpdate | null }> {
    try {
      const store = await this.openBundleStore()
      const record = store.get('latest') as unknown as UpdateBundleRecord | undefined
      if (record === undefined || typeof record.version !== 'string') return { ok: true, value: null }
      return {
        ok: true,
        value: { version: record.version, assetName: record.assetName, bytes: record.bytes },
      }
    } catch {
      return { ok: true, value: null }
    }
  }

  /**
   * PLUGINIZATION §2.B stage one — the install half of the loop. Materializes
   * the stored tarball into `<dsh home>/updates/`, then runs the host's
   * existing `dsh plugin add file:<path>` pipeline (the same CLI the 插件 page
   * drives). The caller still restarts the profile; no silent self-replace.
   */
  async installPreparedUpdate(profile = 'default'): Promise<{ ok: true; value: UpdateInstallResult } | { ok: false; error: string }> {
    let record: UpdateBundleRecord
    try {
      const store = await this.openBundleStore()
      const stored = store.get('latest') as unknown as UpdateBundleRecord | undefined
      if (stored === undefined || typeof stored.version !== 'string' || typeof stored.dataBase64 !== 'string') {
        return { ok: false, error: '没有已下载的更新包，请先下载' }
      }
      record = stored
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }

    // Materialize the tarball under the DSH home; the path feeds a `file:` spec.
    const updatesDir = join(homedir(), '.dsh', 'updates')
    try {
      mkdirSync(updatesDir, { recursive: true })
      writeFileSync(join(updatesDir, record.assetName), Buffer.from(record.dataBase64, 'base64'))
    } catch (error) {
      return { ok: false, error: `写入更新包失败：${error instanceof Error ? error.message : String(error)}` }
    }

    // Reuse the plugin-management seam (system.ts) instead of spawning here:
    // one code path owns DSH CLI invocation and inventory reporting.
    const system = this.systemFace()
    if (system === undefined) return { ok: false, error: 'SystemService 未挂载，无法执行安装' }
    try {
      const result = await system.managePlugin(profile, 'add', `file:${join(updatesDir, record.assetName)}`)
      const tail = (text: string): string => text.length > 2_000 ? `…${text.slice(-2_000)}` : text
      return {
        ok: true,
        value: {
          version: record.version,
          assetName: record.assetName,
          exitCode: result.exitCode,
          stdoutTail: tail(result.stdout),
          stderrTail: tail(result.stderr),
        },
      }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  /** Late-bound face to SystemService — avoids a hard service dependency. */
  private systemFace(): { managePlugin(profile: string, operation: 'add' | 'remove' | 'update', spec: string): Promise<{ exitCode: number; stdout: string; stderr: string }> } | undefined {
    try {
      return this.ctx.get('controlCenterSystem') as unknown as { managePlugin(...args: never[]): Promise<{ exitCode: number; stdout: string; stderr: string }> } | undefined
    } catch {
      return undefined
    }
  }

  private async openBundleStore(): Promise<KvTable<string, UpdateBundleRecord>> {
    if (this.bundleTable === undefined) {
      const facility = (this.ctx as unknown as Record<string, unknown>).storageDomain as DomainFacility | undefined
      if (facility === undefined) {
        throw new Error('DSH storage-domain 未挂载，无法保存更新包')
      }
      const domain = await facility.open(updateBundleDomain)
      this.bundleTable = domain.table('bundles')
    }
    return this.bundleTable
  }

  private bundleTable: KvTable<string, UpdateBundleRecord> | undefined

  /**
   * Pick the installable tarball from a release's assets: prefer a name that
   * names the control-center package; refuse non-tgz attachments outright.
   */
  private pickBundleAsset(
    tagName: string,
    assets: Array<{ name?: string; browser_download_url?: string }>,
  ): { name: string; url: string; version: string } | undefined {
    const candidates = assets.filter(entry =>
      typeof entry.name === 'string' && entry.name.endsWith('.tgz')
      && typeof entry.browser_download_url === 'string')
    const chosen = candidates.find(entry => (entry.name ?? '').includes('control-center')) ?? candidates[0]
    if (chosen === undefined) return undefined
    return {
      name: chosen.name!,
      url: chosen.browser_download_url!,
      version: tagName.replace(/^v/, ''),
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
    // fileURLToPath, not URL.pathname: on Windows the pathname keeps a leading
    // slash (/D:/…) which readFileSync cannot open — the version then silently
    // fell back to 0.1.0 and the update check always offered an upgrade.
    return fileURLToPath(new URL('..', import.meta.url))
  }

  [Symbol.dispose]() {
    // Nothing to release.
  }
}
