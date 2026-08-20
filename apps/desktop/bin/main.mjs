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
import { app, BrowserWindow, dialog } from 'electron'
import { spawn } from 'node:child_process'

const DEFAULT_LOOPBACK = 'http://127.0.0.1:3080/'
const DEFAULT_HARNESS_DIR = process.env.DSH_HARNESS_DIR || 'D:\\Github_Open\\deepseek-harness'
/** Readiness signal the DSH web boot prints once Loader is settled and the loopback server is up. */
const WEB_URL_LINE = /dsh web:\s+(http:\/\/127\.0\.0\.1:\d+)/

/** Resolve the loopback base URL for the DSH surface. */
function resolveUrl() {
  const base = process.env.DSH_CONTROL_DESKTOP_URL || DEFAULT_LOOPBACK
  return base.endsWith('/') ? base : `${base}/`
}

/** Isolated DSH home used when the desktop shell self-hosts (defaults to `~/.dsh-desktop`). */
function resolveSelfHome() {
  return process.env.DSH_DESKTOP_HOME || `${process.env.USERPROFILE || process.env.HOME || '.'}\\.dsh-desktop`
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
 * Uses the system Node.js (`DSH_DESKTOP_NODE`, default `node`). The Electron
 * binary in Node mode does not match the harness's native-module ABI for the
 * directory-picker dependency, so an installed app will bundle/path a matching
 * Node in a later packaging phase.
 * @returns `{ child, urlPromise }` where `urlPromise` resolves to the loopback URL once ready.
 */
function startSelfHost() {
  const dir = resolveHarnessDir()
  const nodeBin = process.env.DSH_DESKTOP_NODE || 'node'
  const env = {
    ...process.env,
    DSH_HOME: resolveSelfHome(),
  }
  const child = spawn(
    nodeBin,
    ['--import', 'tsx/esm', 'apps/cli/src/bin.ts', 'web', '--port', '0'],
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
      resolveReady(match[1])
    })
    // Drain stderr so a blocked pipe never stalls the child.
    child.stderr?.on('data', () => {})
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

  return { child, urlPromise }
}

function resolveHarnessDir() {
  return process.env.DSH_HARNESS_DIR || DEFAULT_HARNESS_DIR
}

let mainWindow = null
/** Self-hosted DSH surface child, owned and torn down with the app. */
let activeChild = null

function createWindow(url) {
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
      sandbox: true,
    },
  })
  mainWindow.setMenuBarVisibility(false)
  mainWindow.loadURL(url)
  if (smoke) {
    // E2E smoke: report surface load, then exit so CI/a driver can assert.
    // `SMOKE_SURFACE_ONLY=1` asserts the surface came up (self-host on a fresh
    // home has no Control Center bundle yet); otherwise it also requires the
    // Control Center trigger to be mounted in the renderer.
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

  const url = resolveUrl()

  // Second-instance focus the existing window.
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  await app.whenReady()

  let surfaceUrl = url
  if (await isListening(url)) {
    console.log(`[desktop] surface already listening at ${url}`)
  } else {
    // No external surface: self-host a dedicated loopback one (free port via --port 0).
    console.log(`[desktop] no DSH surface at ${url}; self-hosting…`)
    try {
      const { child, urlPromise } = startSelfHost()
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
          '请确认 DSH_HARNESS_DIR 指向 deepseek-harness 目录（或用 DSH_CONTROL_DESKTOP_URL 手动指定一个已运行的 surface），' +
          '然后重新打开应用。',
      )
      app.quit()
      return
    }
  }

  createWindow(surfaceUrl)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(surfaceUrl)
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
