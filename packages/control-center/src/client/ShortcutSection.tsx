/**
 * Shortcut settings — Cherry ShortcutSettings parity: grouped rows with
 * inline key recording, enable switches, search + group filter, bulk actions.
 * Persisted in localStorage; app-internal bindings (settings.open etc.) are
 * wired to a window keydown listener, global ones are marked for desktop.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { IconChevronDownOutline14, IconSearchOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import { Switch } from './panel-ui.tsx'
import { SettingGroup, SettingsPageShell } from './SettingsPages.tsx'
import css from './ShortcutSection.module.css'

export interface ShortcutEntry {
  id: string
  label: string
  group: 'general' | 'topic' | 'chat' | 'assistant'
  defaultBinding: string
  editable: boolean
  /** True when this binding can actually fire inside the web app. */
  applicable: boolean
  onTrigger?: () => void
}

export const SHORTCUT_GROUPS: ReadonlyArray<{ id: ShortcutEntry['group']; label: string }> = [
  { id: 'general', label: '全局与窗口' },
  { id: 'topic', label: '会话与对话' },
  { id: 'chat', label: '消息交互' },
  { id: 'assistant', label: 'AI 助手工具' },
]

export const DEFAULT_SHORTCUTS: readonly ShortcutEntry[] = [
  // Order mirrors Cherry COMMAND_DEFINITIONS so each group lists entries in Cherry's order.
  { id: 'app.fullscreen.exit', label: '退出全屏', group: 'general', defaultBinding: 'Escape', editable: false, applicable: false },
  { id: 'app.search', label: '搜索消息', group: 'general', defaultBinding: 'Ctrl+Shift+F', editable: true, applicable: false },
  { id: 'app.print', label: '打印', group: 'general', defaultBinding: 'Ctrl+P', editable: true, applicable: false },
  { id: 'app.sidebar.toggle', label: '切换左侧边栏', group: 'topic', defaultBinding: 'Ctrl+[', editable: true, applicable: false },
  { id: 'app.settings.open', label: '打开设置', group: 'general', defaultBinding: 'Ctrl+,', editable: false, applicable: true, onTrigger: openSettings },
  { id: 'app.window.show', label: '显示 / 隐藏应用', group: 'general', defaultBinding: '', editable: true, applicable: false },
  { id: 'app.zoom.in', label: '放大界面', group: 'general', defaultBinding: 'Ctrl+=', editable: false, applicable: false },
  { id: 'app.zoom.out', label: '缩小界面', group: 'general', defaultBinding: 'Ctrl+-', editable: false, applicable: false },
  { id: 'app.zoom.reset', label: '重置缩放', group: 'general', defaultBinding: 'Ctrl+0', editable: false, applicable: false },
  { id: 'chat.context.toggle_new', label: '清除上下文', group: 'chat', defaultBinding: 'Ctrl+K', editable: true, applicable: false },
  { id: 'chat.message.copy_last', label: '复制上一条消息', group: 'chat', defaultBinding: 'Ctrl+Shift+C', editable: true, applicable: false },
  { id: 'chat.message.edit_last_user', label: '编辑最后一条用户消息', group: 'chat', defaultBinding: 'Ctrl+Shift+E', editable: true, applicable: false },
  { id: 'chat.message.search', label: '在当前对话中搜索消息', group: 'chat', defaultBinding: 'Ctrl+F', editable: true, applicable: false },
  { id: 'chat.model.select', label: '选择模型', group: 'chat', defaultBinding: 'Ctrl+Shift+M', editable: true, applicable: false },
  { id: 'quick_assistant.toggle', label: '快捷助手', group: 'assistant', defaultBinding: 'Ctrl+E', editable: true, applicable: false },
  { id: 'selection.capture_text', label: '划词助手：取词', group: 'assistant', defaultBinding: '', editable: true, applicable: false },
  { id: 'selection.toggle', label: '开关划词助手', group: 'assistant', defaultBinding: '', editable: true, applicable: false },
  { id: 'screenshot.capture', label: '屏幕截图', group: 'assistant', defaultBinding: 'Ctrl+Shift+A', editable: true, applicable: false },
  { id: 'topic.create', label: '新建对话', group: 'topic', defaultBinding: 'Ctrl+N', editable: true, applicable: false },
  { id: 'topic.rename', label: '重命名对话', group: 'topic', defaultBinding: 'Ctrl+T', editable: true, applicable: false },
  { id: 'topic.sidebar.toggle', label: '切换右侧边栏', group: 'topic', defaultBinding: 'Ctrl+]', editable: true, applicable: false },
  { id: 'tab.next', label: '下一个标签页', group: 'general', defaultBinding: 'Ctrl+Tab', editable: true, applicable: false },
  { id: 'tab.prev', label: '上一个标签页', group: 'general', defaultBinding: 'Ctrl+Shift+Tab', editable: true, applicable: false },
]

function openSettings(): void {
  window.dispatchEvent(new CustomEvent('cc:open-settings-section', { detail: 'shortcuts' }))
}

