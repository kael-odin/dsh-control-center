import { describe, expect, it } from 'vitest'
import { createNativeMenuModel, validateNativeMenuModel } from '../src/client/native-menu-contract.ts'

describe('native menu endpoint model safety', () => {
  it('keeps the command set finite and nested menus bounded', () => {
    const model = createNativeMenuModel('smoke')
    expect(model.items.every(item => item.type !== 'command' || item.command.startsWith('app.'))).toBe(true)
    expect(() => validateNativeMenuModel(model)).not.toThrow()
  })

  it('rejects oversized menu models before Electron construction', () => {
    expect(() => validateNativeMenuModel({
      id: 'oversized', location: 'webcontents.context', context: {}, items: Array.from({ length: 101 }, () => ({ type: 'separator' })),
    })).toThrow('items are invalid')
  })
})
