/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GeneralCherrySettings } from '../src/client/GeneralCherrySettings.tsx'
import type { GeneralSettingsStore, GeneralState } from '../src/client/general-store.ts'
import { en } from '../src/client/locales.ts'

const prefs = {
  launchOnBoot: false,
  trayEnabled: true,
  trayOnClose: false,
  trayOnLaunch: false,
  preventSleepWhenBusy: false,
  developerMode: false,
  contextEnabled: true,
  contextMaxMessages: 24,
  contextToolOutputThreshold: 50_000,
  contextAutoCompress: true,
  contextCompressionProvider: '',
  contextCompressionModel: '',
}

function renderSettings(overrides: Partial<GeneralState['prefs']> = {}) {
  const save = vi.fn(async () => true)
  const controller = {
    load: vi.fn(async () => {}),
    save,
  } as unknown as GeneralSettingsStore
  const state: GeneralState = {
    status: 'ready',
    error: null,
    writeError: null,
    available: true,
    writable: true,
    revision: 3,
    prefs: { ...prefs, ...overrides },
  }
  const useSnapshot = <T,>(selector: (current: GeneralState) => T): T => selector(state)

  render(
    <GeneralCherrySettings
      controller={controller}
      useSnapshot={useSnapshot as never}
      t={key => en[key]}
    />,
  )
  return { save }
}

afterEach(() => { cleanup() })

describe('GeneralCherrySettings context management', () => {
  it('persists the context toggle and numeric policy fields', async () => {
    const { save } = renderSettings()

    const contextSwitch = screen.getByTitle('Enable context management').querySelector('input')!
    fireEvent.click(contextSwitch)
    const maxMessages = screen.getByRole('spinbutton', { name: /^Keep recent messages/ })
    const threshold = screen.getByRole('spinbutton', { name: /^Tool output truncate threshold/ })
    fireEvent.change(maxMessages, { target: { value: '36' } })
    fireEvent.blur(maxMessages)
    fireEvent.change(threshold, { target: { value: '64000' } })
    fireEvent.blur(threshold)

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith('contextEnabled', false)
      expect(save).toHaveBeenCalledWith('contextMaxMessages', 36)
      expect(save).toHaveBeenCalledWith('contextToolOutputThreshold', 64_000)
    })
  })

  it('stores an empty message window as unlimited and rejects unsafe thresholds', async () => {
    const { save } = renderSettings()
    const maxMessages = screen.getByRole('spinbutton', { name: /^Keep recent messages/ })
    const threshold = screen.getByRole('spinbutton', { name: /^Tool output truncate threshold/ })

    fireEvent.change(maxMessages, { target: { value: '' } })
    fireEvent.blur(maxMessages)
    fireEvent.change(threshold, { target: { value: '1999' } })
    fireEvent.blur(threshold)

    await waitFor(() => { expect(save).toHaveBeenCalledWith('contextMaxMessages', null) })
    expect(save).not.toHaveBeenCalledWith('contextToolOutputThreshold', 1_999)
    expect((threshold as HTMLInputElement).value).toBe('50000')
  })

  it('trims and persists the compression route', async () => {
    const { save } = renderSettings()
    const provider = screen.getByRole('textbox', { name: /^Compression provider/ })
    const model = screen.getByRole('textbox', { name: /^Compression model/ })

    fireEvent.change(provider, { target: { value: '  DeepSeek  ' } })
    fireEvent.blur(provider)
    fireEvent.change(model, { target: { value: '  deepseek-chat  ' } })
    fireEvent.blur(model)

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith('contextCompressionProvider', 'DeepSeek')
      expect(save).toHaveBeenCalledWith('contextCompressionModel', 'deepseek-chat')
    })
  })
})
