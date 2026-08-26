/**
 * Selection assistant settings — Cherry SelectionAssistantSettings parity:
 * enable + toolbar preview, trigger mode, compact, window behaviors, action
 * list (built-in 7 + custom, drag to reorder/enable), app filter. Persisted
 * locally; system-level capture needs the desktop build (noted honestly).
 */
import { useMemo, useState } from 'react'
import type { SelectionAction, SelectionPrefs } from '../assistant-types.ts'
import type { AssistantRemote, DesktopRemote } from './assistant-store.ts'
import { useAssistantStore, useDesktopStatus } from './assistant-store.ts'
import { IconMoreHorizontal, IconPlus, IconRefreshCw, IconTrash2 } from './cherry-icons.tsx'
import { ConfirmDialog, HelpTooltip } from './panel-ui.tsx'
import {
  SettingDivider, SettingGroup, SettingRow, SettingRowTitle, SettingsPageShell, SettingSwitch,
} from './SettingsPages.tsx'
import css from './SelectionAssistantSection.module.css'

const DEFAULT_ACTIONS: readonly SelectionAction[] = [
  { id: 'translate', name: '翻译', icon: 'languages', enabled: true, builtin: true },
  { id: 'explain', name: '解释', icon: 'file-question', enabled: true, builtin: true },
  { id: 'summary', name: '总结', icon: 'scan-text', enabled: true, builtin: true },
  { id: 'search', name: '搜索', icon: 'search', enabled: true, builtin: true, searchEngine: 'Google|https://www.google.com/search?q={{queryString}}' },
  { id: 'copy', name: '复制', icon: 'clipboard-copy', enabled: true, builtin: true },
  { id: 'refine', name: '优化', icon: 'wand-sparkles', enabled: false, builtin: true },
  { id: 'quote', name: '引用', icon: 'quote', enabled: false, builtin: true },
]

const MAX_ENABLED = 8
const MAX_CUSTOM = 10

const SELECTION_KEY = 'cc.settings.selection'

export interface SelectionAssistantSectionInjected {
  assistant: AssistantRemote | undefined
  desktop: DesktopRemote | undefined
}

