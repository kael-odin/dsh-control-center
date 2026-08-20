/**
 * Shared Cherry-faithful panel primitives for the translate side panels:
 * switch, segmented control, icon button, confirm dialog, copy feedback.
 */
import { useCallback, useRef, useState, type ReactNode } from 'react'
import css from './TranslationWorkspace.module.css'
import { IconCloseOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'

export interface SwitchProps {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <label className={css.switch} title={label}>
      <input type="checkbox" checked={checked} onChange={event => { onChange(event.target.checked) }} />
      <span className={css.switchTrack} />
    </label>
  )
}

export interface SegmentedProps<T extends string> {
  options: ReadonlyArray<{ value: T; label: string; disabled?: boolean }>
  value: T
  onChange: (next: T) => void
}

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className={css.segmented} role="tablist">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          disabled={option.disabled}
          className={`${css.segItem} ${option.value === value ? css.active : ''}`}
          onClick={() => { onChange(option.value) }}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export interface IconButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  title?: string
  disabled?: boolean
  active?: boolean
  on?: boolean
  className?: string
  children: ReactNode
}

/** Cherry IconButton (size sm/md variants, ghost tone). */
export function IconButton({ onClick, title, disabled, active, on, className, children }: IconButtonProps) {
  const classes = [css.iconBtn]
  if (active) classes.push(css.active)
  if (on) classes.push(css.on)
  if (className !== undefined) classes.push(className)
  return (
    <button
      type="button"
      className={classes.join(' ')}
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmText: string
  cancelText?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, description, confirmText, cancelText = '取消', destructive, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className={css.confirmOverlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}>
      <div className={css.confirmCard} role="dialog" aria-modal="true" aria-label={title}>
        <h3 className={css.confirmTitle}>{title}</h3>
        {description === undefined ? null : <p className={css.confirmText}>{description}</p>}
        <div className={css.confirmActions}>
          <button type="button" className={css.btn} onClick={onCancel}>{cancelText}</button>
          <button type="button" className={`${css.btn} ${css.btnPrimary} ${destructive ? css.destructive : ''}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}

export interface PanelShellProps {
  title: string
  onClose: () => void
  children: ReactNode
  headerExtra?: ReactNode
  /** CSS module class values index as `string | undefined` under noUncheckedIndexedAccess. */
  bodyClassName?: string | undefined
}/** Floating right side panel (Cherry PageSidePanel geometry). */
export function PanelShell({ title, onClose, children, headerExtra, bodyClassName }: PanelShellProps) {
  return (
    <>
      <div className={css.backdrop} onClick={onClose} />
      <section className={css.sidePanel} role="dialog" aria-modal="true" aria-label={title}>
        <header className={css.panelHeader}>
          <div className={css.panelTitle}>{title}</div>
          {headerExtra}
          <IconButton onClick={onClose} title="关闭"><IconCloseOutline16 size={16} /></IconButton>
        </header>
        <div className={`${css.panelBody} ${bodyClassName ?? ''}`}>{children}</div>
      </section>
    </>
  )
}

/** Copy-to-clipboard with transient check feedback. */
export function useCopy(): { copied: boolean; copy: (text: string) => void } {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | null>(null)
  const copy = useCallback((text: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      if (timer.current !== null) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => { setCopied(false) }, 1600)
    }).catch(() => {})
  }, [])
  return { copied, copy }
}
