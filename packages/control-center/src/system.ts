/**
 * System & Diagnostics Host service: versions, compatibility, dependencies,
 * and environment info for the About / Dependencies / Diagnostics pages.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir, platform, release, arch } from 'node:os'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import { SUPPORTED_DSH_VERSION, DSH_SOURCE_BASELINE, profileRequire } from './compatibility.ts'

export interface SystemInfo {
  controlCenterVersion: string
  dshSupportedVersion: string
  dshSourceBaseline: string
  platform: string
  arch: string
  release: string
  nodeVersion: string
  dshHome: string
  hostname: string
}

export interface DependencyEntry {
  name: string
  version: string
  client: boolean
}

const CONTRACT_PACKAGES: ReadonlyArray<{ name: string; client: boolean }> = [
  { name: '@deepseek-ai/dsh-api-remotes', client: true },
  { name: '@deepseek-ai/dsh-client-runtime', client: true },
  { name: '@deepseek-ai/dsh-client-ui-settings', client: true },
  { name: '@deepseek-ai/dsh-client-ui-layout', client: true },
  { name: '@deepseek-ai/dsh-client-ui-slots', client: false },
  { name: '@deepseek-ai/dsh-client-modules', client: true },
  { name: '@deepseek-ai/dsh-host-apiproxy', client: true },
  { name: '@deepseek-ai/dsh-settings', client: false },
]

export class SystemService extends Service {
  static inject = ['settings'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterSystem')
  /** Profile-anchored require (same fallback chain as the compatibility gate). */
  private readonly profileRequire = profileRequire()

  constructor(ctx: Context, _config?: { logger?: Context['logger'] }) {
    super(ctx, 'controlCenterSystem')
  }

  async getInfo(): Promise<SystemInfo> {
    let controlCenterVersion = '0.1.0'
    try {
      const manifest = JSON.parse(readFileSync(join(this.packageRoot(), 'package.json'), 'utf8')) as { version?: string }
      controlCenterVersion = manifest.version ?? controlCenterVersion
    } catch {
      // Keep the default when the manifest is unreachable.
    }
    return {
      controlCenterVersion,
      dshSupportedVersion: SUPPORTED_DSH_VERSION,
      dshSourceBaseline: DSH_SOURCE_BASELINE,
      platform: platform(),
      arch: arch(),
      release: release(),
      nodeVersion: process.version,
      dshHome: resolveDshHome(),
      hostname: homedir(),
    }
  }

  async listDependencies(): Promise<DependencyEntry[]> {
    const entries: DependencyEntry[] = []
    for (const pkg of CONTRACT_PACKAGES) {
      let version = 'unresolved'
      try {
        const manifestPath = this.profileRequire.resolve(`${pkg.name}/package.json`)
        version = (JSON.parse(readFileSync(manifestPath, 'utf8')) as { version?: string }).version ?? version
      } catch {
        // Resolution failure is itself the diagnostic.
      }
      entries.push({ name: pkg.name, version, client: pkg.client })
    }
    return entries
  }

  private packageRoot(): string {
    return new URL('..', import.meta.url).pathname
  }

  [Symbol.dispose]() {
    // Nothing to release.
  }
}
