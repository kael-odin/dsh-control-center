/** Compact token estimator for chunk sizing (GPT-style heuristic, no dependency). */
/**
 * Approximate a string's token count deterministically. ASCII-heavy text costs
 * ~4 chars/token, CJK ~1.6 chars/token. This only sizes chunks and caps payloads;
 * exactness is not required, only monotonicity and a sane CJK/Latin ratio.
 */
export declare function estimateTokenCount(text: string): number;
/** Count the words/chars of a query for the fallback embedding dimension hint. */
export declare function estimateTokensForQuery(query: string): number;
//# sourceMappingURL=tokens.d.ts.map