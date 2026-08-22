/**
 * DesktopService — real-HTTP integration over the native bridge.
 *
 * A real `node:http` server mimics the Electron main's /dsh-native/* micro-service;
 * the bridge env vars are set before each `DesktopService` construction (the
 * constructor snapshots `DSH_DESKTOP_NATIVE_URL`/`DSH_DESKTOP_NATIVE_TOKEN`) and
 * restored afterwards. No mocks: every assertion goes through the actual fetch
 * path the host uses in production.
 */
import { createServer, type Server } from 'node:http'
import { Context } from '@deepseek-ai/cordis'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DesktopService } from '../src/desktop.ts'

const BRIDGE_URL_ENV = 'DSH_DESKTOP_NATIVE_URL'
const BRIDGE_TOKEN_ENV = 'DSH_DESKTOP_NATIVE_TOKEN'

let server: Server
let receivedAuth: string | undefined
let requests: Array<{ path: string; body: Record<string, unknown> }> = []

function bridgeUrl(): string {
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('unexpected server address')
  return `http://127.0.0.1:${address.port}`
}

async function listen(): Promise<void> {
  server = createServer((req, res) => {
    receivedAuth = req.headers.authorization
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk as Buffer))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      const body = raw === '' ? {} : JSON.parse(raw) as Record<string, unknown>
      requests.push({ path: req.url ?? '', body })
      const url = new URL(req.url || '/', 'http://127.0.0.1')
      res.setHeader('content-type', 'application/json')
      if (req.method === 'GET' && url.pathname === '/dsh-native/status') {
        res.end(JSON.stringify({ ok: true, shell: true, electron: '42.0.0', node: '24.0.0', trayActive: true, hotkey: 'CommandOrControl+Shift+Space', hotkeyRegistered: true }))
        return
      }
      if (req.method === 'POST' && url.pathname === '/dsh-native/fonts') { res.end(JSON.stringify({ ok: true, fonts: ['Arial', '微软雅黑'] })); return }
      if (req.method === 'POST' && url.pathname === '/dsh-native/menu') { res.end(JSON.stringify({ ok: true, action: null })); return }
      if (req.method === 'POST' && url.pathname === '/dsh-native/zoom') { res.end(JSON.stringify({ ok: true, zoom: 1.1 })); return }
      if (req.method === 'POST' && url.pathname === '/dsh-native/relaunch') { res.end(JSON.stringify({ ok: true })); return }
      if (req.method === 'POST' && url.pathname === '/dsh-native/fileDialog') { res.end(JSON.stringify({ ok: true, canceled: false, filePaths: ['C:/docs/a.md'] })); return }
      if (req.method === 'POST' && url.pathname === '/dsh-native/readFile') { res.end(JSON.stringify({ ok: true, name: 'a.md', contentBase64: 'YWJj', mediaType: 'text/markdown' })); return }
      if (req.method === 'POST' && url.pathname === '/dsh-native/notify') { res.end(JSON.stringify({ ok: true, supported: true })); return }
      res.statusCode = 404
      res.end(JSON.stringify({ ok: false, error: 'not found' }))
    })
  })
  await new Promise<void>((resolveReady) => server.listen(0, '127.0.0.1', resolveReady))
}

async function closeServer(): Promise<void> {
  await new Promise<void>((resolveClose) => {
    if (!server.listening) { resolveClose(); return }
    server.close(() => resolveClose())
  })
}

