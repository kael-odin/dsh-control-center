/**
 * materializer smoke: cycle-aware materialize of a harness dependency subtree
 * completes without ELOOP and leaves no dangling intra-tree links.
 *
 * Usage:
 *   node tests/materialize-smoke.mjs
 */
import { spawn } from 'node:child_process'
import { readdirSync, lstatSync, realpathSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const harness = process.env.DSH_HARNESS_DIR || 'D:/Github_Open/deepseek-harness'
const src = resolve(harness)
const out = resolve(root, '.materialize-tmp/harness')

const script = resolve(root, 'scripts/materialize-harness.mjs')
const child = spawn(process.execPath, [script, src, out], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], shell: false })
let err = ''
child.stderr.on('data', (b) => { err += b.toString() })

const timer = setTimeout(() => { console.error('materialize smoke: timeout (full tree materialize is slow)'); child.kill('SIGKILL'); process.exit(1) }, 3_600_000)

child.on('close', (code) => {
  clearTimeout(timer)
  if (code !== 0) {
    console.error(`materialize FAIL: exit=${code} stderr=${err.slice(0, 400)}`)
    process.exit(1)
  }
  // Verify no dangling links inside the tree.
  let dangling = 0
  function walk(dir) {
    let entries = []
    try { entries = readdirSync(dir) } catch { return }
    for (const e of entries) {
      const p = join(dir, e)
      let st
      try { st = lstatSync(p) } catch { continue }
      if (st.isSymbolicLink()) {
        try { realpathSync(p) } catch { dangling += 1 }
      } else if (st.isDirectory()) {
        walk(p)
      }
    }
  }
  walk(out)
  console.log(`materialize smoke: exit=0, danglingLinks=${dangling}`)
  if (dangling !== 0) {
    console.error(`materialize FAIL: ${dangling} dangling link(s)`)
    process.exit(1)
  }
  console.log('materialize PASS')
  process.exit(0)
})
child.on('error', (e) => { clearTimeout(timer); console.error(`materialize spawn error: ${String(e && e.message)}`); process.exit(1) })
