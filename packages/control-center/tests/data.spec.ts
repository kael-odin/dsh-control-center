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
      'control-center-file-processing',
      'control-center-local-models',
      'control-center-mcp',
      'control-center-model-prefs',
      'control-center-notifications',
      'control-center-provider-stash',
      'control-center-providers',
      'control-center-repos',
      'control-center-skills',
      'control-center-tasks',
      'control-center-translation',
      'control-center-webdav',
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
})
