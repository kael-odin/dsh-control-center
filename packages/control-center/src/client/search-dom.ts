/**
 * 消息内搜索 (§1.3) — DOM-level search over the host-rendered chat flow.
 * The chat nodes carry `data-chat-flow-kind`; matches are scoped to those
 * rendered nodes, so the honest scope is "what is currently loaded" (the
 * host may virtualize distant messages away). Navigation = scrollIntoView +
 * a temporary flash outline; the host DOM is never mutated structurally.
 */

const SEAT_SELECTOR = '[data-chat-flow-kind]'
export const SEARCH_FLASH_CLASS = 'cc-search-flash'

export interface SearchHit {
  /** The chat node seat containing the match, in document order. */
  element: Element
  /** A trimmed snippet around the first match for the result list. */
  snippet: string
}

/** All rendered chat node seats under `root`, document order. */
export function chatSeats(root: ParentNode): Element[] {
  return Array.from(root.querySelectorAll(SEAT_SELECTOR))
}

/**
 * Seats whose rendered text contains `query` (case-insensitive), document
 * order, one entry per seat even when it matches several times.
 */
export function collectMatches(root: ParentNode, query: string): SearchHit[] {
  const needle = query.trim().toLowerCase()
  if (needle.length === 0) return []
  const hits: SearchHit[] = []
  for (const seat of chatSeats(root)) {
    const haystack = seat.textContent ?? ''
    const at = haystack.toLowerCase().indexOf(needle)
    if (at < 0) continue
    const from = Math.max(0, at - 24)
    const snippet = haystack.slice(from, at + needle.length + 24).replace(/\s+/g, ' ').trim()
    hits.push({ element: seat, snippet })
  }
  return hits
}

/** Scroll one hit into view and flash a temporary outline. */
export function focusHit(hit: SearchHit): void {
  hit.element.scrollIntoView({ block: 'center', behavior: 'smooth' })
  const element = hit.element as HTMLElement
  element.classList.add(SEARCH_FLASH_CLASS)
  window.setTimeout(() => { element.classList.remove(SEARCH_FLASH_CLASS) }, 1_200)
}

/** Idempotently install the flash-outline stylesheet. */
export function ensureSearchFlashStyle(doc: Document): void {
  if (doc.getElementById('cc-search-flash-style') !== null) return
  const style = doc.createElement('style')
  style.id = 'cc-search-flash-style'
  style.textContent = `.${SEARCH_FLASH_CLASS} { outline: 2px solid #f5a623; outline-offset: 2px; transition: outline-color .4s; }`
  doc.head.appendChild(style)
}
