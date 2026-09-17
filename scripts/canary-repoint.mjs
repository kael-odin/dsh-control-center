#!/usr/bin/env node
/**
 * Canary repoint: rewrite every @deepseek-ai pin in the workspace from the
 * currently pinned contract version to `--to <version>` so a throwaway
 * typecheck (CI contract-canary) can compile against the newest published
 * line. Throws when the current pin cannot be found anywhere, so a drift in
 * the version scheme fails loudly instead of silently canarying nothing.
 *
 * Usage: node scripts/canary-repoint.mjs --to 0.1.6-alpha.2
 * Run from the repository root. Never commit the rewritten files.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const to = process.argv[2]
if (to === undefined || to === '') {
  console.error('usage: node scripts/canary-repoint.mjs <version>')
  process.exit(1)
}

const FILES = [
  'package.json',
  'packages/control-center/package.json',
  'packages/bundle/package.json',
  'apps/desktop/package.json',
  'pnpm-workspace.yaml',
]

// Discover the pinned version from the compatibility module (the source of
// truth) so the repoint tracks the baseline automatically.
const compat = readFileSync('packages/control-center/src/compatibility.ts', 'utf8')
const pinned = /export const SUPPORTED_DSH_VERSION = '([^']+)'/.exec(compat)?.[1]
if (pinned === undefined) throw new Error('SUPPORTED_DSH_VERSION not found')

let touched = 0
for (const file of FILES) {
  const original = readFileSync(file, 'utf8')
  const updated = original.split(pinned).join(to)
  if (updated !== original) {
    writeFileSync(file, updated)
    touched += 1
  }
}
if (touched === 0) throw new Error(`no file referenced the pinned version ${pinned} — version scheme drift?`)
console.log(`canary repoint: ${touched} file(s) moved from ${pinned} to ${to}`)
