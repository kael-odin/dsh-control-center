import { describe, expect, it } from 'vitest'
import { expandPhraseVariables } from '../src/client/phrase-variables.ts'

// A fixed clock: 2026-09-18 is a Friday; 09:05 local.
const NOW = new Date(2026, 8, 18, 9, 5, 0)
const CONTEXT = { now: NOW, clipboard: 'pasted text' }

describe('expandPhraseVariables', () => {
  it('expands date, time, datetime, and weekday deterministically', () => {
    expect(expandPhraseVariables('{{date}}', CONTEXT)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(expandPhraseVariables('{{time}}', CONTEXT)).toMatch(/^\d{2}:\d{2}$/)
    expect(expandPhraseVariables('{{datetime}}', CONTEXT)).toBe(
      `${expandPhraseVariables('{{date}}', CONTEXT)} ${expandPhraseVariables('{{time}}', CONTEXT)}`,
    )
    expect(expandPhraseVariables('{{week}}', CONTEXT)).toBe(
      new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(NOW),
    )
    expect(expandPhraseVariables('{{weekday}}', CONTEXT)).toBe(expandPhraseVariables('{{week}}', CONTEXT))
  })

  it('expands clipboard only when a value is available', () => {
    expect(expandPhraseVariables('see: {{clipboard}}', CONTEXT)).toBe('see: pasted text')
    // Unavailable clipboard stays verbatim — the user sees what did not resolve.
    expect(expandPhraseVariables('see: {{clipboard}}', { now: NOW })).toBe('see: {{clipboard}}')
  })

  it('leaves unknown variables and partial syntax verbatim', () => {
    expect(expandPhraseVariables('{{nope}}', CONTEXT)).toBe('{{nope}}')
    expect(expandPhraseVariables('{{ DATE }}', CONTEXT)).toBe('{{ DATE }}')
    expect(expandPhraseVariables('a {{ lone brace', CONTEXT)).toBe('a {{ lone brace')
  })

  it('expands every occurrence and leaves clean text unchanged', () => {
    expect(expandPhraseVariables('{{date}} … {{date}}', CONTEXT)).toBe(
      `${expandPhraseVariables('{{date}}', CONTEXT)} … ${expandPhraseVariables('{{date}}', CONTEXT)}`,
    )
    const plain = 'plain text'
    expect(expandPhraseVariables(plain, CONTEXT)).toBe(plain)
  })

  it('honors the requested locale for the weekday', () => {
    expect(expandPhraseVariables('{{week}}', { ...CONTEXT, locale: 'en-US' })).toBe(
      new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(NOW),
    )
  })
})
