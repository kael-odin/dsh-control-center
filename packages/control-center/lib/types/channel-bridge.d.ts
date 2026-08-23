/**
 * Channel bridge — the host-process service that watches `control-center-channels`
 * and drives live connections for active instances.
 *
 * Four platforms run real protocols today:
 * - Telegram long-polling (getUpdates) — pure fetch.
 * - Discord gateway over WebSocket (heartbeat / identify / MESSAGE_CREATE,
 *   REST sends against api/v10).
 * - Slack Socket Mode (apps.connections.open → WebSocket envelopes with
 *   mandatory 3s acks, chat.postMessage sends).
 * - QQ official bot platform (getAppAccessToken → /gateway WebSocket with
 *   sharded identify, passive replies bound to the inbound msg_id).
 *
 * Feishu (Lark SDK long-connection protocol) and WeChat (reverse-engineered
 * iLink protocol) stay honest errors until their protocol ports land.
 *
 * Every platform shares one reply pipeline: allowlist → default model route
 * (Cherry 重试设置 honored: attempts + fallback routes) → LlmRuntime stream →
 * platform sender. A connected channel proves the credentials work; per-channel
 * status and a log ring feed the UI's 状态点 and 日志 dialog.
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
/**
 * pbbp2 wire frames (the Lark long-connection protocol) are protobuf messages
 * with a tiny fixed schema:
 *
 *   message Header { string key = 1; string value = 2 }
 *   message Frame {
 *     uint64 SeqID = 1;  uint64 LogID = 2;  int32 service = 3;  int32 method = 4;
 *     repeated Header headers = 5;  string payloadEncoding = 6;
 *     string payloadType = 7;  bytes payload = 8;  string LogIDNew = 9;
 *   }
 *
 * method: 0 = control (ping/pong), 1 = data (events). Encoded frames are
 * sent as raw binary WebSocket messages.
 */
interface LarkFrame {
    SeqID?: number;
    LogID?: number;
    service?: number;
    method?: number;
    headers?: Array<{
        key: string;
        value: string;
    }>;
    payload?: Uint8Array;
}
export type { LarkFrame };
/** Minimal protobuf writer for the Frame/Header schema. */
export declare function encodeLarkFrame(frame: LarkFrame): Uint8Array<ArrayBuffer>;
/** Minimal protobuf reader for the Frame/Header schema. */
export declare function decodeLarkFrame(buffer: Uint8Array): LarkFrame;
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
     * Cherry-style allowlist: an empty list allows everyone. Accepts either
     * config key style (allowed_chat_ids / allowed_channel_ids) and checks every
     * candidate id the platform offers for one inbound message.
     */
    private isAllowed;
    /**
     * Shared reply pipeline behind every platform: resolve the host's default
     * model, honor the Cherry 重试设置 (attempts + fallback routes), stream a
     * reply through the LlmRuntime, then hand it to the platform's sender. Any
     * failure is a log line — the connection loop must survive a bad model or a
     * refused send.
     */
    private generateAndDeliver;
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
    private startDiscord;
    /**
     * Discord gateway loop: resolve a gateway URL, open the socket, heartbeat +
     * identify, dispatch MESSAGE_CREATE through the shared reply pipeline. The
     * socket is re-established with backoff after any close — resume sessions
     * are deliberately skipped; a fresh identify re-syncs from live events.
     */
    private runDiscordGateway;
    /** Dispatch one Discord MESSAGE_CREATE through allowlist → reply pipeline. */
    private handleDiscordMessageCreate;
    private sendDiscordMessage;
    private startSlack;
    /**
     * Slack Socket Mode loop: apps.connections.open mints a fresh wss URL each
     * attempt; envelopes must be acked within 3s or Slack resends them. Message
     * events flow through the same allowlist → reply pipeline as every platform.
     */
    private runSlackSocketMode;
    /** Dispatch one Slack message event through allowlist → reply pipeline. */
    private handleSlackEvent;
    private sendSlackMessage;
    private qqTokenCache;
    private qqAccessToken;
    private startQq;
    /**
     * QQ official-bot gateway loop. Passive replies reference the inbound
     * msg_id inside its TTL window (max five per msg_id); once lapsed the send
     * degrades to an active push, which group chats deliver only when the
     * owner enabled 主动发言.
     */
    private runQqGateway;
    /** Route one QQ dispatch event to its chat-type handler. */
    private handleQqDispatch;
    private sendQqMessage;
    private feishuTokenCache;
    private feishuBotOpenId;
    private feishuTenantToken;
    private startFeishu;
    /**
     * Feishu Lark long-connection loop: mint a tenant token, discover the wss
     * endpoint, then speak the protobuf ping/pong + event protocol. Inbound
     * event frames are ACKed with an echoed frame (Feishu redelivers otherwise)
     * and routed through the shared reply pipeline.
     */
    private runFeishuLoop;
    /**
     * One Feishu im.message.receive_v1 event: allowlist the chat, require a
     * mention of the bot in group chats (parity with cherry's requireMention),
     * strip mention tokens, then ride the shared reply pipeline.
     */
    private handleFeishuEvent;
    /** app_id/app_secret of live feishu runtimes (used by the deliver closure). */
    private feishuCredentials;
    private sendFeishuMessage;
    /**
     * Shared WebSocket session for the gateway-style platforms (Discord/Slack/QQ):
     * opens one socket on Node's built-in WebSocket, hands every parsed payload
     * to `onPayload` (whose 'reconnect' verdict closes and re-establishes), and
     * calls `onHello` when the platform hello arrives. Resolves when the socket
     * closes or the signal aborts; callers loop with backoff.
     */
    private runGatewaySocket;
    /** The live socket of a channel, when connected. */
    private sockets;
    private wsFor;
    /** All per-channel statuses (the 状态点 data source). */
    status(): ChannelBridgeStatus[];
    /** One channel's recent runtime log lines. */
    getLog(channelId: string, lines?: number): string[];
}
//# sourceMappingURL=channel-bridge.d.ts.map