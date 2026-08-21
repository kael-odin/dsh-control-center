import { describe, expect, it, vi } from 'vitest'
import {
  createNativeMenuDisposer, createNativeMenuModel, isNativeMenuCommand, validateNativeMenuModel,
} from '../src/client/native-menu-contract.ts'

describe('native menu contract', () => {
  it('creates a bounded JSON-safe model with an allowlisted command set', () => {
    const model = createNativeMenuModel('settings-test', { selection: 'x'.repeat(5000) })
    expect(model.context.selection).toHaveLength(4096)
    expect(model.items.some(item => item.type === 'command' && item.command === 'app.settings.open')).toBe(true)
    expect(isNativeMenuCommand('window.execute')).toBe(false)
    expect(() => validateNativeMenuModel(model)).not.toThrow()
  })

  it('rejects commands outside the allowlist', () => {
    expect(() => validateNativeMenuModel({
      id: 'bad', location: 'webcontents.context', context: {},
      items: [{ type: 'command', command: 'eval', label: 'bad', enabled: true }],
    })).toThrow('not allowlisted')
  })

  it('disposes a native menu exactly once', () => {
    const dispose = vi.fn()
    const disposer = createNativeMenuDisposer(dispose)
    disposer()
    disposer()
    expect(dispose).toHaveBeenCalledTimes(1)
  })
})
