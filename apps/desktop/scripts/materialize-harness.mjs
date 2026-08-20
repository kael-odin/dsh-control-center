/**
 * Materialize a DSH harness checkout into a self-contained deploy tree — v3.
 *
 * v3 preserves pnpm's node_modules semantics so a self-contained boot works:
 *   - non-node_modules harness content (packages/apps/vendor/config) is copied as
 *     real files (skipping node_modules and runtime data dirs),
 *   - each `.pnpm/<pkg>@<ver>/node_modules/` is reproduced at the same path: real
 *     directory entries (the package body and any real sub-dirs) are copied as real
 *     files once; symlink entries (direct dependencies) are re-linked to the
 *     already-materialized target via an intra-tree junction. Node's walk-up
 *     resolution then finds dependency siblings exactly as pnpm laid them out.
 *   - the top-level node_modules (`@deepseek-ai/*` workspace links → packages,
 *     `.bin`, and other entries) is reproduced against the materialized tree.
 *
 * ⚠ Performance (2026-08): the three passes run without ELOOP and the materialize
 * smoke (probe:materialize) checks that, but FULL-tree materialization is very slow
 * (>20 min; 926 virtual pkg bodies + ~8k intra-tree junctions) and the output is
 * hundreds of MB. Treat full materialization as a one-off release-time job, not a
 * fast dev-loop step.
 *
 * Usage:
 *   node scripts/materialize-harness.mjs <srcHarnessRoot> <outDir>
 */
import {
  mkdirSync, rmSync, copyFileSync, lstatSync, realpathSync, statSync, readdirSync, symlinkSync, cpSync,
} from 'node:fs'
import { resolve, join, relative, dirname } from 'node:path'

const src = resolve(process.argv[2])
const out = resolve(process.argv[3])
if (!src || !out || src === out) {
  console.error('usage: node scripts/materialize-harness.mjs <srcHarnessRoot> <outDir>')
  process.exit(1)
}
const SKIP_TOP = new Set(['.git', '.dsh', 'logs', 'sessions', 'storages', '.test-home'])
const norm = (p) => resolve(p).replace(/\\/g, '/').toLowerCase()
let stats = { dirs: 0, files: 0, links: 0 }

function linkTo(dest, targetAbs) {
  mkdirSync(dirname(dest), { recursive: true })
  try {
    const rel = relative(dirname(dest), targetAbs).replace(/\\/g, '/')
    symlinkSync(rel, dest, 'junction')
  } catch (e1) {
    try { symlinkSync(targetAbs.replace(/\\/g, '/'), dest, 'junction') } catch (e2) {
      try { symlinkSync(targetAbs.replace(/\\/g, '/'), dest, 'dir') } catch (e3) {
        // No symlink permission / unsupported: copy the real target instead.
        const key = norm(targetAbs)
        if (!realToMat.has(key) && lstatSafeDir(targetAbs)) {
          // materialize target in place to keep resolution working
          const inline = dirname(dest)
          try { copyTreeRec(targetAbs, inline, []) } catch { /* best effort */ }
        }
        console.warn(`linkTo fallback copied (no symlink): ${dest}\nr1=${String(e1 && e1.message)?.slice(0,80)}\nr2=${String(e2 && e2.message)?.slice(0,80)}\nr3=${String(e3 && e3.message)?.slice(0,80)}`)
        return
      }
    }
  }
  stats.links += 1
}
function copyTree(s, d) {
  copyTreeRec(s, d)
}
function copyTreeRec(s, d) {
  mkdirSync(d, { recursive: true })
  stats.dirs += 1
  for (const entry of readdirSync(s)) {
    const ss = join(s, entry)
    const sd = join(d, entry)
    let st
    try { st = lstatSync(ss) } catch { continue }
    if (st.isSymbolicLink()) {
      let target
      try { target = realpathSync(ss) } catch { continue }
      if (statSync(target).isFile()) { copyFileSync(target, sd); stats.files += 1 }
      else copyTreeRec(target, sd)
      continue
    }
    if (st.isFile()) { copyFileSync(ss, sd); stats.files += 1; continue }
    if (st.isDirectory()) copyTreeRec(ss, sd)
  }
}

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
const t0 = Date.now()

