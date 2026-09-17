import { describe, expect, it } from 'vitest'
import { userTextsOf } from '../src/client/input-history.ts'

function userEvent(text: string) {
  return { event: { type: 'user/message', data: { content: [{ type: 'text', text }] } } }
}

describe('userTextsOf', () => {
  it('extracts user messages newest first and ignores other event types', () => {
    const value = {
      events: [
        userEvent('third'),
        { event: { type: 'assistant/message', data: { content: [{ type: 'text', text: 'reply' }] } } },
        { event: { type: 'compaction/start', data: {} } },
        userEvent('second'),
        userEvent('first'),
      ],
    }
    expect(userTextsOf(value)).toEqual(['third', 'second', 'first'])
  })

  it('collapses exact duplicates while keeping the newest position', () => {
    const value = { events: [userEvent('same'), userEvent('other'), userEvent('same')] }
    expect(userTextsOf(value)).toEqual(['same', 'other'])
  })

  it('drops whitespace-only and non-text user events', () => {
    const value = {
      events: [
        { event: { type: 'user/message', data: { content: [{ type: 'text', text: '   ' }] } } },
        { event: { type: 'user/message', data: { content: [{ type: 'image', url: 'x' }] } } },
        userEvent('kept'),
      ],
    }
    expect(userTextsOf(value)).toEqual(['kept'])
  })

  it('caps the list at the requested limit', () => {
    const value = { events: Array.from({ length: 30 }, (_, i) => userEvent(`m${i}`)) }
    expect(userTextsOf(value, 20)).toHaveLength(20)
    expect(userTextsOf(value, 20)[0]).toBe('m0')
  })

  it('is safe against malformed wire shapes', () => {
    expect(userTextsOf(undefined)).toEqual([])
    expect(userTextsOf({})).toEqual([])
    expect(userTextsOf({ events: [null, 'junk', {}] })).toEqual([])
  })
})
