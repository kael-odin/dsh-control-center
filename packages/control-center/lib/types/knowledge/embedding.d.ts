/** Embedding for the knowledge base: an OpenAI-compatible `/embeddings` client and a deterministic local fallback. */
/**
 * Deterministic local hashing embedding used when no embedding provider is
 * configured or the configured one is unreachable. This is a real, offline
 * retrieval signal (lexical hashing of n-grams), NOT a fake switch: it is
 * surfaced honestly as `providerId: 'local-hash'` in catalog and metadata so
 * the UI never claims an embedding model that did not run.
 */
export declare const LOCAL_EMBEDDING_PROVIDER_ID = "local-hash";
export declare const LOCAL_EMBEDDING_DIMENSIONS = 384;
/**
 * Embed text with the local n-gram hashing model. Deterministic for a given
 * input, so reindexes and queries are stable and testable.
 */
export declare function localHashEmbed(texts: readonly string[], dimensions?: number): number[][];
/** Cosine similarity between two vectors. */
export declare function cosineSimilarity(left: readonly number[], right: readonly number[]): number;
/** Resolved OpenAI-compatible embedding endpoint. */
export interface EmbeddingEndpoint {
    baseURL: string;
    apiKey: string;
    model: string;
}
/** Call `{baseURL}/embeddings` and return vectors in input order. */
export declare function callEmbeddings(endpoint: EmbeddingEndpoint, inputs: readonly string[], signal: AbortSignal): Promise<number[][]>;
//# sourceMappingURL=embedding.d.ts.map