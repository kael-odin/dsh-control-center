// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import { removeProviderProfile } from '../src/client/ModelsSection.tsx'

function ok<T>(value: T) {
  return { ok: true as const, value }
}

function fail(message: string) {
  return { ok: false as const, error: { code: 'internal', message, details: {} } }
}

describe('provider removal', () => {
  it('removes the managed credential before the narrow provider path', async () => {
    const order: string[] = []
    const unset = vi.fn(async () => { order.push('credential'); return ok(undefined) })
    const mutate = vi.fn(async () => { order.push('settings'); return ok({ revision: 2 }) })
    const load = vi.fn(async () => {})
    const failure = await removeProviderProfile(
      { credentials: { unset }, settings: { mutate } } as unknown as Pick<ClientRemote, 'settings' | 'credentials'>,
      { load } as never,
      { settingsNs: 'llm-pi-ai', settingsPath: ['providers', 'acme'], credentialRef: 'ACME_API_KEY' },
    )
    expect(failure).toBeUndefined()
    expect(order).toEqual(['credential', 'settings'])
    expect(mutate).toHaveBeenCalledWith('llm-pi-ai', [{ op: 'unset', path: ['providers', 'acme'] }], undefined)
    expect(load).toHaveBeenCalledOnce()
  })

  it('does not hide the provider when credential removal fails', async () => {
    const mutate = vi.fn()
    const failure = await removeProviderProfile(
      { credentials: { unset: vi.fn(async () => fail('locked')) }, settings: { mutate } } as unknown as Pick<ClientRemote, 'settings' | 'credentials'>,
      { load: vi.fn() } as never,
      { settingsNs: 'llm-pi-ai', settingsPath: ['providers', 'acme'], credentialRef: 'ACME_API_KEY' },
    )
    expect(failure).toBe('locked')
    expect(mutate).not.toHaveBeenCalled()
  })
})
