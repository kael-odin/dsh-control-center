/**
 * Notes host service — Cherry NotesPage parity, v2 (full-text search).
 *
 * Cherry stores notes as plain Markdown files on disk (a root directory plus
 * relative paths; SQLite only carries tree metadata). We keep that philosophy:
 * files live under `<dsh home>/notes/`, readable by any tool, and the tree
 * metadata (starred flags) rides a settings namespace.
 * v2 adds a FlexSearch full-text index, maintained incrementally on every
 * write/create/rename/remove so search never needs a full rebuild.
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
export interface NotesEntry {
    /** Forward-slash path relative to the notes root; directories have no extension. */
    path: string;
    type: 'file' | 'directory';
    starred: boolean;
}
export interface NotesTree {
    root: string;
    entries: NotesEntry[];
}
export interface NoteSearchHit {
    path: string;
    snippet: string;
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        controlCenterNotes: NotesService;
    }
}
export declare class NotesService extends Service {
    static inject: readonly ["settings"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    /** FlexSearch index for full-text search over Markdown content. The default
     * latin encoder leaves CJK text unsearchable, so a custom encoder emits
     * latin words plus CJK unigrams and bigrams. */
    private readonly searchIndex;
    constructor(ctx: Context);
    private notesRoot;
    /** Rejects traversal: the relative path must stay inside the notes root. */
    private safePath;
    private starredSet;
    private writeStarred;
    private isDirectory;
    /** Whole tree, depth-capped, newest-file order per directory. */
    tree(): Promise<{
        ok: true;
        value: NotesTree;
    }>;
    read(params: {
        path: string;
    }): Promise<{
        ok: true;
        value: {
            content: string;
        };
    } | {
        ok: false;
        error: string;
    }>;
    write(params: {
        path: string;
        content: string;
    }): Promise<{
        ok: true;
        value: {
            absent: true;
        };
    } | {
        ok: false;
        error: string;
    }>;
    create(params: {
        path: string;
        directory?: boolean;
    }): Promise<{
        ok: true;
        value: {
            absent: true;
        };
    } | {
        ok: false;
        error: string;
    }>;
    rename(params: {
        from: string;
        to: string;
    }): Promise<{
        ok: true;
        value: {
            absent: true;
        };
    } | {
        ok: false;
        error: string;
    }>;
    remove(params: {
        path: string;
        directory?: boolean;
    }): Promise<{
        ok: true;
        value: {
            absent: true;
        };
    } | {
        ok: false;
        error: string;
    }>;
    toggleStar(params: {
        path: string;
    }): Promise<{
        ok: true;
        value: {
            starred: boolean;
        };
    }>;
    /** Full-text search over note content; returns paths with a matching-line snippet. */
    search(params: {
        query: string;
        limit?: number;
    }): Promise<{
        ok: true;
        value: NoteSearchHit[];
    }>;
    /** Rebuild the index from every .md file under the root. */
    private rebuildIndex;
    private indexNote;
    private extractSnippet;
}
//# sourceMappingURL=notes.d.ts.map