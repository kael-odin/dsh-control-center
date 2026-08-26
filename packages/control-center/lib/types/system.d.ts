/**
 * System & Diagnostics Host service: versions, compatibility, dependencies,
 * and environment info for the About / Dependencies / Diagnostics pages.
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import type { EnvCheckEntry, PluginInventory, PluginOperation, PluginOperationResult } from './system-types.ts';
import { type PluginLogEntry } from './log-ring.ts';
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
    /** The plugin's own log ring — the diagnostic bundle's third source. */
    collectDiagnosticLogs(): Promise<{
        ok: true;
        value: PluginLogEntry[];
    }>;
    /**
     * Detect AI coding CLIs on PATH (Cherry CodeCliPage roster parity). Pure
     * detection — install/launch stays with the operator's package manager.
     */
    listCodeClis(): Promise<{
        ok: true;
        value: EnvCheckEntry[];
    }>;
    listDependencies(): Promise<DependencyEntry[]>;
    checkDependencies(): Promise<EnvCheckEntry[]>;
    listPlugins(profile: string): Promise<PluginInventory>;
    managePlugin(profile: string, operation: PluginOperation, spec: string): Promise<PluginOperationResult>;
    private dshHarnessDir;
    private packageRoot;
    [Symbol.dispose](): void;
}
//# sourceMappingURL=system.d.ts.map