/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  QuickPhrasesButton,
  phrasesOf,
  type ComposerSettingsFace,
} from '../src/client/QuickPhrasesButton.tsx'

function identityT(key: string): string {
  return key
}

function makeFixture(options: {
  phrases?: ReadonlyArray<{ label: string; text: string }>
  draft?: string
  mutateError?: boolean
} = {}) {
  const storedPhrases = options.phrases ?? [{ label: '问候', text: '请用一句话回答：' }]
  let revision = 7
  const describe = vi.fn(async () => ({
    ok: true as const,
    value: { namespaces: [{ ns: 'control-center-composer', revision, value: { phrases: structuredClone(storedPhrases) } }] },
  }))
  const mutate = vi.fn(async (ns: string, ops: ReadonlyArray<{ op: string; value?: unknown }>) => {
    if (options.mutateError === true) return { ok: false as const, error: { message: 'read-only' } }
    const set = ops.find(op => op.op === 'set')
    storedPhrases.splice(0, storedPhrases.length, ...((set?.value as typeof storedPhrases) ?? []))
    revision++
    return { ok: true as const, value: { revision } }
  })
  const settings: ComposerSettingsFace = { describe, mutate } as unknown as ComposerSettingsFace
  const setDraft = vi.fn()
  const props = {
    session: { sessionId: 'session-1' } as never,
    input: { draft: options.draft ?? '' } as never,
    useInput: ((selector: (state: { draft: string }) => unknown) =>
      selector({ draft: options.draft ?? '' })) as never,
    inputActions: { setDraft } as never,
    settings,
    t: identityT,
  } as never
  return { props, setDraft, describe, mutate }
}

describe('phrasesOf', () => {
  it('drops malformed rows and keeps well-formed pairs', () => {
    expect(phrasesOf({ phrases: [
      { label: 'a', text: 'x' },
      { label: '', text: 'y' },
      { label: 'b' },
      null,
      'junk',
    ] })).toEqual([{ label: 'a', text: 'x' }])
    expect(phrasesOf(undefined)).toEqual([])
    expect(phrasesOf({ phrases: 'junk' })).toEqual([])
  })
})

describe('QuickPhrasesButton composer entry', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => { cleanup() })

  it('lists stored phrases and appends the picked one to the draft', async () => {
    const { props, setDraft } = makeFixture({ draft: '已有草稿' })
    render(<QuickPhrasesButton {...props} />)
    fireEvent.click(screen.getByLabelText('quickPhrases'))
    const item = await screen.findByRole('button', { name: '问候' })
    fireEvent.click(item)
    await waitFor(() => {
      expect(setDraft).toHaveBeenCalledWith('已有草稿\n请用一句话回答：')
    })
    // The popover closes after insertion.
    expect(screen.queryByRole('button', { name: '问候' })).toBeNull()
  })

  it('replaces an empty draft verbatim', async () => {
    const { props, setDraft } = makeFixture({ draft: '' })
    render(<QuickPhrasesButton {...props} />)
    fireEvent.click(screen.getByLabelText('quickPhrases'))
    fireEvent.click(await screen.findByRole('button', { name: '问候' }))
    await waitFor(() => {
      expect(setDraft).toHaveBeenCalledWith('请用一句话回答：')
    })
  })

  it('adds a phrase through a revision-guarded namespace write', async () => {
    const { props, mutate } = makeFixture()
    render(<QuickPhrasesButton {...props} />)
    fireEvent.click(screen.getByLabelText('quickPhrases'))
    fireEvent.change(await screen.findByLabelText('phraseLabel'), { target: { value: '总结' } })
    fireEvent.change(screen.getByLabelText('phraseText'), { target: { value: '请总结上文' } })
    fireEvent.click(screen.getByLabelText('addPhrase'))
    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        'control-center-composer',
        [{ op: 'set', path: ['phrases'], value: [
          { label: '问候', text: '请用一句话回答：' },
          { label: '总结', text: '请总结上文' },
        ] }],
        7,
      )
    })
    expect(await screen.findByRole('button', { name: '总结' })).toBeTruthy()
  })

  it('deletes a phrase', async () => {
    const { props, mutate } = makeFixture({ phrases: [
      { label: '一', text: 'a' },
      { label: '二', text: 'b' },
    ] })
    render(<QuickPhrasesButton {...props} />)
    fireEvent.click(screen.getByLabelText('quickPhrases'))
    fireEvent.click(await screen.findByLabelText('deletePhrase 二'))
    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        'control-center-composer',
        [{ op: 'set', path: ['phrases'], value: [{ label: '一', text: 'a' }] }],
        7,
      )
    })
  })

  it('surfaces a rejected write without losing the editor', async () => {
    const { props } = makeFixture({ mutateError: true })
    render(<QuickPhrasesButton {...props} />)
    fireEvent.click(screen.getByLabelText('quickPhrases'))
    fireEvent.change(await screen.findByLabelText('phraseLabel'), { target: { value: 'x' } })
    fireEvent.change(screen.getByLabelText('phraseText'), { target: { value: 'y' } })
    fireEvent.click(screen.getByLabelText('addPhrase'))
    expect((await screen.findByRole('alert')).textContent).toContain('read-only')
  })
})
