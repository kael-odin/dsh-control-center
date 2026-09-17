/**
 * One-shot migration: move every @deepseek-ai dependency from the vendored
 * DSH 0.1.2 tarball set (vendor/dsh-0.1.2, served through the local
 * verdaccio channel) to the npm-published contract line.
 *
 * Why: upstream now publishes every prerelease to npm (the 2026-08-30
 * "npm does not carry DSH prereleases" constraint no longer holds), so the
 * vendored-tarball + local-registry machinery is dead weight. This script
 * repoints the workspace at the public registry:
 *
 * - `@deepseek-ai/dsh-*`            -> 0.1.6-alpha.1 (verified present on npm;
 *                                      matches the deployed harness baseline)
 * - `@deepseek-ai/cordis*`          -> highest npm version (the fork is
 *                                      published under its own 4.x line)
 * - `@deepseek-ai/cosmokit`         -> highest npm version (1.8.x line)
 * - `@deepseek-ai/schemastery`      -> highest npm version (3.18.x line)
 *
 * The pnpm-workspace.yaml overrides block is regenerated wholesale and the
 * compatibility constants are bumped so the startup gate and the peer range
 * stay in lockstep.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const root = process.cwd()
const REGISTRY = 'https://registry.npmjs.org/'
const DSH_TARGET = '0.1.6-alpha.1'
const DSH_SOURCE_BASELINE = '0d1f50007f'

const manifests = [
  'package.json',
  'packages/control-center/package.json',
  'packages/bundle/package.json',
  'apps/desktop/package.json',
]

async function fetchJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/vnd.npm.install-v1+json, application/json' } })
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      if (i === tries - 1) throw err
      await delay(800 * (i + 1))
    }
  }
}

function highestVersion(versions) {
  const scored = Object.keys(versions).map((v) => {
    const m = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/)
    if (!m) return null
    const rel = m[4] ? [-1, m[4]] : [0]
    return { v, key: [Number(m[0] && m[1]), Number(m[2]), Number(m[3]), ...rel] }
  }).filter(Boolean)
  scored.sort((a, b) => {
    for (let i = 0; i < Math.max(a.key.length, b.key.length); i++) {
      const av = a.key[i] ?? 0
      const bv = b.key[i] ?? 0
      if (av !== bv) return av < bv ? -1 : 1
    }
    return 0
  })
  return scored.at(-1)?.v
}

async function resolveTargets() {
  const ws = readFileSync('pnpm-workspace.yaml', 'utf8')
  const block = ws.match(/^overrides:\r?\n((?:  '@deepseek-ai\/[^']+': '[^']+'\r?\n)+)/m)
  if (!block) throw new Error('overrides block not found in pnpm-workspace.yaml')
  const names = [...block[1].matchAll(/'(@deepseek-ai\/[^']+)':/g)].map((m) => m[1])
  console.log(`overrides entries: ${names.length}`)

  const targets = new Map()
  const dropped = []
  const queue = [...names]
  const workers = Array.from({ length: 12 }, async () => {
    for (;;) {
      const name = queue.shift()
      if (name === undefined) return
      const doc = await fetchJson(`${REGISTRY}${encodeURIComponent(name).replace('%40', '@')}`)
      const versions = doc?.versions ?? {}
      if (name.startsWith('@deepseek-ai/dsh')) {
        if (versions[DSH_TARGET]) {
          targets.set(name, DSH_TARGET)
        } else {
          const fallback = Object.keys(versions).filter((v) => v.startsWith('0.1.6')).sort().at(-1)
          if (!fallback) {
            // Upstream stopped publishing this package (e.g. retired demos).
            // It is only an inert single-version-graph override here — drop it.
            dropped.push(name)
            console.warn(`warn: ${name} has no 0.1.6 line on npm — dropped from overrides`)
          } else {
            console.warn(`warn: ${name} lacks ${DSH_TARGET}, falling back to ${fallback}`)
            targets.set(name, fallback)
          }
        }
      } else if (Object.keys(versions).length === 0) {
        dropped.push(name)
        console.warn(`warn: ${name} not on npm at all — dropped from overrides`)
      } else {
        targets.set(name, highestVersion(versions))
      }
    }
  })
  await Promise.all(workers)
  return { targets, dropped }
}

function rewriteManifest(rel, targets) {
  const path = join(root, rel)
  const json = readFileSync(path, 'utf8')
  const manifest = JSON.parse(json)
  let changed = 0
  for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    const deps = manifest[section]
    if (deps === undefined) continue
    for (const [name, spec] of Object.entries(deps)) {
      const target = targets.get(name)
      if (!target) continue
      if (spec.startsWith('>=') && spec.endsWith('<0.2.0-0')) {
        deps[name] = `>=${target} <0.2.0-0`
      } else if (name === '@deepseek-ai/cordis' && spec.startsWith('>=')) {
        deps[name] = `>=${target} <5`
      } else {
        deps[name] = target
      }
      changed++
    }
  }
  if (changed) writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`${rel}: ${changed} specs rewritten`)
  return changed
}

function rewriteOverrides(targets) {
  const path = join(root, 'pnpm-workspace.yaml')
  const ws = readFileSync(path, 'utf8')
  const lines = ws.split(/\r?\n/)
  const start = lines.findIndex((l) => l === 'overrides:')
  if (start === -1) throw new Error('overrides: not found')
  let end = start + 1
  while (end < lines.length && /^  '/.test(lines[end])) end++
  const sorted = [...targets.entries()].sort(([a], [b]) => (a < b ? -1 : 1))
  const block = ['overrides:', ...sorted.map(([name, v]) => `  '${name}': '${v}'`)]
  lines.splice(start, end - start, ...block)
  writeFileSync(path, lines.join('\n'))
  console.log(`pnpm-workspace.yaml overrides regenerated (${sorted.length} entries)`)
}

function rewriteCompatibility() {
  const path = join(root, 'packages/control-center/src/compatibility.ts')
  let src = readFileSync(path, 'utf8')
  src = src.replace(/export const SUPPORTED_DSH_VERSION = '[^']+'/, `export const SUPPORTED_DSH_VERSION = '${DSH_TARGET}'`)
  src = src.replace(/export const DSH_SOURCE_BASELINE = '[^']+'/, `export const DSH_SOURCE_BASELINE = '${DSH_SOURCE_BASELINE}'`)
  // Code compiles against the 0.1.6 contract, so hosts below it are rejected:
  // 0.1.6+ including later 0.1.x minors and their prereleases.
  src = src.replace(/const SUPPORTED_DSH_RANGE = \^.*$/m, "const SUPPORTED_DSH_RANGE = /^0\\.1\\.[6-9]/")
  writeFileSync(path, src)
  console.log('compatibility.ts constants bumped')
}

function rewriteNpmrc() {
  const path = join(root, '.npmrc')
  const src = readFileSync(path, 'utf8')
  writeFileSync(path, src.replace(/registry=.*/g, `registry=${REGISTRY}`))
  console.log('.npmrc -> public registry')
}

const { targets } = await resolveTargets()
let total = 0
for (const rel of manifests) total += rewriteManifest(rel, targets)
if (total === 0) throw new Error('no specs rewritten — aborting')
rewriteOverrides(targets)
rewriteCompatibility()
rewriteNpmrc()
console.log('done')
