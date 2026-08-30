import { describe, expect, it, vi } from 'vitest'

import {
  ActionRegistry,
  combineAvailability,
  createActionRegistry,
} from '../src/client/actions/action-registry.ts'

interface Ctx {
  tag: string
  allowed: boolean
}

describe('action registry (Cherry chat/actions port)', () => {
  it('resolves only the requested surface, ordered by order then id', () => {
    const registry = createActionRegistry<Ctx>()
    registry.registerAction({ id: 'b', label: 'b', surface: 'menu', order: 5 })
    registry.registerAction({ id: 'a', label: 'a', surface: 'menu', order: 5 })
    registry.registerAction({ id: 'toolbar-only', label: 't', surface: 'toolbar' })
    const menu = registry.resolve({ tag: '', allowed: true }, 'menu')
    expect(menu.map(action => action.id)).toEqual(['a', 'b'])
    expect(registry.resolve({ tag: '', allowed: true }, 'toolbar').map(action => action.id)).toEqual(['toolbar-only'])
  })

  it('hides invisible actions and disables enabled=false with a reason', async () => {
    const registry = createActionRegistry<Ctx>()
    registry.registerAction({
      id: 'hidden', label: 'hidden', availability: () => false,
    })
    registry.registerAction({
      id: 'locked', label: 'locked', availability: () => ({ visible: true, enabled: false, reason: 'read-only' }),
    })
    const resolved = registry.resolve({ tag: '', allowed: false }, 'menu')
    expect(resolved.map(action => action.id)).toEqual(['locked'])
    expect(resolved[0]?.availability).toEqual({ visible: true, enabled: false, reason: 'read-only' })
    await expect(registry.execute('locked', { tag: '', allowed: false })).rejects.toThrow('read-only')
  })

  it('materializes dynamic children and executes nested actions', async () => {
    const run = vi.fn()
    const registry = new ActionRegistry<Ctx>()
    registry.registerAction({
      id: 'export', label: 'export', children: context => [
        { id: 'export.markdown', label: 'markdown', run },
        ...(context.allowed ? [{ id: 'export.image', label: 'image', run }] : []),
      ],
    })
    const allowed = registry.resolve({ tag: '', allowed: true }, 'menu')
    expect(allowed[0]?.children.map(child => child.id)).toEqual(['export.markdown', 'export.image'])
    await registry.execute('export.image', { tag: '', allowed: true })
    expect(run).toHaveBeenCalledOnce()
    const denied = registry.resolve({ tag: '', allowed: false }, 'menu')
    expect(denied[0]?.children.map(child => child.id)).toEqual(['export.markdown'])
  })

  it('replaces a same-id registration and honors its disposer', () => {
    const registry = createActionRegistry<Ctx>()
    const disposeFirst = registry.registerAction({ id: 'x', label: 'first' })
    registry.registerAction({ id: 'x', label: 'second' })
    expect(registry.resolve({ tag: '', allowed: true }, 'menu')[0]?.label).toBe('second')
    disposeFirst()
    // The stale disposer must not remove the newer registration.
    expect(registry.resolve({ tag: '', allowed: true }, 'menu')).toHaveLength(1)
  })

  it('throws on unknown action ids', async () => {
    const registry = createActionRegistry<Ctx>()
    await expect(registry.execute('nope', { tag: '', allowed: true })).rejects.toThrow('unknown action')
  })
})

describe('combineAvailability', () => {
  it('merges visibility, enabled, and reasons', () => {
    expect(combineAvailability(undefined, undefined)).toEqual({ visible: true, enabled: true })
    expect(combineAvailability(false, true)).toEqual({ visible: false, enabled: false })
    expect(combineAvailability({ visible: true, enabled: false, reason: 'a' }, true))
      .toEqual({ visible: true, enabled: false, reason: 'a' })
    expect(combineAvailability(
      { visible: true, enabled: false, reason: 'a' },
      { visible: true, enabled: false, reason: 'b' },
    )).toEqual({ visible: true, enabled: false, reason: 'a' })
  })
})
