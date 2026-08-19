import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import type { KnowledgeAddFileRequest, KnowledgeAddTextRequest, KnowledgeAddUrlRequest, KnowledgeBaseView, KnowledgeChunkView, KnowledgeCreateBaseRequest, KnowledgeIndexResult, KnowledgeRetrievalResult, KnowledgeRetrieveRequest, KnowledgeSourceView } from './knowledge-types.ts';
export interface KnowledgeServiceOptions {
    /** Override the DSH home (tests). */
    dshHome?: string;
}
/** Real knowledge bases, indexing, retrieval, and tool registration over DSH providers and a SQLite catalog. */
export declare class KnowledgeService extends Service {
    static inject: string[];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private readonly db;
    private readonly home;
    private readonly root;
    private readonly settings;
    private readonly credentials;
    private readonly llm;
    private readonly disposeTools;
    constructor(ctx: Context, options?: KnowledgeServiceOptions);
    private baseFromRow;
    private sourceFromRow;
    private baseRow;
    private requireBase;
    private counts;
    private resolveEmbedding;
    private embedValues;
    private updateBaseStamp;
    listBases(): {
        bases: KnowledgeBaseView[];
    };
    createBase(request: KnowledgeCreateBaseRequest): KnowledgeBaseView;
    getBase(baseId: string): KnowledgeBaseView;
    deleteBase(baseId: string): {
        absent: true;
    };
    private insertSource;
    addText(request: KnowledgeAddTextRequest): KnowledgeSourceView;
    addUrl(request: KnowledgeAddUrlRequest): Promise<KnowledgeSourceView>;
    private fetchUrl;
    addFile(request: KnowledgeAddFileRequest): KnowledgeSourceView;
    private requireSource;
    listSources(baseId: string): {
        sources: KnowledgeSourceView[];
    };
    deleteSource(baseId: string, sourceId: string): {
        absent: true;
    };
    indexBase(baseId: string): Promise<KnowledgeIndexResult>;
    listChunks(baseId: string, cursor: string | null, limit: number): {
        chunks: KnowledgeChunkView[];
        nextCursor?: string;
    };
    retrieve(request: KnowledgeRetrieveRequest): Promise<KnowledgeRetrievalResult>;
    private registerTool;
}
export default KnowledgeService;
//# sourceMappingURL=knowledge.d.ts.map