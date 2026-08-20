/**
 * Materialize a DSH harness dependency node_modules tree into a self-contained
 * deploy tree — cycle-aware.
 *
 * v2 (2026-08): DFS that
 *   - copies real directories/entries at depth,
 *   - dereferences symlinks/junctions by realpath,
 *   - re-uses already-materialized realpaths by a *relative* symlink inside the
 *     materialized tree (so pnpm's circular peer links like
 *     `cordis ↔ cordis-plugin-include` cannot ELOOP: the second visit finds the
 *     first copy and links to it), and
 *   - keeps a realpath stack to break genuine directory cycles.
 * Output is fully real files + intra-tree relative links; it no longer depends
 * on the source checkout's node_modules links.
 *
 * ⚠ STATUS (2026-08): v2 materializes the whole harness tree without ELOOP and
 * with no dangling links (tests/materialize-smoke.mjs PASS), but a self-contained
 * boot of the materialized tree FAILS: flattening `.pnpm/<pkg>@v/node_modules/`
 * into `@link-*` copies breaks pnpm resolution — e.g. tsx's runtime `cannot find
 * package 'esbuild'` because the sibling `.pnpm/tsx@v/node_modules/esbuild` is
 * absent next to the flattened tsx copy.
 * → v3 direction: materialize each `.pnpm/<pkg>@<ver>/node_modules/` directory AS
 *   A UNIT (preserving its direct-dependency links as siblings) so Node's walk-up
 *   resolution works. Open, larger release-architecture item; the tree is hundreds
 *   of MB.
 *
 * Usage:
 *   node scripts/materialize-harness.mjs <srcHarnessSubdir> <outDir>
 */
import { mkdirSync, rmSync, copyFileSync, lstatSync, realpathSync, statSync, readdirSync, symlinkSync, readlinkSync, unlinkSync } from 'node:fs'
import { resolve, join, relative, dirname, basename } from 'node:path'

const src = resolve(process.argv[2])
const out = resolve(process.argv[3])

if (!src || !out || src === out) {
  console.error('usage: node scripts/materialize-harness.mjs <src> <out>')
  process.exit(1)
}

const norm = (p) => realpathSync(p).replace(/\\/g, '/').toLowerCase()
/** realpath → materialized path (for re-linking already-copied targets). */
const copied = new Map()
let stats = { dirs: 0, files: 0, links: 0 }

/** Symlink `dest` (relative) to the already-materialized target path. */
function linkTo(dest, materializedTarget) {
  mkdirSync(dirname(dest), { recursive: true })
  const rel = relative(dirname(dest), materializedTarget).replace(/\\/g, '/')
  try { symlinkSync(rel, dest, 'junction') } catch {
    // junction may need absolute on Windows; fall back to a relative dir junction.
    symlinkSync(rel, dest, 'dir')
  }
  stats.links += 1
}

function materializeDir(s, d, realStack) {
  mkdirSync(d, { recursive: true })
  const real = norm(s)
  if (realStack.includes(real)) return
  stats.dirs += 1
  for (const entry of readdirSync(s)) {
    const ss = join(s, entry)
    const sd = join(d, entry)
    let st
    try { st = lstatSync(ss) } catch { continue }
    if (st.isSymbolicLink()) {
      let target
      try { target = realpathSync(ss) } catch { continue }
      const tKey = norm(target)
      const existing = copied.get(tKey)
      let ts
      try { ts = statSync(target) } catch { continue }
      if (ts.isFile()) {
        if (existing) { linkTo(sd, existing) } else {
          copyFileSync(target, sd); copied.set(tKey, sd); stats.files += 1
        }
        continue
      }
      // directory target
      if (existing) { linkTo(sd, existing); continue }
      copied.set(tKey, resolve(out, `@link-${stats.dirs}-${basename(target)}`))
      linkTo(sd, copied.get(tKey))
      materializeDir(target, copied.get(tKey), [...realStack, real])
      continue
    }
    if (st.isFile()) {
      copyFileSync(ss, sd); stats.files += 1; continue
    }
    if (st.isDirectory()) {
      materializeDir(ss, sd, [...realStack, real])
    } else if (st.isSymbolicLink()) {
      // handled above; fallthrough
    }
  }
}

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
const t0 = Date.now()
materializeDir(src, out, [])
console.log(`materialize done in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${out}`)
console.log(`stats: dirs=${stats.dirs} files=${stats.files} links=${stats.links}`)
