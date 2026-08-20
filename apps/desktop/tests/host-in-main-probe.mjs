/**
 * host-in-main probe — B0 feasibility gate for the native-capability bridge.
 *
 * Confirms the DSH Host can be mounted inside the Electron main process: the
 * harness profile-boot (app-boot trunk) prepares the web profile under a
 * harness-anchored resolver. This is the prerequisite for a Control Center Host
 * plugin that exposes Electron dialog / Notification to the renderer via DSH RPC.
 *
 * The inner probe is spawned with cwd at the harness so bare specifiers
 * (`@deepseek-ai/cordis` et al.) resolve against harness node_modules.
 *
 * Usage:
 *   node tests/host-in-main-probe.mjs
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)))
const harness = process.env.DSH_HARNESS_DIR || 'D:/Github_Open/deepseek-harness'
const inner = resolve(root, '_host-in-main-inner.mjs')

if (!existsSync(resolve(harness, 'apps/cli/package.json'))) {
  console.error(`probe: harness not found at ${harness} (set DSH_HARNESS_DIR)`)
  process.exit(1)
}

const child = spawn(
  process.execPath,
  ['--import', 'tsx/esm', inner],
  { cwd: harness, env: { ...process.env, DSH_HARNESS_DIR: harness }, stdio: ['ignore', 'pipe', 'pipe'], shell: false },
)

let out = ''
let err = ''
child.stdout.on('data', (b) => { out += b.toString() })
child.stderr.on('data', (b) => { err += b.toString() })
const timeout = setTimeout(() => { console.error('probe: timeout'); child.kill('SIGKILL'); process.exit(1) }, 60_000)

child.on('close', (code) => {
  clearTimeout(timeout)
  console.log('--- inner stdout ---')
  console.log(out.trim())
  if (err.trim()) { console.log('--- inner stderr ---'); console.log(err.trim()) }
  const ok = code === 0 && /HOST_IN_MAIN=OK/.test(out)
  if (!ok) {
    console.error('host-in-main probe FAIL')
    process.exit(1)
  }
  console.log('host-in-main probe PASS')
  process.exit(0)
})
child.on('error', (e) => { clearTimeout(timeout); console.error(`probe spawn error: ${String(e && e.message)}`); process.exit(1) })
