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

const expected = {
  loaded: false,
  attached: false,
  selfHostReady: false,
  marker: false,
  markerNoToken: false,
  bridge: false,
  zoom: false,
  shellTray: false,
  shellHotkey: false,
}

// Drop ELECTRON_RUN_AS_NODE: shells spawned from an Electron host (agents,
// VS Code terminals) leak it, and electron.exe would boot as plain node.
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

if (selfHost) {
  // Force the self-host path: the boot mode checks DSH_CONTROL_DESKTOP_SELF_HOST
  // first; with this set, the shell spawns a DSH host on a free port (--port 0),
  // reuses the default ~/.dsh home (which carries the Control Center bundle),
  // and loads the self-hosted surface.
  env.DSH_CONTROL_DESKTOP_SELF_HOST = '1'
}

const child = spawn(electronBin, ['.', '--e2e'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], shell: false, env })

let stdout = ''
let stderr = ''
child.stdout.on('data', (b) => {
  stdout += b.toString()
  if (b.toString().includes('SURFACE_LOADED')) expected.loaded = true
  if (/CONTROL_CENTER_ATTACHED=true/.test(b.toString())) expected.attached = true
  if (/self-host ready/.test(b.toString())) expected.selfHostReady = true
  if (/DESKTOP_MARKER=true/.test(b.toString())) expected.marker = true
  if (/DESKTOP_MARKER_NO_TOKEN=true/.test(b.toString())) expected.markerNoToken = true
  if (/NATIVE_BRIDGE=REACHED/.test(b.toString())) expected.bridge = true
  if (/NATIVE_ZOOM=REACHED/.test(b.toString())) expected.zoom = true
  if (/"tray":true/.test(b.toString())) expected.shellTray = true
  if (/"hotkeyRegistered":true/.test(b.toString())) expected.shellHotkey = true
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
    const ok = code === 0 && expected.loaded && expected.selfHostReady && expected.attached && expected.marker && expected.markerNoToken && expected.bridge && expected.zoom && expected.shellTray && expected.shellHotkey
    if (!ok) {
      console.error(`smoke FAIL(self-host): code=${code} loaded=${expected.loaded} ready=${expected.selfHostReady} attached=${expected.attached} marker=${expected.marker} noToken=${expected.markerNoToken} bridge=${expected.bridge} zoom=${expected.zoom} tray=${expected.shellTray} hotkey=${expected.shellHotkey}`)
      process.exit(1)
    }
    console.log('smoke PASS(self-host)')
    process.exit(0)
  }

  const ok = code === 0 && expected.loaded && expected.attached && expected.marker && expected.markerNoToken && expected.bridge && expected.zoom && expected.shellTray && expected.shellHotkey
  if (!ok) {
    console.error(`smoke FAIL: code=${code} loaded=${expected.loaded} attached=${expected.attached} marker=${expected.marker} noToken=${expected.markerNoToken} bridge=${expected.bridge} zoom=${expected.zoom} tray=${expected.shellTray} hotkey=${expected.shellHotkey}`)
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
