/**
 * Channel bridge — the first REAL piece of the 频道 story: a host-process
 * service that watches `control-center-channels` and drives live connections
 * for active instances.
 *
 * Telegram long-polling is implemented end-to-end with nothing but fetch:
 * getUpdates against api.telegram.org with the instance's bot token. A
 * connected channel proves the token works, the bridge reports per-channel
 * status (connected / error / stopped), and every received update lands in a
 * per-channel log ring — the 日志 dialog shows real runtime lines instead of
 * "暂无日志".
 *
 * What this deliberately is NOT yet: the reply pipe into DSH sessions
 * (received messages are logged, not answered), and the other five platform
 * protocols. Those land on top of the lifecycle this file establishes.
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
export declare const CHANNELS_BRIDGE_NAMESPACE: import("@deepseek-ai/dsh-settings").SettingsNamespace;
/** Per-instance runtime status exposed over the wire. */
export interface ChannelBridgeStatus {
    channelId: string;
    name: string;
    type: string;
    /** running only appears while an instance is active in settings. */
    state: 'disconnected' | 'starting' | 'connected' | 'error';
    detail?: string | undefined;
    updatedAt: number;
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        controlCenterChannelBridge: ChannelBridgeService;
    }
}
/**
 * Drives one long-lived connection per active channel instance.
 */
export declare class ChannelBridgeService extends Service {
    static inject: readonly ["settings", "llm"];
    readonly typertRemote: import("@deepseek-ai/dsh-typert-protocol").TypertGatewayBinding<this>;
    private readonly llm;
    private readonly statuses;
    private readonly runtimes;
    private readonly names;
    private source;
    constructor(ctx: Context);
    /** The instances array from the current settings source. */
    private readInstances;
    private reconcile;
    private setStatus;
    private appendLog;
    /**
     * Telegram long-polling loop: getUpdates with a 25s server hold, restart
     * with backoff on failure, stop only through the AbortController.
     */
    private startTelegram;
    private pollTelegram;
    /**
     * One received message: enforce the instance's allowlist, resolve the
     * host's default model, stream a reply through the same LlmRuntime every
     * other consumer uses, and send it back via the bot API. Any failure is a
     * log line — the poll loop must survive a bad model or a refused send.
     */
    private handleIncoming;
    /** One generation attempt over one route; throws on terminal error finish. */
    private generateReply;
    /** Abort signal of the channel's active loop, so replies die with it. */
    private signalFor;
    /**
     * The host default-model route from agent-default-model; null when unset
     * or when the settings service is unavailable.
     */
    private defaultModelRoute;
    private sendTelegramMessage;
    /** All per-channel statuses (the 状态点 data source). */
    status(): ChannelBridgeStatus[];
    /** One channel's recent runtime log lines. */
    getLog(channelId: string, lines?: number): string[];
}
//# sourceMappingURL=channel-bridge.d.ts.map