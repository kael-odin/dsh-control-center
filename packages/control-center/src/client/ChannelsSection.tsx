/**
 * Channels settings — Cherry ChannelsSettings parity: six channel types
 * (Feishu/Telegram/QQ/WeChat/Discord/Slack) with per-type instance lists,
 * add/edit/delete modals, permission mode. Instances persist locally; real
 * platform connectivity needs the desktop build (noted honestly).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import { IconPlusOutline16, IconTrashOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import { ConfirmDialog, Switch } from './panel-ui.tsx'
import type { ChannelsState } from './channels-store.ts'
import type { ChannelBridgeStatus } from '../channel-bridge.ts'
import qrcodeGenerator from 'qrcode-generator'
import { importLegacyChannels, ChannelsStore, type ChannelInstance } from './channels-store.ts'

/** Encode one login URL into a scannable QR data URI (GIF, cell=8, margin=4). */
function qrDataUri(content: string): string {
  const qr = qrcodeGenerator(0, 'M')
  qr.addData(content)
  qr.make()
  return qr.createDataURL(8, 4)
}

/** Bridge status slice injected alongside the settings store. */
export interface WechatLoginStateView {
  phase: 'idle' | 'pending' | 'scaned' | 'confirmed' | 'expired' | 'error'
  qrContent?: string
  userId?: string
  error?: string
}

export interface ChannelBridgeHandle {
  status(): Promise<{ ok: true; value: ChannelBridgeStatus[] } | { ok: false; error: { code: string; message: string; details: object } }>
  getLog(channelId: string, lines?: number): Promise<{ ok: true; value: string[] } | { ok: false; error: { code: string; message: string; details: object } }>
  wechatLoginState(channelId: string): Promise<{ ok: true; value: { loggedIn: boolean; userId?: string } } | { ok: false; error: { code: string; message: string; details: object } }>
  wechatQrBegin(channelId: string): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
  wechatQrPoll(channelId: string): Promise<{ ok: true; value: WechatLoginStateView } | { ok: false; error: { code: string; message: string; details: object } }>
}
import { CHANNEL_ICONS } from './channel-icons.ts'
import css from './ChannelsSection.module.css'

/** Injected dependencies delivered by the settings shell. */
export interface ChannelsSectionInjected {
  api: Pick<IApiClient, 'settings'>
  useChannels: SnapshotSelectorHook<ChannelsState>
  controller: ChannelsStore
  /** Lazy handle to the host channel bridge (undefined until mounted). */
  getBridge?: (() => ChannelBridgeHandle | undefined) | undefined
}

/** Props delivered by the slot outlet (partial until injected). */
export type ChannelsSectionProps = Partial<ChannelsSectionInjected>

interface ChannelTypeDef {
  type: string
  name: string
  description: string
  icon: string
  iconKey: string
  fields: ReadonlyArray<{ key: string; label: string; secret?: boolean; fullWidth?: boolean; placeholder?: string }>
  /** Feishu only: feishu.com vs larksuite.com tenant domain. */
  domain?: boolean
  /** QQ only: reply only when mentioned. */
  mentionOnly?: boolean
  /** The allowlist config key + copy (Cherry's chat/channel ids editor). */
  ids?: { key: string; label: string; placeholder: string }
}

