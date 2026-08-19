/**
 * System & Diagnostics Host service: versions, compatibility, dependencies,
 * and environment info for the About / Dependencies / Diagnostics pages.
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
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
export declare class SystemService extends Service {
    static inject: readonly ["settings"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    /** Profile-anchored require (same fallback chain as the compatibility gate). */
    private readonly profileRequire;
    constructor(ctx: Context, _config?: {
        logger?: Context['logger'];
    });
    getInfo(): Promise<SystemInfo>;
    listDependencies(): Promise<DependencyEntry[]>;
    private packageRoot;
    [Symbol.dispose](): void;
}
//# sourceMappingURL=system.d.ts.map