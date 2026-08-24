/**
 * System & Diagnostics Host service: versions, compatibility, dependencies,
 * and environment info for the About / Dependencies / Diagnostics pages.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir, platform, release, arch } from 'node:os'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import type { EnvCheckEntry, PluginInventory, PluginOperation, PluginOperationResult } from './system-types.ts'

function resolveProfileDir(profile: string): string {
  if (!/^[A-Za-z0-9._-]+$/.test(profile) || profile === '.' || profile === '..') throw new Error('invalid profile name')
  return join(resolveDshHome(), 'profiles', profile)
}

function readProfileManifest(profileDir: string): { dependencies?: Record<string, string>; dsh?: { profile?: { bundles?: string[] } } } {
  return JSON.parse(readFileSync(join(profileDir, 'package.json'), 'utf8')) as { dependencies?: Record<string, string>; dsh?: { profile?: { bundles?: string[] } } }
}

function isResolvedDependency(profileDir: string, name: string): boolean {
  try { const resolver = createRequire(join(profileDir, 'package.json')); resolver.resolve(`${name}/package.json`); return true } catch { try { createRequire(join(profileDir, 'package.json')).resolve(name); return true } catch { return false } }
}

function ensureProfile(profile: string, profileDir: string): void {
  if (existsSync(join(profileDir, 'package.json'))) return
  mkdirSync(profileDir, { recursive: true })
  writeFileSync(join(profileDir, 'package.json'), JSON.stringify({ name: `dsh-profile-${profile}`, private: true, dependencies: {}, dsh: { profile: { bundles: ['@deepseek-ai/dsh-base'] } } }, null, 2) + '\n')
  writeFileSync(join(profileDir, 'cordis.patch.yml'), '# DSH profile patch layer\n[]\n')
  writeFileSync(join(profileDir, 'pnpm-workspace.yaml'), 'packages:\n  - .\n\nnodeLinker: hoisted\nautoInstallPeers: false\n')
}
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

  async checkDependencies(): Promise<EnvCheckEntry[]> {
    const entries: EnvCheckEntry[] = []
    const whichCmd = platform() === 'win32' ? 'where' : 'which'
    const toolSpecs: Array<{ name: string; probe: string[]; hint?: string }> = [
      { name: 'ffmpeg', probe: ['-version'], hint: '音频/视频处理、媒体消息' },
      { name: 'tesseract', probe: ['--version'], hint: '本地 OCR（图片转文字）' },
      { name: 'git', probe: ['--version'], hint: '仓库操作' },
    ]
    for (const spec of toolSpecs) {
      try {
        const found = spawnSync(whichCmd, [spec.name], { encoding: 'utf8', timeout: 5_000 })
        if (found.status === 0) {
          const versionProbe = spawnSync(spec.name, spec.probe, { encoding: 'utf8', timeout: 5_000 })
          const version = versionProbe.status === 0
            ? (versionProbe.stdout ?? '').split('\n')[0]?.trim() || undefined
            : undefined
          entries.push({ name: spec.name, present: true, version, hint: spec.hint })
        } else {
          entries.push({ name: spec.name, present: false, hint: spec.hint })
        }
      } catch {
        entries.push({ name: spec.name, present: false, hint: spec.hint })
      }
    }
    return entries
  }

  async listPlugins(profile: string): Promise<PluginInventory> {
    const profileDir = resolveProfileDir(profile)
    if (!existsSync(join(profileDir, 'package.json'))) {
      return { profile, profileDir, dependencies: [], bundles: [], restartRequired: false, unsupported: ['profile-not-initialized'] }
    }
    const manifest = readProfileManifest(profileDir)
    const dependencies = Object.entries(manifest.dependencies ?? {}).map(([name, spec]) => ({
      name, spec: String(spec), bundle: (manifest.dsh?.profile?.bundles ?? []).includes(name), active: isResolvedDependency(profileDir, name),
    }))
    return {
      profile, profileDir, dependencies,
      bundles: [...(manifest.dsh?.profile?.bundles ?? [])],
      restartRequired: true,
      unsupported: ['hot-enable', 'hot-disable', 'rollback', 'restore'],
    }
  }

  async managePlugin(profile: string, operation: PluginOperation, spec: string): Promise<PluginOperationResult> {
    if (!['add', 'remove', 'update'].includes(operation)) throw new Error(`unsupported plugin operation: ${operation}`)
    if (spec.trim() === '' || /[\r\n]/.test(spec) || spec.trim().startsWith('-')) throw new Error('plugin spec is invalid')
    const profileDir = resolveProfileDir(profile)
    ensureProfile(profile, profileDir)
    const harnessDir = this.dshHarnessDir()
    const cliEntry = join(harnessDir, 'apps', 'cli', 'src', 'bin.ts')
    if (!existsSync(cliEntry)) throw new Error(`DSH harness CLI is unavailable: ${cliEntry}`)
    const args = ['plugin', '--profile', profile, operation, spec]
    const result = spawnSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', ['exec', 'tsx', cliEntry, ...args], { cwd: harnessDir, encoding: 'utf8', shell: false })
    const exitCode = result.status ?? 1
    const inventory = await this.listPlugins(profile)
    return { profile, operation, spec, exitCode, stdout: result.stdout ?? '', stderr: result.stderr ?? '', inventory }
  }

  private dshHarnessDir(): string {
    const configured = process.env.DSH_HARNESS_DIR
    if (configured !== undefined && configured.trim() !== '') return configured
    throw new Error('DSH_HARNESS_DIR is not configured; set it to the official deepseek-harness checkout')
  }

  private packageRoot(): string {
    return new URL('..', import.meta.url).pathname
  }

  [Symbol.dispose]() {
    // Nothing to release.
  }
}
