/** Compact token estimator for chunk sizing (GPT-style heuristic, no dependency). */

const CJK_RE = /[　-〿぀-ヿ㐀-䶿一-鿿豈-﫿＀-￯]/

/**
 * Approximate a string's token count deterministically. ASCII-heavy text costs
 * ~4 chars/token, CJK ~1.6 chars/token. This only sizes chunks and caps payloads;
 * exactness is not required, only monotonicity and a sane CJK/Latin ratio.
 */
export function estimateTokenCount(text: string): number {
  if (text.length === 0) return 0
  let ascii = 0
  let cjk = 0
  for (const char of text) {
    if (CJK_RE.test(char)) cjk += 1
    else ascii += 1
  }
  return Math.max(1, Math.round(ascii / 4 + cjk / 1.6))
}

/** Count the words/chars of a query for the fallback embedding dimension hint. */
export function estimateTokensForQuery(query: string): number {
  return Math.max(1, estimateTokenCount(query))
}
