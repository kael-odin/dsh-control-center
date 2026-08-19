/**
 * Structure-aware text splitter with exact source offsets.
 *
 * Adapted from Cherry Studio's knowledge splitter
 * (src/main/features/knowledge/pipeline/indexing/splitter.ts) at baseline
 * 13687df354e9845c7e2b6d155eac6a9171f6a533 (AGPL-3.0-only). The algorithm,
 * break scoring, and the verbatim-slice invariant are preserved; the
 * `tokenx` token estimator is replaced by the local `estimateTokenCount`,
 * and `KnowledgeChunkStrategy` is inlined as the local `ChunkStrategy`.
 * See provenance/cherry-source-inventory.json and NOTICE.
 */

import { estimateTokenCount } from './tokens.ts'

export type ChunkStrategy = 'structured' | 'delimiter'

/**
 * A chunk of source text together with its code-unit offsets into that source.
 * The defining invariant is `source.slice(start, end) === text` — the chunk is a
 * verbatim slice, never a transformed copy.
 */
export interface TextChunk {
  text: string
  /** Inclusive start offset (UTF-16 code units) into the source string. */
  start: number
  /** Exclusive end offset (UTF-16 code units) into the source string. */
  end: number
}

export interface SplitOptions {
  /** Target maximum tokens per chunk. */
  chunkSize: number
  /** Tokens of trailing context repeated at the start of the next chunk. */
  chunkOverlap: number
  /**
   * Primary break delimiter (e.g. `"\\n\\n"`, `"。"`). When set, cuts are
   * preferred at its boundaries. Defaults to none.
   */
  separator?: string
  /**
   * `'structured'` (default) snaps cuts to markdown heading / code-fence /
   * rule / paragraph breaks, never splits a code fence. `'delimiter'` splits
   * purely by `separator` then a fallback delimiter chain.
   */
  strategy?: ChunkStrategy
}

/** A candidate place to cut, scored by how clean a boundary it is. */
interface BreakPoint {
  pos: number
  score: number
}

/** A `\`\`\`` … `\`\`\`` region where preferred break points should be ignored. */
interface CodeFenceRegion {
  start: number
  end: number
}

