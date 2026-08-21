/** DSH package versions and exports required by the first Control Center release. */
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'

export const SUPPORTED_DSH_VERSION = '0.1.0-rc.8'
export const DSH_SOURCE_BASELINE = '141eb6fef83422698aef7a981029e843e8161534'

interface RequiredPackage {
  name: string
  client: boolean
}

const REQUIRED_PACKAGES: readonly RequiredPackage[] = [
  { name: '@deepseek-ai/dsh-api-remotes', client: true },
  { name: '@deepseek-ai/dsh-client-runtime', client: true },
  { name: '@deepseek-ai/dsh-client-ui-settings', client: true },
  { name: '@deepseek-ai/dsh-client-ui-layout', client: true },
  { name: '@deepseek-ai/dsh-client-ui-slots', client: false },
  { name: '@deepseek-ai/dsh-client-modules', client: true },
  { name: '@deepseek-ai/dsh-host-apiproxy', client: true },
  { name: '@deepseek-ai/dsh-settings', client: false },
]

interface PackageManifest {
  name?: unknown
  version?: unknown
  exports?: Record<string, unknown>
}

function resolveManifest(requireFrom: NodeJS.Require, name: string): string | undefined {
  try {
    return requireFrom.resolve(`${name}/package.json`)
  } catch {
    return undefined
  }
}

/**
 * Resolve DSH contract packages from the profile dependency root.
 *
 * When the bundle is installed into a profile, the plugin resolves DSH
 * packages from its own node_modules. The linked-repo dev layout breaks that:
 * pnpm `link:` resolves from the link target's real path, so the plugin
 * cannot see the profile's node_modules. Fall back to the framework's flat
 * module fallback (`$DSH_HOME/profiles/node_modules`), which symlinks every
 * DSH package and is the shared dependency root for all plugins.
 */
export function profileRequire(): NodeJS.Require {
  const own = createRequire(import.meta.url)
  if (REQUIRED_PACKAGES.every((required) => resolveManifest(own, required.name) !== undefined)) return own
  try {
    const fallback = createRequire(join(resolveDshHome(), 'profiles', 'node_modules', 'package.json'))
    if (REQUIRED_PACKAGES.every((required) => resolveManifest(fallback, required.name) !== undefined)) return fallback
  } catch {
    // No fallback home; fall through to the strict per-package check below.
  }
  return own
}

/** Reject a DSH installation whose resolved contract packages differ from rc.7. */
export function assertCompatibleDsh(requireFrom: NodeJS.Require = profileRequire()): void {
  for (const required of REQUIRED_PACKAGES) {
    let manifestPath: string
    try {
      manifestPath = requireFrom.resolve(`${required.name}/package.json`)
    } catch (cause) {
      throw new Error(
        `DSH Control Center requires ${required.name}@${SUPPORTED_DSH_VERSION}, but its package manifest cannot be resolved. `
        + 'Remove the Control Center bundle or install the supported DSH release.',
        { cause },
      )
    }
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as PackageManifest
    if (manifest.name !== required.name || manifest.version !== SUPPORTED_DSH_VERSION) {
      throw new Error(
        `DSH Control Center is incompatible with ${required.name}: expected ${SUPPORTED_DSH_VERSION}, `
        + `resolved ${String(manifest.version)}. Supported DSH source baseline: ${DSH_SOURCE_BASELINE}.`,
      )
    }
    if (typeof manifest.exports !== 'object' || manifest.exports['./package.json'] === undefined) {
      throw new Error(`${required.name}@${SUPPORTED_DSH_VERSION} does not expose ./package.json as required`)
    }
    if (required.client && manifest.exports['./client'] === undefined) {
      throw new Error(`${required.name}@${SUPPORTED_DSH_VERSION} does not expose ./client as required`)
    }
  }
}
