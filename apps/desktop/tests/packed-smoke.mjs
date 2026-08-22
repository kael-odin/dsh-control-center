/**
 * Packed desktop shell smoke test.
 *
 * Spawns the electron-builder unpacked executable (release/win-unpacked) in
 * --e2e mode against a running DSH loopback surface and asserts it loads the
 * surface with the Control Center trigger mounted.
 *
 * Prerequisites:
 *  - `pnpm pack:dir` has produced release/win-unpacked/<productName>.exe
 *  - a DSH Web surface is listening (default 127.0.0.1:3080)
 *
 * Usage:
 *   node tests/packed-smoke.mjs
 */
import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const winUnpacked = resolve(root, 'release/win-unpacked')
const product = process.env.DSH_DESKTOP_PRODUCT || 'DSH Control Center.exe'
let exe = resolve(winUnpacked, product)

if (!existsSync(exe)) {
  // Fall back to any .exe in the unpacked dir.
  const candidates = existsSync(winUnpacked) ? readdirSync(winUnpacked).filter((f) => f.endsWith('.exe')) : []
  if (candidates.length === 0) {
    console.error(`smoke: packed exe not found; run \`pnpm pack:dir\` first (looked at ${winUnpacked})`)
    process.exit(1)
  }
  exe = resolve(winUnpacked, candidates[0])
}
console.log(`packed exe: ${exe}`)

const expected = { loaded: false, attached: false, marker: false, markerNoToken: false, bridge: false, zoom: false, shellTray: false, shellHotkey: false }
const child = spawn(exe, ['--e2e'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], shell: false })

let stdout = ''
let stderr = ''
child.stdout.on('data', (b) => {
  stdout += b.toString()
  if (b.toString().includes('SURFACE_LOADED')) expected.loaded = true
  if (/CONTROL_CENTER_ATTACHED=true/.test(b.toString())) expected.attached = true
  if (/DESKTOP_MARKER=true/.test(b.toString())) expected.marker = true
  if (/DESKTOP_MARKER_NO_TOKEN=true/.test(b.toString())) expected.markerNoToken = true
  if (/NATIVE_BRIDGE=REACHED/.test(b.toString())) expected.bridge = true
  if (/NATIVE_ZOOM=REACHED/.test(b.toString())) expected.zoom = true
  if (/"tray":true/.test(b.toString())) expected.shellTray = true
  if (/"hotkeyRegistered":true/.test(b.toString())) expected.shellHotkey = true
})
child.stderr.on('data', (b) => { stderr += b.toString() })

const timeout = setTimeout(() => {
  console.error('smoke: timed out waiting for packed exe to exit')
  child.kill('SIGKILL')
  process.exit(1)
}, 90_000)

child.on('close', (code) => {
  clearTimeout(timeout)
  console.log('--- packed desktop-shell stdout ---')
  console.log(stdout.trim())
  console.log('--- packed desktop-shell stderr ---')
  console.log(stderr.trim())

  const ok = code === 0 && expected.loaded && expected.attached && expected.marker && expected.markerNoToken && expected.bridge && expected.zoom && expected.shellTray && expected.shellHotkey
  if (!ok) {
    console.error(`smoke FAIL(packed): code=${code} loaded=${expected.loaded} attached=${expected.attached} marker=${expected.marker} noToken=${expected.markerNoToken} bridge=${expected.bridge} tray=${expected.shellTray} hotkey=${expected.shellHotkey}`)
    process.exit(1)
  }
  console.log('smoke PASS(packed)')
  process.exit(0)
})

child.on('error', (err) => {
  clearTimeout(timeout)
  console.error(`smoke FAIL: could not launch packed exe: ${String(err && err.message)}`)
  process.exit(1)
})