const CHANNEL_TYPES: readonly ChannelTypeDef[] = [
  {
    type: 'feishu', name: '飞书', icon: '🪶', iconKey: 'feishu',
    description: '通过 WebSocket 使用飞书/ Lark 机器人接收并回复消息。',
    fields: [
      { key: 'app_id', label: '应用ID', placeholder: '输入你的飞书应用 ID' },
      { key: 'app_secret', label: '应用密钥', secret: true, placeholder: '输入你的飞书应用密钥' },
      { key: 'encrypt_key', label: '加密密钥', secret: true, placeholder: '请输入来自你飞书应用的加密密钥' },
      { key: 'verification_token', label: '验证令牌', secret: true, placeholder: '输入您飞书应用中的验证令牌' },
    ],
    domain: true,
    ids: { key: 'allowed_chat_ids', label: '允许的会话 ID', placeholder: '多个 ID 用英文逗号分隔，留空允许全部' },
  },
  {
    type: 'telegram', name: 'Telegram', icon: '✈️', iconKey: 'telegram',
    description: '通过 Telegram 机器人使用长轮询方式接收和回复消息。',
    fields: [
      { key: 'bot_token', label: 'Bot Token', secret: true, fullWidth: true, placeholder: '输入您的 Telegram 机器人 Token' },
    ],
    ids: { key: 'allowed_chat_ids', label: '允许的会话 ID', placeholder: '多个 ID 用英文逗号分隔，留空允许全部' },
  },
  {
    type: 'qq', name: 'QQ', icon: '🐧', iconKey: 'qq',
    description: '通过 QQ 机器人官方 API 接收和回复消息。',
    fields: [
      { key: 'app_id', label: 'App ID', placeholder: '输入您的 QQ 机器人 App ID' },
      { key: 'client_secret', label: 'Client Secret', secret: true, placeholder: '输入您的 QQ 机器人 Client Secret' },
    ],
    mentionOnly: true,
    ids: { key: 'allowed_chat_ids', label: '允许的会话 ID', placeholder: '多个 ID 用英文逗号分隔，留空允许全部' },
  },
  {
    type: 'wechat', name: '微信', icon: '💬', iconKey: 'wechat',
    description: '通过微信 iLink Bot API 接收和回复消息。凭据由「扫码登录」自动保存到 DSH home，无需手动填写。',
    fields: [],
    ids: { key: 'allowed_chat_ids', label: '允许的会话 ID', placeholder: '多个 ID 用英文逗号分隔，留空允许全部' },
  },
  {
    type: 'discord', name: 'Discord', icon: '🎮', iconKey: 'discord',
    description: '通过 Discord 机器人使用 WebSocket 网关接收和回复消息。',
    fields: [
      { key: 'bot_token', label: 'Bot Token', secret: true, fullWidth: true, placeholder: '输入您的 Discord 机器人 Token' },
    ],
    ids: { key: 'allowed_channel_ids', label: '允许的频道 ID', placeholder: '多个 ID 用英文逗号分隔，留空允许全部' },
  },
  {
    type: 'slack', name: 'Slack', icon: '🧵', iconKey: 'slack',
    description: '通过 Slack 机器人使用 Socket Mode 接收和回复消息。',
    fields: [
      { key: 'bot_token', label: 'Bot Token', secret: true, fullWidth: true, placeholder: 'xoxb-...' },
      { key: 'app_token', label: '应用级别 Token', secret: true, fullWidth: true, placeholder: 'xapp-...' },
    ],
    ids: { key: 'allowed_channel_ids', label: '允许的频道 ID', placeholder: '多个 ID 用英文逗号分隔，留空允许全部' },
  },
]

const PERMISSION_MODES: ReadonlyArray<{ value: string; label: string; description: string }> = [
  { value: '__inherit', label: '继承智能体设置', description: '' },
  { value: 'default', label: '逐次确认', description: '编辑文件或执行命令前询问。' },
  { value: 'plan', label: '仅规划', description: '只规划、不编辑文件，仅执行只读或审查通过的命令。' },
  { value: 'acceptEdits', label: '自动接受编辑', description: '可自由编辑文件，执行命令前询问。' },
  { value: 'auto', label: '智能批准', description: '无需逐次批准，安全检查会拦截风险操作。' },
  { value: 'bypassPermissions', label: '完全访问', description: '跳过权限检查，可删除文件、访问网络。' },
]

/** Comma text -> trimmed, non-empty id list (Cherry's parse rule). */
export function parseAllowedIds(text: string): string[] {
  return text.split(',').map(part => part.trim()).filter(Boolean)
}