interface ShortcutPref {
  binding: string
  enabled: boolean
}

const SHORTCUTS_KEY = 'cc.settings.shortcuts'

function loadPrefs(): Record<string, ShortcutPref> {
  try {
    const raw = localStorage.getItem(SHORTCUTS_KEY)
    return raw === null ? {} : JSON.parse(raw) as Record<string, ShortcutPref>
  } catch {
    return {}
  }
}

function savePrefs(prefs: Record<string, ShortcutPref>): void {
  try { localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(prefs)) } catch { /* best effort */ }
}

function formatKeyToken(token: string): string {
  const map: Record<string, string> = {
    'ctrl': 'Ctrl', 'cmd': '⌘', 'shift': 'Shift', 'alt': 'Alt', 'meta': 'Meta',
  }
  return map[token.toLowerCase()] ?? token
}

export function bindingLabel(binding: string): string[] {
  return binding.split('+').filter(Boolean).map(formatKeyToken)
}

function ShortcutKeys({ binding, className }: { binding: string; className?: string }) {
  const keys = bindingLabel(binding)
  if (keys.length === 0) {
    return <span className={`${css.unbound} ${className ?? ''}`}>按下快捷键</span>
  }
  return (
    <span className={`${css.keys} ${className ?? ''}`}>
      {keys.map(key => <kbd key={key} className={css.kbd}>{key}</kbd>)}
    </span>
  )
}

