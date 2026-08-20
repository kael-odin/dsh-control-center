/**
 * Self-containment smoke: from the materialized harness tree (no dependence on
 * the source deepseek-harness checkout), boot the web profile with the bundled
 * Node.js and confirm it prints a loopback URL line.
 *
 * Prerequisite: `scripts/materialize-harness.mjs <harnessRoot> .materialized/harness`
 * has produced the tree.
 *
 * Usage:
 *   node tests/selfcontained-smoke.mjs
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const materialized = resolve(root, '.materialized/harness')
const nodeBin = process.env.DSH_DESKTOP_NODE || resolve(root, 'vendor/node/node.exe')

if (!existsSync(resolve(materialized, 'apps/cli/src/bin.ts'))) {
  console.error(`self-contained: materialized harness missing ${materialized}`)
  process.exit(1)
}
if (!existsSync(nodeBin)) {
  console.error(`self-contained: bundled node missing ${nodeBin}`)
  process.exit(1)
}

console.log(`self-contained: booting from ${materialized} with ${nodeBin}`)
const child = spawn(
  nodeBin,
  ['--import', 'tsx/esm', 'apps/cli/src/bin.ts', 'web', '--port', '0'],
  { cwd: materialized, stdio: ['ignore', 'pipe', 'pipe'], shell: false },
)

let out = ''
let err = ''
const urlLine = /dsh web:\s+(http:\/\/127\.0\.0\.1:\d+)/
let url = null
child.stdout.on('data', (b) => {
  out += b.toString()
  const m = out.match(urlLine)
  if (m && !url) { url = m[1]; console.log(`SELF_CONTAINED_URL=${url}`) }
})
child.stderr.on('data', (b) => { err += b.toString() })

const timer = setTimeout(() => { console.error('timeout waiting for URL'); child.kill('SIGKILL'); process.exit(1) }, 120_000)

child.on('close', (code) => {
  clearTimeout(timer)
  if (url) {
    console.log(`SELF_CONTAINED=OK (url=${url})`
      + `, exitDetail=${code}`)
    process.exit(0)
  }
  console.error(`SELF_CONTAINED=FAIL exit=${code}; stderr tail=${err.slice(-400)}`)
  process.exit(1)
})
child.on('error', (e) => { clearTimeout(timer); console.error(`SELF_CONTAINED=FAIL spawn ${String(e && e.message)}`); process.exit(1) })