const LEGACY_KEY = 'cc.settings.channels'

function loadLegacy(): ChannelInstance[] {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY)
    return raw === null ? [] : JSON.parse(raw) as ChannelInstance[]
  } catch {
    return []
  }
}

function saveLegacy(channels: readonly ChannelInstance[]): void {
  try { window.localStorage.setItem(LEGACY_KEY, JSON.stringify(channels)) } catch { /* best effort */ }
}

function summaryOf(channel: ChannelInstance): string {
  const def = CHANNEL_TYPES.find(t => t.type === channel.type)
  // WeChat keeps no form secrets — its credential status lives in the
  // per-channel login strip below.
  if (channel.type === 'wechat') {
    const ids = channel.config.allowed_chat_ids
    const agentProvider = typeof channel.config.agentProvider === 'string' ? channel.config.agentProvider : ''
    const agentModel = typeof channel.config.agentModel === 'string' ? channel.config.agentModel : ''
    const binding = agentProvider.length > 0 && agentModel.length > 0 ? ` · Agent: ${agentProvider}/${agentModel}` : ''
    return Array.isArray(ids) && ids.length > 0 ? `${ids.length} 个允许会话${binding}` : `iLink Bot · 凭据由扫码登录保存${binding}`
  }
  const tokenKeys = def?.fields.filter(f => f.secret).map(f => f.key) ?? []
  const token = tokenKeys.map(key => typeof channel.config[key] === 'string' ? channel.config[key] as string : '').find(Boolean)
  const parts: string[] = []
  if (token !== undefined && token.length > 0) {
    parts.push(`Token: ${token.slice(0, 7)}...${token.slice(-3)}`)
  }
  if (def?.ids !== undefined) {
    const ids = channel.config[def.ids.key]
    if (Array.isArray(ids) && ids.length > 0) parts.push(`${ids.length} 个允许${def.ids.label.includes('频道') ? '频道' : '会话'}`)
  }
  if (typeof channel.config.domain === 'string' && channel.config.domain.length > 0) {
    parts.push(String(channel.config.domain))
  }
  const agentProvider = typeof channel.config.agentProvider === 'string' ? channel.config.agentProvider : ''
  const agentModel = typeof channel.config.agentModel === 'string' ? channel.config.agentModel : ''
  if (agentProvider.length > 0 && agentModel.length > 0) {
    parts.push(`Agent: ${agentProvider}/${agentModel}`)
  }
  return parts.length === 0 ? '未配置凭证' : parts.join(' · ')
}

/**
 * Render the 频道 section. Instances live in the control-center-channels
 * settings namespace — the same section a desktop bridge reads from
 * settings.yaml — and fall back to browser-local persistence (with an honest
 * notice) when the running host predates the namespace.
 */
export function ChannelsSection(props: ChannelsSectionProps): ReactNode {
  const { api, useChannels, controller, getBridge } = props
  if (api === undefined || useChannels === undefined || controller === undefined) return null
  return <Loaded injected={{ api, useChannels, controller, getBridge }} />
}

