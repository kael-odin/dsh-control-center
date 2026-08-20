/**
 * Desktop shell smoke test (P0/P1).
 *
 * Two modes:
 *  - default: asserts the shell connects to an already-running DSH loopback
 *    surface, loads it, and the Control Center trigger is mounted in the renderer.
 *  - SELFHOST=1: forces the shell onto the self-host path (unused loopback URL +
 *    isolated temp DSH home) and asserts it spawns the DSH host, parses its
 *    readiness URL, loads it, and reports SURFACE_LOADED.
 *
 * Usage:
 *   node tests/smoke.mjs                 # connect-to-existing-surface smoke
 *   SELFHOST=1 node tests/smoke.mjs      # self-host smoke
 */
import { spawn } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// Spawn the real Electron binary (the `.cmd` shim cannot be spawned directly on Windows).
const electronBin = process.platform === 'win32'
  ? resolve(root, 'node_modules/electron/dist/electron.exe')
  : resolve(root, 'node_modules/.bin/electron')

const selfHost = process.argv.includes('--selfhost')

// A loopback port that is (almost certainly) not listening, to force the
// self-host branch when SELFHOST is set.
const TRIGGER_PORT = Number(process.env.SMOKE_TRIGGER_PORT || 39999)

const expected = {
  loaded: false,
  attached: false,
  selfHostReady: false,
}

const env = { ...process.env }

if (selfHost) {
  // Point the shell at an unused loopback URL so it takes the self-host path.
  // No DSH_DESKTOP_HOME is set: the shell reuses the default `~/.dsh` home,
  // whose web profile carries the Control Center bundle, so we can assert the
  // trigger is actually mounted in the self-hosted surface too.
  env.DSH_CONTROL_DESKTOP_URL = `http://127.0.0.1:${TRIGGER_PORT}/`
}

const child = spawn(electronBin, ['.', '--e2e'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], shell: false, env })

let stdout = ''
let stderr = ''
child.stdout.on('data', (b) => {
  stdout += b.toString()
  if (b.toString().includes('SURFACE_LOADED')) expected.loaded = true
  if (/CONTROL_CENTER_ATTACHED=true/.test(b.toString())) expected.attached = true
  if (/self-host ready/.test(b.toString())) expected.selfHostReady = true
})
child.stderr.on('data', (b) => { stderr += b.toString() })

const timeout = setTimeout(() => {
  console.error(`smoke: timed out waiting for electron to exit (selfHost=${selfHost})`)
  child.kill('SIGKILL')
  process.exit(1)
}, selfHost ? 200_000 : 90_000)

child.on('close', (code) => {
  clearTimeout(timeout)
  console.log('--- desktop-shell stdout ---')
  console.log(stdout.trim())
  console.log('--- desktop-shell stderr ---')
  console.log(stderr.trim())

  if (selfHost) {
    const ok = code === 0 && expected.loaded && expected.selfHostReady && expected.attached
    if (!ok) {
      console.error(`smoke FAIL(self-host): code=${code} loaded=${expected.loaded} selfHostReady=${expected.selfHostReady} attached=${expected.attached}`)
      process.exit(1)
    }
    console.log('smoke PASS(self-host)')
    process.exit(0)
  }

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
