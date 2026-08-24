/**
 * WeChat iLink Bot protocol — text-mode port of cherry's reverse-engineered
 * `WeChatProtocol.ts` (@pinixai/weixin-bot).
 *
 * Endpoints live under https://ilinkai.weixin.qq.com and authenticate with a
 * bot token obtained through a QR-code login; every reply must carry the
 * inbound message's `context_token`. Media CDN upload/download is deliberately
 * out of scope here — this bridge moves text.
 */
export declare const USER_MESSAGE_TYPE = 1;
export declare const BOT_MESSAGE_TYPE = 2;
export interface WechatCredentials {
    token: string;
    baseUrl: string;
    accountId: string;
    userId: string;
}
export interface WechatIncomingText {
    userId: string;
    text: string;
    contextToken: string;
}
export declare class WechatApiError extends Error {
    readonly status: number;
    readonly code?: number | undefined;
    constructor(message: string, options: {
        status: number;
        code?: number | undefined;
    });
}
/** True when the error means the bot token expired (server code -14). */
export declare function isWechatSessionExpired(error: unknown): boolean;
/** Token-file path for one channel's WeChat credentials under the DSH home. */
export declare function wechatCredentialsPath(channelId: string): string;
export declare function loadWechatCredentials(channelId: string): Promise<WechatCredentials | undefined>;
export declare function clearWechatCredentials(channelId: string): Promise<void>;
export type WechatQrStatus = 'wait' | 'scaned' | 'confirmed' | 'expired';
export interface QrCodeResponse {
    qrcode: string;
    /** Image content renderable by <img> (data URI expected). */
    imgContent: string;
}
interface RawQrStatus {
    status: WechatQrStatus;
    bot_token?: string;
    ilink_bot_id?: string;
    ilink_user_id?: string;
    baseurl?: string;
}
export declare function wechatFetchQrCode(baseUrlOrigin: string): Promise<QrCodeResponse>;
export declare function wechatPollQrStatus(baseUrlOrigin: string, qrcode: string): Promise<RawQrStatus>;
/**
 * One logged-in WeChat bot: long-polls getupdates, remembers per-peer context
 * tokens (mandatory for replies), and delivers inbound texts to a handler.
 * Session expiry (-14) surfaces through {@link onSessionExpired} so the owner
 * can drop the stored credentials and ask for a fresh QR login.
 */
export declare class WeixinBotLite {
    private baseUrl;
    private readonly uin;
    private readonly credentials;
    private readonly contextTokens;
    private stopped;
    constructor(options: {
        credentials: WechatCredentials;
    });
    get userId(): string;
    stop(): void;
    /**
     * Long-poll until {@link stop}. `onMessage` receives every inbound user
     * text; `onSessionExpired` fires once when the server rejects the token.
     */
    run(handlers: {
        onMessage: (message: WechatIncomingText) => void | Promise<void>;
        onSessionExpired?: () => void | Promise<void>;
        onError?: (error: unknown) => void;
        signal?: AbortSignal;
    }): Promise<void>;
    /** Reply to one inbound message (uses its context token directly). */
    reply(userId: string, contextToken: string, text: string): Promise<void>;
}
export type WechatLoginPhase = 'idle' | 'pending' | 'scaned' | 'confirmed' | 'expired' | 'error';
export interface WechatLoginState {
    phase: WechatLoginPhase;
    /** Renderable QR image content while pending/scaned. */
    qrContent?: string;
    userId?: string;
    error?: string;
}
/**
 * Run one full QR login for a channel: fetch a code, poll until confirmed or
 * expired, persist credentials, and report every transition through `onUpdate`.
 * Resolves with the credentials on success; throws after three expired codes.
 */
export declare function runWechatLogin(options: {
    channelId: string;
    onUpdate: (state: WechatLoginState) => void;
    signal: AbortSignal;
}): Promise<WechatCredentials>;
/** Decrypt helper retained for future media support (AES-128-ECB). */
export declare function wechatAesEcbDecrypt(encrypted: Uint8Array, key: Uint8Array): Buffer;
export {};
//# sourceMappingURL=wechat-bot.d.ts.map