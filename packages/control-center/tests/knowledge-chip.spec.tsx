/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KnowledgeChipButton, type KnowledgeChipKnowledgeFace } from '../src/client/KnowledgeChipButton.tsx'

function identityT(key: string): string {
  return key
}

function makeFixture(options: {
  bases?: ReadonlyArray<{ id: string; name: string; sourceCount?: number }>
  listError?: boolean
  draft?: string
  withChips?: boolean
} = {}) {
  const listBases = vi.fn(async () => {
    if (options.listError === true) return { ok: false as const, error: { message: 'catalog down' } }
    return {
      ok: true as const,
      value: options.bases ?? [
        { id: 'kb-1', name: '工程手册', sourceCount: 12 },
        { id: 'kb-2', name: '会议纪要' },
      ],
    }
  })
  const setDraft = vi.fn()
  const input = { draft: options.draft ?? '', occurrences: options.withChips === true ? [{ nodeKey: 'n1' }] : [] }
  const props = {
    session: { sessionId: 'session-1' } as never,
    input: input as never,
    useInput: ((selector: (state: typeof input) => unknown) => selector(input)) as never,
    inputActions: { setDraft } as never,
    getKnowledge: (() => ({ listBases })) as unknown as KnowledgeChipKnowledgeFace,
    t: identityT,
  } as never
  return { props, setDraft, listBases }
}

describe('KnowledgeChipButton composer entry', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => { cleanup() })

  it('lists knowledge bases with their source counts', async () => {
    const { props } = makeFixture()
    render(<KnowledgeChipButton {...props} />)
    fireEvent.click(screen.getByLabelText('knowledgeChip'))
    expect(await screen.findByRole('button', { name: '工程手册 (12)' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '会议纪要' })).toBeTruthy()
  })

  it('inserts an annotation naming the base and the retrieve tool', async () => {
    const { props, setDraft } = makeFixture({ draft: '帮我看看' })
    render(<KnowledgeChipButton {...props} />)
    fireEvent.click(screen.getByLabelText('knowledgeChip'))
    fireEvent.click(await screen.findByRole('button', { name: '工程手册 (12)' }))
    await waitFor(() => {
      expect(setDraft).toHaveBeenCalledOnce()
    })
    const inserted = setDraft.mock.calls[0]?.[0] as string
    expect(inserted.startsWith('帮我看看\n')).toBe(true)
    expect(inserted).toContain('【知识库：工程手册】')
    expect(inserted).toContain('knowledge_retrieve（base="工程手册"）')
  })

  it('reports an empty knowledge catalog honestly', async () => {
    const { props } = makeFixture({ bases: [] })
    render(<KnowledgeChipButton {...props} />)
    fireEvent.click(screen.getByLabelText('knowledgeChip'))
    expect(await screen.findByText('noBases')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '工程手册 (12)' })).toBeNull()
  })

  it('surfaces a failed listing', async () => {
    const { props } = makeFixture({ listError: true })
    render(<KnowledgeChipButton {...props} />)
    fireEvent.click(screen.getByLabelText('knowledgeChip'))
    expect(await screen.findByRole('alert')).toBeTruthy()
  })

  it('refuses to append while reference chips occupy the draft', async () => {
    const { props, setDraft } = makeFixture({ draft: '带 chip 的草稿', withChips: true })
    render(<KnowledgeChipButton {...props} />)
    fireEvent.click(screen.getByLabelText('knowledgeChip'))
    fireEvent.click(await screen.findByRole('button', { name: '工程手册 (12)' }))
    expect(setDraft).not.toHaveBeenCalled()
    expect(await screen.findByText('chipsBlock')).toBeTruthy()
  })
})
