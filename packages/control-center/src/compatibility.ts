/** DSH package versions and exports required by the first Control Center release. */
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'

export const SUPPORTED_DSH_VERSION = '0.1.2'
export const DSH_SOURCE_BASELINE = 'cd5ef81481'

/**
 * PLUGINIZATION §1.2: the supported DSH version window rather than one pinned
 * string. Any 0.1.x release (including later rcs) satisfies the contract
 * check; a new minor triggers a deliberate compatibility review before the
 * window widens. Keep this in lockstep with the peerDependencies range.
 */
const SUPPORTED_DSH_RANGE = /^0\.1\.\d+/

/** Whether a resolved DSH package version falls inside the support window. */
export function isSupportedDshVersion(version: string): boolean {
  return SUPPORTED_DSH_RANGE.test(version)
}

interface RequiredPackage {
  name: string
  client: boolean
}

const REQUIRED_PACKAGES: readonly RequiredPackage[] = [
  { name: '@deepseek-ai/dsh-api-remotes', client: true },
  // Platform seed since 0.1.2 (dsh-client-runtime was removed upstream).
  { name: '@deepseek-ai/dsh-client-store', client: false },
  { name: '@deepseek-ai/dsh-client-ui-settings', client: true },
  { name: '@deepseek-ai/dsh-client-ui-layout', client: true },
  { name: '@deepseek-ai/dsh-client-ui-slots', client: false },
  { name: '@deepseek-ai/dsh-client-modules', client: true },
  // Host-side session remote (apiProxy was removed upstream in 0.1.2).
  { name: '@deepseek-ai/dsh-api-session-controller', client: false },
  { name: '@deepseek-ai/dsh-agent-presets', client: false },
  { name: '@deepseek-ai/dsh-settings', client: false },
]

/**
 * Host-executed framework package. The host registers settings namespaces and
 * runs services against this package, so it must always resolve from the
 * profile's module graph. Every other required package is a client contract
 * package that a bundled deployment inlines into the client bundle, so its
 * absence from the host graph is expected there — it is verified only when
 * present.
 */
const HOST_CONTRACT = '@deepseek-ai/dsh-settings'

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

/** Candidate roots for the DSH contract, best first. */
function contractRoots(): NodeJS.Require[] {
  const roots: NodeJS.Require[] = [createRequire(import.meta.url)]
  try {
    roots.push(createRequire(join(resolveDshHome(), 'profiles', 'node_modules', 'package.json')))
  } catch {
    // No shared fallback home; the plugin's own root is the only candidate.
  }
  return roots
}

/**
 * Resolve DSH contract packages from the profile dependency root.
 *
 * Prefers a root that can resolve the host framework contract (dsh-settings).
 * The linked-repo dev layout breaks resolution from the plugin's own
 * node_modules: pnpm `link:` resolves from the link target's real path, so the
 * plugin cannot see the profile's node_modules. The framework's flat module
 * fallback (`$DSH_HOME/profiles/node_modules`) symlinks every DSH package and
 * is the shared dependency root for all plugins.
 */
export function profileRequire(): NodeJS.Require {
  const roots = contractRoots()
  for (const root of roots) {
    if (resolveManifest(root, HOST_CONTRACT) !== undefined) return root
  }
  // contractRoots always pushes the plugin's own root first.
  return roots[0]!
}

/**
 * Reject a DSH installation whose resolved contract packages differ from
 * 0.1.1-rc.2.
 *
 * Each package resolves independently, best root first. The host framework
 * contract must always resolve; client contract packages that a bundled
 * deployment inlines into the client bundle are verified only when they are on
 * the host's module graph.
 */
export function assertCompatibleDsh(requireFrom: NodeJS.Require = profileRequire()): void {
  const roots = [requireFrom, ...contractRoots()].filter((root, index, all) => all.indexOf(root) === index)
  const problems: string[] = []
  for (const required of REQUIRED_PACKAGES) {
    let manifestPath: string | undefined
    for (const root of roots) {
      manifestPath = resolveManifest(root, required.name)
      if (manifestPath !== undefined) break
    }
    if (manifestPath === undefined) {
      if (required.name === HOST_CONTRACT) {
        throw new Error(
          `DSH Control Center requires ${HOST_CONTRACT}@${SUPPORTED_DSH_VERSION}, but its package manifest cannot be resolved. `
          + 'Remove the Control Center bundle or install the supported DSH release.',
        )
      }
      continue
    }
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as PackageManifest
    if (manifest.name !== required.name
      || typeof manifest.version !== 'string'
      || !isSupportedDshVersion(manifest.version)) {
      problems.push(
        `DSH Control Center is incompatible with ${required.name}: expected a version in the `
        + `${SUPPORTED_DSH_VERSION} window (0.1.x), resolved ${String(manifest.version)}. `
        + `Supported DSH source baseline: ${DSH_SOURCE_BASELINE}.`,
      )
      continue
    }
    if (typeof manifest.exports !== 'object' || manifest.exports['./package.json'] === undefined) {
      problems.push(`${required.name}@${SUPPORTED_DSH_VERSION} does not expose ./package.json as required`)
      continue
    }
    if (required.client && manifest.exports['./client'] === undefined) {
      problems.push(`${required.name}@${SUPPORTED_DSH_VERSION} does not expose ./client as required`)
    }
  }
  if (problems.length > 0) throw new Error(problems.join(' '))
}
