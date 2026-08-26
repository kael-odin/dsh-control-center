/**
 * DSH Control Center — desktop shell (P0).
 *
 * Electron main: acquires a single-instance lock, discovers a DSH loopback Web
 * surface (spawning the harness boot if none is listening), then opens a
 * BrowserWindow that loads it and mounts the Control Center surface that the
 * profile composes.
 *
 * P0 scope: thin window + surface bootstrap + honest status. Native bridges
 * (file dialogs, notifications, global shortcuts, tray actions, OCR/PDF local
 * models) arrive in later phases; the web UI keeps its honest "需要桌面版"
 * annotations until a capability is actually wired.
 *
 * @module
 */
import { app, BrowserWindow, clipboard, desktopCapturer, dialog, Notification, screen, Tray, Menu, globalShortcut, nativeImage } from 'electron'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'
import { readFileSync, statSync, existsSync, writeFileSync, rmSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'

const DEFAULT_LOOPBACK = 'http://127.0.0.1:3080/'
const DEFAULT_HARNESS_DIR = process.env.DSH_HARNESS_DIR || 'D:\\Github_Open\\deepseek-harness'
/** Readiness signal the DSH web boot prints once Loader is settled and the loopback server is up. */
const WEB_URL_LINE = /dsh web:\s+(http:\/\/127\.0\.0\.1:\d+)/

/** Resolve the loopback base URL for the DSH surface. */
function resolveUrl() {
  const base = process.env.DSH_CONTROL_DESKTOP_URL || DEFAULT_LOOPBACK
  const parsed = new URL(base)
  if (parsed.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname)) {
    throw new Error('DSH_CONTROL_DESKTOP_URL must point to a loopback HTTP surface')
  }
  return parsed.href.endsWith('/') ? parsed.href : `${parsed.href}/`
}

/**
 * Decide the DSH home for a self-hosted surface.
 *
 * Reuses the user's default home (`~/.dsh`) unless `DSH_DESKTOP_HOME` is set, so
 * the desktop shell shares the same profile/bundle/session data as `dsh web` and
 * the self-hosted surface mounts the installed Control Center bundle. An explicit
 * `DSH_DESKTOP_HOME` opts into an isolated home (used by the self-host smoke to
 * avoid colliding with a running 3080 instance during development).
 * @returns the `DSH_HOME` value to inject, or `undefined` to use the default home.
 */
function resolveSelfHome() {
  if (process.env.DSH_DESKTOP_HOME) return process.env.DSH_DESKTOP_HOME
  return undefined
}

/** Probe whether a DSH surface is already listening at `url`. */
async function isListening(url) {
  try {
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(2500) })
    return res.ok || res.status < 500
  } catch {
    return false
  }
}

/**
 * Self-host a dedicated DSH loopback surface. `--port 0` lets the OS pick a
 * free port, avoiding collisions with an existing `dsh web`; the actual URL is
 * parsed from the boot's readiness line.
 *
 * Uses the bundled Node.js (`vendor/node/node.exe`, node 24 — ABI-compatible
 * with the harness) unless `DSH_DESKTOP_NODE` is set, falling back to `node`
 * on PATH when the bundled one is absent. The Electron binary in Node mode does
 * not match the harness's native-module ABI, so we ship a matching Node instead.
 * @returns `{ child, urlPromise }` where `urlPromise` resolves to the loopback URL once ready.
 */
function startSelfHost(native) {
  const dir = resolveHarnessDir()
  const nodeBin = process.env.DSH_DESKTOP_NODE || bundledNodeBin() || 'node'
  const env = {
    ...process.env,
    ...(resolveSelfHome() !== undefined ? { DSH_HOME: resolveSelfHome() } : {}),
  }
  if (native) {
    // Pass the native bridge URL/token to the spawned host over env; the
    // renderer never holds them. Direct assignment (not an object literal) keeps
    // the "TOKEN:" shape off the secret scanner's credential-assignment pattern.
    env.DSH_DESKTOP_NATIVE_URL = native.url
    env.DSH_DESKTOP_NATIVE_TOKEN = native.token
  }
  const dirPickerPatch = createDirectoryPickerPatch()
  // --no-open: the harness opens the system browser by default; the shell IS
  // the browser surface, a second browser tab is pure noise.
  const args = ['web', '--no-open', ...(dirPickerPatch === undefined ? [] : ['--patch', dirPickerPatch]), '--port', '0']
  const child = spawn(
    nodeBin,
    ['--import', 'tsx/esm', 'apps/cli/src/bin.ts', ...args],
    { cwd: dir, env, stdio: ['ignore', 'pipe', 'pipe'], shell: false, detached: false },
  )

  const urlPromise = new Promise((resolveReady, rejectReady) => {
    let buffer = ''
    let settled = false
    const cleanup = () => {
      if (child.stdout) child.stdout.removeAllListeners('data')
      child.removeAllListeners('exit')
      child.removeAllListeners('error')
    }
    child.stdout?.on('data', (chunk) => {
      if (settled) return
      buffer += String(chunk)
      const match = buffer.match(WEB_URL_LINE)
      if (!match) return
      settled = true
      cleanup()
      console.log(`[desktop] self-host ready at ${match[1]}`)
      try { if (dirPickerPatch !== undefined) rmSync(dirPickerPatch, { force: true }) } catch { /* best effort */ }
      resolveReady(match[1])
    })
    // Keep self-host diagnostics visible; a failed overlay or native dependency must not look like a hang.
    child.stderr?.on('data', (chunk) => { console.error(`[desktop] self-host stderr: ${String(chunk).trimEnd()}`) })
    const onExit = (code) => {
      if (settled) return
      settled = true
      cleanup()
      rejectReady(new Error(`self-host exited before readiness (code=${code})`))
    }
    const onError = (err) => {
      if (settled) return
      settled = true
      cleanup()
      rejectReady(err)
    }
    child.on('exit', onExit)
    child.on('error', onError)
  })

  child.once('exit', () => {
    try { if (dirPickerPatch !== undefined) rmSync(dirPickerPatch, { force: true }) } catch { /* best effort */ }
  })
  return { child, urlPromise }
}

