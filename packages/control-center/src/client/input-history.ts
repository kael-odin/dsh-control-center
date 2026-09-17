/**
 * 输入历史 (input history) — Cherry composer parity, §1.4 increment. The
 * session journal is the single fact source: the most recent distinct user
 * messages of the current session, newest first, ready to be recalled into
 * the draft.
 *
 * Pure module: extraction/dedupe/limit live here so the component stays a
 * thin view and the rules stay unit-testable.
 */

/** One wire event entry as `session.history` returns it (redacted view). */
export interface HistoryWireEvent {
  event: { type: string; data: unknown }
}

export interface SessionHistoryFace {
  history(input: { sessionId: string; maxMessages?: number }): Promise<
    | { ok: true; value: { events: ReadonlyArray<HistoryWireEvent> } }
    | { ok: false; error: unknown }
  >
}

/** Flatten one user/message payload's content blocks to plain text. */
function userTextOf(data: unknown): string {
  const content = (data as { content?: unknown } | null)?.content
  if (!Array.isArray(content)) return ''
  let text = ''
  for (const block of content) {
    if (typeof block !== 'object' || block === null) continue
    if ((block as { type?: unknown }).type !== 'text') continue
    const value = (block as { text?: unknown }).text
    if (typeof value === 'string') text += value
  }
  return text
}

/**
 * The session's user messages, newest first, exact duplicates collapsed
 * (sending the same prompt twice keeps one entry), whitespace-only dropped,
 * capped at `limit`. Assistant/tool/event rows are ignored.
 */
export function userTextsOf(historyValue: unknown, limit = 20): string[] {
  const events = (historyValue as { events?: unknown } | null)?.events
  if (!Array.isArray(events)) return []
  const kept: string[] = []
  for (const entry of events) {
    if (typeof entry !== 'object' || entry === null) continue
    const event = (entry as HistoryWireEvent).event
    if (typeof event !== 'object' || event === null) continue
    if (event.type !== 'user/message') continue
    const text = userTextOf(event.data).trim()
    if (text.length === 0) continue
    if (kept.includes(text)) continue
    kept.push(text)
    if (kept.length >= limit) break
  }
  return kept
}
