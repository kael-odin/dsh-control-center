/** Notes types + typert namespace (shared between Host and Client). */
import type { NotesEntry, NotesTree } from './notes.ts';
export type { NotesEntry, NotesTree };
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespaceMap {
        controlCenterNotes: {
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
}
//# sourceMappingURL=notes-types.d.ts.map