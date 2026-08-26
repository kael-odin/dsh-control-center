/**
 * Notes host service — Cherry NotesPage parity, v1.
 *
 * Cherry stores notes as plain Markdown files on disk (a root directory plus
 * relative paths; SQLite only carries tree metadata). We keep that philosophy:
 * files live under `<dsh home>/notes/`, readable by any tool, and the tree
 * metadata (starred flags) rides a settings namespace. Editing surface v1 is
 * plain-text Markdown; a rich editor is a later layer on the same storage.
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
declare module '@deepseek-ai/cordis' {
    interface Context {
        controlCenterNotes: NotesService;
    }
}
export declare class NotesService extends Service {
    static inject: readonly ["settings"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    constructor(ctx: Context);
    private notesRoot;
    /** Rejects traversal: the relative path must stay inside the notes root. */
    private safePath;
    private starredSet;
    private writeStarred;
    /** One level of the tree (Cherry lists per root; v1 lists the whole root recursively, depth-capped). */
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
}
//# sourceMappingURL=notes.d.ts.map