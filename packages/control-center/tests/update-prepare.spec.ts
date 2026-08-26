import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { UpdateService } from '../src/update.ts'

const realFetch = globalThis.fetch

afterEach(() => { globalThis.fetch = realFetch })

function makeCtx(storage?: unknown): Context {
  const ctx = new Context()
  if (storage !== undefined) {
    ;(ctx as unknown as Record<string, unknown>).storageDomain = storage
  }
  return ctx
}

describe('UpdateService prepareUpdate (§2.A)', () => {
  it('downloads the control-center tgz asset and stores it in storage-domain', async () => {
    const stored = new Map<string, unknown>()
    const fakeStorage = {
      open: async () => ({
        table: () => ({
          put: async (key: string, value: unknown) => { stored.set(key, value) },
          get: (key: string) => stored.get(key),
        }),
      }),
    }
    const tarball = Buffer.from('fake-tarball-bytes')
    globalThis.fetch = vi.fn(async (input: string | URL) => {
      const url = String(input)
      if (url.includes('/releases/latest')) {
        return { ok: true, status: 200, json: async () => ({
          tag_name: 'v0.2.0',
          assets: [
            { name: 'notes.md', browser_download_url: 'https://example/notes.md' },
            { name: 'dsh-control-center-control-center-0.2.0.tgz', browser_download_url: 'https://example/bundle.tgz' },
          ],
        }) }
      }
      if (url === 'https://example/bundle.tgz') {
        return { ok: true, status: 200, arrayBuffer: async () => tarball.buffer.slice(tarball.byteOffset, tarball.byteOffset + tarball.byteLength) }
      }
      throw new Error(`unexpected ${url}`)
    }) as unknown as typeof fetch

    const service = new UpdateService(makeCtx(fakeStorage))
    const result = await service.prepareUpdate()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.version).toBe('0.2.0')
    expect(result.value.assetName).toBe('dsh-control-center-control-center-0.2.0.tgz')
    expect(result.value.bytes).toBe(tarball.byteLength)

    const record = stored.get('latest') as { version: string; dataBase64: string; bytes: number }
    expect(record.version).toBe('0.2.0')
    expect(Buffer.from(record.dataBase64, 'base64').toString()).toBe('fake-tarball-bytes')

    const prepared = await service.getPreparedUpdate()
    expect(prepared).toEqual({ ok: true, value: result.value })
  })

  it('refuses when no tgz asset exists', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ tag_name: 'v0.2.0', assets: [{ name: 'notes.md', browser_download_url: 'https://example/notes.md' }] }),
    })) as unknown as typeof fetch

    const service = new UpdateService(makeCtx())
    const result = await service.prepareUpdate()
    expect(result).toMatchObject({ ok: false })
  })

  it('errors honestly without storage-domain', async () => {
    const tarball = Buffer.from('x')
    globalThis.fetch = vi.fn(async (input: string | URL) => {
      const url = String(input)
      if (url.includes('/releases/latest')) {
        return { ok: true, status: 200, json: async () => ({
          tag_name: 'v0.3.0',
          assets: [{ name: 'dsh-control-center-control-center-0.3.0.tgz', browser_download_url: 'https://example/b.tgz' }],
        }) }
      }
      return { ok: true, status: 200, arrayBuffer: async () => tarball.buffer.slice(0, tarball.byteLength) }
    }) as unknown as typeof fetch

    const service = new UpdateService(makeCtx())
    const result = await service.prepareUpdate()
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('storage-domain') })
  })

  it('installs the prepared bundle through the host plugin-add pipeline', async () => {
    const stored = new Map<string, unknown>()
    const fakeStorage = {
      open: async () => ({
        table: () => ({
          put: async (key: string, value: unknown) => { stored.set(key, value) },
          get: (key: string) => stored.get(key),
        }),
      }),
    }
    let installSpec = ''
    const manageCalls: Array<{ profile: string; operation: string; spec: string }> = []
    const service = new UpdateService(makeCtx(fakeStorage))
    // Seed a prepared bundle directly through prepareUpdate's storage path.
    stored.set('latest', {
      version: '0.9.9', assetName: 'dsh-control-center-control-center-0.9.9.tgz',
      bytes: 3, dataBase64: Buffer.from('abc').toString('base64'), downloadedAt: new Date().toISOString(),
    })
    const realGet = (service as unknown as { ctx: Context }).ctx.get.bind((service as unknown as { ctx: Context }).ctx)
    ;((service as unknown as { ctx: Context }).ctx as unknown as { get: unknown }).get = (name: string) => (
      name === 'controlCenterSystem'
        ? { managePlugin: async (profile: string, operation: 'add' | 'remove' | 'update', spec: string) => {
            manageCalls.push({ profile, operation, spec })
            installSpec = spec
            return { exitCode: 0, stdout: 'installed', stderr: '' }
          } }
        : realGet(name)
    )

    const result = await service.installPreparedUpdate()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.exitCode).toBe(0)
    expect(result.value.version).toBe('0.9.9')
    expect(manageCalls).toEqual([{ profile: 'default', operation: 'add', spec: installSpec }])
    expect(installSpec).toContain('.dsh')
    expect(installSpec).toContain('updates')
    expect(installSpec).toContain('file:')
  })

  it('refuses installation when nothing was downloaded', async () => {
    const fakeStorage = {
      open: async () => ({
        table: () => ({ put: async () => {}, get: () => undefined }),
      }),
    }
    const service = new UpdateService(makeCtx(fakeStorage))
    const result = await service.installPreparedUpdate()
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('没有已下载的更新包') })
  })
})
