/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { collectMatches, SEARCH_FLASH_CLASS } from '../src/client/search-dom.ts'
import { MessageSearchButton } from '../src/client/MessageSearchButton.tsx'

function seat(kind: string, text: string): HTMLElement {
  const element = document.createElement('div')
  element.setAttribute('data-chat-flow-kind', kind)
  element.textContent = text
  document.body.appendChild(element)
  return element
}

describe('collectMatches', () => {
  beforeEach(() => {
    document.body.textContent = ''
  })
  afterEach(() => { cleanup() })

  it('finds matching seats in document order, case-insensitively', () => {
    const first = seat('user', 'Hello World')
    const second = seat('assistant', 'say hello again')
    seat('assistant', 'unrelated')
    const hits = collectMatches(document, 'hello')
    expect(hits.map(hit => hit.element)).toEqual([first, second])
    expect(hits[0]?.snippet).toContain('Hello')
  })

  it('returns nothing for an empty or unmatched query', () => {
    seat('user', 'text')
    expect(collectMatches(document, '   ')).toEqual([])
    expect(collectMatches(document, 'missing')).toEqual([])
  })

  it('returns one hit per seat even with several occurrences', () => {
    const only = seat('user', 'a needle and another needle')
    const hits = collectMatches(document, 'needle')
    expect(hits.map(hit => hit.element)).toEqual([only])
  })
})

describe('MessageSearchButton', () => {
  beforeEach(() => {
    document.body.textContent = ''
    Element.prototype.scrollIntoView = vi.fn()
  })
  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  it('searches, reports the count, and flashes the focused seat', async () => {
    seat('user', 'find me once')
    seat('assistant', 'and find me twice')
    const t = (key: string) => key
    render(<MessageSearchButton sessionId={'s' as never} useInput={(() => ({})) as never} t={t} />)
    fireEvent.click(screen.getByLabelText('messageSearch'))
    const input = screen.getByPlaceholderText('searchPlaceholder')
    fireEvent.input(input, { target: { value: 'find' } })
    await vi.waitFor(() => expect(screen.getByText('1/2')).toBeTruthy())
    fireEvent.click(screen.getByLabelText('searchNext'))
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    const flashed = document.querySelectorAll(`.${SEARCH_FLASH_CLASS}`)
    expect(flashed.length).toBeGreaterThan(0)
  })
})
