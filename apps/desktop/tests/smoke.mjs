/**
 * Desktop shell smoke test (P0).
 *
 * Launches the Electron shell in `--e2e` mode against a running DSH loopback
 * surface, then asserts the process reported both a successful surface load and
 * that the Control Center trigger is attached in the renderer, and exited 0.
 *
 * Prerequisite: a DSH Web surface must be listening (e.g. `dsh web` on 127.0.0.1:3080)
 * or DSH_CONTROL_DESKTOP_URL must point at one.
 *
 * Usage:
 *   node tests/smoke.mjs
 */
import { spawn } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// Spawn the real Electron binary (the `.cmd` shim cannot be spawned directly on Windows).
const electronBin = process.platform === 'win32'
  ? resolve(root, 'node_modules/electron/dist/electron.exe')
  : resolve(root, 'node_modules/.bin/electron')

const expected = {
  loaded: false,
  attached: false,
}

const child = spawn(electronBin, ['.', '--e2e'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], shell: false })

let stdout = ''
let stderr = ''
child.stdout.on('data', (b) => {
  stdout += b.toString()
  if (b.toString().includes('SURFACE_LOADED')) expected.loaded = true
  if (/CONTROL_CENTER_ATTACHED=true/.test(b.toString())) expected.attached = true
})
child.stderr.on('data', (b) => { stderr += b.toString() })

const timeout = setTimeout(() => {
  console.error('smoke: timed out waiting for electron to exit')
  child.kill('SIGKILL')
  process.exit(1)
}, 90000)

child.on('close', (code) => {
  clearTimeout(timeout)
  console.log('--- desktop-shell stdout ---')
  console.log(stdout.trim())
  console.log('--- desktop-shell stderr ---')
  console.log(stderr.trim())

  const ok = code === 0 && expected.loaded && expected.attached
  if (!ok) {
    console.error(`smoke FAIL: code=${code} loaded=${expected.loaded} attached=${expected.attached}`)
    process.exit(1)
  }
  console.log('smoke PASS')
  process.exit(0)
})

child.on('error', (err) => {
  clearTimeout(timeout)
  console.error(`smoke FAIL: could not launch electron: ${String(err && err.message)}`)
  process.exit(1)
})
