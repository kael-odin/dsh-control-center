/**
 * Materialize a DSH harness checkout into a self-contained deploy tree — v6.7.
 *
 * Preserves pnpm's node_modules semantics AND materializes EVERY layer:
 *   - non-node_modules content (packages/apps/vendor/config) is copied as real
 *     files (nested node_modules excluded there — they are materialized below),
 *   - each node_modules directory found anywhere under the harness root (top-level
 *     and every package/app/vendor nested one) is materialized by
 *     `materializeNM`: `.pnpm/<pkg>@<ver>/node_modules/` keeps its body + direct
 *     dep siblings as intra-tree junctions; top-level entries (@deepseek-ai/*
 *     workspace links → packages, other real dirs, `.bin`) are reproduced.
 *   - `realToMat` is shared across all layers, so a nested dep (e.g. apps/cli's
 *     `commander`) re-links to the already-materialized top-level `.pnpm` copy.
 *
 * v6.7 fixes the self-contained boot "cannot find commander" by materializing the
 * nested node_modules too (step-1 previously excluded them entirely).
 *
 * Usage:
 *   node scripts/materialize-harness.mjs <srcHarnessRoot> <outDir>
 */
import {
  mkdirSync, rmSync, copyFileSync, lstatSync, realpathSync, statSync, readdirSync, symlinkSync, cpSync,
} from 'node:fs'
import { resolve, join, relative, dirname, basename } from 'node:path'

const src = resolve(process.argv[2])
const out = resolve(process.argv[3])
if (!src || !out || src === out) {
  console.error('usage: node scripts/materialize-harness.mjs <srcHarnessRoot> <outDir>')
  process.exit(1)
}
const SKIP_TOP = new Set(['.git', '.dsh', 'logs', 'sessions', 'storages', '.test-home', 'node_modules'])
const norm = (p) => resolve(p).replace(/\\/g, '/').toLowerCase()
let stats = { dirs: 0, files: 0, links: 0 }
/** realpath(source entry) -> materialized path (SHARED across all node_modules layers). */
const realToMat = new Map()

function lstatSafeDir(dir) {
  try { return statSync(dir).isDirectory() } catch { return false }
}
function materializedFor(tKey) {
  // workspace @deepseek-ai/* -> packages/<name> already copied as real.
  const m = tKey.replace(/\\/g, '/').match(/\/packages\/([^/]+)\/?$/)
  if (m) {
    const cand = resolve(out, 'packages', m[1])
    return lstatSafeDir(cand) ? cand : undefined
  }
  return undefined
}

