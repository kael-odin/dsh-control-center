/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InputHistoryButton, type InputHistoryProps } from '../src/client/InputHistoryButton.tsx'

function identityT(key: string): string {
  return key
}

function userEvent(text: string) {
  return { event: { type: 'user/message', data: { content: [{ type: 'text', text }] } } }
}

function makeFixture(options: {
  events?: ReadonlyArray<ReturnType<typeof userEvent>>
  historyError?: boolean
  draft?: string
} = {}) {
  const history = {
    history: vi.fn(async () => {
      if (options.historyError === true) return { ok: false as const, error: { message: 'session gone' } }
      return { ok: true as const, value: { events: options.events ?? [userEvent('earlier prompt')] } }
    }),
  }
  const setDraft = vi.fn()
  const props = {
    sessionId: 'session-1',
    input: { draft: options.draft ?? '' } as never,
    useInput: ((selector: (state: { draft: string }) => unknown) =>
      selector({ draft: options.draft ?? '' })) as never,
    inputActions: { setDraft } as never,
    history,
    t: identityT,
  } as never
  return { props, setDraft, history }
}

describe('InputHistoryButton composer entry', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => { cleanup() })

  it('lists recent prompts and recalls one into the draft', async () => {
    const { props, setDraft, history } = makeFixture({
      events: [userEvent('newest prompt'), userEvent('older prompt')],
    })
    render(<InputHistoryButton {...props} />)
    fireEvent.click(screen.getByLabelText('inputHistory'))
    const item = await screen.findByRole('button', { name: 'newest prompt' })
    expect(history.history).toHaveBeenCalledWith({ sessionId: 'session-1', maxMessages: 100 })
    fireEvent.click(item)
    await waitFor(() => expect(setDraft).toHaveBeenCalledWith('newest prompt'))
  })

  it('shows the empty hint when the session has no sent messages', async () => {
    const { props } = makeFixture({ events: [] })
    render(<InputHistoryButton {...props} />)
    fireEvent.click(screen.getByLabelText('inputHistory'))
    expect(await screen.findByText('noHistory')).toBeTruthy()
  })

  it('surfaces a history failure honestly', async () => {
    const { props } = makeFixture({ historyError: true })
    render(<InputHistoryButton {...props} />)
    fireEvent.click(screen.getByLabelText('inputHistory'))
    expect(await screen.findByRole('alert')).toBeTruthy()
  })
})
