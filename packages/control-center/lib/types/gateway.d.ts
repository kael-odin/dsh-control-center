/**
 * API gateway runtime — Cherry ApiGatewaySettings parity, real this time.
 *
 * A local loopback HTTP service that exposes the Control Center's configured
 * models through OpenAI- and Anthropic-compatible endpoints:
 *
 *   POST /v1/chat/completions   (OpenAI; stream and non-stream)
 *   POST /v1/messages           (Anthropic; stream and non-stream)
 *   GET  /v1/models             (OpenAI model list)
 *
 * Auth: `Authorization: Bearer <apiKey>` against the key persisted in the
 * `control-center-gateway` settings namespace (the same one the settings page
 * edits). Routing: the request `model` field is `provider/model`; when absent
 * or unknown, the host's agent-default-model route answers.
 *
 * The server binds 127.0.0.1 only — this gateway is for local apps, never a
 * network-exposed proxy.
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
export interface GatewayConfig {
    port: number;
    apiKey: string;
}
export interface GatewayStatus {
    running: boolean;
    port: number;
    url: string | null;
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        controlCenterGateway: GatewayService;
    }
}
export declare class GatewayService extends Service {
    static inject: readonly ["settings", "llm"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private readonly llm;
    private server;
    private boundPort;
    constructor(ctx: Context);
    private config;
    status(): Promise<GatewayStatus>;
    start(): Promise<{
        ok: true;
        value: GatewayStatus;
    } | {
        ok: false;
        error: string;
    }>;
    stop(): Promise<{
        ok: true;
        value: GatewayStatus;
    }>;
    private dispatch;
    /** `model` is `provider/model`; fall back to the host default route. */
    private resolveRoute;
    private runTurn;
    private streamTurn;
    private handleOpenAi;
    private handleAnthropic;
    private handleModels;
    private readBody;
    private respondJson;
}
//# sourceMappingURL=gateway.d.ts.map