function linkTo(dest, targetAbs) {
  mkdirSync(dirname(dest), { recursive: true })
  try {
    const rel = relative(dirname(dest), targetAbs).replace(/\\/g, '/')
    symlinkSync(rel, dest, 'junction')
  } catch (e1) {
    try { symlinkSync(targetAbs.replace(/\\/g, '/'), dest, 'junction') } catch (e2) {
      try { symlinkSync(targetAbs.replace(/\\/g, '/'), dest, 'dir') } catch {
        const mat = realToMat.get(norm(targetAbs))
        if (!mat && lstatSafeDir(targetAbs)) {
          try { copyTreeRec(targetAbs, dirname(dest)) } catch { /* best effort */ }
        }
      }
    }
  }
  stats.links += 1
}
/** Strict junction: never falls back to copying (copy could recurse/loop). */
function linkToStrict(dest, targetAbs) {
  mkdirSync(dirname(dest), { recursive: true })
  try { symlinkSync(targetAbs.replace(/\\/g, '/'), dest, 'junction') }
  catch (e1) {
    try { symlinkSync(targetAbs.replace(/\\/g, '/'), dest, 'dir') }
    catch (e2) {
      console.warn(`[v6.7] linkToStrict failed ${dest} -> ${targetAbs}: ${String((e2 && e2.message) || e2)?.slice(0, 80)}`)
      return
    }
  }
  stats.links += 1
}
function copyTree(s, d) { copyTreeRec(s, d) }
function copyTreeRec(s, d) {
  mkdirSync(d, { recursive: true })
  stats.dirs += 1
  // Record every real directory copied (scoped containers AND their innermost
  // bodies like .pnpm/<pkg>/node_modules/@scope/pkg) so a dependency symlink
  // whose target is such a body can re-link to it instead of being copied as an
  // isolated copy that loses its own deps (e.g. pi-ai -> typebox).
  realToMat.set(norm(s), d)
  for (const entry of readdirSync(s)) {
    const ss = join(s, entry)
    const sd = join(d, entry)
    // Skip any node_modules directory: deps resolve via the materialized
    // top-level node_modules, and following internal node_modules (e.g. a
    // copied source package like @dsh-control-center/control-center) caused
    // infinite ENAMETOOLONG nesting.
    if (entry === 'node_modules') continue
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
/**
 * Copy a top-level real directory of a nested node_modules with dependency
 * awareness: a symlink whose target is already materialized (top-level .pnpm /
 * out/packages) is re-linked via a junction instead of being dereference-copied
 * as an isolated copy (which would break its own deps, e.g. pi-ai -> typebox).
 * Nested node_modules inside are skipped (they are materialized separately).
 */
function copyRelink(s, d, nmBase) {
  mkdirSync(d, { recursive: true })
  stats.dirs += 1
  for (const entry of readdirSync(s)) {
    const ss = join(s, entry)
    const sd = join(d, entry)
    // Skip anything nested under a node_modules path (symlinks included) — those
    // node_modules are materialized separately; dereferencing/following them is
    // what caused infinite ENAMETOOLONG nesting.
    if (relHasNM(ss, nmBase)) continue
    let st
    try { st = lstatSync(ss) } catch { continue }
    if (st.isSymbolicLink()) {
      let target
      try { target = realpathSync(ss) } catch { continue }
      const tKey = norm(target)
      const mat = realToMat.get(tKey) || materializedFor(tKey)
      if (mat) { linkTo(sd, mat); continue }
      if (statSync(target).isFile()) { copyFileSync(target, sd); stats.files += 1 }
      else { copyTree(target, sd); realToMat.set(tKey, sd) }
      continue
    }
    if (st.isFile()) { copyFileSync(ss, sd); stats.files += 1; continue }
    if (st.isDirectory()) {
      if (relHasNM(ss, nmBase)) continue // nested node_modules materialized separately
      copyRelink(ss, sd, nmBase)
    }
  }
}

/** Materialize ONE node_modules dir (its .pnpm + top-level entries) vs its out twin. */
function materializeNM(srcNM, outNM) {
  const pnpmSrc = join(srcNM, '.pnpm')
  const pnpmOut = join(outNM, '.pnpm')
  mkdirSync(pnpmOut, { recursive: true })
  const hasPnPm = lstatSafeDir(pnpmSrc)

  if (hasPnPm) {
  // Pass 1: copy every real (non-symlink) entry under each virtual pkg node_modules.
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
      if (st.isSymbolicLink()) continue // pass 2
      if (st.isFile()) { copyFileSync(es, ed); stats.files += 1; continue }
      if (st.isDirectory()) { copyTree(es, ed); realToMat.set(norm(es), ed) }
    }
  }

  // Pass 2: re-link symlink deps to their materialized targets.
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
      if (statSync(target).isFile()) { copyFileSync(target, ed); stats.files += 1 }
      else { copyTree(target, ed); realToMat.set(tKey, ed) }
    }
  }

  } // end if (hasPnPm)

  // Pass 3: top-level entries of THIS node_modules.
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
        // workspace links -> harness internal paths (packages/..., vendor/...).
        // Map each link to the SAME relative location under out (that source was
        // copied as real files in step 1). A pure junction to a real copy that
        // contains NO node_modules cannot recurse/loop. Never fall back to copy.
        mkdirSync(ed, { recursive: true })
        for (const child of readdirSync(es)) {
          const cs = join(es, child)
          const cd = join(ed, child)
          let cst
          try { cst = lstatSync(cs) } catch { continue }
          if (!cst.isSymbolicLink()) {
            // rare real dir (e.g. schemastery): copy WITHOUT nested node_modules.
            cpSync(cs, cd, { recursive: true, force: true, dereference: true, filter: (e) => !relHasNM(e, es) })
            continue
          }
          let t
          try { t = realpathSync(cs) } catch { continue }
          let relToSrc
          try { relToSrc = relative(src, t) } catch { continue }
          const matHere = resolve(out, relToSrc)
          if (relToSrc && !relToSrc.startsWith('..') && lstatSafeDir(matHere) && !lstatSafeDir(join(matHere, 'node_modules'))) {
            linkToStrict(cd, matHere)
          } else {
            console.warn(`[v6.7] skip @deepseek-ai/${child}: no safe materialized target (${relToSrc})`)
          }
        }
        continue
      }
      // Other top-level dirs must be copied WITHOUT nested node_modules (those are
      // themselves materialized recursively) and with dependency re-linking
      // (copyRelink) so symlink deps point to already-materialized top-level
      // .pnpm copies instead of becoming isolated dereference copies.
      copyRelink(es, ed, srcNM)
    }
  }

  // .bin: reproduce as copy.
  const srcBin = join(srcNM, '.bin')
  if (lstatSafeDir(srcBin)) copyTree(srcBin, join(outNM, '.bin'))
}

