/** Host Knowledge Base service: SQLite catalogs, source ingestion, chunk+embed indexing, retrieval, and a coding-agent tool. */
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import { join } from 'node:path'
import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import type { SettingsProvider } from '@deepseek-ai/dsh-settings'
import type { CredentialProvider } from '@deepseek-ai/dsh-credentials'
import type { LlmRuntime } from '@deepseek-ai/dsh-llm'
import type { ContentBlock } from '@deepseek-ai/dsh-llm/types'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { splitTextWithOffsets } from './knowledge/splitter.ts'
import { estimateTokenCount } from './knowledge/tokens.ts'
import {
  callEmbeddings, cosineSimilarity, localHashEmbed,
  LOCAL_EMBEDDING_DIMENSIONS, LOCAL_EMBEDDING_PROVIDER_ID,
} from './knowledge/embedding.ts'
import { resolveKey, resolveProvider } from './knowledge/provider-resolve.ts'
import { markRemoteMethods } from './knowledge/remote-methods.ts'
import type {
  KnowledgeAddDirectoryRequest, KnowledgeAddFileRequest, KnowledgeAddTextRequest, KnowledgeAddUrlRequest,
  KnowledgeBaseConfigUpdate, KnowledgeBaseView, KnowledgeChunkView, KnowledgeCreateBaseRequest,
  KnowledgeEmbeddingConfig, KnowledgeIndexResult, KnowledgeRetrievalHit, KnowledgeRetrievalResult,
  KnowledgeRetrieveRequest, KnowledgeBaseConfig, KnowledgeSourceKind, KnowledgeSourceView,
} from './knowledge-types.ts'

const MAX_TEXT_CHARS = 200_000
const MAX_URL_CHARS = 2_000_000
const MAX_FILE_CHARS = 5_000_000
const MAX_DIRECTORY_FILES = 500
const MAX_DIRECTORY_BYTES = 20 * 1024 * 1024
const MAX_BASE_NAME = 200
const DEFAULT_TOP_K = 8
const MAX_TOP_K = 50
const MAX_CHUNKS_PAGE = 200
const DEFAULT_EMBEDDING_DIMENSIONS = LOCAL_EMBEDDING_DIMENSIONS

const TEXT_MEDIA_TYPES: ReadonlySet<string> = new Set([
  'text/plain', 'text/markdown', 'text/html', 'text/csv', 'text/x-yaml', 'text/yaml',
  'application/json', 'application/x-ndjson', 'application/xml', 'application/yaml',
])

interface BaseRow {
  id: string
  name: string
  description: string
  embedding_provider: string
  embedding_model: string | null
  dimensions: number
  created_at: number
  updated_at: number
}

interface SourceRow {
  id: string
  base_id: string
  kind: string
  name: string
  ref: string
  content: string
  status: string
  error: string | null
  created_at: number
  updated_at: number
}

function now(): number {
  return Date.now()
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

function assertName(name: string): string {
  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (trimmed.length === 0) throw new Error('name must not be blank')
  if (trimmed.length > MAX_BASE_NAME) throw new Error(`name exceeds ${MAX_BASE_NAME} characters`)
  return trimmed
}

function assertBaseId(baseId: string): string {
  if (typeof baseId !== 'string' || baseId.length === 0) throw new Error('base id is required')
  return baseId
}

function assertQuery(query: string): string {
  const trimmed = typeof query === 'string' ? query.trim() : ''
  if (trimmed.length === 0) throw new Error('query must not be blank')
  return trimmed
}

function normalizeUrl(url: string): string {
  const trimmed = typeof url === 'string' ? url.trim() : ''
  if (trimmed.length === 0) throw new Error('url must not be blank')
  const parsed = new URL(trimmed)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('url must be http(s)')
  }
  return parsed.toString()
}

/** Hosted data directory for knowledge artifacts (source files). */
function hostedDir(home: string): string {
  return join(home, 'control-center', 'knowledge')
}

export interface KnowledgeServiceOptions {
  /** Override the DSH home (tests). */
  dshHome?: string
}

/** Real knowledge bases, indexing, retrieval, and tool registration over DSH providers and a SQLite catalog. */
export class KnowledgeService extends Service {
  static inject = ['settings', 'credentials', 'llm']
  readonly typertRemote = bindTypertRemote(this, 'controlCenterKnowledge')

