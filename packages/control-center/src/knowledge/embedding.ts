/** Embedding for the knowledge base: an OpenAI-compatible `/embeddings` client and a deterministic local fallback. */

/**
 * Deterministic local hashing embedding used when no embedding provider is
 * configured or the configured one is unreachable. This is a real, offline
 * retrieval signal (lexical hashing of n-grams), NOT a fake switch: it is
 * surfaced honestly as `providerId: 'local-hash'` in catalog and metadata so
 * the UI never claims an embedding model that did not run.
 */
export const LOCAL_EMBEDDING_PROVIDER_ID = 'local-hash'
export const LOCAL_EMBEDDING_DIMENSIONS = 384

const NGrams: readonly number[] = [1, 2, 3]

function featureHash(text: string): number {
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/**
 * Embed text with the local n-gram hashing model. Deterministic for a given
 * input, so reindexes and queries are stable and testable.
 */
export function localHashEmbed(texts: readonly string[], dimensions = LOCAL_EMBEDDING_DIMENSIONS): number[][] {
  const vectors: number[][] = []
  for (const text of texts) {
    const vector = Array.from({ length: dimensions }, () => 0)
    const normalized = text.toLowerCase()
    for (const size of NGrams) {
      for (let i = 0; i + size <= normalized.length; i += 1) {
        const feature = normalized.slice(i, i + size)
        const index = featureHash(feature) % dimensions
        vector[index] = (vector[index] ?? 0) + 1
      }
    }
    // Length-normalize.
    let magnitude = 0
    for (const value of vector) magnitude += value * value
    magnitude = Math.sqrt(magnitude)
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i += 1) vector[i] = (vector[i] ?? 0) / magnitude
    }
    vectors.push(vector)
  }
  return vectors
}

/** Cosine similarity between two vectors. */
export function cosineSimilarity(left: readonly number[], right: readonly number[]): number {
  const length = Math.min(left.length, right.length)
  let dot = 0
  let leftNorm = 0
  let rightNorm = 0
  for (let i = 0; i < length; i += 1) {
    const l = left[i] ?? 0
    const r = right[i] ?? 0
    dot += l * r
    leftNorm += l * l
    rightNorm += r * r
  }
  const magnitude = Math.sqrt(leftNorm) * Math.sqrt(rightNorm)
  return magnitude === 0 ? 0 : dot / magnitude
}

/** Resolved OpenAI-compatible embedding endpoint. */
export interface EmbeddingEndpoint {
  baseURL: string
  apiKey: string
  model: string
}

/** Call `{baseURL}/embeddings` and return vectors in input order. */
export async function callEmbeddings(
  endpoint: EmbeddingEndpoint,
  inputs: readonly string[],
  signal: AbortSignal,
): Promise<number[][]> {
  const response = await fetch(`${endpoint.baseURL}/embeddings`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(endpoint.apiKey.length === 0 ? {} : { authorization: `Bearer ${endpoint.apiKey}` }),
    },
    body: JSON.stringify({ model: endpoint.model, input: inputs }),
    signal,
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`embedding failed (HTTP ${response.status}): ${text.slice(0, 300)}`)
  }
  const body = (await response.json()) as { data?: Array<{ embedding?: number[] }> }
  const items = body.data ?? []
  if (items.length !== inputs.length) {
    throw new Error(`embedding returned ${items.length} vectors for ${inputs.length} inputs`)
  }
  const vectors = items.map(item => item.embedding)
  if (vectors.some(vector => vector === undefined || vector.length === 0)) {
    throw new Error('embedding returned an empty vector')
  }
  return vectors as number[][]
}