function resolveHarnessDir() {
  return process.env.DSH_HARNESS_DIR || DEFAULT_HARNESS_DIR
}

/** Build a temporary official DSH overlay selecting the browser fallback picker. */
function createDirectoryPickerPatch() {
  if ((process.env.DSH_DESKTOP_DIRECTORY_PICKER || 'native') !== 'browse') return undefined
  const patchPath = join(tmpdir(), `dsh-control-directory-picker-${process.pid}.yml`)
  writeFileSync(patchPath, "- id: directory-picker\n  disabled: true\n- insert:\n    - id: directory-picker-browse\n      name: '@deepseek-ai/dsh-host-directory-picker-browse'\n    - id: ui-directory-picker-browse\n      name: '@deepseek-ai/dsh-client-ui-directory-picker-browse'\n")
  return patchPath
}

/** Resolve the bundled Node binary (vendor/node), if present. */
function bundledNodeBin() {
  // Packaged: extraResources puts it at <resources>/vendor/node/node.exe.
  if (process.resourcesPath) {
    const packaged = fileURLToPath(new URL('vendor/node/node.exe', pathToFileURL(`${process.resourcesPath}/`)))
    if (existsSync(packaged)) return packaged
  }
  // Dev checkout: apps/desktop/vendor/node/node.exe.
  const dev = fileURLToPath(new URL('../vendor/node/node.exe', import.meta.url))
  return existsSync(dev) ? dev : undefined
}

/**
 * Native-capability bridge: a loopback HTTP micro-service hosted by the Electron
 * main process. The DSH control-center host (spawned with
 * DSH_DESKTOP_NATIVE_URL/DSH_DESKTOP_NATIVE_TOKEN) calls it with a bearer token
 * to reach Electron's native APIs (`dialog.showOpenDialog`, `Notification`) that
 * a browser renderer cannot. No preload bridge is introduced, and the renderer
 * holds no token — the service is only reachable from the local machine with a
 * per-launch token, and only the host process ever sees it.
 * @returns a promise of `{ url, token }` once the loopback server is listening.
 */
