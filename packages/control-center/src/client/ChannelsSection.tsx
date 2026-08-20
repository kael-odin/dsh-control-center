/**
 * Channels settings — Cherry ChannelsSettings parity: six channel types
 * (Feishu/Telegram/QQ/WeChat/Discord/Slack) with per-type instance lists,
 * add/edit/delete modals, permission mode. Instances persist locally; real
 * platform connectivity needs the desktop build (noted honestly).
 */
import { useEffect, useMemo, useState } from 'react'
import { IconPlusOutline16, IconTrashOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import { ConfirmDialog, Switch } from './panel-ui.tsx'
import css from './ChannelsSection.module.css'

interface ChannelTypeDef {
  type: string
  name: string
  description: string
  icon: string
  fields: ReadonlyArray<{ key: string; label: string; secret?: boolean; fullWidth?: boolean; placeholder?: string }>
}

const CHANNEL_TYPES: readonly ChannelTypeDef[] = [
  {
    type: 'feishu', name: '飞书', icon: '🪶',
    description: '通过 WebSocket 使用飞书/ Lark 机器人接收并回复消息。',
    fields: [
      { key: 'app_id', label: '应用ID', placeholder: '输入你的飞书应用 ID' },
      { key: 'app_secret', label: '应用密钥', secret: true, placeholder: '输入你的飞书应用密钥' },
      { key: 'encrypt_key', label: '加密密钥', secret: true, placeholder: '请输入来自你飞书应用的加密密钥' },
      { key: 'verification_token', label: '验证令牌', secret: true, placeholder: '输入您飞书应用中的验证令牌' },
    ],
  },
  {
    type: 'telegram', name: 'Telegram', icon: '✈️',
    description: '通过 Telegram 机器人使用长轮询方式接收和回复消息。',
    fields: [
      { key: 'bot_token', label: 'Bot Token', secret: true, fullWidth: true, placeholder: '输入您的 Telegram 机器人 Token' },
    ],
  },
  {
    type: 'qq', name: 'QQ', icon: '🐧',
    description: '通过 QQ 机器人官方 API 接收和回复消息。',
    fields: [
      { key: 'app_id', label: 'App ID', placeholder: '输入您的 QQ 机器人 App ID' },
      { key: 'client_secret', label: 'Client Secret', secret: true, placeholder: '输入您的 QQ 机器人 Client Secret' },
    ],
  },
  {
    type: 'wechat', name: '微信', icon: '💬',
    description: '通过微信 iLink Bot API 接收和回复消息。',
    fields: [
      { key: 'token_path', label: 'Token 路径', fullWidth: true, placeholder: '输入微信 iLink Bot 的 Token 路径' },
    ],
  },
  {
    type: 'discord', name: 'Discord', icon: '🎮',
    description: '通过 Discord 机器人使用 WebSocket 网关接收和回复消息。',
    fields: [
      { key: 'bot_token', label: 'Bot Token', secret: true, fullWidth: true, placeholder: '输入您的 Discord 机器人 Token' },
    ],
  },
  {
    type: 'slack', name: 'Slack', icon: '🧵',
    description: '通过 Slack 机器人使用 Socket Mode 接收和回复消息。',
    fields: [
      { key: 'bot_token', label: 'Bot Token', secret: true, fullWidth: true, placeholder: 'xoxb-...' },
      { key: 'app_token', label: '应用级别 Token', secret: true, fullWidth: true, placeholder: 'xapp-...' },
    ],
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

export interface ChannelInstance {
  id: string
  type: string
  name: string
  config: Record<string, string>
  permissionMode: string
  isActive: boolean
  createdAt: number
}

const CHANNELS_KEY = 'cc.settings.channels'

function loadChannels(): ChannelInstance[] {
  try {
    const raw = localStorage.getItem(CHANNELS_KEY)
    return raw === null ? [] : JSON.parse(raw) as ChannelInstance[]
  } catch {
    return []
  }
}

function saveChannels(channels: ChannelInstance[]): void {
  try { localStorage.setItem(CHANNELS_KEY, JSON.stringify(channels)) } catch { /* best effort */ }
}

function summaryOf(channel: ChannelInstance): string {
  const def = CHANNEL_TYPES.find(t => t.type === channel.type)
  const tokenKeys = def?.fields.filter(f => f.secret).map(f => f.key) ?? []
  const token = tokenKeys.map(key => channel.config[key] ?? '').find(Boolean)
  if (token !== undefined && token.length > 0) {
    const prefix = token.slice(0, 7)
    const suffix = token.slice(-3)
    return `Token: ${prefix}...${suffix}`
  }
  return '未配置凭证'
}

export function ChannelsSection() {
  const [channels, setChannels] = useState<ChannelInstance[]>(loadChannels)
  const [selectedType, setSelectedType] = useState<string>('feishu')
  const [editChannel, setEditChannel] = useState<ChannelInstance | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ChannelInstance | null>(null)
  const [formName, setFormName] = useState('')
  const [formConfig, setFormConfig] = useState<Record<string, string>>({})
  const [formPermission, setFormPermission] = useState('__inherit')
  const [logsFor, setLogsFor] = useState<ChannelInstance | null>(null)

  useEffect(() => {
    saveChannels(channels)
  }, [channels])

  const typeDef = useMemo(() => CHANNEL_TYPES.find(t => t.type === selectedType) ?? CHANNEL_TYPES[0]!, [selectedType])
  const instances = useMemo(() => channels.filter(c => c.type === selectedType), [channels, selectedType])

  const handleAdd = (): void => {
    const count = channels.filter(c => c.type === typeDef.type).length
    setEditChannel({
      id: `channel-${Date.now()}`,
      type: typeDef.type,
      name: count > 0 ? `${typeDef.name} ${count + 1}` : typeDef.name,
      config: {},
      permissionMode: '__inherit',
      isActive: false,
      createdAt: Date.now(),
    })
    setFormName(count > 0 ? `${typeDef.name} ${count + 1}` : typeDef.name)
    setFormConfig({})
    setFormPermission('__inherit')
    setIsNew(true)
  }

  const handleEdit = (channel: ChannelInstance): void => {
    setEditChannel(channel)
    setFormName(channel.name)
    setFormConfig({ ...channel.config })
    setFormPermission(channel.permissionMode)
    setIsNew(false)
  }

  const saveChannel = (): void => {
    if (editChannel === null) return
    const next = { ...editChannel, name: formName.trim() || editChannel.name, config: formConfig, permissionMode: formPermission }
    setChannels(current => isNew ? [...current, next] : current.map(c => c.id === next.id ? next : c))
    setEditChannel(null)
  }

  const toggleActive = (channel: ChannelInstance): void => {
    setChannels(current => current.map(c => c.id === channel.id ? { ...c, isActive: !c.isActive } : c))
  }

  const confirmDelete = (): void => {
    if (deleteTarget === null) return
    setChannels(current => current.filter(c => c.id !== deleteTarget.id))
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
              <span className={css.typeIcon}>{type.icon}</span>
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
                <span className={css.typeIconLarge}>{typeDef.icon}</span>
                <span className={css.detailTitle}>{typeDef.name}</span>
              </div>
              <button type="button" className={css.addBtn} onClick={handleAdd}>
                <IconPlusOutline16 size={16} />
                添加
              </button>
            </div>
            <p className={css.detailDesc}>{typeDef.description}</p>
            <div className={css.divider} />

            <div className={css.notice}>
              Web 版不附带独立伴生程序；频道绑定与消息推送需要桌面环境支持。此处配置将随桌面版直接生效。
            </div>

            {instances.length === 0 ? (
              <div className={css.emptyState}>暂无 {typeDef.name} 频道，点击「+ 添加」创建。</div>
            ) : instances.map(channel => (
              <div key={channel.id} className={css.instanceRow}>
                <span className={`${css.statusDot} ${channel.isActive ? css.statusDotActive : ''}`} />
                <div className={css.instanceMain}>
                  <div className={css.instanceName}>
                    {channel.name}
                    {channel.isActive && <span className={css.connectedBadge}>已连接</span>}
                  </div>
                  <div className={css.instanceSummary}>{summaryOf(channel)}</div>
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

      {editChannel !== null && (
        <div className={css.modalOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setEditChannel(null) }}>
          <div className={css.modalCard} role="dialog" aria-modal="true" aria-label={editChannel.name}>
            <h3>{editChannel.name}</h3>
            <div className={css.formField}>
              <label>名称</label>
              <input className={css.formInput} value={formName} onChange={event => { setFormName(event.target.value) }} autoFocus />
            </div>
            {typeDef.fields.map(field => (
              <div key={field.key} className={css.formField}>
                <label>{field.label}</label>
                <input
                  className={css.formInput}
                  type={field.secret ? 'password' : 'text'}
                  value={formConfig[field.key] ?? ''}
                  onChange={event => { setFormConfig(current => ({ ...current, [field.key]: event.target.value })) }}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
            <div className={css.formField}>
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
            <div className={css.logsBody}>暂无日志</div>
            <div className={css.modalFooter}>
              <button type="button" className={css.btn} onClick={() => { setLogsFor(null) }}>关闭</button>
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
