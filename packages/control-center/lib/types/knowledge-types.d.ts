/** Stable ids and wire-safe contracts for the Control Center Knowledge Base workspace. */
export type KnowledgeBaseId = string;
export type KnowledgeSourceId = string;
export type KnowledgeChunkId = string;
export type KnowledgeSourceKind = 'text' | 'file' | 'directory' | 'url';
/** Embedding mode actually used for a base: a configured provider route or the local hashing fallback. */
/** Per-base RAG tuning (chunking + retrieval defaults). */
export interface KnowledgeBaseConfig {
    /** Chunk size in tokens. */
    chunkSize: number;
    /** Chunk overlap in tokens. */
    chunkOverlap: number;
    /** Default Top K for recall. */
    topK: number;
}
export interface KnowledgeEmbeddingConfig {
    /** `local-hash` or a provider id configured in DSH settings. */
    providerId: string;
    /** Provider model id when not `local-hash`. */
    model?: string;
    dimensions: number;
}
export interface KnowledgeBaseView {
    id: KnowledgeBaseId;
    name: string;
    description: string;
    embedding: KnowledgeEmbeddingConfig;
    sourceCount: number;
    chunkCount: number;
    createdAt: number;
    updatedAt: number;
}
export interface KnowledgeSourceView {
    id: KnowledgeSourceId;
    kind: KnowledgeSourceKind;
    name: string;
    /** Source kind-specific reference: file name, url, or text excerpt. */
    ref: string;
    status: 'ready' | 'indexing' | 'failed';
    error?: string;
    chunks: number;
    tokens: number;
    createdAt: number;
    updatedAt: number;
}
/** One indexed chunk with enough context to display and cite it. */
export interface KnowledgeChunkView {
    id: KnowledgeChunkId;
    sourceId: KnowledgeSourceId;
    sourceName: string;
    text: string;
    tokens: number;
    position: number;
}
/** A retrieval hit with score and the citation projection of its source. */
export interface KnowledgeRetrievalHit {
    chunkId: KnowledgeChunkId;
    sourceId: KnowledgeSourceId;
    sourceName: string;
    kind: KnowledgeSourceKind;
    text: string;
    score: number;
}
export interface KnowledgeRetrievalResult {
    hits: KnowledgeRetrievalHit[];
    embeddingProvider: string;
    query: string;
}
export interface KnowledgeCreateBaseRequest {
    name: string;
    description?: string;
    /** `local-hash` or a configured provider id; defaults to `local-hash`. */
    embeddingProvider?: string;
    embeddingModel?: string;
}
export interface KnowledgeAddTextRequest {
    baseId: KnowledgeBaseId;
    name: string;
    text: string;
}
export interface KnowledgeAddUrlRequest {
    baseId: KnowledgeBaseId;
    url: string;
}
export interface KnowledgeAddFileRequest {
    baseId: KnowledgeBaseId;
    name: string;
    /** Base64-encoded bytes; the Host writes them to the hosted data directory. */
    dataBase64: string;
    mediaType: string;
}
/** One file inside a directory import. */
export interface KnowledgeDirectoryFile {
    name: string;
    dataBase64: string;
    mediaType: string;
}
export interface KnowledgeAddDirectoryRequest {
    baseId: KnowledgeBaseId;
    /** Display name of the directory source. */
    name: string;
    files: KnowledgeDirectoryFile[];
}
export interface KnowledgeRetrieveRequest {
    baseId: KnowledgeBaseId;
    query: string;
    topK?: number;
    /** Score threshold in [0,1]; default 0.0 (no filter). */
    minScore?: number;
}
export interface KnowledgeIndexResult {
    baseId: KnowledgeBaseId;
    sourcesIndexed: number;
    chunksWritten: number;
    embeddingProvider: string;
}
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespaceMap {
        controlCenterKnowledge: {
            listBases(): Promise<{
                ok: true;
                value: {
                    bases: KnowledgeBaseView[];
                };
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            createBase(request: KnowledgeCreateBaseRequest): Promise<{
                ok: true;
                value: KnowledgeBaseView;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            getBase(baseId: KnowledgeBaseId): Promise<{
                ok: true;
                value: KnowledgeBaseView;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            deleteBase(baseId: KnowledgeBaseId): Promise<{
                ok: true;
                value: {
                    absent: true;
                };
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            addText(request: KnowledgeAddTextRequest): Promise<{
                ok: true;
                value: KnowledgeSourceView;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            addUrl(request: KnowledgeAddUrlRequest): Promise<{
                ok: true;
                value: KnowledgeSourceView;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            addFile(request: KnowledgeAddFileRequest): Promise<{
                ok: true;
                value: KnowledgeSourceView;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            addDirectory(request: KnowledgeAddDirectoryRequest): Promise<{
                ok: true;
                value: KnowledgeSourceView;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            renameBase(baseId: KnowledgeBaseId, name: string): Promise<{
                ok: true;
                value: KnowledgeBaseView;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            getBaseConfig(baseId: KnowledgeBaseId): Promise<{
                ok: true;
                value: KnowledgeBaseConfig;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            setBaseConfig(baseId: KnowledgeBaseId, config: KnowledgeBaseConfig): Promise<{
                ok: true;
                value: KnowledgeBaseConfig;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            listSources(baseId: KnowledgeBaseId): Promise<{
                ok: true;
                value: {
                    sources: KnowledgeSourceView[];
                };
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            deleteSource(baseId: KnowledgeBaseId, sourceId: KnowledgeSourceId): Promise<{
                ok: true;
                value: {
                    absent: true;
                };
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            indexBase(baseId: KnowledgeBaseId): Promise<{
                ok: true;
                value: KnowledgeIndexResult;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            listChunks(baseId: KnowledgeBaseId, cursor: string | null, limit: number): Promise<{
                ok: true;
                value: {
                    chunks: KnowledgeChunkView[];
                    nextCursor?: string;
                };
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            retrieve(request: KnowledgeRetrieveRequest): Promise<{
                ok: true;
                value: KnowledgeRetrievalResult;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
        };
    }
}
//# sourceMappingURL=knowledge-types.d.ts.map