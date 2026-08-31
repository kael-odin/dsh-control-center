import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { DataService, DATA_NAMESPACES } from '../src/data.ts'

describe('DataService', () => {
  function setup() {
    const stored = new Map<string, unknown>()
    const updated: string[] = []
    const ctx = new Context()
    ;(ctx as unknown as { settings: unknown }).settings = {
      get: (ns: string) => stored.get(String(ns)),
      update: async (ns: string, value: object) => {
        updated.push(String(ns))
        stored.set(String(ns), structuredClone(value))
      },
      register: () => {},
    }
    const service = new DataService(ctx)
    return { service, stored, updated }
  }

  it('exports every Control Center namespace, including prefs, channels, and stash', async () => {
    const { service } = setup()
    expect(DATA_NAMESPACES.map(ns => String(ns)).sort()).toEqual([
      'control-center-appearance',
      'control-center-channels',
      'control-center-export',
      'control-center-file-processing',
      'control-center-local-models',
      'control-center-mcp',
      'control-center-model-prefs',
      'control-center-notifications',
      'control-center-provider-stash',
      'control-center-providers',
      'control-center-repos',
      'control-center-s3',
      'control-center-skills',
      'control-center-tasks',
      'control-center-translation',
      'control-center-webdav',
      'control-center-webdav-nutstore',
      'control-center-websearch',
    ])
    const snapshot = await service.exportControlCenter()
    expect(snapshot.version).toBe(1)
    for (const ns of DATA_NAMESPACES) {
      expect(snapshot.namespaces).toHaveProperty(String(ns))
    }
  })

  it('imports only the namespaces a snapshot carries and clears every namespace', async () => {
    const { service, updated } = setup()
    await service.importControlCenter({
      version: 1,
      exportedAt: '2026-08-23T00:00:00.000Z',
      namespaces: { 'control-center-model-prefs': { retryEnabled: true }, 'control-center-channels': { instances: [] } },
    })
    expect(updated.sort()).toEqual(['control-center-channels', 'control-center-model-prefs'])

    updated.length = 0
    await service.clearControlCenter()
    expect(updated).toHaveLength(DATA_NAMESPACES.length)
  })

  it('rejects snapshots without version 1', async () => {
    const { service } = setup()
    await expect(service.importControlCenter({ version: 2 } as never)).rejects.toThrow('Invalid Control Center data snapshot')
  })

  it('round-trips through a local backup file', async () => {
    const { service } = setup()
    const dir = await mkdtemp(join(tmpdir(), 'dsh-data-'))
    try {
      const path = join(dir, 'backup.json')
      await service.exportToFile(path)
      const raw = JSON.parse(await readFile(path, 'utf8')) as { version: number; namespaces: Record<string, unknown> }
      expect(raw.version).toBe(1)
      await expect(service.importFromFile(path)).resolves.toEqual({ absent: true })
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('backs up to a directory and lists backups', async () => {
    const { service } = setup()
    const dir = await mkdtemp(join(tmpdir(), 'dsh-backup-'))
    try {
      const first = await service.backupToDirectory(dir, 2)
      expect(first).toMatch(/dsh-control-center-.*\.json$/)
      const second = await service.backupToDirectory(dir, 2)
      expect(second).not.toBe(first)
      expect(await service.listBackupFiles(dir)).toHaveLength(2)
      // Rotation: with maxBackups=1 a third backup prunes the oldest.
      await service.backupToDirectory(dir, 1)
      const files = await service.listBackupFiles(dir)
      expect(files).toHaveLength(1)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('reports a missing backup directory as an error', async () => {
    const { service } = setup()
    const missing = join(tmpdir(), 'dsh-backup-missing-dir-does-not-exist')
    await expect(service.backupToDirectory(missing, 5)).rejects.toThrow()
  })

  it('round-trips WebDAV config with a write-only password', async () => {
    const { service } = setup()
    // Set a config with a password.
    await service.setWebdavConfig({ host: 'https://example.com', user: 'alice', path: 'backups', pass: 'secret-1' })
    const view = await service.getWebdavConfig()
    expect(view).toEqual({ host: 'https://example.com', user: 'alice', path: 'backups', passSet: true })
    expect(JSON.stringify(view)).not.toContain('secret-1')
    // Empty pass keeps the stored secret.
    await service.setWebdavConfig({ host: 'https://example.com', user: 'alice', path: 'backups', pass: '' })
    expect((await service.getWebdavConfig()).passSet).toBe(true)
    // A new pass replaces it.
    await service.setWebdavConfig({ host: 'https://example.com', user: 'alice', path: 'backups', pass: 'secret-2' })
    expect((await service.getWebdavConfig()).passSet).toBe(true)
  })

  it('exports the WebDAV namespace in a backup', async () => {
    const { service } = setup()
    await service.setWebdavConfig({ host: 'https://example.com', user: 'alice', path: 'backups', pass: 'secret' })
    const snapshot = await service.exportControlCenter()
    const webdavNs = snapshot.namespaces['control-center-webdav'] as { host?: string }
    expect(webdavNs?.host).toBe('https://example.com')
  })

  it('keeps the nutstore vendor config isolated from generic WebDAV', async () => {
    const { service } = setup()
    await service.setWebdavConfig({ host: 'https://dav.jianguoyun.com/dav/', user: 'nut@example.com', path: 'dsh', pass: 'app-pass' }, 'nutstore')
    // Generic WebDAV stays untouched.
    expect(await service.getWebdavConfig()).toEqual({ host: '', user: '', path: '', passSet: false })
    const view = await service.getWebdavConfig('nutstore')
    expect(view).toEqual({ host: 'https://dav.jianguoyun.com/dav/', user: 'nut@example.com', path: 'dsh', passSet: true })
  })

  it('round-trips S3 config without leaking the secret', async () => {
    const { service } = setup()
    await service.setS3Config({
      endpoint: 'https://s3.example.com', bucket: 'backups', region: 'us-east-1',
      accessKeyId: 'AKID', prefix: 'dsh', secret: 'top-secret',
    })
    const view = await service.getS3Config()
    expect(view).toEqual({
      endpoint: 'https://s3.example.com', bucket: 'backups', region: 'us-east-1',
      accessKeyId: 'AKID', prefix: 'dsh', secretSet: true,
    })
    expect(JSON.stringify(view)).not.toContain('top-secret')
    // Empty secret keeps the stored one.
    await service.setS3Config({ endpoint: 'https://s3.example.com', bucket: 'backups', region: 'us-east-1', accessKeyId: 'AKID', prefix: 'dsh', secret: '' })
    expect((await service.getS3Config()).secretSet).toBe(true)
  })

  it('signs S3 requests with AWS SigV4 and reports auth failures honestly', async () => {
    const { service } = setup()
    await service.setS3Config({
      endpoint: 'https://s3.example.com', bucket: 'backups', region: 'us-east-1',
      accessKeyId: 'AKIDEXAMPLE', prefix: '', secret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
    })
    const captured: Array<{ url: string; headers: Record<string, string>; method?: string }> = []
    globalThis.fetch = (async (input: string | URL, init?: { method?: string; headers?: Record<string, string> }) => {
      const url = String(input)
      captured.push({ url, headers: (init?.headers ?? {}) as Record<string, string>, method: init?.method })
      return { ok: true, status: 200, statusText: 'OK', text: async () => '', json: async () => ({}) } as Response
    }) as unknown as typeof fetch

    const result = await service.testS3Connection()
    expect(result.ok).toBe(true)
    expect(captured.length).toBe(1)
    const auth = captured[0]!.headers.Authorization ?? ''
    expect(auth.startsWith('AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/')).toBe(true)
    expect(auth).toContain('/s3/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=')
    expect(captured[0]!.headers['x-amz-date']).toBeDefined()
  })
})
