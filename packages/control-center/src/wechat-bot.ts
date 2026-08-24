/**
 * WeChat iLink Bot protocol — text-mode port of cherry's reverse-engineered
 * `WeChatProtocol.ts` (@pinixai/weixin-bot).
 *
 * Endpoints live under https://ilinkai.weixin.qq.com and authenticate with a
 * bot token obtained through a QR-code login; every reply must carry the
 * inbound message's `context_token`. Media CDN upload/download is deliberately
 * out of scope here — this bridge moves text.
 */

import { createDecipheriv } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'

const DEFAULT_BASE_URL = 'https://ilinkai.weixin.qq.com'
const CHANNEL_VERSION = '1.0.0'
const QR_POLL_INTERVAL_MS = 2_000
/** Maximum remembered context tokens (one per peer user id). */
const MAX_CONTEXT_TOKENS = 1_000

export const USER_MESSAGE_TYPE = 1
export const BOT_MESSAGE_TYPE = 2
/** message_state FINISH — replies are always complete texts. */
const STATE_FINISH = 2
/** ApiError code the server returns when the bot token expired. */
const SESSION_EXPIRED_CODE = -14

interface BaseInfo {
  channel_version: string
}

export interface WechatCredentials {
  token: string
  baseUrl: string
  accountId: string
  userId: string
}

export interface WechatIncomingText {
  userId: string
  text: string
  contextToken: string
}

interface WeixinMessage {
  message_id: number
  from_user_id: string
  to_user_id: string
  client_id: string
  create_time_ms: number
  message_type: number
  message_state: number
  context_token: string
  item_list: Array<{
    type: number
    text_item?: { text?: string }
    voice_item?: { text?: string }
  }>
}

export class WechatApiError extends Error {
  readonly status: number
  readonly code?: number | undefined

  constructor(message: string, options: { status: number; code?: number | undefined }) {
    super(message)
    this.name = 'WechatApiError'
    this.status = options.status
    this.code = options.code
  }
}

/** True when the error means the bot token expired (server code -14). */
export function isWechatSessionExpired(error: unknown): boolean {
  return error instanceof WechatApiError && error.code === SESSION_EXPIRED_CODE
}

function buildBaseInfo(): BaseInfo {
  return { channel_version: CHANNEL_VERSION }
}

function buildHeaders(token: string, uin: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    AuthorizationType: 'ilink_bot_token',
    Authorization: `Bearer ${token}`,
    'X-WECHAT-UIN': uin,
  }
}

async function parseResponse(response: Response, label: string): Promise<unknown> {
  const text = await response.text()
  let raw: unknown
  try {
    raw = text.length > 0 ? JSON.parse(text) : {}
  } catch {
    throw new WechatApiError(`${label} 返回非 JSON（HTTP ${String(response.status)}）`, { status: response.status })
  }
  const body = raw as { ret?: unknown; errcode?: unknown; errmsg?: unknown }
  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined)
    throw new WechatApiError(
      typeof body.errmsg === 'string' ? body.errmsg : `${label} 失败（HTTP ${String(response.status)}）`,
      { status: response.status, code: typeof body.errcode === 'number' ? body.errcode : undefined },
    )
  }
  if (typeof body.ret === 'number' && body.ret !== 0) {
    throw new WechatApiError(typeof body.errmsg === 'string' ? body.errmsg : `${label} 失败`, {
      status: response.status,
      code: typeof body.errcode === 'number' ? body.errcode : body.ret,
    })
  }
  return raw
}

async function apiPost(
  baseUrlOrigin: string,
  endpoint: string,
  payload: unknown,
  token: string,
  uin: string,
  timeoutMs = 40_000,
  signal?: AbortSignal,
): Promise<unknown> {
  const timeout = AbortSignal.timeout(timeoutMs)
  // Node 22+: compose the caller's signal with the per-call timeout.
  const signal2 = signal === undefined ? timeout : AbortSignal.any([signal, timeout])
  const response = await fetch(`${baseUrlOrigin}${endpoint}`, {
    method: 'POST',
    headers: buildHeaders(token, uin),
    body: JSON.stringify(payload),
    signal: signal2,
  })
  return parseResponse(response, endpoint)
}

