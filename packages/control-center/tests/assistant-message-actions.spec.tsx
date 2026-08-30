/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AssistantMessageActions,
  errorText,
  type AssistantMessageActionsServices,
} from '../src/client/AssistantMessageActions.tsx'

function identityT(key: string): string {
  return key
}

function makeProps(overrides: {
  services?: Partial<AssistantMessageActionsServices>
  title?: string
} = {}) {
  const write = vi.fn(async () => ({ ok: true as const, value: { absent: true } }))
  const listBases = vi.fn(async () => ({ ok: true as const, value: [{ id: 'kb-1', name: '工程笔记' }] }))
  const addText = vi.fn(async () => ({ ok: true as const, value: {} }))
  const readAssistantText = vi.fn(async () => 'AGENT TEXT')
  const services: AssistantMessageActionsServices = {
    getNotes: () => ({ write }),
    getKnowledge: () => ({ listBases, addText }),
    readAssistantText,
    ...overrides.services,
  }
  return {
    props: {
      messageId: 'msg-1' as never,
      sessionId: 'session-1' as never,
      useSessions: ((selector: (state: { byId: Record<string, { displayTitle?: string }> }) => unknown) =>
        selector({ byId: { 'session-1': { displayTitle: overrides.title ?? '测试会话' } } })) as never,
      t: identityT,
      ...services,
    } as never,
    write,
    listBases,
    addText,
    readAssistantText,
  }
}

describe('assistant message action helpers', () => {
  it('normalizes wire failures to display text', () => {
    expect(errorText('plain')).toBe('plain')
    expect(errorText({ code: 'x', message: 'boom', details: {} })).toBe('boom')
    expect(errorText(undefined)).toBe('undefined')
  })
})

describe('AssistantMessageActions slot entry', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => { cleanup() })

  it('writes the newest assistant text into a dated note under 会话/', async () => {
    const { props, write, readAssistantText } = makeProps()
    render(<AssistantMessageActions {...props} />)
    const button = screen.getByLabelText('saveNotes')
    fireEvent.click(button)
    await waitFor(() => {
      expect(write).toHaveBeenCalledOnce()
    })
    const call = write.mock.calls[0]?.[0] as { path: string; content: string }
    expect(call.path).toMatch(/^会话\/测试会话-\d{14}\.md$/)
    expect(call.content).toContain('AGENT TEXT')
    expect(call.content).toContain('测试会话')
    expect(await screen.findByLabelText('saveNotesDone')).toBeTruthy()
    // The one-shot follow read is cached across both actions.
    expect(readAssistantText).toHaveBeenCalledTimes(1)
  })

  it('adds the text to the single knowledge base without a picker', async () => {
    const { props, addText, listBases } = makeProps()
    render(<AssistantMessageActions {...props} />)
    fireEvent.click(screen.getByLabelText('saveKnowledge'))
    await waitFor(() => {
      expect(addText).toHaveBeenCalledOnce()
    })
    expect(listBases).toHaveBeenCalledOnce()
    const request = addText.mock.calls[0]?.[0] as { baseId: string; name: string; text: string }
    expect(request.baseId).toBe('kb-1')
    expect(request.text).toBe('AGENT TEXT')
    expect(await screen.findByLabelText('saveKnowledgeDone')).toBeTruthy()
  })

  it('offers a base picker when several bases exist', async () => {
    const addText = vi.fn(async () => ({ ok: true as const, value: {} }))
    const { props } = makeProps({
      services: {
        getKnowledge: () => ({
          listBases: vi.fn(async () => ({ ok: true as const, value: [
            { id: 'kb-1', name: '一号库' },
            { id: 'kb-2', name: '二号库' },
          ] })),
          addText,
        }),
      },
    })
    render(<AssistantMessageActions {...props} />)
    fireEvent.click(screen.getByLabelText('saveKnowledge'))
    expect(await screen.findByRole('menu')).toBeTruthy()
    fireEvent.click(screen.getByRole('menuitem', { name: '二号库' }))
    await waitFor(() => {
      const request = addText.mock.calls[0]?.[0] as { baseId: string }
      expect(request.baseId).toBe('kb-2')
    })
  })

  it('reports an empty knowledge catalog honestly instead of failing silently', async () => {
    const { props } = makeProps({
      services: {
        getKnowledge: () => ({
          listBases: vi.fn(async () => ({ ok: true as const, value: [] })),
          addText: vi.fn(),
        }),
      },
    })
    render(<AssistantMessageActions {...props} />)
    fireEvent.click(screen.getByLabelText('saveKnowledge'))
    expect(await screen.findByTitle(/noBases/)).toBeTruthy()
  })
})
