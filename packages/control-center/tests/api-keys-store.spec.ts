import { describe, expect, it, vi } from 'vitest'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsSchemaOperations } from '../src/client/schema-operations.ts'
import { ApiKeysController, firstEnabledRef, nextSlotNumber, readSlots, slotRefOf } from '../src/client/api-keys-store.ts'

const schema: SettingsSchemaOperations = {
  rehydrate: serialized => serialized as never,
  validate: () => undefined,
  nodeAtPath: () => undefined,
  getPath: (value, path) => {
    let current: unknown = value
    for (const key of path) {
      if (typeof current !== 'object' || current === null) return undefined
      current = (current as Record<string, unknown>)[key]
    }
    return current
  },
  hasPath: () => false,
  setPath: () => ({}),
  deletePath: () => ({}),
}

function ok<T>(value: T) {
  return { ok: true as const, value }
}

describe('slotRefOf', () => {
  it('returns the base ref for slot 1 and a numbered ref beyond', () => {
    expect(slotRefOf('ACME_API_KEY', 1)).toBe('ACME_API_KEY')
    expect(slotRefOf('ACME_API_KEY', 2)).toBe('ACME_API_KEY__SLOT_2')
    expect(slotRefOf('ACME_API_KEY', 5)).toBe('ACME_API_KEY__SLOT_5')
  })
})

describe('nextSlotNumber', () => {
  it('returns 2 for an empty list', () => {
    expect(nextSlotNumber([])).toBe(2)
  })
  it('scans beyond the highest existing slot', () => {
    expect(nextSlotNumber([
      { ref: 'BASE', label: '', isEnabled: true },
      { ref: 'BASE__SLOT_3', label: '', isEnabled: false },
    ])).toBe(4)
  })
  it('ignores refs that are not numbered slots', () => {
    expect(nextSlotNumber([
      { ref: 'BASE', label: '', isEnabled: true },
      { ref: 'OTHER', label: '', isEnabled: true },
    ])).toBe(2)
  })
})

describe('firstEnabledRef', () => {
  it('returns the first enabled slot', () => {
    expect(firstEnabledRef([
      { ref: 'A', label: '', isEnabled: false },
      { ref: 'B', label: '', isEnabled: true },
      { ref: 'C', label: '', isEnabled: true },
    ])).toBe('B')
  })
  it('returns undefined when none are enabled', () => {
    expect(firstEnabledRef([{ ref: 'A', label: '', isEnabled: false }])).toBeUndefined()
  })
  it('returns undefined on empty list', () => {
    expect(firstEnabledRef([])).toBeUndefined()
  })
})

describe('readSlots', () => {
  it('reads valid slots and skips junk', () => {
    expect(readSlots({
      providers: {
        acme: {
          slots: [
            { ref: 'A', label: 'first', isEnabled: true },
            { ref: 'B', label: 'second', isEnabled: false },
            null,
            { ref: '' },
            { not_ref: 'C' },
          ],
        },
      },
    }, schema, 'acme')).toEqual([
      { ref: 'A', label: 'first', isEnabled: true },
      { ref: 'B', label: 'second', isEnabled: false },
    ])
  })
  it('returns empty array for missing provider', () => {
    expect(readSlots({}, schema, 'missing')).toEqual([])
  })
})

describe('ApiKeysController', () => {
  it('loads slots joined with credential state and detects the active binding', async () => {
    const api = {
      settings: {
        describe: vi.fn(async () => ok({
          writable: true, hasDocument: true,
          namespaces: [
            { ns: 'control-center-api-keys', schema: {}, revision: 3, value: { providers: { acme: { slots: [{ ref: 'A', label: 'key1', isEnabled: true }] } } } },
            { ns: 'llm-pi-ai', schema: {}, revision: 5, value: { providers: { acme: { apiKeyEnv: 'A', models: [] } } } },
          ],
        })),
        mutate: vi.fn(),
      },
      credentials: {
        describe: vi.fn(async () => ok({ A: { configured: true, writable: true } })),
      },
    } as unknown as Pick<ClientRemote, 'settings' | 'credentials'>
    const controller = new ApiKeysController({
      api, schema,
      namespaceValue: { providers: { acme: { apiKeyEnv: 'A', models: [] } } },
      namespaceRevision: 5,
      settingsPath: ['providers', 'acme'],
      baseRef: 'A',
      providerId: 'acme',
    })
    const state = await controller.load()
    expect(state.slots).toHaveLength(1)
    expect(state.slots[0]).toMatchObject({ ref: 'A', label: 'key1', isEnabled: true, configured: true, active: true })
    expect(state.boundRef).toBe('A')
    expect(state.keysRevision).toBe(3)
    expect(state.profileRevision).toBe(5)
  })

  it('shows the implicit single-key slot when no metadata exists yet', async () => {
    const api = {
      settings: {
        describe: vi.fn(async () => ok({
          writable: true, hasDocument: true,
          namespaces: [
            { ns: 'llm-pi-ai', schema: {}, revision: 2, value: { providers: { demo: { apiKeyEnv: 'DEMO_API_KEY', models: [] } } } },
          ],
        })),
        mutate: vi.fn(),
      },
      credentials: {
        describe: vi.fn(async () => ok({ DEMO_API_KEY: { configured: true, writable: true } })),
      },
    } as unknown as Pick<ClientRemote, 'settings' | 'credentials'>
    const controller = new ApiKeysController({
      api, schema,
      namespaceValue: { providers: { demo: { apiKeyEnv: 'DEMO_API_KEY', models: [] } } },
      namespaceRevision: 2,
      settingsPath: ['providers', 'demo'],
      baseRef: 'DEMO_API_KEY',
      providerId: 'demo',
    })
    const state = await controller.load()
    expect(state.slots).toHaveLength(1)
    expect(state.slots[0]!.ref).toBe('DEMO_API_KEY')
    expect(state.slots[0]!.active).toBe(true)
    expect(state.slots[0]!.configured).toBe(true)
  })
})