async function apiGet(baseUrlOrigin: string, urlPath: string, extraHeaders: Record<string, string> = {}): Promise<unknown> {
  const response = await fetch(`${baseUrlOrigin}${urlPath}`, { method: 'GET', headers: extraHeaders })
  return parseResponse(response, urlPath)
}

// --------------- Credentials storage ---------------

function sanitizeChannelId(channelId: string): string {
  const safe = channelId.replace(/[^a-zA-Z0-9_-]/g, '')
  if (safe.length === 0 || safe !== channelId) throw new Error(`非法的频道 ID：${JSON.stringify(channelId)}`)
  return safe
}

/** Token-file path for one channel's WeChat credentials under the DSH home. */
export function wechatCredentialsPath(channelId: string): string {
  const dir = `${resolveDshHome()}/control-center/wechat-bot`
  return `${dir}/${sanitizeChannelId(channelId)}.json`
}

export async function loadWechatCredentials(channelId: string): Promise<WechatCredentials | undefined> {
  try {
    const raw = await readFile(wechatCredentialsPath(channelId), 'utf8')
    const parsed = JSON.parse(raw) as Partial<WechatCredentials>
    if (
      typeof parsed.token === 'string' && parsed.token.length > 0
      && typeof parsed.baseUrl === 'string' && typeof parsed.accountId === 'string'
      && typeof parsed.userId === 'string'
    ) {
      return parsed as WechatCredentials
    }
    return undefined
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

async function saveWechatCredentials(credentials: WechatCredentials, tokenPath: string): Promise<void> {
  await mkdir(dirname(tokenPath), { recursive: true, mode: 0o700 })
  await writeFile(tokenPath, `${JSON.stringify(credentials, null, 2)}\n`, { mode: 0o600 })
}

export async function clearWechatCredentials(channelId: string): Promise<void> {
  await rm(wechatCredentialsPath(channelId), { force: true })
}

// --------------- QR login ---------------

export type WechatQrStatus = 'wait' | 'scaned' | 'confirmed' | 'expired'

export interface QrCodeResponse {
  qrcode: string
  /** Image content renderable by <img> (data URI expected). */
  imgContent: string
}

interface RawQrStatus {
  status: WechatQrStatus
  bot_token?: string
  ilink_bot_id?: string
  ilink_user_id?: string
  baseurl?: string
}

export async function wechatFetchQrCode(baseUrlOrigin: string): Promise<QrCodeResponse> {
  const raw = await apiGet(baseUrlOrigin, '/ilink/bot/get_bot_qrcode?bot_type=3') as {
    qrcode?: unknown
    qrcode_img_content?: unknown
  }
  if (typeof raw.qrcode !== 'string' || typeof raw.qrcode_img_content !== 'string') {
    throw new Error('二维码响应格式无效')
  }
  return { qrcode: raw.qrcode, imgContent: raw.qrcode_img_content }
}

export async function wechatPollQrStatus(baseUrlOrigin: string, qrcode: string): Promise<RawQrStatus> {
  const raw = await apiGet(baseUrlOrigin, `/ilink/bot/get_qrcode_status?qrcode=${encodeURIComponent(qrcode)}`, {
    'iLink-App-ClientVersion': '1',
  }) as Record<string, unknown>
  const status = raw.status
  if (status !== 'wait' && status !== 'scaned' && status !== 'confirmed' && status !== 'expired') {
    throw new Error(`二维码状态无效：${String(status)}`)
  }
  return {
    status,
    ...(typeof raw.bot_token === 'string' ? { bot_token: raw.bot_token } : {}),
    ...(typeof raw.ilink_bot_id === 'string' ? { ilink_bot_id: raw.ilink_bot_id } : {}),
    ...(typeof raw.ilink_user_id === 'string' ? { ilink_user_id: raw.ilink_user_id } : {}),
    ...(typeof raw.baseurl === 'string' ? { baseurl: raw.baseurl } : {}),
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

// --------------- Messaging ---------------

interface UpdatesResult {
  msgs: WeixinMessage[]
  cursor: string
}

async function getUpdates(
  baseUrl: string,
  token: string,
  uin: string,
  cursor: string,
  signal?: AbortSignal,
): Promise<UpdatesResult> {
  const raw = await apiPost(
    baseUrl,
    '/ilink/bot/getupdates',
    { get_updates_buf: cursor, base_info: buildBaseInfo() },
    token,
    uin,
    40_000,
    signal,
  ) as { msgs?: unknown; get_updates_buf?: unknown }
  const msgs = Array.isArray(raw.msgs) ? (raw.msgs as WeixinMessage[]) : []
  return { msgs, cursor: typeof raw.get_updates_buf === 'string' ? raw.get_updates_buf : cursor }
}

async function sendTextMessage(
  baseUrl: string,
  token: string,
  uin: string,
  toUserId: string,
  contextToken: string,
  text: string,
): Promise<void> {
  const msg = {
    from_user_id: '',
    to_user_id: toUserId,
    client_id: crypto.randomUUID(),
    message_type: BOT_MESSAGE_TYPE,
    message_state: STATE_FINISH,
    context_token: contextToken,
    item_list: [{ type: 1, text_item: { text } }],
  }
  await apiPost(baseUrl, '/ilink/bot/sendmessage', { msg, base_info: buildBaseInfo() }, token, uin, 15_000)
}

/** Extract the user-facing text of one inbound message's item list. */
function extractText(items: WeixinMessage['item_list']): string {
  return items
    .map(item => {
      if (item.type === 1) return item.text_item?.text ?? ''
      if (item.type === 3) return item.voice_item?.text ?? '[语音]'
      if (item.type === 2) return '[图片]'
      if (item.type === 4) return '[文件]'
      if (item.type === 5) return '[视频]'
      return ''
    })
    .filter(part => part.length > 0)
    .join('\n')
}

/**
 * One logged-in WeChat bot: long-polls getupdates, remembers per-peer context
 * tokens (mandatory for replies), and delivers inbound texts to a handler.
 * Session expiry (-14) surfaces through {@link onSessionExpired} so the owner
 * can drop the stored credentials and ask for a fresh QR login.
 */
export class WeixinBotLite {
  private baseUrl: string
  private readonly uin: string
  private readonly credentials: WechatCredentials
  private readonly contextTokens = new Map<string, string>()
  private stopped = false

  constructor(options: { credentials: WechatCredentials }) {
    this.credentials = options.credentials
    this.baseUrl = normalizeBaseUrl(options.credentials.baseUrl.length > 0 ? options.credentials.baseUrl : DEFAULT_BASE_URL)
    // The UIN header is client-generated (random 4 bytes, base64) per cherry.
    const bytes = new Uint8Array(4)
    crypto.getRandomValues(bytes)
    this.uin = Buffer.from(bytes).toString('base64')
  }

  get userId(): string {
    return this.credentials.userId
  }

  stop(): void {
    this.stopped = true
  }

  /**
   * Long-poll until {@link stop}. `onMessage` receives every inbound user
   * text; `onSessionExpired` fires once when the server rejects the token.
   */
  async run(handlers: {
    onMessage: (message: WechatIncomingText) => void | Promise<void>
    onSessionExpired?: () => void | Promise<void>
    onError?: (error: unknown) => void
    signal?: AbortSignal
  }): Promise<void> {
    let cursor = ''
    let retryDelayMs = 1_000
    while (!this.stopped && handlers.signal?.aborted !== true) {
      try {
        const updates = await getUpdates(this.baseUrl, this.credentials.token, this.uin, cursor, handlers.signal)
        cursor = updates.cursor
        retryDelayMs = 1_000
        for (const message of updates.msgs) {
          // Context tokens arrive on both directions; remember the peer's latest.
          const peerId = message.message_type === USER_MESSAGE_TYPE ? message.from_user_id : message.to_user_id
          if (peerId.length > 0 && message.context_token.length > 0) {
            if (this.contextTokens.size >= MAX_CONTEXT_TOKENS && !this.contextTokens.has(peerId)) {
              const oldest = this.contextTokens.keys().next().value
              if (oldest !== undefined) this.contextTokens.delete(oldest)
            }
            this.contextTokens.set(peerId, message.context_token)
          }
          if (message.message_type !== USER_MESSAGE_TYPE) continue
          const text = extractText(message.item_list ?? [])
          if (text.length === 0) continue
          await handlers.onMessage({ userId: message.from_user_id, text, contextToken: message.context_token })
        }
      } catch (error) {
        if (this.stopped || handlers.signal?.aborted) break
        if (isAbortError(error)) break
        if (isWechatSessionExpired(error)) {
          await handlers.onSessionExpired?.()
          return
        }
        handlers.onError?.(error)
        await delay(retryDelayMs)
        retryDelayMs = Math.min(retryDelayMs * 2, 10_000)
      }
    }
  }

  /** Reply to one inbound message (uses its context token directly). */
  async reply(userId: string, contextToken: string, text: string): Promise<void> {
    if (text.length === 0) throw new Error('消息文本不能为空')
    await sendTextMessage(this.baseUrl, this.credentials.token, this.uin, userId, contextToken, text.slice(0, 2_000))
  }
}

// --------------- Login flow driver ---------------

export type WechatLoginPhase = 'idle' | 'pending' | 'scaned' | 'confirmed' | 'expired' | 'error'

export interface WechatLoginState {
  phase: WechatLoginPhase
  /** Renderable QR image content while pending/scaned. */
  qrContent?: string
  userId?: string
  error?: string
}

/**
 * Run one full QR login for a channel: fetch a code, poll until confirmed or
 * expired, persist credentials, and report every transition through `onUpdate`.
 * Resolves with the credentials on success; throws after three expired codes.
 */
export async function runWechatLogin(options: {
  channelId: string
  onUpdate: (state: WechatLoginState) => void
  signal: AbortSignal
}): Promise<WechatCredentials> {
  let retries = 0
  while (retries < 3) {
    if (options.signal.aborted) throw new Error('登录已取消')
    const qr = await wechatFetchQrCode(DEFAULT_BASE_URL)
    options.onUpdate({ phase: 'pending', qrContent: qr.imgContent })
    for (;;) {
      if (options.signal.aborted) throw new Error('登录已取消')
      const status = await wechatPollQrStatus(DEFAULT_BASE_URL, qr.qrcode)
      if (status.status === 'scaned') {
        options.onUpdate({ phase: 'scaned', qrContent: qr.imgContent })
        continue
      }
      if (status.status === 'confirmed') {
        if (status.bot_token === undefined || status.ilink_bot_id === undefined || status.ilink_user_id === undefined) {
          throw new Error('扫码确认成功，但接口未返回机器人凭据')
        }
        const credentials: WechatCredentials = {
          token: status.bot_token,
          baseUrl: normalizeBaseUrl(status.baseurl ?? DEFAULT_BASE_URL),
          accountId: status.ilink_bot_id,
          userId: status.ilink_user_id,
        }
        await saveWechatCredentials(credentials, wechatCredentialsPath(options.channelId))
        options.onUpdate({ phase: 'confirmed', userId: credentials.userId })
        return credentials
      }
      if (status.status === 'expired') break
      await delay(QR_POLL_INTERVAL_MS)
    }
    retries += 1
    if (retries < 3) options.onUpdate({ phase: 'expired' })
  }
  throw new Error('二维码连续三次过期，登录失败')
}

// --------------- Shared helpers ---------------

function delay(ms: number): Promise<void> {
  return new Promise(resolve => { setTimeout(resolve, ms) })
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')
}

/** Decrypt helper retained for future media support (AES-128-ECB). */
export function wechatAesEcbDecrypt(encrypted: Uint8Array, key: Uint8Array): Buffer {
  const decipher = createDecipheriv('aes-128-ecb', Buffer.from(key), null)
  return Buffer.concat([decipher.update(Buffer.from(encrypted)), decipher.final()])
}
