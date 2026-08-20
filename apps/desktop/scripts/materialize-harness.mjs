/**
 * Materialize a DSH harness checkout into a self-contained deploy tree.
 *
 * ⚠ STATUS (2026-08): FIRST ATTEMPT — a plain recursive `fs.cpSync(..., {dereference:true})`
 * fails with ELOOP on the harness's circular pnpm store symlinks (e.g.
 * cordis ↔ cordis-plugin-include form a symlink cycle). A correct materializer
 * must be cycle-aware (see deepseek-harness-desktop's scripts/materialize3.js),
 * and the fully-materialized tree is hundreds of MB. This file is a starting
 * point / record, not a finished release pipeline.
 *
 * Usage:
 *   node scripts/materialize-harness.mjs <srcHarnessSubdir> <outDir>
 */
import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const src = resolve(process.argv[2])
const out = resolve(process.argv[3])

/** Paths relative to the harness root that must not be copied into the deploy tree. */
const EXCLUDES = new Set([
  '.git', '.dsh', 'node_modules/.cache', 'logs', 'sessions', 'storages',
  '.test-home', 'tests', '__tests__', '*.tsbuildinfo', '.pnpm-store',
])

if (!src || !out || src === out) {
  console.error('usage: node scripts/materialize-harness.mjs <srcHarness> <outDir>')
  process.exit(1)
}

console.log(`materialize: ${src} -> ${out}`)
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

const started = Date.now()
cpSync(src, out, {
  recursive: true,
  dereference: true,
  force: true,
  errorOnExist: false,
  filter: (entry) => {
    const rel = entry.slice(src.length).replace(/\\/g, '/').replace(/^\//, '')
    const seg = rel.split('/')
    if (EXCLUDES.has(seg[0]) || seg.some(s => EXCLUDES.has(s))) return false
    return true
  },
})

console.log(`materialize done in ${((Date.now() - started) / 1000).toFixed(1)}s -> ${out}`)
