/**
 * Notes workspace (Cherry NotesPage parity, v2): Markdown file tree, full-text
 * search, and a Tiptap rich-text editor that round-trips Markdown. Files stay
 * on disk under `<dsh home>/notes/` — the file IS the source of truth, exactly
 * like Cherry. The editor loads Markdown through a markdown Tiptap extension
 * set and serializes back to Markdown on save.
 */
import type { ReactNode } from 'react';
import type { NotesTree, NoteSearchHit } from '../notes-types.ts';
export interface NotesWorkspaceInjected {
    notes: {
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
        search(params: {
            query: string;
            limit?: number;
        }): Promise<{
            ok: true;
            value: NoteSearchHit[];
        }>;
    };
}
export declare function NotesWorkspace({ notes }: NotesWorkspaceInjected): ReactNode;
//# sourceMappingURL=NotesWorkspace.d.ts.map