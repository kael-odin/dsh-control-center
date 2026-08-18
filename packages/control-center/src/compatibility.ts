/** DSH package versions and exports required by the first Control Center release. */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

export const SUPPORTED_DSH_VERSION = '0.1.0-rc.7'
export const DSH_SOURCE_BASELINE = '99f6f02fecdb7dff40c3fbc9470f5907c29f74ca'

interface RequiredPackage {
  name: string
  client: boolean
}

const REQUIRED_PACKAGES: readonly RequiredPackage[] = [
  { name: '@deepseek-ai/dsh-api-remotes', client: true },
  { name: '@deepseek-ai/dsh-client-runtime', client: true },
  { name: '@deepseek-ai/dsh-client-ui-settings', client: true },
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

/** Reject a DSH installation whose resolved contract packages differ from rc.7. */
export function assertCompatibleDsh(requireFrom: NodeJS.Require = createRequire(import.meta.url)): void {
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
