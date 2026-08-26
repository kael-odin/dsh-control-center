/**
 * Notes workspace (Cherry NotesPage parity, v1): a Markdown file tree on the
 * left, a plain-text editor on the right with autosave. Files live on disk
 * under `<dsh home>/notes/` — the file IS the source of truth, exactly like
 * Cherry. The rich (Tiptap-style) editing layer is a later increment on the
 * same storage; v1 ships the full CRUD + star + autosave loop.
 */
import type { ReactNode } from 'react';
import type { NotesTree } from '../notes-types.ts';
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
    };
}
export declare function NotesWorkspace({ notes }: NotesWorkspaceInjected): ReactNode;
//# sourceMappingURL=NotesWorkspace.d.ts.map