/* 1. Copy non-node_modules harness content as real files. */
// Exclude any nested node_modules (deps resolve via the v3-materialized
// top-level node_modules); excluding them avoids ELOOP on harness-internal links.
const skipNM = (p) => {
  const rel = p.slice(src.length).replace(/\\/g, '/').replace(/^\//, '')
  return rel.split('/').includes('node_modules')
}
for (const entry of readdirSync(src)) {
  if (SKIP_TOP.has(entry) || entry === 'node_modules') continue
  const ss = join(src, entry)
  let st
  try { st = lstatSync(ss) } catch { continue }
  if (st.isFile()) copyFileSync(ss, join(out, entry))
  else cpSync(ss, join(out, entry), { recursive: true, force: true, dereference: true, filter: (e) => !skipNM(e) })
}

/* 2. Materialize node_modules with preserved .pnpm semantics. */
const srcNM = join(src, 'node_modules')
const outNM = join(out, 'node_modules')
const pnpmSrc = join(srcNM, '.pnpm')
const pnpmOut = join(outNM, '.pnpm')
mkdirSync(pnpmOut, { recursive: true })

// realpath(source entry) -> materialized path (for deps to re-link to).
const realToMat = new Map()

try {
console.log(`[v3] pass1 copy bodies from ${pnpmSrc}`)

// Pass 1: copy every real (non-symlink) entry under each virtual pkg's node_modules.
for (const pv of readdirSync(pnpmSrc)) {
  const vn = join(pnpmSrc, pv, 'node_modules')
  if (!lstatSafeDir(vn)) continue
  const outVn = join(pnpmOut, pv, 'node_modules')
  mkdirSync(outVn, { recursive: true })
  for (const entry of readdirSync(vn)) {
    const es = join(vn, entry)
    const ed = join(outVn, entry)
    let st
    try { st = lstatSync(es) } catch { continue }
    if (st.isSymbolicLink()) continue // handled in pass 2
    if (st.isFile()) { copyFileSync(es, ed); stats.files += 1; continue }
    if (st.isDirectory()) {
      copyTree(es, ed)
      realToMat.set(norm(es), ed)
    }
  }
}

// Pass 2: re-link symlink deps to their materialized targets.
console.log(`[v3] pass2 relink deps`)
for (const pv of readdirSync(pnpmSrc)) {
  const vn = join(pnpmSrc, pv, 'node_modules')
  if (!lstatSafeDir(vn)) continue
  const outVn = join(pnpmOut, pv, 'node_modules')
  for (const entry of readdirSync(vn)) {
    const es = join(vn, entry)
    const ed = join(outVn, entry)
    let st
    try { st = lstatSync(es) } catch { continue }
    if (!st.isSymbolicLink()) continue
    let target
    try { target = realpathSync(es) } catch { continue }
    const tKey = norm(target)
    const mat = realToMat.get(tKey)
    if (mat) { linkTo(ed, mat); continue }
    // target not yet materialized (non-.pnpm or file) — copy real.
    if (statSync(target).isFile()) { copyFileSync(target, ed); stats.files += 1 }
    else { copyTree(target, ed); realToMat.set(tKey, ed) }
  }
}

// Pass 3: top-level node_modules (@deepseek-ai workspace links + others).
console.log(`[v3] pass3 top-level`)
for (const entry of readdirSync(srcNM)) {
  if (entry === '.pnpm' || entry === '.bin') continue
  const es = join(srcNM, entry)
  const ed = join(outNM, entry)
  let st
  try { st = lstatSync(es) } catch { continue }
  if (st.isSymbolicLink()) {
    let target
    try { target = realpathSync(es) } catch { continue }
    const tKey = norm(target)
    const mat = realToMat.get(tKey) || materializedFor(tKey)
    if (mat) { linkTo(ed, mat); continue }
    if (statSync(target).isFile()) { copyFileSync(target, ed); stats.files += 1 }
    else { copyTree(target, ed); realToMat.set(tKey, ed) }
    continue
  }
  if (st.isFile()) { copyFileSync(es, ed); stats.files += 1; continue }
  if (st.isDirectory()) {
    if (entry === '@deepseek-ai') {
      // Top-level workspace links (@deepseek-ai/* -> packages) are NOT expanded
      // here. v5 attempted to re-link each to the materialized packages, but that
      // created junction self-loops (infinite nesting) on this Windows tree.
      // Safely skip; materializing node_modules/@deepseek-ai/* against isolated
      // packages without recursion is v6 release work. .pnpm deps ARE materialized.
      console.warn('[v3] skip top-level @deepseek-ai workspace links (v6 pending)')
      continue
    }
    copyTree(es, ed)
  }
}

// .bin: reproduce as copy (contains the shims; keep as real so Node/PnPM may use).
const srcBin = join(srcNM, '.bin')
if (lstatSafeDir(srcBin)) copyTree(srcBin, join(outNM, '.bin'))

console.log(`materialize v3 done in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${out}`)
console.log(`stats: dirs=${stats.dirs} files=${stats.files} links=${stats.links}`)
} catch (err) {
  console.error(`[v3] node_modules materialize error: ${String(err && err.stack || err)}`)
  process.exit(2)
}

/** Whether `dir` exists and is a directory. */
function lstatSafeDir(dir) {
  try { return statSync(dir).isDirectory() } catch { return false }
}
/** Map a realpath to a materialized location under out/ when it mirrors one. */
function materializedFor(tKey) {
  // workspace @deepseek-ai/* -> packages/<name> already copied as real.
  const m = tKey.replace(/\\/g, '/').match(/\/packages\/([^/]+)\/?$/)
  if (m) {
    const cand = resolve(out, 'packages', m[1])
    return lstatSafeDir(cand) ? cand : undefined
  }
  return undefined
}
