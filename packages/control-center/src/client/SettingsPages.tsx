/**
 * Shared Cherry settings-page primitives: SettingsContentColumn (p-6 max-w-3xl),
 * SettingGroup (rounded-xl card), SettingRow, SettingSwitch, SettingTitle.
 */
import type { ReactNode } from 'react'
import { Switch } from './panel-ui.tsx'
import css from './SettingsPages.module.css'

export function SettingsPageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`${css.shell} ${className ?? ''}`}>
      <div className={css.shellInner}>{children}</div>
    </div>
  )
}

export function SettingTitle({ children }: { children: ReactNode }) {
  return <div className={css.groupTitle}>{children}</div>
}

export function SettingDescription({ children }: { children: ReactNode }) {
  return <div className={css.groupDescription}>{children}</div>
}

export function SettingDivider() {
  return <div className={css.divider} />
}

export function SettingGroup({ children, className }: { children: ReactNode; className?: string | undefined }) {
  return <div className={`${css.group} ${className ?? ''}`}>{children}</div>
}

export function SettingRow({ children, className }: { children: ReactNode; className?: string | undefined }) {
  return <div className={`${css.row} ${className ?? ''}`}>{children}</div>
}

export function SettingRowTitle({ children }: { children: ReactNode }) {
  return <div className={css.rowTitle}>{children}</div>
}

export interface SettingSwitchProps {
  label: ReactNode
  checked: boolean
  onChange: (next: boolean) => void
  description?: ReactNode
  disabled?: boolean
}

/** Label-left + switch-right setting row (Cherry DescriptionSwitch). */
export function SettingSwitch({ label, checked, onChange, description, disabled = false }: SettingSwitchProps) {
  return (
    <SettingRow>
      <div className={css.switchLabel}>
        <div className={css.rowTitle}>{label}</div>
        {description === undefined ? null : <div className={css.rowDescription}>{description}</div>}
      </div>
      <Switch checked={checked} onChange={onChange} label={typeof label === 'string' ? label : ''} disabled={disabled} />
    </SettingRow>
  )
}
