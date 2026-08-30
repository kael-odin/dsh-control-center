/**
 * Resolve packed tarballs by prefix instead of by pinned version.
 *
 * `pnpm pack` names archives after the manifest version, so every release bump
 * used to strand the probes and E2E suites on a stale `-0.1.0.tgz` path (or on
 * nothing at all). Globbing the prefix keeps them following the current build.
 */
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const PACKS = resolve(import.meta.dirname, '..', '.packs')

function resolveByPrefix(prefix: string): string {
  if (!existsSync(PACKS)) throw new Error(`.packs not found — run "pnpm run pack:check" first (${PACKS})`)
  const matches = readdirSync(PACKS).filter(name => name.startsWith(prefix) && name.endsWith('.tgz'))
  if (matches.length === 0) throw new Error(`no ${prefix}*.tgz in ${PACKS} — run "pnpm run pack:check" first`)
  // Newest by mtime, not by name: `.packs` accumulates archives across release
  // bumps, and a lexical sort would rank 0.9.0 above 0.10.0. The freshest file
  // is by definition the one the current build just produced.
  return join(PACKS, matches.reduce((newest, name) =>
    statSync(join(PACKS, name)).mtimeMs > statSync(join(PACKS, newest)).mtimeMs ? name : newest))
}

/** Packed DSH web-profile bundle (the artifact hosts install). */
export function bundlePack(): string {
  return resolveByPrefix('dsh-control-center-bundle-')
}

/** Packed control-center library. */
export function controlCenterPack(): string {
  return resolveByPrefix('dsh-control-center-control-center-')
}