function Loaded({ injected }: { injected: ChannelsSectionInjected }): ReactNode {
  const { controller, getBridge } = injected
  const state = injected.useChannels(snapshot => snapshot)
  // Browser-local mirror for hosts without the namespace.
  const [local, setLocal] = useState<readonly ChannelInstance[]>(loadLegacy)
  const [selectedType, setSelectedType] = useState<string>('feishu')
  const [editChannel, setEditChannel] = useState<ChannelInstance | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ChannelInstance | null>(null)
  const [formName, setFormName] = useState('')
  const [formConfig, setFormConfig] = useState<Record<string, unknown>>({})
  const [formIds, setFormIds] = useState('')
  const [formDomain, setFormDomain] = useState<'feishu' | 'lark'>('feishu')
  const [formMentionOnly, setFormMentionOnly] = useState(true)
  const [formPermission, setFormPermission] = useState('__inherit')
  const [formAgentProvider, setFormAgentProvider] = useState('')
  const [formAgentModel, setFormAgentModel] = useState('')
  const [formAgentSystemPrompt, setFormAgentSystemPrompt] = useState('')
  const [logsFor, setLogsFor] = useState<ChannelInstance | null>(null)
  const [bridgeStatuses, setBridgeStatuses] = useState<readonly ChannelBridgeStatus[]>([])
  const [logLines, setLogLines] = useState<string[]>([])
  const migratedRef = useRef(false)
  /** Per-wechat-channel login state from the host (credentials on disk). */
  const [wechatStates, setWechatStates] = useState<Record<string, { loggedIn: boolean; userId?: string }>>({})
  /** The QR login dialog target + live flow snapshot. */
  const [qrFor, setQrFor] = useState<ChannelInstance | null>(null)
  const [qrState, setQrState] = useState<WechatLoginStateView>({ phase: 'idle' })

  const available = state.available
  const instances = useMemo(
    () => (available ? state.instances : local).filter(channel => channel.type === selectedType),
    [available, state.instances, local, selectedType],
  )

  // One-time import of pre-settings browser data into the authority.
  useEffect(() => {
    if (state.status !== 'ready' || !available || migratedRef.current) return
    migratedRef.current = true
    void importLegacyChannels(controller).then((imported) => {
      if (imported) void controller.load()
    })
  }, [state.status, available, controller])

  // Bridge status polling: the dots are real runtime states from the host.
  useEffect(() => {
    if (!available || getBridge === undefined) return undefined
    let stopped = false
    const tick = (): void => {
      const bridge = getBridge()
      if (bridge === undefined) return
      void bridge.status().then((result) => {
        if (!stopped && result.ok) setBridgeStatuses(result.value)
      }, () => undefined)
    }
    tick()
    const timer = window.setInterval(tick, 5000)
    return () => { stopped = true; window.clearInterval(timer) }
  }, [available, getBridge])

  // Live log tail while the dialog is open.
  useEffect(() => {
    if (logsFor === null || getBridge === undefined) return undefined
    let stopped = false
    const fetchLog = (): void => {
      const bridge = getBridge()
      if (bridge === undefined) return
      void bridge.getLog(logsFor.id, 50).then((result) => {
        if (!stopped && result.ok) setLogLines(result.value)
      }, () => undefined)
    }
    fetchLog()
    const timer = window.setInterval(fetchLog, 2000)
    return () => { stopped = true; window.clearInterval(timer) }
  }, [logsFor, getBridge])

  // WeChat credential states: refresh when the wechat view opens or instances change.
  useEffect(() => {
    if (selectedType !== 'wechat' || getBridge === undefined) return
    let stopped = false
    const fetchStates = (): void => {
      const bridge = getBridge()
      if (bridge === undefined) return
      for (const channel of instances) {
        void bridge.wechatLoginState(channel.id).then((result) => {
          if (!stopped && result.ok) {
            setWechatStates(current => ({ ...current, [channel.id]: result.value }))
          }
        }, () => undefined)
      }
    }
    fetchStates()
    return () => { stopped = true }
  }, [selectedType, instances, getBridge])

  // QR login dialog: poll the host flow while open until it settles.
  useEffect(() => {
    if (qrFor === null || getBridge === undefined) return undefined
    let stopped = false
    const poll = (): void => {
      const bridge = getBridge()
      if (bridge === undefined) return
      void bridge.wechatQrPoll(qrFor.id).then((result) => {
        if (!stopped && result.ok) setQrState(result.value)
      }, () => undefined)
    }
    poll()
    const timer = window.setInterval(poll, 2000)
    return () => { stopped = true; window.clearInterval(timer) }
  }, [qrFor, getBridge])

  /** Start one channel's QR login and open the dialog. */
  const beginWechatLogin = (channel: ChannelInstance): void => {
    const bridge = getBridge?.()
    if (bridge === undefined) return
    setQrState({ phase: 'pending' })
    setQrFor(channel)
    void bridge.wechatQrBegin(channel.id).then(() => {
      void bridge.wechatQrPoll(channel.id).then((result) => {
        if (result.ok) setQrState(result.value)
      }, () => undefined)
    }, () => undefined)
  }

  /** Write through the authority, or the browser mirror when unavailable. */
  const persist = (next: readonly ChannelInstance[]): void => {
    if (controller.store.getSnapshot().available) {
      void controller.save(next)
    } else {
      setLocal(next)
      saveLegacy(next)
    }
  }

  const typeDef = useMemo(() => CHANNEL_TYPES.find(t => t.type === selectedType) ?? CHANNEL_TYPES[0]!, [selectedType])

  const handleAdd = (): void => {
    const count = (available ? state.instances : local).filter(c => c.type === typeDef.type).length
    const name = count > 0 ? `${typeDef.name} ${count + 1}` : typeDef.name
    setEditChannel({ id: `channel-${Date.now()}`, type: typeDef.type, name, config: {}, permissionMode: '__inherit', isActive: false, createdAt: Date.now() })
    setFormName(name)
    setFormConfig({})
    setFormIds('')
    setFormDomain('feishu')
    setFormMentionOnly(true)
    setFormPermission('__inherit')
    setFormAgentProvider('')
    setFormAgentModel('')
    setFormAgentSystemPrompt('')
    setIsNew(true)
  }

  const handleEdit = (channel: ChannelInstance): void => {
    setEditChannel(channel)
    setFormName(channel.name)
    setFormConfig({ ...channel.config })
    const def = CHANNEL_TYPES.find(t => t.type === channel.type)
    const idsKey = def?.ids?.key
    setFormIds(idsKey === undefined ? '' : (Array.isArray(channel.config[idsKey]) ? (channel.config[idsKey] as string[]) : []).join(', '))
    setFormDomain(typeof channel.config.domain === 'string' && channel.config.domain === 'lark' ? 'lark' : 'feishu')
    setFormMentionOnly(channel.config.mention_only !== false)
    setFormPermission(channel.permissionMode)
    setFormAgentProvider(typeof channel.config.agentProvider === 'string' ? channel.config.agentProvider : '')
    setFormAgentModel(typeof channel.config.agentModel === 'string' ? channel.config.agentModel : '')
    setFormAgentSystemPrompt(typeof channel.config.agentSystemPrompt === 'string' ? channel.config.agentSystemPrompt : '')
    setIsNew(false)
  }

  const saveChannel = (): void => {
    if (editChannel === null) return
    const config: Record<string, unknown> = { ...formConfig }
    if (typeDef.ids !== undefined) config[typeDef.ids.key] = parseAllowedIds(formIds)
    if (typeDef.domain === true) config.domain = formDomain
    if (typeDef.mentionOnly === true) config.mention_only = formMentionOnly
    // Agent binding: empty provider/model means "no binding → use the shared default model".
    const agentProvider = formAgentProvider.trim()
    const agentModel = formAgentModel.trim()
    if (agentProvider.length > 0) config.agentProvider = agentProvider
    else delete config.agentProvider
    if (agentModel.length > 0) config.agentModel = agentModel
    else delete config.agentModel
    const agentSystemPrompt = formAgentSystemPrompt.trim()
    if (agentSystemPrompt.length > 0) config.agentSystemPrompt = agentSystemPrompt
    else delete config.agentSystemPrompt
    const next = { ...editChannel, name: formName.trim() || editChannel.name, config, permissionMode: formPermission }
    persist(isNew ? [...(available ? state.instances : local), next] : (available ? state.instances : local).map(c => c.id === next.id ? next : c))
    setEditChannel(null)
  }

  const toggleActive = (channel: ChannelInstance): void => {
    persist((available ? state.instances : local).map(c => c.id === channel.id ? { ...c, isActive: !c.isActive } : c))
  }

  const confirmDelete = (): void => {
    if (deleteTarget === null) return
    persist((available ? state.instances : local).filter(c => c.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className={css.split}>
      <aside className={css.submenu}>
        <div className={css.submenuTitle}>频道</div>
        <div className={css.submenuList}>
          {CHANNEL_TYPES.map(type => (
            <button
              key={type.type}
              type="button"
              className={`${css.submenuItem} ${type.type === selectedType ? css.submenuItemActive : ''}`}
              onClick={() => { setSelectedType(type.type) }}
            >
              <img className={css.typeIconImg} src={CHANNEL_ICONS[type.iconKey]} alt={type.name} />
              <span>{type.name}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className={css.detail}>
        <div className={css.detailScroll}>
          <div className={css.detailBody}>
            <div className={css.detailHeader}>
              <div className={css.detailTitleBlock}>
                <img className={css.typeIconImgLarge} src={CHANNEL_ICONS[typeDef.iconKey]} alt={typeDef.name} />
                <span className={css.detailTitle}>{typeDef.name}</span>
              </div>
              <button type="button" className={css.addBtn} disabled={!state.writable && available} onClick={handleAdd}>
                <IconPlusOutline16 size={16} />
                添加
              </button>
            </div>
            <p className={css.detailDesc}>{typeDef.description}</p>
            <div className={css.divider} />

            <p className={css.detailDesc}>{typeDef.description}</p>
            <div className={css.divider} />

            {!available && (
              <div className={css.notice}>
                当前部署未启用频道存储，更改仅保存在本浏览器；更新 Control Center 后可迁移。
              </div>
            )}

            {instances.length === 0 ? (
              <div className={css.emptyState}>暂无 {typeDef.name} 频道，点击「+ 添加」创建。</div>
            ) : instances.map(channel => (
              <div key={channel.id} className={css.instanceRow}>
                <span
                  className={`${css.statusDot} ${(() => {
                    const bridgeState = bridgeStatuses.find(entry => entry.channelId === channel.id)?.state
                    if (bridgeState === 'connected') return css.statusDotConnected ?? ''
                    if (bridgeState === 'error') return css.statusDotError ?? ''
                    return channel.isActive ? css.statusDotActive : ''
                  })()}`}
                  title={bridgeStatuses.find(entry => entry.channelId === channel.id)?.detail ?? undefined}
                />
                <div className={css.instanceMain}>
                  <div className={css.instanceName}>
                    {channel.name}
                    {channel.isActive && <span className={css.connectedBadge}>已启用</span>}
                  </div>
                  <div className={css.instanceSummary}>{summaryOf(channel)}</div>
                  {channel.type === 'wechat' && (() => {
                    const loginState = qrFor?.id === channel.id ? qrState : undefined
                    const credentialState = wechatStates[channel.id]
                    const loggedIn = loginState?.phase === 'confirmed' || credentialState?.loggedIn === true
                    const shownUser = loginState?.userId ?? credentialState?.userId
                    return (
                      <div className={css.wechatLoginRow}>
                        <span className={`${css.wechatLoginDot} ${loggedIn ? css.wechatLoginDotOn : ''}`} />
                        <span className={css.wechatLoginText}>
                          {loggedIn ? `已登录${shownUser === undefined ? '' : `（${shownUser}）`}` : '未登录'}
                        </span>
                        <button type="button" className="cc-btn cc-btn-secondary" style={{ fontSize: 12, padding: '3px 10px' }}
                          disabled={!available || getBridge === undefined}
                          onClick={() => { beginWechatLogin(channel) }}>
                          {loggedIn ? '重新扫码' : '扫码登录'}
                        </button>
                      </div>
                    )
                  })()}
                </div>
                <div className={css.instanceOps}>
                  <button type="button" className={css.opBtn} title="日志" onClick={() => { setLogsFor(channel) }}>📄</button>
                  <button type="button" className={css.opBtn} title="编辑" onClick={() => { handleEdit(channel) }}>✎</button>
                  <button type="button" className={`${css.opBtn} ${css.opBtnDanger}`} title="删除" onClick={() => { setDeleteTarget(channel) }}>
                    <IconTrashOutline16 size={13} />
                  </button>
                  <Switch checked={channel.isActive} onChange={() => { toggleActive(channel) }} label={channel.name} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editChannel !== null && typeDef !== undefined && (
        <div className={css.modalOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setEditChannel(null) }}>
          <div className={css.modalCard} role="dialog" aria-modal="true" aria-label={editChannel.name}>
            <h3>{editChannel.name}</h3>
            <div className={css.formGrid}>
              <div className={`${css.formField} ${css.formFieldSpan2}`}>
                <label>名称</label>
                <input className={css.formInput} value={formName} onChange={event => { setFormName(event.target.value) }} autoFocus />
              </div>
              {typeDef.fields.map(field => (
                <div key={field.key} className={`${css.formField} ${field.fullWidth === true ? css.formFieldSpan2 : ''}`}>
                  <label>{field.label}</label>
                  <input
                    className={css.formInput}
                    type={field.secret ? 'password' : 'text'}
                    value={typeof formConfig[field.key] === 'string' ? formConfig[field.key] as string : ''}
                    onChange={event => { setFormConfig(current => ({ ...current, [field.key]: event.target.value })) }}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
              {typeDef.domain === true
                ? (
                  <div className={css.formField}>
                    <label>域名</label>
                    <select
                      className={css.formSelect}
                      value={formDomain}
                      onChange={event => { setFormDomain(event.target.value as 'feishu' | 'lark') }}
                    >
                      <option value="feishu">feishu（国内）</option>
                      <option value="lark">Lark（国际）</option>
                    </select>
                  </div>
                )
                : null}
              {typeDef.mentionOnly === true
                ? (
                  <div className={`${css.formField} ${css.formFieldSpan2}`}>
                    <label>仅被 @ 时回复</label>
                    <div className={css.formSwitchRow}>
                      <Switch checked={formMentionOnly} onChange={setFormMentionOnly} label="mention_only" />
                      <span className={css.formHint}>开启后，群聊中只有 @ 机器人的消息会触发回复。</span>
                    </div>
                  </div>
                )
                : null}
              {typeDef.ids !== undefined
                ? (
                  <div className={css.formFieldSpan2}>
                    <div className={css.formField}>
                      <label>{typeDef.ids.label}</label>
                      <input
                        className={css.formInput}
                        value={formIds}
                        onChange={event => { setFormIds(event.target.value) }}
                        onBlur={() => { setFormIds(parseAllowedIds(formIds).join(', ')) }}
                        placeholder={typeDef.ids.placeholder}
                      />
                      <div className={css.formHint}>逗号分隔；留空表示允许全部会话/频道。</div>
                    </div>
                  </div>
                )
                : null}
              <div className={`${css.formField} ${css.formFieldSpan2}`}>
                <label>频道权限模式</label>
                <select className={css.formSelect} value={formPermission} onChange={event => { setFormPermission(event.target.value) }}>
                  {PERMISSION_MODES.map(mode => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
                {formPermission !== '__inherit' && (
                  <div className={css.formHint}>{PERMISSION_MODES.find(m => m.value === formPermission)?.description}</div>
                )}
              </div>
              <details className={css.formFieldSpan2}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Agent 绑定（可选）</summary>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className={css.formField}>
                    <label>提供商</label>
                    <input className={css.formInput} value={formAgentProvider} onChange={e => { setFormAgentProvider(e.target.value) }} placeholder="deepseek" />
                  </div>
                  <div className={css.formField}>
                    <label>模型</label>
                    <input className={css.formInput} value={formAgentModel} onChange={e => { setFormAgentModel(e.target.value) }} placeholder="deepseek-v4-flash" />
                  </div>
                  <div className={css.formField}>
                    <label>系统提示词</label>
                    <textarea className={css.formInput} style={{ minHeight: 60, resize: 'vertical' }} value={formAgentSystemPrompt} onChange={e => { setFormAgentSystemPrompt(e.target.value) }} placeholder="选填；留空使用默认系统提示词" />
                  </div>
                </div>
              </details>
            </div>
            <div className={css.modalFooter}>
              <button type="button" className={css.btn} onClick={() => { setEditChannel(null) }}>取消</button>
              <button type="button" className={`${css.btn} ${css.btnPrimary}`} onClick={saveChannel}>保存</button>
            </div>
          </div>
        </div>
      )}

      {logsFor !== null && (
        <div className={css.modalOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setLogsFor(null) }}>
          <div className={css.modalCard} role="dialog" aria-modal="true" aria-label={`${logsFor.name} — 日志`}>
            <h3>{logsFor.name} — 日志</h3>
            <div className={css.logsBody}>
              {logLines.length === 0
                ? '暂无运行时日志。启用频道并收到消息后，连接与消息事件会显示在这里。'
                : logLines.map((line, index) => <div key={index} className={css.logLine}>{line}</div>)}
            </div>
            <div className={css.modalFooter}>
              <button type="button" className={css.btn} onClick={() => { setLogsFor(null) }}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {qrFor !== null && (
        <div className={css.modalOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setQrFor(null) }}>
          <div className={css.modalCard} role="dialog" aria-modal="true" aria-label={`${qrFor.name} — 微信扫码登录`}>
            <h3>{qrFor.name} — 微信扫码登录</h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '8px 0' }}>
              {(qrState.phase === 'pending' || qrState.phase === 'scaned') && qrState.qrContent !== undefined && (
                <img
                  alt="微信登录二维码"
                  style={{ width: 220, height: 220, borderRadius: 8, background: '#fff', padding: 8 }}
                  src={qrState.qrContent.startsWith('data:')
                    ? qrState.qrContent
                    : qrState.qrContent.startsWith('http')
                      ? qrDataUri(qrState.qrContent)
                      : `data:image/png;base64,${qrState.qrContent}`}
                />
              )}
              {qrState.phase === 'scaned' && <div>已扫描，请在手机上确认登录</div>}
              {qrState.phase === 'pending' && <div>请使用微信扫描二维码登录 iLink 机器人</div>}
              {qrState.phase === 'expired' && (
                <>
                  <div style={{ color: 'var(--warning, #b45309)' }}>二维码已过期</div>
                  <button type="button" className="cc-btn cc-btn-primary" onClick={() => { beginWechatLogin(qrFor) }}>
                    刷新二维码
                  </button>
                </>
              )}
              {qrState.phase === 'confirmed' && (
                <>
                  <div style={{ color: 'var(--success-border, #15803d)' }}>登录成功</div>
                  {qrState.userId !== undefined && <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{qrState.userId}</div>}
                </>
              )}
              {qrState.phase === 'error' && (
                <>
                  <div className="cc-notice-error">{qrState.error ?? '登录失败'}</div>
                  <button type="button" className="cc-btn cc-btn-primary" onClick={() => { beginWechatLogin(qrFor) }}>
                    重试
                  </button>
                </>
              )}
              {qrState.phase === 'idle' && <div>正在启动登录…</div>}
            </div>
            <div className={css.modalFooter}>
              <button type="button" className={css.btn} onClick={() => {
                setQrFor(null)
                if (getBridge !== undefined) {
                  const bridge = getBridge()
                  if (bridge === undefined) return
                  void bridge.wechatLoginState(qrFor.id).then((result) => {
                    if (result.ok) setWechatStates(current => ({ ...current, [qrFor.id]: result.value }))
                  }, () => undefined)
                }
              }}>关闭</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除频道"
        description={deleteTarget === null ? '' : `确定删除频道「${deleteTarget.name}」？`}
        confirmText="确认"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteTarget(null) }}
      />
    </div>
  )
}
