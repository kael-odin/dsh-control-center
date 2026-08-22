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
})