/** Whether a copied path contains a nested node_modules segment (relative to a base). */
function relHasNM(p, base) {
  const rel = relative(base, p).replace(/\\/g, '/')
  return rel.split('/').includes('node_modules')
}

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
const t0 = Date.now()

// 1. Copy non-node_modules harness content (packages/apps/vendor/config) as real files.
for (const entry of readdirSync(src)) {
  if (SKIP_TOP.has(entry)) continue
  const ss = join(src, entry)
  let st
  try { st = lstatSync(ss) } catch { continue }
  if (st.isFile()) copyFileSync(ss, join(out, entry))
  else cpSync(ss, join(out, entry), { recursive: true, force: true, dereference: true, filter: (e) => !relHasNM(e, src) })
}

// 2. Enumerate every node_modules dir under the harness root and materialize each,
//    top-level first (fills realToMat so nested layers can re-link to it).
//    We skip .pnpm (handled by materializeNM) and do NOT descend into a node_modules.
function findNodeModules(nodeModuleList, dir) {
  let entries = []
  try { entries = readdirSync(dir) } catch { return }
  for (const entry of entries) {
    if (entry === '.pnpm') continue
    const full = join(dir, entry)
    let st
    try { st = lstatSync(full) } catch { continue }
    if (entry === 'node_modules') { nodeModuleList.push(full); continue }
    if (st.isDirectory() && !st.isSymbolicLink()) findNodeModules(nodeModuleList, full)
  }
}
const nmDirs = []
findNodeModules(nmDirs, src)
// TOP-LEVEL node_modules MUST materialize FIRST so its .pnpm bodies populate
// realToMat before any nested layer (apps/packages/vendor) tries to re-link its
// symlink deps (e.g. vendor/hmr chokidar -> top-level .pnpm/chokidar) — otherwise
// a nested layer would fall back to copying an isolated copy and break the chain.
materializeNM(join(src, 'node_modules'), join(out, 'node_modules'))
nmDirs.sort((a, b) => a.length - b.length)
console.log(`[v6.9] materializing ${nmDirs.length} nested node_modules layers`)
for (const nmDir of nmDirs) {
  if (nmDir === join(src, 'node_modules')) continue // already done above
  const outNMDir = resolve(out, relative(src, nmDir))
  materializeNM(nmDir, outNMDir)
}

console.log(`materialize v6.7 done in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${out}`)
console.log(`stats: dirs=${stats.dirs} files=${stats.files} links=${stats.links}`)
