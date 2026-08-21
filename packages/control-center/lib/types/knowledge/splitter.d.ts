/**
 * Structure-aware text splitter with exact source offsets.
 *
 * Adapted from Cherry Studio's knowledge splitter
 * (src/main/features/knowledge/pipeline/indexing/splitter.ts) at baseline
 * 0bb1725c638bf12d505e9baadaa69f8da47dd05e (AGPL-3.0-only). The algorithm,
 * break scoring, and the verbatim-slice invariant are preserved; the
 * `tokenx` token estimator is replaced by the local `estimateTokenCount`,
 * and `KnowledgeChunkStrategy` is inlined as the local `ChunkStrategy`.
 * See provenance/cherry-source-inventory.json and NOTICE.
 */
export type ChunkStrategy = 'structured' | 'delimiter';
/**
 * A chunk of source text together with its code-unit offsets into that source.
 * The defining invariant is `source.slice(start, end) === text` — the chunk is a
 * verbatim slice, never a transformed copy.
 */
export interface TextChunk {
    text: string;
    /** Inclusive start offset (UTF-16 code units) into the source string. */
    start: number;
    /** Exclusive end offset (UTF-16 code units) into the source string. */
    end: number;
}
export interface SplitOptions {
    /** Target maximum tokens per chunk. */
    chunkSize: number;
    /** Tokens of trailing context repeated at the start of the next chunk. */
    chunkOverlap: number;
    /**
     * Primary break delimiter (e.g. `"\\n\\n"`, `"。"`). When set, cuts are
     * preferred at its boundaries. Defaults to none.
     */
    separator?: string;
    /**
     * `'structured'` (default) snaps cuts to markdown heading / code-fence /
     * rule / paragraph breaks, never splits a code fence. `'delimiter'` splits
     * purely by `separator` then a fallback delimiter chain.
     */
    strategy?: ChunkStrategy;
}
/**
 * Split `text` into overlapping, structure-aware chunks sized by token count,
 * returning each chunk's exact offsets into `text`. See Cherry's original for
 * the full algorithm rationale; the `slice(start, end) === text` invariant
 * holds throughout.
 */
export declare function splitTextWithOffsets(text: string, options: SplitOptions): TextChunk[];
//# sourceMappingURL=splitter.d.ts.map