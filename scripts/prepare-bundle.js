#!/usr/bin/env node
/**
 * Prepare bundle artifacts for the desktop shell:
 * - copy the newest built bundle tarball into apps/desktop/vendor as bundle.tgz
 * - stamp bundle-version.json from the tarball filename
 *
 * Location-independent: paths anchor to this file, not the caller's cwd. The
 * tarball may live in packages/bundle (a plain `pnpm pack`) or .packs (the
 * pack:check destination); the freshest one wins.
 */

import { readdirSync, readFileSync, writeFileSync, statSync, copyFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const searchDirs = [join(repoRoot, 'packages', 'bundle'), join(repoRoot, '.packs')]
const vendorDir = join(repoRoot, 'apps', 'desktop', 'vendor')

const candidates = searchDirs.flatMap((dir) => {
  let names = []
  try { names = readdirSync(dir) } catch { /* dir may not exist yet */ }
  return names
    .filter((f) => f.startsWith('dsh-control-center-bundle-') && f.endsWith('.tgz'))
    .map((f) => ({ dir, f, mtime: statSync(join(dir, f)).mtimeMs }))
}).sort((a, b) => b.mtime - a.mtime)

if (candidates.length === 0) {
  console.error(`No bundle tarball found in any of: ${searchDirs.join(', ')} — run "pnpm run pack:check" first`)
  process.exit(1)
}
const newest = candidates[0]

const match = newest.f.match(/-([0-9][^-]*)\.tgz$/)
if (match === null) {
  console.error('Cannot parse version from tarball name:', newest.f)
  process.exit(1)
}
const version = match[1]

mkdirSync(vendorDir, { recursive: true })
writeFileSync(join(vendorDir, 'bundle-version.json'), JSON.stringify({ version }))
copyFileSync(join(newest.dir, newest.f), join(vendorDir, 'bundle.tgz'))
console.log(`Prepared apps/desktop/vendor: bundle.tgz (from ${join(newest.dir, newest.f)}, version ${version})`)
