/**
 * System & Diagnostics types (shared between Host and Client).
 */
export interface SystemInfo {
    controlCenterVersion: string;
    dshSupportedVersion: string;
    dshSourceBaseline: string;
    platform: string;
    arch: string;
    release: string;
    nodeVersion: string;
    dshHome: string;
    hostname: string;
}
export interface DependencyEntry {
    name: string;
    version: string;
    client: boolean;
}
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespaceMap {
        controlCenterSystem: {
            getInfo(): Promise<{
                ok: true;
                value: SystemInfo;
            } | {
                ok: false;
                error: {
                    code: string;
                    message: string;
                    details: object;
                };
            }>;
            listDependencies(): Promise<{
                ok: true;
                value: DependencyEntry[];
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
export {};
//# sourceMappingURL=system-types.d.ts.map