describe('DesktopService native bridge', () => {
  beforeEach(async () => {
    requests = []
    receivedAuth = undefined
    await listen()
  })

  afterEach(async () => {
    delete process.env[BRIDGE_URL_ENV]
    delete process.env[BRIDGE_TOKEN_ENV]
    await closeServer()
  })

  it('check() reports the bridge status and authenticates with the bearer token', async () => {
    process.env[BRIDGE_URL_ENV] = bridgeUrl()
    process.env[BRIDGE_TOKEN_ENV] = 'test-token'
    const service = new DesktopService(new Context())

    const status = await service.check()

    expect(status).toEqual({
      supported: true,
      electron: '42.0.0',
      node: '24.0.0',
      trayActive: true,
      hotkey: 'CommandOrControl+Shift+Space',
      hotkeyRegistered: true,
    })
    expect(receivedAuth).toBe('Bearer test-token')
  })

  it('proxies fonts/adjustZoom/notify/pickFile/readFile with the right path and body', async () => {
    process.env[BRIDGE_URL_ENV] = bridgeUrl()
    process.env[BRIDGE_TOKEN_ENV] = 'test-token'
    const service = new DesktopService(new Context())

    const fonts = await service.fonts()
    expect(fonts).toEqual({ ok: true, fonts: ['Arial', '微软雅黑'] })
    expect(requests[0]?.path).toBe('/dsh-native/fonts')

    const zoom = await service.adjustZoom(0.1, false)
    expect(zoom).toEqual({ ok: true, zoom: 1.1 })
    expect(requests[1]?.path).toBe('/dsh-native/zoom')
    expect(requests[1]?.body).toEqual({ delta: 0.1, reset: false })

    const notify = await service.notify('标题', '内容')
    expect(notify).toEqual({ ok: true, supported: true })
    expect(requests[2]?.path).toBe('/dsh-native/notify')
    expect(requests[2]?.body).toEqual({ title: '标题', body: '内容' })

    const picked = await service.pickFile(['openFile', 'multiSelections'])
    expect(picked).toEqual({ ok: true, canceled: false, filePaths: ['C:/docs/a.md'] })
    expect(requests[3]?.path).toBe('/dsh-native/fileDialog')
    expect(requests[3]?.body).toEqual({ properties: ['openFile', 'multiSelections'] })

    const read = await service.readFile('C:/docs/a.md')
    expect(read).toEqual({ ok: true, name: 'a.md', contentBase64: 'YWJj', mediaType: 'text/markdown' })
    expect(requests[4]?.path).toBe('/dsh-native/readFile')
    expect(requests[4]?.body).toEqual({ path: 'C:/docs/a.md' })
  })

  it('menu()/relaunch() proxy through the bridge', async () => {
    process.env[BRIDGE_URL_ENV] = bridgeUrl()
    process.env[BRIDGE_TOKEN_ENV] = 'test-token'
    const service = new DesktopService(new Context())

    const menu = await service.menu({ id: 'x', location: 'webcontents.context', context: {}, items: [] })
    expect(menu).toEqual({ ok: true, action: null })
    expect(requests[0]?.path).toBe('/dsh-native/menu')
    expect(requests[0]?.body).toEqual({ model: { id: 'x', location: 'webcontents.context', context: {}, items: [] } })

    const relaunch = await service.relaunch()
    expect(relaunch).toEqual({ ok: true })
    expect(requests[1]?.path).toBe('/dsh-native/relaunch')
  })

  it('honestly reports unsupported when the bridge env is absent (web profile)', async () => {
    delete process.env[BRIDGE_URL_ENV]
    delete process.env[BRIDGE_TOKEN_ENV]
    const service = new DesktopService(new Context())

    const status = await service.check()
    expect(status.supported).toBe(false)

    const read = await service.readFile('C:/docs/a.md')
    expect(read.ok).toBe(false)
    expect(read.error).toBe('desktop native bridge is not reachable')
  })

  it('honestly reports unsupported when the bridge env is set but the server is down', async () => {
    process.env[BRIDGE_URL_ENV] = 'http://127.0.0.1:1'
    process.env[BRIDGE_TOKEN_ENV] = 'test-token'
    const service = new DesktopService(new Context())

    const status = await service.check()
    expect(status).toEqual({ supported: false, error: 'desktop native bridge is not reachable' })
  })
})
