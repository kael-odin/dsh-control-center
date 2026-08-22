/**
 * Per-model health checks for configuration surfaces: one tiny real
 * completion per checked model, streamed through the same adapter registry
 * production requests use.
 *
 * This is deliberately NOT an endpoint ping — discoverModels already answers
 * reachability. A model check proves the route serves THIS model id: adapter,
 * credential, and catalog agree, and the provider actually completes. The
 * prompt asks for a fixed token so a healthy check costs cents of nothing and
 * the reply doubles as evidence.
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
/** Serializable outcome of one model check. */
export interface ModelCheckResult {
    ok: boolean;
    /** Round-trip latency through prepare + first finish, when ok. */
    latencyMs?: number;
    /** First bytes of the completion, capped — evidence, not content. */
    reply?: string;
    /** Failure message when not ok (provider refusal, auth, timeout…). */
    error?: string;
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        controlCenterModelCheck: ModelCheckService;
    }
}
/**
 * One-shot real completions used as model health probes.
 */
export declare class ModelCheckService extends Service {
    static inject: readonly ["llm"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private readonly llm;
    constructor(ctx: Context);
    /**
     * Stream one minimal completion against {@param model} on
     * {@param provider}, aborting at the first finish (or the ceiling).
     */
    check(provider: string, model: string): Promise<ModelCheckResult>;
}
//# sourceMappingURL=model-check.d.ts.map