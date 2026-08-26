/**
 * Host capability probe (PLUGINIZATION.md §1.1): one startup-time survey of
 * every host surface the plugin depends on, so callers consult a single table
 * instead of scattering try/catch fallbacks — and the diagnostic bundle can
 * report exactly which contract broke on an unfamiliar DSH version.
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
export interface CapabilityProbe {
    /** Dot path of the probed surface, e.g. `apiProxy.sessions`. */
    name: string;
    available: boolean;
    detail?: string | undefined;
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        controlCenterCompat: CompatService;
    }
}
export declare class CompatService extends Service {
    static inject: readonly ["settings"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    constructor(ctx: Context);
    /** Presence checks run synchronously; the sessions probe rides one RPC. */
    probe(): Promise<{
        ok: true;
        value: CapabilityProbe[];
    }>;
}
//# sourceMappingURL=compat-probe.d.ts.map