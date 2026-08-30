import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = resolve(root, 'packages/bundle')
const stage = resolve(root, '.pack-bundle')
rmSync(stage, { recursive: true, force: true })
mkdirSync(stage, { recursive: true })
for (const name of ['cordis.patch.yml', 'lib']) cpSync(resolve(source, name), resolve(stage, name), { recursive: true })
cpSync(resolve(root, 'LICENSE'), resolve(stage, 'LICENSE'))
const manifest = JSON.parse(readFileSync(resolve(source, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: unknown
  [key: string]: unknown
}
// Track the control-center version rather than pinning it: `pnpm pack` names the
// tarball after the manifest version, so a hardcoded number silently points at a
// stale (or absent) archive after every release bump.
const ccVersion = (JSON.parse(readFileSync(resolve(root, 'packages/control-center/package.json'), 'utf8')) as { version: string }).version
const ccTarball = resolve(root, `.packs/dsh-control-center-control-center-${ccVersion}.tgz`)
if (!existsSync(ccTarball)) throw new Error(`packed control-center missing: ${ccTarball}`)
const fileSpec = `file:${ccTarball.replaceAll('\\', '/')}`
manifest.dependencies = { ...manifest.dependencies, '@dsh-control-center/control-center': fileSpec }
// The dependency is declared as `workspace:*` under devDependencies upstream.
// Left in place, `pnpm pack` in the staging dir cannot resolve the workspace
// protocol (ERR_PNPM_CANNOT_RESOLVE_WORKSPACE_PROTOCOL) — the staged copy is
// outside the workspace. The runtime dep above supersedes it.
if (manifest.devDependencies?.['@dsh-control-center/control-center'] !== undefined) {
  delete manifest.devDependencies['@dsh-control-center/control-center']
  if (Object.keys(manifest.devDependencies).length === 0) delete manifest.devDependencies
}
delete manifest.scripts
writeFileSync(resolve(stage, 'package.json'), `${JSON.stringify(manifest, undefined, 2)}\n`)
