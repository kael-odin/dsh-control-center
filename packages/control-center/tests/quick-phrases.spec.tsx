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

  it('imports a phrases JSON file, merging and skipping duplicates', async () => {
    const { props, mutate } = makeFixture({ phrases: [{ label: '问候', text: '请用一句话回答：' }] })
    render(<QuickPhrasesButton {...props} />)
    fireEvent.click(screen.getByLabelText('quickPhrases'))
    fireEvent.click(await screen.findByRole('button', { name: 'importPhrases' }))
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(
      [JSON.stringify({ phrases: [
        { label: '问候', text: '请用一句话回答：' },
        { label: '翻译', text: '请翻译成英文：' },
        { label: '坏行', text: '' },
      ] })],
      'phrases.json',
      { type: 'application/json' },
    )
    await waitFor(() => { input.files?.length === 1 })
    Object.defineProperty(input, 'files', { value: [file] })
    fireEvent.change(input)
    await waitFor(() => expect(mutate).toHaveBeenCalled())
    const set = mutate.mock.calls[0][1].find((op: { op: string }) => op.op === 'set')
    expect(set.value).toEqual([
      { label: '问候', text: '请用一句话回答：' },
      { label: '翻译', text: '请翻译成英文：' },
    ])
  })

  it('exports the current library as a phrases JSON download', async () => {
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() })
    const created: string[] = []
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string, opts?: never) => {
      const element = originalCreate(tag, opts)
      if (tag === 'a') created.push('anchor')
      return element
    }) as never)
    const { props } = makeFixture({ phrases: [{ label: '问候', text: '请用一句话回答：' }] })
    render(<QuickPhrasesButton {...props} />)
    fireEvent.click(screen.getByLabelText('quickPhrases'))
    fireEvent.click(await screen.findByRole('button', { name: 'exportPhrases' }))
    expect(created).toHaveLength(1)
    vi.restoreAllMocks()
  })

  it('expands {{date}} variables at insert time', async () => {
    const { props, setDraft } = makeFixture({ phrases: [{ label: '今日', text: '今天是 {{date}}（{{week}}）' }] })
    render(<QuickPhrasesButton {...props} />)
    fireEvent.click(screen.getByLabelText('quickPhrases'))
    const item = await screen.findByRole('button', { name: '今日' })
    fireEvent.click(item)
    await waitFor(() => expect(setDraft).toHaveBeenCalled())
    const draft = setDraft.mock.calls[0][0] as string
    expect(draft).toMatch(/^今天是 \d{4}-\d{2}-\d{2}（星期.）$/)
    expect(draft).not.toContain('{{date}}')
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
