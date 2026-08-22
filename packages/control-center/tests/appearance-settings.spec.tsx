/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppearanceSection } from '../src/client/AppearanceSection.tsx'

const defaults = { colorPrimary: '#00b96b', fontFamily: '', codeFontFamily: '', customCss: '' }

// These tests exercise settings behavior only; stub the desktop bridge as
// not-ready so the desktop-only probes never fire (they are covered by
// desktop.spec.ts and the desktop smoke).
const useDesktopReady = (): boolean => false
const getDesktop = () => { throw new Error('desktop bridge must not be used in appearance settings tests') }

function api(value = defaults, revision = 4) {
  const mutate = vi.fn(async () => ({ result: { ok: true, value: { revision: revision + 1 } } }))
  return {
    client: {
      settings: {
        describe: vi.fn(async () => ({ result: { ok: true, value: { namespaces: [
          { ns: 'ui-theme', value: { preference: 'system' }, revision: 1 },
          { ns: 'control-center-appearance', value, revision },
        ] } } })),
        mutate,
      },
    } as never,
    mutate,
  }
}

describe('AppearanceSection authoritative settings', () => {
  beforeEach(() => {
    localStorage.clear()
    document.getElementById('cc-theme-overrides')?.remove()
  })

  it('loads DSH values and persists a color with the current revision', async () => {
    const fixture = api({ ...defaults, colorPrimary: '#EF4444' })
    render(<AppearanceSection api={fixture.client} useDesktopReady={useDesktopReady} getDesktop={getDesktop} />)

    const hex = await screen.findByDisplayValue('#EF4444')
    await waitFor(() => { expect((hex as HTMLInputElement).disabled).toBe(false) })
    fireEvent.change(hex, { target: { value: '#3B82F6' } })
    fireEvent.blur(hex)

    await waitFor(() => {
      expect(fixture.mutate).toHaveBeenCalledWith({
        ns: 'control-center-appearance',
        ops: [{ op: 'set', path: ['colorPrimary'], value: '#3B82F6' }],
        expectedRevision: 4,
      })
    })
    expect(document.getElementById('cc-theme-overrides')?.textContent).toContain('#3B82F6')
    expect(localStorage.getItem('cc.theme.overrides')).toBeNull()
  })

  it('rolls back the preview and field after a rejected write', async () => {
    const fixture = api({ ...defaults, colorPrimary: '#EF4444' })
    fixture.mutate.mockResolvedValueOnce({ result: { ok: false, error: { message: 'revision conflict' } } } as never)
    render(<AppearanceSection api={fixture.client} useDesktopReady={useDesktopReady} getDesktop={getDesktop} />)

    const hex = await screen.findByDisplayValue('#EF4444')
    await waitFor(() => { expect((hex as HTMLInputElement).disabled).toBe(false) })
    fireEvent.change(hex, { target: { value: '#3B82F6' } })
    fireEvent.blur(hex)

    expect((await screen.findByRole('alert')).textContent).toContain('revision conflict')
    expect(screen.getByDisplayValue('#EF4444')).not.toBeNull()
    expect(document.getElementById('cc-theme-overrides')?.textContent).toContain('#EF4444')
  })

  it('uses DSH locale authority for the language selector', async () => {
    const fixture = api()
    const setLocale = vi.fn()
    const locale = {
      getSnapshot: () => ({ active: 'zh', locales: [{ id: 'zh', label: '中文' }, { id: 'en', label: 'English' }], revision: 1 }),
      subscribe: (listener: () => void) => { void listener; return () => {} },
      setLocale,
    } as never
    render(<AppearanceSection api={fixture.client} locale={locale} useDesktopReady={useDesktopReady} getDesktop={getDesktop} />)

    const select = (await screen.findAllByLabelText('语言')).at(-1)!
    fireEvent.change(select, { target: { value: 'en' } })
    expect(setLocale).toHaveBeenCalledWith('en')
  })
  it('migrates legacy localStorage once when DSH remains at defaults', async () => {
    localStorage.setItem('cc.theme.overrides', JSON.stringify({
      colorPrimary: '#8B5CF6', fontFamily: 'Inter', codeFontFamily: 'Fira Code', customCss: '.cc-surface { opacity: .9 }',
    }))
    const fixture = api()
    render(<AppearanceSection api={fixture.client} useDesktopReady={useDesktopReady} getDesktop={getDesktop} />)

    await waitFor(() => {
      expect(fixture.mutate).toHaveBeenCalledWith(expect.objectContaining({
        ns: 'control-center-appearance',
        expectedRevision: 4,
      }))
    })
    await waitFor(() => { expect(localStorage.getItem('cc.theme.overrides')).toBeNull() })
    expect(localStorage.getItem('cc.theme.overrides.migrated-to-dsh')).toBe('1')
    expect(screen.getByDisplayValue('#8B5CF6')).not.toBeNull()
  })
})
