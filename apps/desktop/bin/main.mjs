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
import { setTimeout as delay } from 'node:timers/promises'

const DEFAULT_LOOPBACK = 'http://127.0.0.1:3080/'
const DEFAULT_HARNESS_DIR = process.env.DSH_HARNESS_DIR || undefined

/** Resolve the loopback base URL for the DSH surface. */
function resolveUrl() {
  const base = process.env.DSH_CONTROL_DESKTOP_URL || DEFAULT_LOOPBACK
  return base.endsWith('/') ? base : `${base}/`
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
 * Spawn the DSH harness Web boot so the loopback surface comes up on its own.
 * Honest best-effort: if no harness root is resolvable we leave it to the user
 * to start `dsh web` and surface the discovery error.
 */
function spawnHostSelf() {
  const dir = resolveHarnessDir()
  if (!dir) throw new Error('no DSH harness root (set DSH_HARNESS_DIR)')
  const child = spawn(
    process.execPath,
    ['--import', 'tsx/esm', 'apps/cli/src/bin.ts', 'web'],
    { cwd: dir, stdio: 'ignore', shell: false, detached: false },
  )
  return child
}

function resolveHarnessDir() {
  if (DEFAULT_HARNESS_DIR) return DEFAULT_HARNESS_DIR
  if (process.env.DSH_HARNESS_DIR) return process.env.DSH_HARNESS_DIR
  return undefined
}

/** Poll a DSH surface until it answers (bounded). */
async function waitForSurface(url, deadlineMs) {
  const deadline = Date.now() + deadlineMs
  while (Date.now() < deadline) {
    if (await isListening(url)) return true
    await delay(500)
  }
  return false
}

let mainWindow = null

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
    mainWindow.webContents.on('did-finish-load', async () => {
      console.log('[desktop] SURFACE_LOADED')
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

  let child = null
  if (await isListening(url)) {
    console.log(`[desktop] surface already listening at ${url}`)
  } else {
    // Attempt a self-hosted boot; on failure surface an honest error.
    try {
      child = spawnHostSelf()
      console.log(`[desktop] spawned DSH host; waiting for ${url}`)
    } catch (err) {
      console.error(`[desktop] ${err.message}`)
    }
    const deadlineMs = Number(process.env.DSH_CONTROL_DESKTOP_READY_MS || 60000)
    const up = await waitForSurface(url, deadlineMs)
    if (!up) {
      dialog.showErrorBox(
        '无法连接 DSH 服务',
        `桌面壳无法在本机下方服务监听：\n\n  ${url}\n\n` +
          '请在控制台先启动 `dsh web`（或设置 DSH_HARNESS_DIR / DSH_CONTROL_DESKTOP_URL），' +
          '然后重新打开应用。',
      )
      app.quit()
      return
    }
  }

  createWindow(url)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(url)
  })
}

app.on('window-all-closed', () => {
  // Quit unless we own an alive host child (its lifecycle is managed later).
  app.quit()
})

boot().catch((err) => {
  console.error('[desktop] fatal boot error:', err)
  dialog.showErrorBox('DSH Control Center 启动失败', String((err && err.message) || err))
  app.exit(1)
})