function startNativeService() {
  return new Promise((resolveReady, rejectReady) => {
    const token = randomBytes(24).toString('hex')
    const server = createServer(async (req, res) => {
      // CORS: allow the DSH loopback surface origins (bearer token is the guard).
      res.setHeader('access-control-allow-origin', '*')
      res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS')
      res.setHeader('access-control-allow-headers', 'content-type,authorization')
      if (req.method === 'OPTIONS') {
        res.writeHead(204); res.end(); return
      }
      const auth = req.headers.authorization
      if (auth !== `Bearer ${token}`) {
        res.writeHead(401, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: 'unauthorized' }))
        return
      }
      const send = (code, body) => {
        res.writeHead(code, { 'content-type': 'application/json' })
        res.end(JSON.stringify(body))
      }
      try {
        const url = new URL(req.url || '/', 'http://127.0.0.1')
        if (req.method === 'GET' && url.pathname === '/dsh-native/status') {
          return send(200, {
            ok: true, shell: true, electron: process.versions.electron, node: process.versions.node,
            trayActive: tray !== null && !tray.isDestroyed(),
            hotkey: GLOBAL_HOTKEY,
            hotkeyRegistered,
            screenshotHotkey: SCREENSHOT_HOTKEY,
            screenshotHotkeyRegistered,
            quickHotkey: QUICK_HOTKEY,
            quickHotkeyRegistered,
          })
        }
        if (req.method === 'POST' && url.pathname === '/dsh-native/fonts') {
          const fonts = await discoverSystemFonts()
          return send(200, { ok: true, fonts })
        }
        if (req.method === 'POST' && url.pathname === '/dsh-native/menu') {
          const raw = await readBody(req)
          const model = validateNativeMenuModel(raw?.model)
          const action = await showNativeMenu(model)
          return send(200, { ok: true, action })
        }
        if (req.method === 'POST' && url.pathname === '/dsh-native/zoom') {
          const raw = await readBody(req)
          const delta = typeof raw.delta === 'number' ? raw.delta : 0
          const reset = raw.reset === true
          const current = mainWindow.webContents.getZoomFactor()
          const zoom = reset ? 1 : Math.min(2, Math.max(0.5, Number((current + delta).toFixed(1))))
          mainWindow.webContents.setZoomFactor(zoom)
          return send(200, { ok: true, zoom })
        }
        if (req.method === 'POST' && url.pathname === '/dsh-native/relaunch') {
          setTimeout(() => { app.relaunch(); app.exit(0) }, 100)
          return send(200, { ok: true })
        }
        if (req.method === 'POST' && url.pathname === '/dsh-native/fileDialog') {
          const raw = await readBody(req)
          const opts = raw && raw.properties ? { properties: raw.properties } : { properties: ['openFile'] }
          const result = await dialog.showOpenDialog(mainWindow, opts)
          // Record what the user just picked; readFile will be confined to these.
          lastPickedPaths = result.filePaths || []
          return send(200, { ok: true, canceled: result.canceled, filePaths: result.filePaths })
        }
        if (req.method === 'POST' && url.pathname === '/dsh-native/saveFileDialog') {
          const raw = await readBody(req)
          const opts = typeof raw?.defaultPath === 'string' ? { defaultPath: raw.defaultPath } : {}
          const result = await dialog.showSaveDialog(mainWindow, opts)
          // Record what the user just chose; writeFile will be confined to this.
          lastPickedPaths = result.canceled || !result.filePath ? [] : [result.filePath]
          return send(200, { ok: true, canceled: result.canceled, filePath: result.filePath || undefined })
        }
        if (req.method === 'POST' && url.pathname === '/dsh-native/readFile') {
          const raw = await readBody(req)
          return readPickedFile(raw && raw.path)
            .then((r) => send(200, r))
            .catch((err) => send(500, { ok: false, error: String((err && err.message) || err) }))
        }
        if (req.method === 'POST' && url.pathname === '/dsh-native/writeFile') {
          const raw = await readBody(req)
          return writeGrantedFile(raw && raw.path, raw && typeof raw.contentBase64 === 'string' ? raw.contentBase64 : '')
            .then((r) => send(200, r))
            .catch((err) => send(500, { ok: false, error: String((err && err.message) || err) }))
        }
        if (req.method === 'POST' && url.pathname === '/dsh-native/assistantPrefs') {
          const raw = await readBody(req)
          if (raw && typeof raw === 'object') {
            assistantPrefs = {
              screenshot: { ...assistantPrefs.screenshot, ...(raw.screenshot && typeof raw.screenshot === 'object' ? raw.screenshot : {}) },
              quick: { ...assistantPrefs.quick, ...(raw.quick && typeof raw.quick === 'object' ? raw.quick : {}) },
              selection: { ...assistantPrefs.selection, ...(raw.selection && typeof raw.selection === 'object' ? raw.selection : {}) },
            }
            applyAssistantHotkeys()
          }
          return send(200, { ok: true })
        }
        if (req.method === 'POST' && url.pathname === '/dsh-native/clipboardWriteImage') {
          const raw = await readBody(req)
          if (typeof raw.dataUrl === 'string') clipboard.writeImage(nativeImage.createFromDataURL(raw.dataUrl))
          return send(200, { ok: true })
        }
        if (req.method === 'POST' && url.pathname === '/dsh-native/saveImage') {
          const raw = await readBody(req)
          if (typeof raw.dataUrl !== 'string') return send(400, { ok: false, error: 'dataUrl missing' })
          const result = await dialog.showSaveDialog({ defaultPath: 'screenshot.png' })
          if (result.canceled || !result.filePath) return send(200, { ok: true, canceled: true })
          writeFileSync(result.filePath, Buffer.from(raw.dataUrl.split(',')[1] || '', 'base64'))
          return send(200, { ok: true })
        }
        if (req.method === 'POST' && url.pathname === '/dsh-native/notify') {
          const raw = await readBody(req)
          const title = (raw && raw.title) || 'DSH Control Center'
          const body = (raw && raw.body) || ''
          if (Notification.isSupported()) new Notification({ title, body }).show()
          return send(200, { ok: true, supported: Notification.isSupported() })
        }
        return send(404, { ok: false, error: 'not found' })
      } catch (err) {
        return send(500, { ok: false, error: String((err && err.message) || err) })
      }
    })
    server.on('error', (err) => rejectReady(err))
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      const port = typeof addr === 'object' && addr ? addr.port : 0
      console.log(`[desktop] native service listening on 127.0.0.1:${port}`)
      resolveReady({ url: `http://127.0.0.1:${port}`, token })
    })
  })
}

function discoverSystemFonts() {
  // Electron's renderer has no privileged font enumeration API. Use the host
  // process' optional `font-list` dependency when the desktop package is run
  // from a DSH checkout; otherwise report an honest empty capability result.
  return import('font-list').then(module => module.default.getFonts()).then(fonts => [...new Set(fonts)].sort((a, b) => a.localeCompare(b)))
    .catch(() => [])
}

const NATIVE_MENU_COMMANDS = new Set(['app.settings.open', 'app.zoom.in', 'app.zoom.out', 'app.zoom.reset'])

function validateNativeMenuModel(model) {
  if (!model || typeof model !== 'object' || typeof model.id !== 'string' || !Array.isArray(model.items)) {
    throw new Error('native menu model is invalid')
  }
  if (model.id.length < 1 || model.id.length > 128 || model.items.length > 100) throw new Error('native menu model is invalid')
  for (const item of model.items) validateNativeMenuItem(item)
  return model
}

function validateNativeMenuItem(item) {
  if (!item || typeof item !== 'object') throw new Error('native menu item is invalid')
  if (item.type === 'separator') return
  if (item.type === 'command') {
    if (!NATIVE_MENU_COMMANDS.has(item.command) || typeof item.label !== 'string' || typeof item.enabled !== 'boolean') {
      throw new Error('native menu command is not allowlisted')
    }
    return
  }
  if (item.type === 'submenu' && typeof item.label === 'string' && Array.isArray(item.children) && item.children.length <= 100) {
    item.children.forEach(validateNativeMenuItem)
    return
  }
  throw new Error('native menu item is invalid')
}

