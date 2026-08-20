/**
 * Junction-aware recursive delete, for cleaning a materialized tree that may
 * contain circular junctions (Windows join-to-self). Deletes junction links as
 * links (does NOT follow into their target), then removes empty dirs bottom-up,
 * so a cycle cannot cause infinite recursion.
 *
 * Usage:
 *   node scripts/clean-tree.mjs <dir>
 */
import { lstatSync, readdirSync, rmdirSync, unlinkSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(process.argv[2])
if (!root) { console.error('usage: node scripts/clean-tree.mjs <dir>'); process.exit(1) }

let cleared = 0
function clean(p) {
  let st
  try { st = lstatSync(p) } catch { return }
  if (st.isSymbolicLink()) {
    try { unlinkSync(p); cleared += 1 } catch { /* best effort */ }
    return
  }
  if (st.isDirectory()) {
    let entries = []
    try { entries = readdirSync(p) } catch { /* ignore */ }
    for (const e of entries) clean(join(p, e))
    // remove dir only if empty (children cleaned) or junction-free attempt.
    try { rmdirSync(p) } catch { /* not empty yet */ }
  } else if (st.isFile()) {
    try { unlinkSync(p); cleared += 1 } catch { /* ignore */ }
  }
}
clean(root)
console.log(`clean: removed ${cleared} links/files; attempting final rmdir`)
try { rmdirSync(root); console.log('clean: root removed') } catch (e) {
  console.error(`clean: root still present (${String(e && e.code)})`)
  process.exit(1)
}
