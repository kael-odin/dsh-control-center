/**
 * One-shot migration: point every @deepseek-ai dependency at the vendored
 * DSH 0.1.2 tarball set in vendor/dsh-0.1.2 (built from deepseek-harness
 * commit cd5ef814, see vendor/dsh-0.1.2/MANIFEST.md).
 *
 * - Tarball names map back to package names (`deepseek-ai-dsh-llm-0.1.2.tgz`
 *   -> `@deepseek-ai/dsh-llm`; `deepseek-ai-cordis-0.1.2.tgz` ->
 *   `@deepseek-ai/cordis`).
 * - Any spec that referenced the old rc.2 line, npm cordis 4.0.1, or npm
 *   schemastery 3.18.1 is rewritten to the `file:` spec so the whole
 *   workspace resolves one single-version graph.
 * - The pnpm-workspace.yaml overrides block is regenerated wholesale.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const vendorDir = join(root, 'vendor', 'dsh-0.1.2')

// Registry naming convention for scoped packages: `@scope/name` packs as
// `scope-name-version.tgz`. Every harness package name is `@deepseek-ai/<pkg>`
// with single-token <pkg>, so the mapping is unambiguous.
const specOf = new Map()
for (const file of readdirSync(vendorDir).filter(f => f.endsWith('.tgz'))) {
  const stem = file.replace(/\.tgz$/, '').replace(/-0\.1\.2$/, '')
  const pkg = stem.replace(/^deepseek-ai-/, '')
  specOf.set(`@deepseek-ai/${pkg}`, `file:${relative(root, join(vendorDir, file)).replaceAll('\\', '/')}`)
}

const OLD_SPECS = new Set([
  '0.1.1-rc.2',
  '>=0.1.1-rc.2 <0.2.0-0',
  '4.0.1', // @deepseek-ai/cordis (npm baseline, same content as the vendor tarball)
  '3.18.1', // @deepseek-ai/schemastery (npm baseline)
  '^0.1.1-rc.2',
])

let touched = 0
const packageFiles = ['package.json', 'packages/control-center/package.json', 'packages/bundle/package.json', 'apps/desktop/package.json']
for (const rel of packageFiles) {
  const path = join(root, rel)
  let json = readFileSync(path, 'utf8')
  const manifest = JSON.parse(json)
  let changed = false
  for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    const deps = manifest[section]
    if (deps === undefined) continue
    for (const [name, spec] of Object.entries(deps)) {
      if (specOf.has(name) && OLD_SPECS.has(spec)) {
        deps[name] = specOf.get(name)
        changed = true
      } else if (specOf.has(name) && (spec === '0.1.2' || spec.startsWith('workspace:'))) {
        deps[name] = specOf.get(name)
        changed = true
      }
    }
  }
  // Root migration: the removed host-apiproxy contract is replaced by the
  // session controller, and agent presets becomes a direct dev dependency.
  if (rel === 'package.json') {
    const dev = manifest.devDependencies
    if (dev['@deepseek-ai/dsh-host-apiproxy'] !== undefined) {
      delete dev['@deepseek-ai/dsh-host-apiproxy']
      dev['@deepseek-ai/dsh-api-session-controller'] = specOf.get('@deepseek-ai/dsh-api-session-controller')
      dev['@deepseek-ai/dsh-agent-presets'] = specOf.get('@deepseek-ai/dsh-agent-presets')
      changed = true
    }
  }
  if (changed) {
    writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n')
    touched++
    console.log(`updated ${rel}`)
  }
}

// pnpm-workspace.yaml: regenerate the overrides block from the tarball set and
// refresh the minimumReleaseAgeExclude versions.
const wsPath = join(root, 'pnpm-workspace.yaml')
const ws = readFileSync(wsPath, 'utf8')
const overrideLines = [...specOf.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, spec]) => `  '${name}': '${spec}'`)
const overridesBlock = `overrides:\n${overrideLines.join('\n')}\n`
const wsLines = ws.split('\n')
const start = wsLines.findIndex(line => line === 'overrides:')
if (start === -1) throw new Error('overrides block not found in pnpm-workspace.yaml')
let end = start + 1
while (end < wsLines.length && (wsLines[end] ?? '').startsWith('  ')) end++
wsLines.splice(start, end - start, ...overridesBlock.split('\n').slice(0, -1))
let wsOut = wsLines.join('\n').replaceAll('0.1.1-rc.2', '0.1.2')
writeFileSync(wsPath, wsOut)
touched++
console.log(`updated pnpm-workspace.yaml (${overrideLines.length} overrides)`)
console.log(`done: ${touched} files`)