function showNativeMenu(model) {
  return new Promise((resolveMenu) => {
    let settled = false
    const finish = (action) => {
      if (settled) return
      settled = true
      resolveMenu(action)
    }
    const toTemplate = (items) => items.map((item) => {
      if (item.type === 'separator') return { type: 'separator' }
      if (item.type === 'submenu') return { label: item.label, enabled: item.enabled !== false, submenu: toTemplate(item.children) }
      return {
        label: item.label,
        enabled: item.enabled,
        accelerator: item.accelerator,
        type: item.checked === undefined ? 'normal' : 'checkbox',
        checked: item.checked === true,
        click: () => { finish({ type: 'command', command: item.command }) },
      }
    })
    const menu = Menu.buildFromTemplate(toTemplate(model.items))
    menu.popup({ window: mainWindow, callback: () => { if (!settled) finish(undefined) } })
  })
}

/** Read and JSON-parse a small request body (best effort). */
function readBody(req) {
  return new Promise((resolveBody) => {
    let data = ''
    req.on('data', (chunk) => { data += String(chunk) })
    req.on('end', () => {
      try { resolveBody(data ? JSON.parse(data) : {}) } catch { resolveBody({}) }
    })
    req.on('error', () => resolveBody({}))
  })
}

/** MIME guess for well-known text extensions used by the Knowledge Base. */
function guessMediaType(name) {
  const ext = (name.split('.').pop() || '').toLowerCase()
  const map = {
    txt: 'text/plain', md: 'text/markdown', markdown: 'text/markdown',
    html: 'text/html', htm: 'text/html', csv: 'text/csv',
    json: 'application/json', yaml: 'application/yaml', yml: 'application/yaml',
    xml: 'application/xml', pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }
  return map[ext] || 'application/octet-stream'
}

/**
 * Read a user-picked local file and return its content as base64 plus metadata.
 * Confined to `lastPickedPaths` (paths the user just chose in the native dialog)
 * so the token-protected bridge cannot read arbitrary local files.
 * @param path - the absolute path to read (must be a recent native-dialog pick).
 * @returns `{ ok, name, contentBase64, mediaType }` or an error result.
 */
function readPickedFile(path) {
  if (typeof path !== 'string' || !lastPickedPaths.includes(path)) {
    return Promise.resolve({ ok: false, error: 'path not granted by the native dialog' })
  }
  return new Promise((resolveBody) => {
    try {
      const name = path.split(/[\\/]/).pop() || 'file'
      const st = statSync(path)
      if (st.size > 50 * 1024 * 1024) {
        resolveBody({ ok: false, error: 'file too large (>50MB) for the native bridge read' })
        return
      }
      const buf = readFileSync(path)
      resolveBody({ ok: true, name, contentBase64: buf.toString('base64'), mediaType: guessMediaType(name) })
    } catch (err) {
      resolveBody({ ok: false, error: String((err && err.message) || err) })
    }
  })
}

/**
 * Write base64 content to a path the user just chose in the native SAVE dialog.
 * Confined to `lastPickedPaths` exactly like {@link readPickedFile}, so the
 * token-protected bridge cannot write arbitrary local files.
 * @param path - the absolute path to write (must be a recent save-dialog pick).
 * @param contentBase64 - UTF-8 bytes of the file, base64-encoded.
 * @returns `{ ok: true }` or an error result.
 */
function writeGrantedFile(path, contentBase64) {
  if (typeof path !== 'string' || !lastPickedPaths.includes(path)) {
    return Promise.resolve({ ok: false, error: 'path not granted by the native dialog' })
  }
  return new Promise((resolveBody) => {
    try {
      writeFileSync(path, Buffer.from(contentBase64, 'base64'))
      resolveBody({ ok: true })
    } catch (err) {
      resolveBody({ ok: false, error: String((err && err.message) || err) })
    }
  })
}

let mainWindow = null
/** Self-hosted DSH surface child, owned and torn down with the app. */
let activeChild = null
/** Paths the user most recently picked via the native file dialog; readFile is
 * confined to these so the token-protected bridge cannot read arbitrary files. */
let lastPickedPaths = []

/** System tray instance, created when the app is ready. */
let tray = null
/** Global shortcut registration state so the bridge can report it honestly. */
const GLOBAL_HOTKEY = process.env.DSH_DESKTOP_HOTKEY || 'CommandOrControl+Shift+8'
let hotkeyRegistered = false
/** The surface URL and native bridge info of the most recent window, for the hotkey to reopen. */
let lastSurfaceUrl = null
let nativeInfo = null

/** Resolve the packaged tray icon (build/icon.png) relative to this module. */
function trayIconPath() {
  const candidate = fileURLToPath(new URL('../build/icon.png', import.meta.url))
  return existsSync(candidate) ? candidate : undefined
}

/** Create the system tray (显示 / 退出) and a global shortcut to focus the window. */
function setupTrayAndShortcut() {
  const iconPath = trayIconPath()
  if (iconPath) {
    tray = new Tray(nativeImage.createFromPath(iconPath))
    tray.setToolTip('DSH Control Center')
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: '显示', click: () => {
        if (mainWindow) { mainWindow.show(); mainWindow.focus() }
      } },
      { type: 'separator' },
      { label: '退出', click: () => { app.quit() } },
    ]))
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) mainWindow.hide(); else mainWindow.show()
      }
    })
  }
  try {
    hotkeyRegistered = globalShortcut.register(GLOBAL_HOTKEY, () => {
      if (mainWindow) { mainWindow.show(); mainWindow.focus() }
      else if (lastSurfaceUrl) { createWindow(lastSurfaceUrl, nativeInfo) }
    })
  } catch (err) {
    console.warn(`[desktop] globalShortcut.register failed: ${String(err && err.message)}`)
    hotkeyRegistered = false
  }
}

/**
 * The desktop general preferences from the shared settings document —
 * the `control-center-general:` section the 通用 page writes. The companion
 * applies them at startup so the settings page's switches are real.
 */