const BREAK_PATTERNS: Array<{ pattern: RegExp; score: number }> = [
  { pattern: /\n#{1}(?!#)/g, score: 100 },
  { pattern: /\n#{2}(?!#)/g, score: 90 },
  { pattern: /\n#{3}(?!#)/g, score: 80 },
  { pattern: /\n#{4}(?!#)/g, score: 70 },
  { pattern: /\n#{5}(?!#)/g, score: 60 },
  { pattern: /\n#{6}(?!#)/g, score: 50 },
  { pattern: /\n```/g, score: 80 },
  { pattern: /\n(?:---|\*\*\*|___)\s*\n/g, score: 60 },
  { pattern: /\n\n+/g, score: 20 },
  { pattern: /\n[-*]\s/g, score: 5 },
  { pattern: /\n\d+\.\s/g, score: 5 },
  { pattern: /\n/g, score: 1 },
]

/** ~22% of the chunk budget — how far back from the target we hunt for a clean break. */
const WINDOW_RATIO = 0.22
const DECAY_FACTOR = 0.7

const STRUCTURED_SEPARATOR_SCORE = 30
const DELIMITER_SEPARATOR_SCORE = 100

const DELIMITER_FALLBACKS: ReadonlyArray<{ separator: string; score: number }> = [
  { separator: '\n\n', score: 20 },
  { separator: '\n', score: 12 },
  { separator: '。', score: 10 },
  { separator: '. ', score: 8 },
  { separator: ' ', score: 3 },
]

const SEPARATOR_ESCAPES: Record<string, string> = { n: '\n', t: '\t', r: '\r', '\\': '\\' }

function unescapeSeparator(raw: string): string {
  return raw.replace(/\\([ntr\\])/g, (_match, code: string) => SEPARATOR_ESCAPES[code] ?? code)
}

/**
 * Split `text` into overlapping, structure-aware chunks sized by token count,
 * returning each chunk's exact offsets into `text`. See Cherry's original for
 * the full algorithm rationale; the `slice(start, end) === text` invariant
 * holds throughout.
 */
export function splitTextWithOffsets(text: string, options: SplitOptions): TextChunk[] {
  if (text.trim() === '') {
    return []
  }

  const chunkSize = Math.max(1, options.chunkSize)
  const chunkOverlap = Math.max(0, Math.min(options.chunkOverlap, chunkSize - 1))
  const strategy = options.strategy ?? 'structured'
  const separator = options.separator ? unescapeSeparator(options.separator) : ''

  const charsPerToken = text.length / Math.max(1, estimateTokenCount(text))
  const maxChars = Math.max(1, Math.round(chunkSize * charsPerToken))
  const overlapChars = Math.min(Math.round(chunkOverlap * charsPerToken), maxChars - 1)
  const windowChars = Math.max(1, Math.round(maxChars * WINDOW_RATIO))

  const breakPoints = scanBreakPoints(text, { strategy, separator })
  const codeFences = strategy === 'structured' ? findCodeFences(text) : []

  const chunks: TextChunk[] = []
  let cursor = 0
  while (cursor < text.length) {
    let endPos = Math.min(cursor + maxChars, text.length)
    if (endPos < text.length) {
      const cutoff = findBestCutoff(breakPoints, endPos, windowChars, codeFences)
      if (cutoff > cursor && cutoff <= endPos) {
        endPos = cutoff
      }
    }

    const chunk = trimToChunk(text, cursor, endPos)
    if (chunk) {
      chunks.push(chunk)
    }

    if (endPos >= text.length) {
      break
    }
    const nextCursor = endPos - overlapChars
    cursor = nextCursor > cursor ? nextCursor : endPos
  }

  return chunks
}

function scanBreakPoints(text: string, options: { strategy: ChunkStrategy; separator: string }): BreakPoint[] {
  const best = new Map<number, number>()
  const consider = (pos: number, score: number) => {
    const existing = best.get(pos)
    if (existing === undefined || score > existing) {
      best.set(pos, score)
    }
  }

  if (options.strategy === 'structured') {
    for (const { pattern, score } of BREAK_PATTERNS) {
      for (const match of text.matchAll(pattern)) {
        consider(match.index, score)
      }
    }
    addLiteralBreaks(text, options.separator, STRUCTURED_SEPARATOR_SCORE, consider)
  } else {
    addLiteralBreaks(text, options.separator, DELIMITER_SEPARATOR_SCORE, consider)
    for (const { separator, score } of DELIMITER_FALLBACKS) {
      addLiteralBreaks(text, separator, score, consider)
    }
  }

  return [...best.entries()].map(([pos, score]) => ({ pos, score })).sort((a, b) => a.pos - b.pos)
}

function addLiteralBreaks(
  text: string,
  separator: string,
  score: number,
  consider: (pos: number, score: number) => void,
): void {
  if (!separator) {
    return
  }
  let index = text.indexOf(separator)
  while (index !== -1) {
    consider(index + separator.length, score)
    index = text.indexOf(separator, index + separator.length)
  }
}

function findCodeFences(text: string): CodeFenceRegion[] {
  const regions: CodeFenceRegion[] = []
  let open: number | null = null
  for (const match of text.matchAll(/\n```/g)) {
    if (open === null) {
      open = match.index
    } else {
      regions.push({ start: open, end: match.index + match[0].length })
      open = null
    }
  }
  if (open !== null) {
    regions.push({ start: open, end: text.length })
  }
  return regions
}

function isInsideCodeFence(pos: number, fences: CodeFenceRegion[]): boolean {
  return fences.some(fence => pos > fence.start && pos < fence.end)
}

function findBestCutoff(
  breakPoints: BreakPoint[],
  target: number,
  windowChars: number,
  codeFences: CodeFenceRegion[],
): number {
  const windowStart = target - windowChars
  let bestScore = -1
  let bestPos = target
  for (const bp of breakPoints) {
    if (bp.pos < windowStart) continue
    if (bp.pos > target) break
    if (isInsideCodeFence(bp.pos, codeFences)) continue

    const normalizedDistance = (target - bp.pos) / windowChars
    const score = bp.score * (1 - normalizedDistance * normalizedDistance * DECAY_FACTOR)
    if (score > bestScore) {
      bestScore = score
      bestPos = bp.pos
    }
  }
  return bestPos
}

function trimToChunk(text: string, start: number, end: number): TextChunk | null {
  let trimmedStart = start
  let trimmedEnd = end
  while (trimmedStart < trimmedEnd && isWhitespace(text[trimmedStart])) {
    trimmedStart += 1
  }
  while (trimmedEnd > trimmedStart && isWhitespace(text[trimmedEnd - 1])) {
    trimmedEnd -= 1
  }
  if (trimmedStart >= trimmedEnd) {
    return null
  }
  const body = text.slice(trimmedStart, trimmedEnd)
  return { text: body, start: trimmedStart, end: trimmedEnd }
}

function isWhitespace(char: string | undefined): boolean {
  return char === undefined || char.trim() === ''
}