export function ShortcutSection() {
  const [prefs, setPrefs] = useState<Record<string, ShortcutPref>>(loadPrefs)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<ShortcutEntry['group'] | 'all'>('all')
  const [groupMenuOpen, setGroupMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [recording, setRecording] = useState<string | null>(null)
  const [pendingKeys, setPendingKeys] = useState<string[]>([])
  const recordingRef = useRef<{ id: string; keys: string[] } | null>(null)

  useEffect(() => {
    savePrefs(prefs)
  }, [prefs])

  const prefOf = (id: string): ShortcutPref => prefs[id] ?? { binding: DEFAULT_SHORTCUTS.find(s => s.id === id)?.defaultBinding ?? '', enabled: DEFAULT_SHORTCUTS.find(s => s.id === id)?.defaultBinding !== '' }

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return DEFAULT_SHORTCUTS.filter(entry => {
      if (groupFilter !== 'all' && entry.group !== groupFilter) return false
      if (query !== '') {
        const binding = prefOf(entry.id).binding.toLowerCase()
        if (!entry.label.toLowerCase().includes(query) && !binding.includes(query)) return false
      }
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, groupFilter, prefs])

  const setBinding = (id: string, binding: string): void => {
    setPrefs(current => ({ ...current, [id]: { binding, enabled: current[id]?.enabled ?? binding !== '' } }))
  }

  const toggleEnabled = (id: string, enabled: boolean): void => {
    setPrefs(current => ({ ...current, [id]: { ...prefOf(id), enabled } }))
  }

  const resetOne = (id: string): void => {
    setPrefs(current => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  const setAll = (enabled: boolean): void => {
    setPrefs(current => {
      const next = { ...current }
      for (const entry of DEFAULT_SHORTCUTS) {
        next[entry.id] = { ...prefOf(entry.id), enabled }
      }
      return next
    })
    setMoreMenuOpen(false)
  }

  const resetAll = (): void => {
    setPrefs({})
    setMoreMenuOpen(false)
  }

  const startRecording = (id: string): void => {
    setRecording(id)
    setPendingKeys([])
    recordingRef.current = { id, keys: [] }
  }

  const stopRecording = (save: boolean): void => {
    const current = recordingRef.current
    if (current === null) return
    if (save && current.keys.length > 0) setBinding(current.id, current.keys.join('+'))
    recordingRef.current = null
    setRecording(null)
    setPendingKeys([])
  }

  useEffect(() => {
    if (recording === null) return
    const onKeyDown = (event: KeyboardEvent): void => {
      event.preventDefault()
      event.stopPropagation()
      if (event.key === 'Escape') { stopRecording(false); return }
      const mods: string[] = []
      if (event.ctrlKey) mods.push('Ctrl')
      if (event.metaKey) mods.push('Cmd')
      if (event.altKey) mods.push('Alt')
      if (event.shiftKey) mods.push('Shift')
      const key = event.key.length === 1 ? event.key.toUpperCase() : event.key.replace('Arrow', '')
      const tokens = [...mods, key]
      recordingRef.current = { id: recording, keys: tokens }
      setPendingKeys(tokens)
    }
    const onKeyUp = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') return
      // Commit when the last modifier or key is released.
      const released = event.key.length === 1 ? event.key.toUpperCase() : event.key.replace('Arrow', '')
      if (recordingRef.current !== null && recordingRef.current.keys.includes(released)) {
        stopRecording(true)
      }
    }
    const onBlur = (): void => { stopRecording(false) }
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('keyup', onKeyUp, true)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('keyup', onKeyUp, true)
      window.removeEventListener('blur', onBlur)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording])

  // App-internal shortcuts actually fire in the web app.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey !== true && event.metaKey !== true) return
      const key = event.key.toLowerCase()
      for (const entry of DEFAULT_SHORTCUTS) {
        if (!entry.applicable || entry.onTrigger === undefined) continue
        const binding = prefOf(entry.id).binding.toLowerCase()
        if (binding !== '' && prefOf(entry.id).enabled) {
          const [mod, k] = binding.split('+').map(part => part.toLowerCase())
          if (mod === 'ctrl' && k === key) {
            event.preventDefault()
            entry.onTrigger()
          }
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('keydown', onKeyDown) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs])

  const grouped = SHORTCUT_GROUPS.filter(group => groupFilter === 'all' || group.id === groupFilter)

  return (
    <SettingsPageShell>
      <div className={css.header}>
        <h2 className={css.headerTitle}>快捷键</h2>
        <div className={css.headerControls}>
          <div className={css.searchWrap}>
            <IconSearchOutline16 size={13} className={css.searchIcon} />
            <input
              className={css.searchInput}
              value={search}
              onChange={event => { setSearch(event.target.value) }}
              placeholder="搜索快捷键..."
            />
          </div>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={css.filterButton}
              onClick={() => { setGroupMenuOpen(open => !open) }}
            >
              <span className={css.filterIcon}>☰</span>
              <span>{groupFilter === 'all' ? '全部' : SHORTCUT_GROUPS.find(g => g.id === groupFilter)?.label}</span>
              <IconChevronDownOutline14 size={12} />
            </button>
            {groupMenuOpen && (
              <div className={css.menuPop}>
                <button
                  type="button"
                  className={`${css.menuItem} ${groupFilter === 'all' ? css.menuItemActive : ''}`}
                  onClick={() => { setGroupFilter('all'); setGroupMenuOpen(false) }}
                >
                  全部 <span className={css.menuCount}>{DEFAULT_SHORTCUTS.length}</span>
                </button>
                {SHORTCUT_GROUPS.map(group => {
                  const count = DEFAULT_SHORTCUTS.filter(s => s.group === group.id).length
                  if (count === 0) return null
                  return (
                    <button
                      key={group.id}
                      type="button"
                      className={`${css.menuItem} ${groupFilter === group.id ? css.menuItemActive : ''}`}
                      onClick={() => { setGroupFilter(group.id); setGroupMenuOpen(false) }}
                    >
                      {group.label} <span className={css.menuCount}>{count}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={css.moreButton}
              title="更多"
              onClick={() => { setMoreMenuOpen(open => !open) }}
            >
              ⋯
            </button>
            {moreMenuOpen && (
              <div className={css.menuPop}>
                <button type="button" className={css.menuItem} onClick={() => { setAll(true) }}>全部启用</button>
                <button type="button" className={css.menuItem} onClick={() => { setAll(false) }}>全部禁用</button>
                <div className={css.menuSep} />
                <button
                  type="button"
                  className={`${css.menuItem} ${css.menuItemDanger}`}
                  onClick={() => { if (window.confirm('确定要重置所有快捷键吗？')) resetAll() }}
                >
                  重置
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <SettingGroup className={css.listGroup}>
        {rows.length === 0 ? (
          <div className={css.emptyState}>当前分组下没有可显示的快捷键</div>
        ) : grouped.map(group => {
          const entries = rows.filter(row => row.group === group.id)
          if (entries.length === 0) return null
          return (
            <div key={group.id} className={css.groupBlock}>
              <div className={css.groupLabel}>{group.label}</div>
              {entries.map((entry) => {
                const pref = prefOf(entry.id)
                const dirty = pref.binding !== DEFAULT_SHORTCUTS.find(s => s.id === entry.id)?.defaultBinding
                const isRecording = recording === entry.id
                return (
                  <div
                    key={entry.id}
                    className={`${css.row} ${!pref.enabled ? css.rowDisabled : ''}`}
                  >
                    <span className={css.rowLabel}>{entry.label}{!entry.applicable && <span className={css.desktopTag}>桌面</span>}</span>
                    <span className={css.rowShortcut}>
                      {isRecording ? (
                        <span className={css.recording}>
                          {pendingKeys.length > 0 ? pendingKeys.join('+') : '按下快捷键'}
                        </span>
                      ) : (
                        <>
                          {dirty && (
                            <button type="button" className={css.undo} title="重置为默认" onClick={() => { resetOne(entry.id) }}>
                              ↩
                            </button>
                          )}
                          <button
                            type="button"
                            className={css.bound}
                            disabled={!entry.editable}
                            onClick={() => { startRecording(entry.id) }}
                          >
                            <ShortcutKeys binding={pref.binding} />
                          </button>
                        </>
                      )}
                    </span>
                    <span className={css.rowSwitch}>
                      <Switch
                        checked={pref.enabled}
                        onChange={next => { toggleEnabled(entry.id, next) }}
                        label={entry.label}
                      />
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </SettingGroup>
    </SettingsPageShell>
  )
}