  private readonly db: DatabaseSync
  private readonly home: string
  private readonly root: string
  private readonly settings: SettingsProvider
  private credentials: CredentialProvider | undefined
  private readonly llm: LlmRuntime
  private readonly disposeTools: Array<() => void> = []

  constructor(ctx: Context, options: KnowledgeServiceOptions = {}) {
    super(ctx, 'controlCenterKnowledge')
    this.home = resolveDshHome(options.dshHome)
    this.root = hostedDir(this.home)
    this.settings = this.ctx.get('settings') as SettingsProvider
    this.llm = this.ctx.get('llm') as LlmRuntime
    mkdirSync(this.root, { recursive: true })
    this.db = new DatabaseSync(join(this.root, 'knowledge.sqlite'))
    this.db.exec('PRAGMA journal_mode = WAL')
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_bases (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        embedding_provider TEXT NOT NULL,
        embedding_model TEXT,
        dimensions INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS knowledge_sources (
        id TEXT PRIMARY KEY,
        base_id TEXT NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        name TEXT NOT NULL,
        ref TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT NOT NULL,
        error TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS knowledge_sources_base ON knowledge_sources(base_id);
      CREATE TABLE IF NOT EXISTS knowledge_chunks (
        id TEXT PRIMARY KEY,
        base_id TEXT NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
        source_id TEXT NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        text TEXT NOT NULL,
        tokens INTEGER NOT NULL,
        embedding TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS knowledge_chunks_base ON knowledge_chunks(base_id);
      CREATE INDEX IF NOT EXISTS knowledge_chunks_source ON knowledge_chunks(source_id);
    `)
    this.migrateColumns()
    this.registerTool()
    markRemoteMethods(this, [
      ['listBases', 'listBases'], ['createBase', 'createBase'], ['getBase', 'getBase'], ['deleteBase', 'deleteBase'],
      ['renameBase', 'renameBase'],
      ['getBaseConfig', 'getBaseConfig'], ['setBaseConfig', 'setBaseConfig'],
      ['addText', 'addText'], ['addUrl', 'addUrl'], ['addFile', 'addFile'], ['addDirectory', 'addDirectory'],
      ['listSources', 'listSources'], ['deleteSource', 'deleteSource'],
      ['indexBase', 'indexBase'], ['listChunks', 'listChunks'], ['retrieve', 'retrieve'],
    ])
    ctx.effect(() => async () => {
      this.db.close()
      for (const dispose of this.disposeTools.splice(0)) dispose()
    }, 'control-center.knowledge: close catalog')
  }

  /** Add per-base RAG config columns on pre-existing databases. */
  private migrateColumns(): void {
    const columns = new Set<string>()
    for (const row of this.db.prepare('PRAGMA table_info(knowledge_bases)').all() as unknown as Array<{ name: string }>) {
      columns.add(row.name)
    }
    if (!columns.has('chunk_size')) {
      this.db.exec('ALTER TABLE knowledge_bases ADD COLUMN chunk_size INTEGER NOT NULL DEFAULT 1024')
    }
    if (!columns.has('chunk_overlap')) {
      this.db.exec('ALTER TABLE knowledge_bases ADD COLUMN chunk_overlap INTEGER NOT NULL DEFAULT 200')
    }
    if (!columns.has('top_k')) {
      this.db.exec('ALTER TABLE knowledge_bases ADD COLUMN top_k INTEGER NOT NULL DEFAULT 8')
    }
    if (!columns.has('chunk_strategy')) {
      this.db.exec("ALTER TABLE knowledge_bases ADD COLUMN chunk_strategy TEXT NOT NULL DEFAULT 'structured'")
    }
    if (!columns.has('chunk_separators')) {
      this.db.exec("ALTER TABLE knowledge_bases ADD COLUMN chunk_separators TEXT NOT NULL DEFAULT ''")
    }
  }

  private baseConfigOf(baseId: string): KnowledgeBaseConfig {
    const row = this.db.prepare('SELECT chunk_size, chunk_overlap, top_k, chunk_strategy, chunk_separators FROM knowledge_bases WHERE id = ?').get(baseId) as
      { chunk_size: number; chunk_overlap: number; top_k: number; chunk_strategy: string; chunk_separators: string } | undefined
    if (row === undefined) throw new Error(`knowledge base "${baseId}" does not exist`)
    return {
      chunkSize: row.chunk_size,
      chunkOverlap: row.chunk_overlap,
      topK: row.top_k,
      strategy: row.chunk_strategy === 'delimiter' ? 'delimiter' : 'structured',
      separators: row.chunk_separators,
    }
  }

  getBaseConfig(baseId: string): KnowledgeBaseConfig {
    return this.baseConfigOf(baseId)
  }

  setBaseConfig(baseId: string, config: KnowledgeBaseConfigUpdate): KnowledgeBaseConfig {
    this.requireBase(baseId)
    const current = this.baseConfigOf(baseId)
    const chunkSize = config.chunkSize === undefined ? current.chunkSize : Math.min(8_000, Math.max(100, Math.trunc(config.chunkSize)))
    const chunkOverlap = config.chunkOverlap === undefined ? current.chunkOverlap : Math.min(4_000, Math.max(0, Math.trunc(config.chunkOverlap)))
    const topK = config.topK === undefined ? current.topK : Math.min(MAX_TOP_K, Math.max(1, Math.trunc(config.topK)))
    const strategy = config.strategy === undefined ? current.strategy : config.strategy
    const separators = config.separators === undefined ? current.separators : config.separators.slice(0, 200)
    this.db.prepare(
      'UPDATE knowledge_bases SET chunk_size = ?, chunk_overlap = ?, top_k = ?, chunk_strategy = ?, chunk_separators = ?, updated_at = ? WHERE id = ?',
    ).run(chunkSize, chunkOverlap, topK, strategy, separators, now(), baseId)
    // Embedding route change invalidates every existing chunk (re-index needed).
    if (config.embeddingProvider !== undefined) {
      const provider = config.embeddingProvider === 'local-hash' ? 'local-hash' : config.embeddingProvider
      const model = config.embeddingProvider === 'local-hash' ? null : (config.embeddingModel ?? null)
      if (provider !== 'local-hash' && model === null) {
        throw new Error('a non-local embedding provider requires an embedding model')
      }
      this.db.prepare('UPDATE knowledge_bases SET embedding_provider = ?, embedding_model = ? WHERE id = ?').run(provider, model, baseId)
      this.db.prepare('DELETE FROM knowledge_chunks WHERE base_id = ?').run(baseId)
    }
    return { chunkSize, chunkOverlap, topK, strategy, separators }
  }

  private baseFromRow(row: BaseRow, sourceCount: number, chunkCount: number): KnowledgeBaseView {
    const embedding: KnowledgeEmbeddingConfig = {
      providerId: row.embedding_provider,
      dimensions: row.dimensions,
      ...(row.embedding_model === null ? {} : { model: row.embedding_model }),
    }
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      embedding,
      sourceCount,
      chunkCount,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private sourceFromRow(row: SourceRow, chunkCount: number): KnowledgeSourceView {
    return {
      id: row.id,
      kind: row.kind as KnowledgeSourceKind,
      name: row.name,
      ref: row.ref,
      status: row.status as KnowledgeSourceView['status'],
      ...(row.error === null ? {} : { error: row.error }),
      chunks: chunkCount,
      tokens: estimateTokenCount(row.content),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private baseRow(id: string): BaseRow | undefined {
    return this.db.prepare('SELECT * FROM knowledge_bases WHERE id = ?').get(id) as BaseRow | undefined
  }

  private requireBase(id: string): BaseRow {
    const row = this.baseRow(id)
    if (row === undefined) throw new Error(`knowledge base "${id}" does not exist`)
    return row
  }

  private counts(baseId: string): { sources: number; chunks: number } {
    const sources = this.db.prepare('SELECT COUNT(*) AS n FROM knowledge_sources WHERE base_id = ?').get(baseId) as { n: number }
    const chunks = this.db.prepare('SELECT COUNT(*) AS n FROM knowledge_chunks WHERE base_id = ?').get(baseId) as { n: number }
    return { sources: sources.n, chunks: chunks.n }
  }

  private creds(): CredentialProvider {
    if (this.credentials === undefined) {
      this.credentials = this.ctx.get('credentials') as CredentialProvider
    }
    return this.credentials
  }

  private async resolveEmbedding(baseId: string): Promise<{
    mode: 'local' | 'provider'
    providerId: string
    model?: string
    dimensions: number
  }> {
    const base = this.requireBase(baseId)
    if (base.embedding_provider === LOCAL_EMBEDDING_PROVIDER_ID) {
      return { mode: 'local', providerId: LOCAL_EMBEDDING_PROVIDER_ID, dimensions: base.dimensions }
    }
    return {
      mode: 'provider',
      providerId: base.embedding_provider,
      ...(base.embedding_model === null ? {} : { model: base.embedding_model }),
      dimensions: base.dimensions,
    }
  }

  private async embedValues(
    config: { mode: 'local' | 'provider'; providerId: string; model?: string; dimensions: number },
    values: readonly string[],
    signal: AbortSignal,
  ): Promise<number[][]> {
    if (values.length === 0) return []
    if (config.mode === 'local') return localHashEmbed(values, config.dimensions)
    const provider = await resolveProvider(this.settings, this.llm, config.providerId)
    const apiKey = await resolveKey(this.settings, this.creds(), config.providerId, provider.settingsNs, provider.settingsPath)
    if (config.model === undefined) throw new Error(`embedding provider "${config.providerId}" has no model configured`)
    const vectors = await callEmbeddings({ baseURL: provider.baseURL, apiKey, model: config.model }, values, signal)
    this.recordEmbeddingUsage(config.providerId, config.model, values)
    for (const vector of vectors) {
      if (vector.length !== config.dimensions) {
        throw new Error(`embedding model returned width ${vector.length}, expected ${config.dimensions}`)
      }
    }
    return vectors
  }

  private updateBaseStamp(id: string): void {
    this.db.prepare('UPDATE knowledge_bases SET updated_at = ? WHERE id = ?').run(now(), id)
  }

  /** Best-effort usage recording for provider embedding calls. */
  private recordEmbeddingUsage(provider: string, model: string | undefined, values: readonly string[]): void {
    try {
      const usage = this.ctx.get('controlCenterUsage') as { record(input: unknown): unknown } | undefined
      const chars = values.reduce((sum, value) => sum + value.length, 0)
      usage?.record({
        provider,
        model: model ?? 'embedding',
        kind: 'embedding',
        inputTokens: Math.ceil(chars / 4),
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        latencyMs: 0,
      })
    } catch {
      // The usage service is optional for embedding jobs.
    }
  }

  // --- bases ---

  listBases(): { bases: KnowledgeBaseView[] } {
    const rows = this.db.prepare('SELECT * FROM knowledge_bases ORDER BY created_at DESC').all() as unknown as BaseRow[]
    return {
      bases: rows.map(row => {
        const counts = this.counts(row.id)
        return this.baseFromRow(row, counts.sources, counts.chunks)
      }),
    }
  }

  createBase(request: KnowledgeCreateBaseRequest): KnowledgeBaseView {
    const name = assertName(request.name)
    const description = typeof request.description === 'string' ? request.description.trim() : ''
    const providerId = request.embeddingProvider === undefined || request.embeddingProvider.length === 0
      ? LOCAL_EMBEDDING_PROVIDER_ID
      : request.embeddingProvider
    const model = request.embeddingModel === undefined || request.embeddingModel.length === 0
      ? null
      : request.embeddingModel
    if (providerId !== LOCAL_EMBEDDING_PROVIDER_ID && model === null) {
      throw new Error('a non-local embedding provider requires an embedding model')
    }
    const id = `knowledge-base-${randomUUID()}`
    const dimensions = DEFAULT_EMBEDDING_DIMENSIONS
    const timestamp = now()
    this.db.prepare(
      'INSERT INTO knowledge_bases (id, name, description, embedding_provider, embedding_model, dimensions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(id, name, description, providerId, model, dimensions, timestamp, timestamp)
    return this.baseFromRow(this.requireBase(id), 0, 0)
  }

  getBase(baseId: string): KnowledgeBaseView {
    const base = this.requireBase(baseId)
    const counts = this.counts(baseId)
    return this.baseFromRow(base, counts.sources, counts.chunks)
  }

  deleteBase(baseId: string): { absent: true } {
    this.requireBase(baseId)
    const baseDir = join(this.root, baseId)
    this.db.prepare('DELETE FROM knowledge_sources WHERE base_id = ?').run(baseId)
    this.db.prepare('DELETE FROM knowledge_chunks WHERE base_id = ?').run(baseId)
    this.db.prepare('DELETE FROM knowledge_bases WHERE id = ?').run(baseId)
    void rm(baseDir, { recursive: true, force: true }).catch(() => {})
    return { absent: true }
  }

  renameBase(baseId: string, name: string): KnowledgeBaseView {
    this.requireBase(baseId)
    const resolved = assertName(name)
    this.db.prepare('UPDATE knowledge_bases SET name = ?, updated_at = ? WHERE id = ?').run(resolved, now(), baseId)
    const base = this.requireBase(baseId)
    const counts = this.counts(baseId)
    return this.baseFromRow(base, counts.sources, counts.chunks)
  }

  // --- sources ---

  private insertSource(input: {
    baseId: string
    kind: KnowledgeSourceKind
    name: string
    ref: string
    content: string
  }): KnowledgeSourceView {
    this.requireBase(input.baseId)
    const id = `knowledge-source-${randomUUID()}`
    const timestamp = now()
    this.db.prepare(
      'INSERT INTO knowledge_sources (id, base_id, kind, name, ref, content, status, error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(id, input.baseId, input.kind, input.name, input.ref, input.content, 'ready', null, timestamp, timestamp)
    this.updateBaseStamp(input.baseId)
    return this.sourceFromRow(this.requireSource(id), 0)
  }

  addText(request: KnowledgeAddTextRequest): KnowledgeSourceView {
    const baseId = assertBaseId(request.baseId)
    const name = assertName(request.name)
    const text = typeof request.text === 'string' ? request.text : ''
    if (text.trim().length === 0) throw new Error('text source must not be blank')
    if (text.length > MAX_TEXT_CHARS) throw new Error(`text source exceeds ${MAX_TEXT_CHARS} characters`)
    return this.insertSource({ baseId, kind: 'text', name, ref: name, content: text })
  }

  async addUrl(request: KnowledgeAddUrlRequest): Promise<KnowledgeSourceView> {
    const baseId = assertBaseId(request.baseId)
    const url = normalizeUrl(request.url)
    const name = new URL(url).hostname
    // Fetch before returning; the caller sees a ready source or a failure.
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30_000)
    return this.fetchUrl(baseId, name, url, controller.signal).finally(() => clearTimeout(timeout))
  }

  private async fetchUrl(baseId: string, name: string, url: string, signal: AbortSignal): Promise<KnowledgeSourceView> {
    try {
      const response = await fetch(url, { signal, headers: { accept: 'text/*, text/html, application/json' } })
      if (!response.ok) throw new Error(`url fetch failed (HTTP ${response.status})`)
      const body = await response.text()
      if (body.length > MAX_URL_CHARS) throw new Error(`url content exceeds ${MAX_URL_CHARS} characters`)
      return this.insertSource({ baseId, kind: 'url', name, ref: url, content: body })
    } catch (error) {
      if (isAbort(error)) throw new Error('url fetch timed out')
      throw error
    }
  }

  addDirectory(request: KnowledgeAddDirectoryRequest): KnowledgeSourceView {
    const baseId = assertBaseId(request.baseId)
    const name = assertName(request.name)
    const files = Array.isArray(request.files) ? request.files : []
    if (files.length === 0) throw new Error('directory import requires at least one file')
    if (files.length > MAX_DIRECTORY_FILES) throw new Error(`directory import exceeds ${MAX_DIRECTORY_FILES} files`)
    const parts: string[] = []
    let totalBytes = 0
    for (const file of files) {
      const fileName = assertName(file.name)
      const mediaType = typeof file.mediaType === 'string' ? file.mediaType.toLowerCase() : ''
      const mimeFamily = mediaType.split(';')[0]?.trim() ?? ''
      if (!TEXT_MEDIA_TYPES.has(mimeFamily) && !mimeFamily.startsWith('text/')) {
        throw new Error(`file type "${mimeFamily}" is not supported; text, markdown, HTML, CSV, JSON, and YAML sources are supported`)
      }
      if (typeof file.dataBase64 !== 'string' || file.dataBase64.length === 0) {
        throw new Error(`directory file "${fileName}" has no data`)
      }
      const bytes = Buffer.from(file.dataBase64, 'base64')
      totalBytes += bytes.byteLength
      if (totalBytes > MAX_DIRECTORY_BYTES) throw new Error('directory import exceeds the supported total size')
      parts.push(`# ${fileName}\n\n${bytes.toString('utf8')}`)
    }
    const content = parts.join('\n\n---\n\n')
    if (content.length > MAX_TEXT_CHARS) throw new Error(`directory content exceeds ${MAX_TEXT_CHARS} characters`)
    const id = `knowledge-source-${randomUUID()}`
    const timestamp = now()
    this.requireBase(baseId)
    this.db.prepare(
      'INSERT INTO knowledge_sources (id, base_id, kind, name, ref, content, status, error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(id, baseId, 'directory', name, name, content, 'ready', null, timestamp, timestamp)
    this.updateBaseStamp(baseId)
    return this.sourceFromRow(this.requireSource(id), 0)
  }

  addFile(request: KnowledgeAddFileRequest): KnowledgeSourceView {
    const baseId = assertBaseId(request.baseId)
    const name = assertName(request.name)
    const mediaType = typeof request.mediaType === 'string' ? request.mediaType.toLowerCase() : ''
    const mimeFamily = mediaType.split(';')[0]?.trim() ?? ''
    if (!TEXT_MEDIA_TYPES.has(mimeFamily) && !mimeFamily.startsWith('text/')) {
      throw new Error(`file type "${mimeFamily}" is not supported; text, markdown, HTML, CSV, JSON, and YAML sources are supported`)
    }
    if (typeof request.dataBase64 !== 'string' || request.dataBase64.length === 0) {
      throw new Error('file data is required')
    }
    const bytes = Buffer.from(request.dataBase64, 'base64')
    if (bytes.byteLength > MAX_FILE_CHARS * 4) throw new Error('file exceeds the supported size')
    const content = bytes.toString('utf8')
    const id = `knowledge-source-${randomUUID()}`
    const timestamp = now()
    const filePath = join(this.root, baseId, `${id}.bin`)
    void mkdir(join(this.root, baseId), { recursive: true }).then(() => writeFile(filePath, bytes)).catch(() => {})
    this.requireBase(baseId)
    this.db.prepare(
      'INSERT INTO knowledge_sources (id, base_id, kind, name, ref, content, status, error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(id, baseId, 'file', name, `${mimeFamily}@${filePath}`, content, 'ready', null, timestamp, timestamp)
    this.updateBaseStamp(baseId)
    return this.sourceFromRow(this.requireSource(id), 0)
  }

  private requireSource(id: string): SourceRow {
    const row = this.db.prepare('SELECT * FROM knowledge_sources WHERE id = ?').get(id) as SourceRow | undefined
    if (row === undefined) throw new Error(`knowledge source "${id}" does not exist`)
    return row
  }

  listSources(baseId: string): { sources: KnowledgeSourceView[] } {
    this.requireBase(baseId)
    const rows = this.db.prepare('SELECT * FROM knowledge_sources WHERE base_id = ? ORDER BY created_at DESC').all(baseId) as unknown as SourceRow[]
    return {
      sources: rows.map(row => {
        const chunkCount = (this.db.prepare('SELECT COUNT(*) AS n FROM knowledge_chunks WHERE source_id = ?').get(row.id) as { n: number }).n
        return this.sourceFromRow(row, chunkCount)
      }),
    }
  }

  deleteSource(baseId: string, sourceId: string): { absent: true } {
    this.requireBase(baseId)
    this.db.prepare('DELETE FROM knowledge_chunks WHERE source_id = ?').run(sourceId)
    this.db.prepare('DELETE FROM knowledge_sources WHERE id = ? AND base_id = ?').run(sourceId, baseId)
    this.updateBaseStamp(baseId)
    return { absent: true }
  }

  // --- indexing ---

  async indexBase(baseId: string): Promise<KnowledgeIndexResult> {
    this.requireBase(baseId)
    // Idempotent re-index: rebuild chunks from scratch (Cherry auto-indexes).
    this.db.prepare('DELETE FROM knowledge_chunks WHERE base_id = ?').run(baseId)
    const config = await this.resolveEmbedding(baseId)
    const sourceRows = this.db.prepare('SELECT * FROM knowledge_sources WHERE base_id = ? AND status = ?').all(baseId, 'ready') as unknown as SourceRow[]
    if (sourceRows.length === 0) {
      return { baseId, sourcesIndexed: 0, chunksWritten: 0, embeddingProvider: config.providerId }
    }
    // Chunk all ready sources, then embed in batches.
    type Pending = { source: SourceRow; chunks: Array<{ position: number; text: string; tokens: number }> }
    const pending: Pending[] = []
    for (const source of sourceRows) {
      this.db.prepare('UPDATE knowledge_sources SET status = ?, updated_at = ? WHERE id = ?').run('indexing', now(), source.id)
      const chunkConfig = this.baseConfigOf(baseId)
      const chunks = splitTextWithOffsets(source.content, {
        chunkSize: chunkConfig.chunkSize,
        chunkOverlap: chunkConfig.chunkOverlap,
        strategy: chunkConfig.strategy,
        ...(chunkConfig.separators.trim().length === 0
          ? {}
          : { separator: chunkConfig.separators.replace(/\n/g, String.fromCharCode(10)) }),
      })
      pending.push({ source, chunks: chunks.map((chunk, position) => ({ position, text: chunk.text, tokens: estimateTokenCount(chunk.text) })) })
    }
    let chunksWritten = 0
    try {
      for (const entry of pending) {
        if (entry.chunks.length === 0) {
          this.db.prepare('UPDATE knowledge_sources SET status = ?, updated_at = ? WHERE id = ?').run('ready', now(), entry.source.id)
          continue
        }
        // Batched embedding: 32 texts per request.
        const BATCH = 32
        const vectors: number[][] = []
        for (let offset = 0; offset < entry.chunks.length; offset += BATCH) {
          const slice = entry.chunks.slice(offset, offset + BATCH)
          vectors.push(...await this.embedValues(config, slice.map(chunk => chunk.text), new AbortController().signal))
        }
        const insert = this.db.prepare(
          'INSERT INTO knowledge_chunks (id, base_id, source_id, position, text, tokens, embedding) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
        for (let i = 0; i < entry.chunks.length; i += 1) {
          const chunk = entry.chunks[i]!
          insert.run(`knowledge-chunk-${randomUUID()}`, baseId, entry.source.id, chunk.position, chunk.text, chunk.tokens, JSON.stringify(vectors[i] ?? []))
        }
        chunksWritten += entry.chunks.length
        this.db.prepare('UPDATE knowledge_sources SET status = ?, updated_at = ? WHERE id = ?').run('indexed', now(), entry.source.id)
      }
      this.updateBaseStamp(baseId)
      return { baseId, sourcesIndexed: pending.length, chunksWritten, embeddingProvider: config.providerId }
    } catch (error) {
      for (const entry of pending) {
        this.db.prepare('UPDATE knowledge_sources SET status = ?, error = ?, updated_at = ? WHERE id = ?')
          .run('ready', error instanceof Error ? error.message.slice(0, 500) : String(error), now(), entry.source.id)
      }
      throw error
    }
  }

  listChunks(baseId: string, cursor: string | null, limit: number): { chunks: KnowledgeChunkView[]; nextCursor?: string } {
    this.requireBase(baseId)
    const bounded = Math.min(MAX_CHUNKS_PAGE, Math.max(1, Math.trunc(limit)))
    const offset = cursor === null ? 0 : Number.parseInt(cursor, 10)
    if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('invalid chunk cursor')
    const rows = this.db.prepare(
      `SELECT c.id, c.source_id, c.position, c.text, c.tokens, s.name AS source_name
       FROM knowledge_chunks c JOIN knowledge_sources s ON s.id = c.source_id
       WHERE c.base_id = ? ORDER BY c.source_id, c.position LIMIT ? OFFSET ?`,
    ).all(baseId, bounded, offset) as unknown as Array<{ id: string; source_id: string; position: number; text: string; tokens: number; source_name: string }>
    const chunks = rows.map(row => ({
      id: row.id,
      sourceId: row.source_id,
      sourceName: row.source_name,
      text: row.text,
      tokens: row.tokens,
      position: row.position,
    }))
    const next = offset + chunks.length
    const total = (this.db.prepare('SELECT COUNT(*) AS n FROM knowledge_chunks WHERE base_id = ?').get(baseId) as { n: number }).n
    return { chunks, ...(next < total ? { nextCursor: String(next) } : {}) }
  }

  // --- retrieval ---

  async retrieve(request: KnowledgeRetrieveRequest): Promise<KnowledgeRetrievalResult> {
    const baseId = assertBaseId(request.baseId)
    const query = assertQuery(request.query)
    this.requireBase(baseId)
    const baseTopK = this.baseConfigOf(baseId).topK
    const topK = request.topK === undefined ? baseTopK : Math.min(MAX_TOP_K, Math.max(1, Math.trunc(request.topK)))
    const minScore = request.minScore === undefined ? 0 : request.minScore
    const config = await this.resolveEmbedding(baseId)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60_000)
    try {
      const [queryVector] = await this.embedValues(config, [query], controller.signal)
      if (queryVector === undefined) throw new Error('embedding returned no vector for the query')
      const rows = this.db.prepare(
        `SELECT c.id AS chunk_id, c.source_id, c.position, c.text, c.embedding, s.name AS source_name, s.kind
         FROM knowledge_chunks c JOIN knowledge_sources s ON s.id = c.source_id
         WHERE c.base_id = ?`,
      ).all(baseId) as unknown as Array<{ chunk_id: string; source_id: string; position: number; text: string; embedding: string; source_name: string; kind: string }>
      const scored = rows
        .map(row => {
          const embedding = JSON.parse(row.embedding) as number[]
          const score = cosineSimilarity(queryVector, embedding)
          return { row, score }
        })
        .filter(entry => entry.score >= minScore)
        .sort((left, right) => right.score - left.score)
        .slice(0, topK)
      const hits: KnowledgeRetrievalHit[] = scored.map(entry => ({
        chunkId: entry.row.chunk_id,
        sourceId: entry.row.source_id,
        sourceName: entry.row.source_name,
        kind: entry.row.kind as KnowledgeSourceKind,
        text: entry.row.text,
        score: Number(entry.score.toFixed(4)),
      }))
      return { hits, embeddingProvider: config.providerId, query }
    } finally {
      clearTimeout(timeout)
    }
  }

  // --- coding-agent tool ---

  private registerTool(): void {
    const tools = this.ctx.get('tools')
    if (tools === undefined) return
    // The tool runtime calls execute() with the tool object as `this`, so the
    // service reference must be captured here.
    // oxlint-disable-next-line
    const serviceRef = this
    const disposer = tools.register(defineTool({
        name: 'knowledge_retrieve',
        description: 'Retrieve the most relevant excerpts from the Control Center knowledge bases for a query. Returns ranked excerpts with their source names and similarity scores; useful when the user references a document, wiki, or knowledge base.',
        parameters: {
          query: { type: 'string', required: true, description: 'Search query to match against knowledge base content.' },
          base: { type: 'string', description: 'Optional knowledge base name to restrict retrieval to. Omit to search all bases.' },
          top_k: { type: 'integer', description: 'Maximum number of excerpts to return. Defaults to 8.' },
        },
        output: {
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              query: { type: 'string', required: true },
              hits: {
                type: 'array',
                required: true,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    source: { type: 'string', required: true },
                    base: { type: 'string', required: true },
                    score: { type: 'number', required: true },
                    text: { type: 'string', required: true },
                  },
                },
              },
            },
          },
          render: (_args, value): ContentBlock[] => {
            const lines = value.hits.map((hit, index) => (
              `[${index + 1}] (score ${hit.score.toFixed(3)}) [${hit.base}] ${hit.source}\n${hit.text}`
            ))
            return [{ type: 'text', text: lines.length === 0 ? 'No knowledge base matches found.' : lines.join('\n\n') }]
          },
        },
        isConcurrencySafe: () => true,
        async execute(args, _exec) {
          const query = assertQuery(args.query)
          const topK = args.top_k === undefined ? DEFAULT_TOP_K : args.top_k
          const bases = serviceRef.listBases().bases
            .filter(base => args.base === undefined || base.name === args.base || base.id === args.base)
          const hits: Array<{ source: string; base: string; score: number; text: string }> = []
          for (const base of bases) {
            const result = await serviceRef.retrieve({ baseId: base.id, query, topK, minScore: 0.05 })
            for (const hit of result.hits) {
              hits.push({ source: hit.sourceName, base: base.name, score: hit.score, text: hit.text.slice(0, 2000) })
            }
          }
          hits.sort((left, right) => right.score - left.score)
          return { query, hits: hits.slice(0, topK) }
        },
      }))
    this.disposeTools.push(disposer)
  }
}

export default KnowledgeService