export function SelectionAssistantSection({ assistant, desktop }: SelectionAssistantSectionInjected) {
  const store = useAssistantStore(assistant, SELECTION_KEY, 'selection')
  const status = useDesktopStatus(desktop)
  const loaded = store.prefs === null ? null : store.prefs.selection
  const prefs: SelectionPrefs | null = loaded === null
    ? null
    : (loaded.actions.length > 0 ? loaded : { ...loaded, actions: DEFAULT_ACTIONS.map(action => ({ ...action })) })
  const [customOpen, setCustomOpen] = useState(false)
  const [editAction, setEditAction] = useState<SelectionAction | null>(null)
  const [deleteAction, setDeleteAction] = useState<SelectionAction | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterDraft, setFilterDraft] = useState('')
  const [formName, setFormName] = useState('')
  const [formIcon, setFormIcon] = useState('')
  const [formPrompt, setFormPrompt] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  /** Apply a mutation to the selection slice and persist via the host. */
  const setPrefs = (mutate: (current: SelectionPrefs) => SelectionPrefs): void => {
    if (prefs !== null) void store.update({ selection: mutate(prefs) })
  }

  const update = (patch: Partial<SelectionPrefs>): void => {
    setPrefs(current => ({ ...current, ...patch }))
  }

  const enabledActions = useMemo(() => (prefs?.actions ?? []).filter(a => a.enabled), [prefs?.actions])
  const disabledActions = useMemo(() => (prefs?.actions ?? []).filter(a => !a.enabled), [prefs?.actions])

  if (prefs === null) return <SettingsPageShell><div className={css.loading}>加载中...</div></SettingsPageShell>
  const desktopLive = status !== null && status.supported

  const moveAction = (id: string, direction: -1 | 1): void => {
    setPrefs(current => {
      const list = [...current.actions]
      const index = list.findIndex(a => a.id === id)
      const target = index + direction
      if (index < 0 || target < 0 || target >= list.length) return current
      const [item] = list.splice(index, 1)
      list.splice(target, 0, item!)
      return { ...current, actions: list }
    })
  }

  const onDragStart = (id: string): void => { setDragId(id) }
  const onDropAt = (targetId: string): void => {
    if (dragId === null || dragId === targetId) { setDragId(null); return }
    setPrefs(current => {
      const list = [...current.actions]
      const from = list.findIndex(a => a.id === dragId)
      const to = list.findIndex(a => a.id === targetId)
      if (from < 0 || to < 0) return current
      const [item] = list.splice(from, 1)
      list.splice(to, 0, item!)
      return { ...current, actions: list }
    })
    setDragId(null)
  }

  const toggleAction = (id: string): void => {
    setPrefs(current => {
      const target = current.actions.find(a => a.id === id)
      if (target === undefined) return current
      if (!target.enabled && enabledActions.length >= MAX_ENABLED) return current
      if (target.enabled && enabledActions.length <= 1) return current
      return { ...current, actions: current.actions.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a) }
    })
  }

  const resetActions = (): void => {
    setPrefs(current => ({
      ...current,
      actions: [
        ...DEFAULT_ACTIONS.map(action => ({ ...action })),
        ...current.actions.filter(a => !a.builtin).map(a => ({ ...a, enabled: false })),
      ],
    }))
    setConfirmReset(false)
  }

  const openAdd = (): void => {
    if (prefs.actions.filter(a => !a.builtin).length >= MAX_CUSTOM) return
    setEditAction(null)
    setFormName('')
    setFormIcon('')
    setFormPrompt('')
    setCustomOpen(true)
  }

  const openEdit = (action: SelectionAction): void => {
    setEditAction(action)
    setFormName(action.name)
    setFormIcon(action.icon)
    setFormPrompt(action.prompt ?? '')
    setCustomOpen(true)
  }

  const saveCustom = (): void => {
    if (formName.trim() === '') return
    setPrefs(current => {
      if (editAction !== null) {
        return { ...current, actions: current.actions.map(a => a.id === editAction.id ? { ...a, name: formName.trim(), icon: formIcon.trim() || a.icon, prompt: formPrompt.trim() } : a) }
      }
      return { ...current, actions: [...current.actions, { id: `user-${Date.now()}`, name: formName.trim(), icon: formIcon.trim() || 'sparkles', enabled: false, builtin: false, prompt: formPrompt.trim() }] }
    })
    setCustomOpen(false)
  }

  const confirmDeleteAction = (): void => {
    if (deleteAction === null) return
    setPrefs(current => ({ ...current, actions: current.actions.filter(a => a.id !== deleteAction.id) }))
    setDeleteAction(null)
  }

  const openFilter = (): void => {
    setFilterDraft(prefs.filterList.join('\n'))
    setFilterOpen(true)
  }

  const saveFilter = (): void => {
    const list = filterDraft.split(/\r?\n/).map(line => line.trim().toLowerCase()).filter(Boolean)
    update({ filterList: [...new Set(list)] })
    setFilterOpen(false)
  }

  const ICONS: Record<string, string> = {
    languages: '译', 'file-question': '？', 'scan-text': '文', search: '搜',
    'clipboard-copy': '复', 'wand-sparkles': '✨', quote: '“', sparkles: '✨',
  }

  return (
    <SettingsPageShell>
      {!desktopLive ? (
        <div className={css.notice}>
          划词助手依赖系统级选中事件与悬浮窗，Web 版不可用；配置已保存，将在桌面版集成后生效。
        </div>
      ) : (
        <div className={css.notice}>桌面版已连接；选中事件捕获能力集成中，配置已先保存。</div>
      )}

      <SettingGroup>
        <div className={css.groupHeaderRow}>
          <span>划词助手</span>
          <button type="button" className={css.faqLink}>FAQ & 反馈</button>
        </div>
        <SettingDivider />
        <SettingSwitch
          label="启用"
          checked={prefs.enabled}
          onChange={next => { update({ enabled: next }) }}
          description="当前仅支持 Windows & macOS；浏览器环境无法拦截选中事件。"
        />
      </SettingGroup>

      <SettingGroup>
        <div className={css.groupTitle}>工具栏</div>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>
            取词方式
            <HelpTooltip text="少数应用不支持通过 Ctrl 键划词。若使用了 AHK 等按键映射工具对 Ctrl 键进行了重映射，可能导致部分应用无法划词。" />
          </SettingRowTitle>
          <div className={css.radioRow}>
            {([['selected', '划词'], ['ctrlkey', 'Ctrl 键'], ['shortcut', '快捷键']] as const).map(([value, label]) => (
              <label key={value} className={css.radioItem}>
                <input
                  type="radio"
                  name="trigger"
                  checked={prefs.triggerMode === value}
                  onChange={() => { update({ triggerMode: value }) }}
                  disabled={value === 'ctrlkey'}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </SettingRow>
        <SettingDivider />
        <SettingSwitch
          label="紧凑模式"
          checked={prefs.compact}
          onChange={next => { update({ compact: next }) }}
          description="紧凑模式下，只显示图标，不显示文字"
        />
      </SettingGroup>

      <SettingGroup>
        <div className={css.groupTitle}>功能窗口</div>
        <SettingDivider />
        <SettingSwitch label="跟随工具栏" checked={prefs.followToolbar} onChange={next => { update({ followToolbar: next }) }} description="窗口位置将跟随工具栏显示，禁用后则始终居中显示" />
        <SettingDivider />
        <SettingSwitch label="记住大小" checked={prefs.rememberWinSize} onChange={next => { update({ rememberWinSize: next }) }} description="应用运行期间，窗口会按上次调整的大小显示" />
        <SettingDivider />
        <SettingSwitch label="自动关闭" checked={prefs.autoClose} onChange={next => { update({ autoClose: next }) }} description="当窗口未置顶且失去焦点时，将自动关闭该窗口" />
        <SettingDivider />
        <SettingSwitch label="自动置顶" checked={prefs.autoPin} onChange={next => { update({ autoPin: next }) }} description="默认将窗口置于顶部" />
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>透明度</SettingRowTitle>
          <div className={css.opacityRow}>
            <span>{prefs.opacity}%</span>
            <input
              type="range"
              className={css.opacitySlider}
              min={20}
              max={100}
              value={prefs.opacity}
              onChange={event => { update({ opacity: Number(event.target.value) }) }}
            />
          </div>
        </SettingRow>
      </SettingGroup>

      <SettingGroup>
        <div className={css.groupHeaderRow}>
          <span>功能</span>
          <div className={css.actionsHeaderBtns}>
            <button type="button" className={css.ghostBtn} title="重置为默认功能，自定义功能不会被删除" onClick={() => { setConfirmReset(true) }}>
              <IconRefreshCw size={13} />
              重置
            </button>
            <button
              type="button"
              className={css.outlineBtn}
              disabled={prefs.actions.filter(a => !a.builtin).length >= MAX_CUSTOM}
              onClick={openAdd}
            >
              <IconPlus size={14} />
              自定义功能
            </button>
          </div>
        </div>
        <SettingDivider />

        <div className={css.toolbarPreview}>
          {enabledActions.slice(0, MAX_ENABLED).map(action => (
            <span key={action.id} className={css.toolbarItem}>
              <span className={css.toolbarIcon}>{ICONS[action.icon] ?? '·'}</span>
              {!prefs.compact && <span className={css.toolbarText}>{action.name}</span>}
            </span>
          ))}
        </div>

        <div className={css.actionsDivider}>
          <span>拖拽排序，移动到上方以启用功能 ({enabledActions.length}/{MAX_ENABLED})</span>
        </div>

        {[...enabledActions, ...disabledActions].map(action => (
          <div
            key={action.id}
            className={`${css.actionRow} ${!action.enabled ? css.actionRowDisabled : ''} ${dragId === action.id ? css.actionRowDragging : ''}`}
            draggable
            onDragStart={() => { onDragStart(action.id) }}
            onDragOver={event => { event.preventDefault() }}
            onDrop={() => { onDropAt(action.id) }}
          >
            <span className={css.dragHandle} title="拖动排序">⠿</span>
            <span className={css.actionIcon}>{ICONS[action.icon] ?? '·'}</span>
            <span className={css.actionName}>{action.name}</span>
            {action.searchEngine !== undefined && (
              <span className={css.engineChip}>{action.searchEngine.split('|')[0]}</span>
            )}
            <span className={css.actionOps}>
              <button type="button" className={css.opBtn} title="上移" onClick={() => { moveAction(action.id, -1) }}>↑</button>
              <button type="button" className={css.opBtn} title="下移" onClick={() => { moveAction(action.id, 1) }}>↓</button>
              {action.builtin ? (
                action.id === 'search' && (
                  <button type="button" className={css.opBtn} title="设置搜索引擎" onClick={() => { openEdit(action) }}>⚙</button>
                )
              ) : (
                <>
                  <button type="button" className={css.opBtn} title="编辑" onClick={() => { openEdit(action) }}>✎</button>
                  <button type="button" className={`${css.opBtn} ${css.opBtnDanger}`} title="删除" onClick={() => { setDeleteAction(action) }}>
                    <IconTrash2 size={12} />
                  </button>
                </>
              )}
              <button
                type="button"
                className={`${css.enableBtn} ${action.enabled ? css.enableBtnOn : ''}`}
                onClick={() => { toggleAction(action.id) }}
              >
                {action.enabled ? '已启用' : '已禁用'}
              </button>
            </span>
          </div>
        ))}
      </SettingGroup>

      <SettingGroup>
        <div className={css.groupTitle}>高级</div>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>应用筛选</SettingRowTitle>
          <div className={css.radioRow}>
            {([['default', '关闭'], ['whitelist', '白名单'], ['blacklist', '黑名单']] as const).map(([value, label]) => (
              <label key={value} className={css.radioItem}>
                <input
                  type="radio"
                  name="filter"
                  checked={prefs.filterMode === value}
                  onChange={() => { update({ filterMode: value }) }}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </SettingRow>
        {prefs.filterMode !== 'default' && (
          <>
            <SettingDivider />
            <SettingRow>
              <SettingRowTitle>筛选名单</SettingRowTitle>
              <button type="button" className={css.outlineBtn} onClick={openFilter}>
                ✎ 编辑
              </button>
            </SettingRow>
          </>
        )}
      </SettingGroup>

      {customOpen && (
        <div className={css.modalOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setCustomOpen(false) }}>
          <div className={css.modalCard} role="dialog" aria-modal="true" aria-label={editAction === null ? '添加自定义功能' : '编辑自定义功能'}>
            <h3>{editAction === null ? '添加自定义功能' : '编辑自定义功能'}</h3>
            <div className={css.formField}>
              <label>名称</label>
              <input className={css.formInput} maxLength={16} value={formName} onChange={event => { setFormName(event.target.value) }} placeholder="请输入功能名称" autoFocus />
            </div>
            <div className={css.formField}>
              <label>图标</label>
              <input className={css.formInput} value={formIcon} onChange={event => { setFormIcon(event.target.value) }} placeholder="图标名称，如 sparkles" />
            </div>
            <div className={css.formField}>
              <label>用户提示词</label>
              <textarea
                className={css.formTextarea}
                rows={4}
                value={formPrompt}
                onChange={event => { setFormPrompt(event.target.value) }}
                placeholder={'使用占位符 {{text}} 代表选中的文本，不填写时，选中的文本将添加到本提示词的末尾'}
              />
            </div>
            <div className={css.modalFooter}>
              <button type="button" className={css.btn} onClick={() => { setCustomOpen(false) }}>取消</button>
              <button type="button" className={`${css.btn} ${css.btnPrimary}`} disabled={formName.trim() === ''} onClick={saveCustom}>确认</button>
            </div>
          </div>
        </div>
      )}

      {filterOpen && (
        <div className={css.modalOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setFilterOpen(false) }}>
          <div className={css.modalCard} role="dialog" aria-modal="true" aria-label="应用筛选名单">
            <h3>应用筛选名单</h3>
            <div className={css.formHint}>请输入应用的执行文件名，每行一个，不区分大小写，可以模糊匹配。例如：chrome.exe、weixin.exe 等</div>
            <textarea className={css.formTextarea} rows={6} value={filterDraft} onChange={event => { setFilterDraft(event.target.value) }} spellCheck={false} />
            <div className={css.modalFooter}>
              <button type="button" className={css.btn} onClick={() => { setFilterOpen(false) }}>取消</button>
              <button type="button" className={`${css.btn} ${css.btnPrimary}`} onClick={saveFilter}>保存</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteAction !== null}
        title="删除自定义功能"
        description="确定要删除这个自定义功能吗？"
        confirmText="删除"
        destructive
        onConfirm={confirmDeleteAction}
        onCancel={() => { setDeleteAction(null) }}
      />
      <ConfirmDialog
        open={confirmReset}
        title="重置功能"
        description="确定要重置为默认功能吗？自定义功能不会被删除。"
        confirmText="重置"
        onConfirm={resetActions}
        onCancel={() => { setConfirmReset(false) }}
      />
      <IconMoreHorizontal size={0} />
    </SettingsPageShell>
  )
}