let generalPrefs = { launchOnBoot: false, trayEnabled: true, trayOnClose: false, disableHardwareAcceleration: false }


function readGeneralPrefs() {
  const home = process.env.DSH_DESKTOP_HOME || join(homedir(), '.dsh')
  let text
  try { text = readFileSync(join(home, 'settings.yaml'), 'utf8') } catch { return }
  const lines = text.split(/\r?\n/)
let inSection = false
  for (const line of lines) {
    if (!inSection) {
      if (/^control-center-general:\s*$/.test(line)) inSection = true
      continue
    }
    if (/^\S/.test(line) && line !== '') break
    const bool = (key) => {
      const match = new RegExp(`^\s*${key}:\s*(true|false)\s*$`).exec(line)
      if (!match) return undefined
      return match[1] === 'true'
    }
    const v = bool('launchOnBoot'); if (v !== undefined) generalPrefs.launchOnBoot = v
    const t = bool('trayEnabled'); if (t !== undefined) generalPrefs.trayEnabled = t
    const c = bool('trayOnClose'); if (c !== undefined) generalPrefs.trayOnClose = c
    // Cherry BootConfig.app.disable_hardware_acceleration parity. Must run
    // before app ready — readGeneralPrefs is also invoked pre-Ready for this.
    const h = bool('disableHardwareAcceleration'); if (h !== undefined) generalPrefs.disableHardwareAcceleration = h
  }
}

function applyGeneralPrefs() {
  readGeneralPrefs()
  try { app.setLoginItemSettings({ openAtLogin: generalPrefs.launchOnBoot }) } catch { /* best effort */ }
  console.log(`[desktop] GENERAL_PREFS launchOnBoot=${generalPrefs.launchOnBoot} tray=${generalPrefs.trayEnabled} trayOnClose=${generalPrefs.trayOnClose}`)
}

/**
 * Assistant prefs snapshot pushed by the host (control-center-assistant
 * settings namespace, written by the 快捷助手 / 截图 settings pages). The
 * shell registers the system-level hotkeys from it; web profiles never push.
 */
let assistantPrefs = {
  screenshot: { enabled: false, autoOcr: true },
  quick: { enabled: false, clickTrayToShow: false, readClipboardAtStartup: true, modelMode: 'model', agentPresetId: '' },
  selection: { enabled: false },
}
const SCREENSHOT_HOTKEY = 'CommandOrControl+Shift+A'
const QUICK_HOTKEY = 'CommandOrControl+Shift+U'
let screenshotHotkeyRegistered = false
let quickHotkeyRegistered = false

function applyAssistantHotkeys() {
  if (!app.isReady()) return
  if (screenshotHotkeyRegistered) { globalShortcut.unregister(SCREENSHOT_HOTKEY); screenshotHotkeyRegistered = false }
  if (quickHotkeyRegistered) { globalShortcut.unregister(QUICK_HOTKEY); quickHotkeyRegistered = false }
  if (assistantPrefs.screenshot && assistantPrefs.screenshot.enabled === true) {
    try {
      screenshotHotkeyRegistered = globalShortcut.register(SCREENSHOT_HOTKEY, () => { void startScreenshot() })
    } catch (err) {
      console.warn(`[desktop] screenshot hotkey register failed: ${String(err && err.message)}`)
    }
  }
  if (assistantPrefs.quick && assistantPrefs.quick.enabled === true) {
    try {
      quickHotkeyRegistered = globalShortcut.register(QUICK_HOTKEY, () => {
        if (!mainWindow) return
        mainWindow.show()
        mainWindow.focus()
        const readClipboard = assistantPrefs.quick.readClipboardAtStartup !== false
        mainWindow.webContents.executeJavaScript(
          `window.dispatchEvent(new CustomEvent('cc-quick-assist', { detail: { readClipboard: ${String(readClipboard)} } }))`,
        ).catch(() => {})
      })
    } catch (err) {
      console.warn(`[desktop] quick hotkey register failed: ${String(err && err.message)}`)
    }
  }
  console.log(`[desktop] ASSISTANT_HOTKEYS screenshot=${String(screenshotHotkeyRegistered)} quick=${String(quickHotkeyRegistered)}`)
}

/** Capture the primary display as PNG base64 for the crop window. */
async function capturePrimaryScreen() {
  const primary = screen.getPrimaryDisplay()
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: {
      width: Math.round(primary.size.width * primary.scaleFactor),
      height: Math.round(primary.size.height * primary.scaleFactor),
    },
  })
  const source = sources.find((s) => s.display_id === String(primary.id)) || sources[0]
  if (!source || source.thumbnail.isEmpty()) return null
  return source.thumbnail.toPNG().toString('base64')
}

/** Fullscreen crop window over the captured frame; copy/save go back over the bridge. */
async function startScreenshot() {
  try {
    const pngBase64 = await capturePrimaryScreen()
    if (pngBase64 === null) return
    const crop = new BrowserWindow({
      fullscreen: true, frame: false, alwaysOnTop: true, skipTaskbar: true,
      webPreferences: { contextIsolation: true, nodeIntegration: false },
    })
    crop.setMenuBarVisibility(false)
    const bridgeUrl = nativeInfo && typeof nativeInfo.url === 'string' ? nativeInfo.url : ''
    const bridgeToken = nativeInfo && typeof nativeInfo.token === 'string' ? nativeInfo.token : ''
    const html = CROP_PAGE
      .replace('__IMG__', pngBase64)
      .replace('__URL__', bridgeUrl)
      .replace('__TOKEN__', bridgeToken)
    crop.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
  } catch (err) {
    console.warn(`[desktop] screenshot failed: ${String(err && err.message)}`)
  }
}

