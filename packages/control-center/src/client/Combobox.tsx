/**
 * Cherry Combobox parity: button trigger + popover with optional search,
 * grouped option list, and footer slot. Used for language and model pickers.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { IconChevronDownOutline14, IconSearchOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import css from './Combobox.module.css'

export interface ComboboxOption {
  value: string
  label: string
  /** Secondary line under the label (e.g. provider name). */
  sublabel?: string
  icon?: ReactNode
  /** Group id; options without one stay ungrouped. */
  group?: string
}

export interface ComboboxGroup {
  id: string
  label: string
}

export interface ComboboxProps {
  value: string
  options: readonly ComboboxOption[]
  onChange: (value: string) => void
  /** Trigger placeholder when nothing is selected. */
  placeholder?: string
  searchable?: boolean
  groups?: readonly ComboboxGroup[]
  /** Optional footer row (e.g. "配置自定义模型"). */
  footer?: ReactNode
  /** Popover width (px or css). Defaults to trigger width. */
  width?: number | string
  className?: string | undefined
  ariaLabel?: string | undefined
  align?: 'start' | 'end' | undefined
}

export function Combobox({ value, options, onChange, placeholder, searchable, groups, footer, width, className, ariaLabel, align = 'start' }: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)

  const selected = options.find(option => option.value === value)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q === '') return options
    return options.filter(option =>
      option.label.toLowerCase().includes(q) || (option.sublabel ?? '').toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    searchRef.current?.focus()
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const grouped = groups !== undefined && groups.length > 0
  const renderGroup = (group: ComboboxGroup): ReactNode => {
    const entries = visible.filter(option => option.group === group.id)
    if (entries.length === 0) return null
    return (
      <div key={group.id} className={css.group}>
        <div className={css.groupTitle}>{group.label}</div>
        {entries.map(option => renderOption(option))}
      </div>
    )
  }
  const ungrouped = grouped ? visible.filter(option => option.group === undefined) : visible

  const renderOption = (option: ComboboxOption): ReactNode => (
    <button
      key={option.value}
      type="button"
      className={`${css.option} ${option.value === value ? css.optionActive : ''}`}
      onClick={() => { onChange(option.value); setOpen(false) }}
    >
      {option.icon === undefined ? null : <span className={css.optionIcon}>{option.icon}</span>}
      <span className={css.optionText}>
        <span className={css.optionLabel}>{option.label}</span>
        {option.sublabel === undefined ? null : <span className={css.optionSub}>{option.sublabel}</span>}
      </span>
    </button>
  )

  return (
    <div ref={rootRef} className={`${css.root} ${className ?? ''}`}>
      <button
        type="button"
        className={css.trigger}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => { setOpen(openState => !openState); setQuery('') }}
      >
        {selected?.icon === undefined ? null : <span className={css.triggerIcon}>{selected.icon}</span>}
        <span className={css.triggerLabel}>{selected?.label ?? placeholder ?? '请选择'}</span>
        <IconChevronDownOutline14 size={12} className={css.triggerChevron} />
      </button>
      {open && (
        <div className={`${css.popover} ${align === 'end' ? css.popoverEnd : ''}`} style={width === undefined ? undefined : { width }}>
          {searchable && (
            <div className={css.searchWrap}>
              <IconSearchOutline16 size={13} className={css.searchIcon} />
              <input
                ref={searchRef}
                className={css.searchInput}
                value={query}
                onChange={event => { setQuery(event.target.value) }}
                placeholder="搜索..."
              />
            </div>
          )}
          <div className={css.list} role="listbox">
            {grouped
              ? groups!.map(group => renderGroup(group))
              : null}
            {!grouped && ungrouped.map(option => renderOption(option))}
            {visible.length === 0 && <div className={css.empty}>无结果</div>}
          </div>
          {footer === undefined ? null : <div className={css.footer}>{footer}</div>}
        </div>
      )}
    </div>
  )
}