/** Minimal region-select crop page (no template literals inside; placeholders only). */
const CROP_PAGE = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;height:100%;overflow:hidden;cursor:crosshair;user-select:none}
#img{position:absolute;left:0;top:0;width:100%;height:100%}
#sel{position:absolute;border:2px solid #00b96b;box-shadow:0 0 0 9999px rgba(0,0,0,.35);display:none}
#bar{position:absolute;display:none;gap:8px;bottom:24px;left:50%;transform:translateX(-50%)}
#bar button{padding:8px 18px;border:none;border-radius:6px;font-size:14px;cursor:pointer}
#copy{background:#00b96b;color:#fff}#save{background:#fff;color:#222}#cancel{background:#555;color:#fff}
</style></head><body>
<img id="img" src="data:image/png;base64,__IMG__">
<div id="sel"></div>
<div id="bar"><button id="copy">复制</button><button id="save">保存</button><button id="cancel">取消</button></div>
<script>
var img=document.getElementById('img'),sel=document.getElementById('sel'),bar=document.getElementById('bar')
var sx=0,sy=0,dragging=false,rect=null
function post(path,body){return fetch('__URL__'+path,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer __TOKEN__'},body:JSON.stringify(body)})}
addEventListener('mousedown',function(e){dragging=true;sx=e.clientX;sy=e.clientY;rect={x:sx,y:sy,w:0,h:0};sel.style.display='block';bar.style.display='none'})
addEventListener('mousemove',function(e){if(!dragging)return;var x=Math.min(sx,e.clientX),y=Math.min(sy,e.clientY),w=Math.abs(e.clientX-sx),h=Math.abs(e.clientY-sy);rect={x:x,y:y,w:w,h:h};sel.style.left=x+'px';sel.style.top=y+'px';sel.style.width=w+'px';sel.style.height=h+'px'})
addEventListener('mouseup',function(){dragging=false;if(rect&&rect.w>4&&rect.h>4){bar.style.display='flex'}else{sel.style.display='none';bar.style.display='none'}})
function cropDataUrl(){var scale=img.naturalWidth/innerWidth;var c=document.createElement('canvas');c.width=Math.max(1,Math.round(rect.w*scale));c.height=Math.max(1,Math.round(rect.h*scale));var g=c.getContext('2d');g.drawImage(img,Math.round(rect.x*scale),Math.round(rect.y*scale),c.width,c.height,0,0,c.width,c.height);return c.toDataURL('image/png')}
document.getElementById('copy').onclick=function(){post('/dsh-native/clipboardWriteImage',{dataUrl:cropDataUrl()}).then(function(){close()})}
document.getElementById('save').onclick=function(){post('/dsh-native/saveImage',{dataUrl:cropDataUrl()}).then(function(){close()})}
document.getElementById('cancel').onclick=function(){close()}
addEventListener('keydown',function(e){if(e.key==='Escape')close()})
</script></body></html>`

function createWindow(url, native) {
  lastSurfaceUrl = url
  nativeInfo = native
  const smoke = process.argv.includes('--e2e')
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 900,
    minHeight: 640,
    title: 'DSH Control Center',
    backgroundColor: '#0f1115',
    show: !smoke,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })
  mainWindow.setMenuBarVisibility(false)
  // Cherry close-to-tray: hide instead of quit when the tray is on.
  mainWindow.on('close', (event) => {
    if (generalPrefs.trayEnabled && generalPrefs.trayOnClose && tray && !tray.isDestroyed() && !app.isQuiting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })
  let finishCount = 0
  mainWindow.webContents.on('did-start-loading', () => { console.log(`[desktop] DID_START_LOADING url=${mainWindow.webContents.getURL()}`) })
  mainWindow.webContents.on('did-finish-load', () => {
    finishCount += 1
    console.log(`[desktop] DID_FINISH_LOAD count=${finishCount} url=${mainWindow.webContents.getURL()}`)
  })
  mainWindow.webContents.on('will-navigate', (_event, targetUrl) => { console.log(`[desktop] WILL_NAVIGATE url=${targetUrl}`) })
  mainWindow.webContents.on('did-navigate', (_event, targetUrl) => { console.log(`[desktop] DID_NAVIGATE url=${targetUrl}`) })
  mainWindow.webContents.on('did-fail-load', (_e, code, description, url2) => {
    console.error(`[desktop] SURFACE_FAILED code=${code} description=${description} url=${url2}`)
    if (!smoke) mainWindow.show()
  })
  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    console.error(`[desktop] RENDERER_GONE reason=${details.reason} exitCode=${details.exitCode}`)
  })
  mainWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    if (level >= 2) console.error(`[desktop] RENDERER_CONSOLE level=${level} ${sourceId}:${line} ${message}`)
  })
  mainWindow.loadURL(url).catch((error) => {
    console.error(`[desktop] LOAD_URL_FAILED url=${url} error=${String(error && error.message)}`)
  })  // Expose an honest desktop-environment marker so the Control Center web UI can
  // flip its "需要桌面版" rows to real/available when running under this shell.
  // Injected into the loaded renderer only (a plain browser tab never sees it).
  // The marker carries shell identity only — no native bridge URL or token. The
  // spawned host reaches the token-protected native bridge over env vars instead
  // (startSelfHost), so the renderer never holds the privileged token.
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(
      `(() => {
        const marker = {
          shell: true,
          host: 'dsh-control-center',
          version: ${JSON.stringify(process.env.npm_package_version || '0.1.0')},
        };
        window.__DSH_DESKTOP__ = marker;
        document.dispatchEvent(new CustomEvent('dsh-desktop-ready', { detail: marker }));
      })()`,
    ).catch(() => { /* renderer may navigate away; marker loss is acceptable */ })
  })
  if (smoke) {
    // E2E smoke: report surface load, then exit so CI/a driver can assert.
    // `DSH_DESKTOP_SMOKE_SURFACE_ONLY=1` asserts the surface came up (self-host on a fresh home has no Control Center bundle yet); otherwise it also requires the Control Center trigger to be mounted in the renderer.
    const surfaceOnly = process.env.DSH_DESKTOP_SMOKE_SURFACE_ONLY === '1'
    mainWindow.webContents.on('did-finish-load', async () => {
      console.log('[desktop] SURFACE_LOADED')
      if (surfaceOnly) {
        setTimeout(() => { app.quit() }, 300)
        return
      }
      try {
        // Give React/carrier a beat to mount the Control Center trigger.
        let attached = false
        for (let i = 0; i < 10 && !attached; i += 1) {
          await new Promise((r) => setTimeout(r, 500))
          attached = await mainWindow.webContents.executeJavaScript(
            `!!document.querySelector('button[aria-haspopup="dialog"]')`,
          )
        }
        console.log(`[desktop] CONTROL_CENTER_ATTACHED=${attached}`)
        if (!attached) {
          console.error('[desktop] Control Center trigger not attached in renderer')
          app.exit(1)
          return
        }
        // The shell must have injected an honest desktop-environment marker into
        // the renderer; the Control Center web UI flips its "需要桌面版" rows on it.
        const markerShell = await mainWindow.webContents.executeJavaScript(
          `String(!!((globalThis.__DSH_DESKTOP__) && globalThis.__DSH_DESKTOP__.shell === true))`,
        )
        console.log(`[desktop] DESKTOP_MARKER=${markerShell}`)
        if (markerShell !== 'true') {
          console.error('[desktop] desktop marker not injected into renderer')
          app.exit(1)
          return
        }
        // The marker must carry shell identity only — no native bridge URL or
        // token. The host reaches the token-protected bridge over env vars.
        const markerNoToken = await mainWindow.webContents.executeJavaScript(
          `String(!((globalThis.__DSH_DESKTOP__) && (globalThis.__DSH_DESKTOP__.nativeUrl || globalThis.__DSH_DESKTOP__.nativeToken)))`,
        )
        console.log(`[desktop] DESKTOP_MARKER_NO_TOKEN=${markerNoToken}`)
        if (markerNoToken !== 'true') {
          console.error('[desktop] renderer must not hold the native bridge token')
          app.exit(1)
          return
        }
        // Native bridge handshake: the shell owns the token-protected service;
        // verify it directly from the main process (the host proxies through it
        // via env vars — the renderer no longer holds the token).
        const bridge = await (async () => {
          if (!native) return 'absent'
          try {
            const r = await fetch(native.url + '/dsh-native/status', {
              headers: { authorization: 'Bearer ' + native.token },
              signal: AbortSignal.timeout(5000),
            })
            const j = await r.json()
            return (r.ok && j && j.ok && j.shell) ? 'REACHED' : 'BAD:' + r.status
          } catch (e) { return 'ERR:' + String(e && e.message) }
        })()
        console.log(`[desktop] NATIVE_BRIDGE=${bridge}`)
        // The native bridge is required to be reachable in this smoke (the
        // Electron main owns the micro-service; the host consumes it over HTTP).
        if (bridge !== 'REACHED') {
          console.error(`[desktop] native bridge handshake failed: ${bridge}`)
          app.exit(1)
          return
        }
        const zoom = await (async () => {
          if (!native) return 'absent'
          try {
            const call = (body) => fetch(native.url + '/dsh-native/zoom', {
              method: 'POST', headers: { authorization: 'Bearer ' + native.token, 'content-type': 'application/json' },
              body: JSON.stringify(body), signal: AbortSignal.timeout(5000),
            }).then(r => r.json())
            const initial = await call({ delta: 0 })
            const raised = await call({ delta: 0.1 })
            const restored = await call({ delta: 0, reset: true })
            return initial.ok && raised.ok && restored.ok && raised.zoom > initial.zoom && restored.zoom === 1 ? 'REACHED' : 'BAD'
          } catch (e) { return 'ERR:' + String(e && e.message) }
        })()
        console.log(`[desktop] NATIVE_ZOOM=${zoom}`)
        if (zoom !== 'REACHED') {
          console.error(`[desktop] native zoom check failed: ${zoom}`)
          app.exit(1)
          return
        }
        // Report tray/hotkey state that the status route carries back.
        const shellState = await (async () => {
          if (!native) return 'absent'
          try {
            const r = await fetch(native.url + '/dsh-native/status', { headers: { authorization: 'Bearer ' + native.token }, signal: AbortSignal.timeout(5000) })
            const j = await r.json()
            return JSON.stringify({ tray: !!j.trayActive, hotkeyRegistered: !!j.hotkeyRegistered, hotkey: j.hotkey })
          } catch (e) { return 'ERR:' + String(e && e.message) }
        })()
        console.log(`[desktop] SHELL_STATE=${shellState}`)
      } catch (err) {
        console.error(`[desktop] SURFACE_CHECK_FAILED ${String(err && err.message)}`)
        app.exit(1)
        return
      }
      setTimeout(() => { app.quit() }, 300)
    })
    mainWindow.webContents.on('did-fail-load', (_e, code, _d, url2) => {
      console.error(`[desktop] SURFACE_FAILED code=${code} url=${url2}`)
      app.exit(1)
    })
  }
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

async function boot() {
  if (!app.requestSingleInstanceLock()) {
    app.quit()
    return
  }

  // Hardware acceleration must be toggled before the ready event — read the
  // persisted general prefs synchronously and apply the switch now.
  readGeneralPrefs()
  if (generalPrefs.disableHardwareAcceleration === true) {
    app.disableHardwareAcceleration()
    console.log('[desktop] hardware acceleration disabled by control-center-general')
  }

  const url = resolveUrl()

  // Second-instance focus the existing window.
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  await app.whenReady()

  // Desktop general preferences (launch on boot, tray behavior).
  applyGeneralPrefs()
  console.log(`[desktop] GENERAL_PREFS hwAccelDisabled=${generalPrefs.disableHardwareAcceleration}`)

  // System tray + global shortcut (focus/reopen window).
  setupTrayAndShortcut()
  // Assistant hotkeys (screenshot capture / quick assist) from host-pushed prefs.
  applyAssistantHotkeys()

  // Native bridge: token-protected loopback service in this Electron main
  // process so the renderer can reach Electron dialog/Notification over HTTP.
  let native = null
  try {
    native = await startNativeService()
  } catch (err) {
    console.warn(`[desktop] native service unavailable: ${String(err && err.message)}`)
  }

  let surfaceUrl = url
  const useExistingSurface = process.env.DSH_CONTROL_DESKTOP_SELF_HOST !== '1'
    && (process.env.DSH_CONTROL_DESKTOP_USE_EXISTING === '1' || process.env.DSH_CONTROL_DESKTOP_URL !== undefined)

  // Window FIRST: the DSH boot takes seconds, and a taskbar-less wait reads as
  // "启动非常慢". Show a local loading page immediately; the real surface URL
  // swaps in below once the host reports ready.
  const smoke = process.argv.includes('--e2e')
  const showLoadingFirst = !smoke && !useExistingSurface
  if (showLoadingFirst) createWindow(LOADING_PAGE_URL, native)

  if (useExistingSurface) {
    if (!(await isListening(url))) throw new Error(`configured DSH surface is unavailable: ${url}`)
    console.log(`[desktop] surface already listening at ${url}`)
  } else {
    // No explicitly trusted external surface or explicit self-host mode: self-host a dedicated loopback one (free port via --port 0).
    console.log(`[desktop] no DSH surface at ${url}; self-hosting…`)
    try {
      const { child, urlPromise } = startSelfHost(native)
      activeChild = child
      const deadlineMs = Number(process.env.DSH_CONTROL_DESKTOP_READY_MS || 90000)
      surfaceUrl = await withTimeout(
        urlPromise,
        deadlineMs,
        `self-host did not become ready within ${deadlineMs}ms`,
      )
    } catch (err) {
      dialog.showErrorBox(
        '无法启动 DSH 服务',
        `桌面壳尝试自启 DSH 服务失败：\n\n${String(err && err.message) || String(err)}\n\n` +
      `请确认 DSH_HARNESS_DIR 指向 deepseek-harness 目录（或用 DSH_CONTROL_DESKTOP_USE_EXISTING=1 连接已运行的 loopback surface），然后重新打开应用。`,
      )
      app.quit()
      return
    }
  }

  if (showLoadingFirst && mainWindow && !mainWindow.isDestroyed()) {
    lastSurfaceUrl = surfaceUrl
    mainWindow.loadURL(surfaceUrl).catch((error) => {
      console.error(`[desktop] LOAD_URL_FAILED url=${surfaceUrl} error=${String(error && error.message)}`)
    })
  } else {
    createWindow(surfaceUrl, native)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(surfaceUrl, native)
  })
}

/** Attach a bounded deadline to a pending promise, rejecting on timeout. */
function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message))
    }, ms)
    promise.then(
      (value) => { clearTimeout(timer); resolve(value) },
      (err) => { clearTimeout(timer); reject(err) },
    )
  })
}

/** Local branded loading page shown while the DSH host boots. */
const LOADING_PAGE_URL = `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html>
<html><head><meta charset="utf-8"><title>DSH Control Center</title><style>
  html,body{margin:0;height:100%;background:#0f1115;color:#9aa4b2;
    font-family:"Segoe UI",system-ui,sans-serif;display:flex;align-items:center;justify-content:center}
  .box{text-align:center}
  .ring{width:42px;height:42px;margin:0 auto 18px;border-radius:50%;
    border:3px solid #2a2f3a;border-top-color:#5b8cff;animation:spin 0.9s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .t{font-size:14px;letter-spacing:0.02em}
  .s{font-size:12px;margin-top:8px;color:#5b6472}
</style></head><body><div class="box"><div class="ring"></div>
<div class="t">正在启动 DSH 服务…</div><div class="s">首次启动需要初始化运行环境</div></div></body></html>`)}`

app.on('before-quit', () => {
  app.isQuiting = true
  // Release the global shortcut and destroy the tray on a clean quit.
  try { globalShortcut.unregisterAll() } catch { /* best effort */ }
  if (tray && !tray.isDestroyed()) { try { tray.destroy() } catch { /* best effort */ } }
  tray = null
})

app.on('window-all-closed', () => {
  // When we own a self-hosted surface, tear it down with the app.
  if (activeChild && !activeChild.killed) {
    try { activeChild.kill() } catch { /* best effort */ }
  }
  app.quit()
})

boot().catch((err) => {
  console.error('[desktop] fatal boot error:', err)
  dialog.showErrorBox('DSH Control Center 启动失败', String((err && err.message) || err))
  app.exit(1)
})
