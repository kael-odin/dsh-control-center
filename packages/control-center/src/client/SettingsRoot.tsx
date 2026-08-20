/** Cherry-style settings shell over DSH's additive settings slots. */
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import clsx from 'clsx'
import { IconCloseOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import {
  IconActivity, IconBell, IconCalendarClock, IconCloud, IconCommand, IconCrop, IconDataDrive,
  IconFileBox, IconFileCode, IconHardDrive, IconInfo, IconPalette, IconPackage, IconRadio,
  IconScanText, IconSearch, IconSettings2, IconTerminal, IconToolCase, IconUser,
} from './cherry-icons.tsx'
import type { SettingsRootComponentProps, SettingsSectionRow } from './shell-contract.ts'
import css from './SettingsRoot.module.css'
import './cherry-tokens.css'

interface PanelProps {
  rows: readonly SettingsSectionRow[]
  renderSlot: SettingsRootComponentProps['renderSlot']
  activeId: string | undefined
  onSelect: (id: string) => void
  onClose: () => void
  groupLabels: Record<SettingsSectionRow['group'], string>
}

/** Nav groups in Cherry's settings order: core, capabilities, personal,
 * then the DSH-owned sections as a native group. */
const GROUPS: readonly SettingsSectionRow['group'][] = ['core', 'capabilities', 'personal', 'native', 'automation', 'system', 'other']

function navIcon(id: string) {
  const size = 16
  const cls = css.navIcon
  switch (id) {
    case 'models': return <IconPackage size={size} className={cls} />
    case 'skills': return <IconToolCase size={size} className={cls} />
    case 'providers': return <IconCloud size={size} className={cls} />
    case 'mcp': return <IconSettings2 size={size} className={cls} />
    case 'websearch': return <IconSearch size={size} className={cls} />
    case 'agent-presets': return <IconUser size={size} className={cls} />
    case 'plugins': return <IconPackage size={size} className={cls} />
    case 'general': return <IconSettings2 size={size} className={cls} />
    case 'usage': return <IconActivity size={size} className={cls} />
    case 'data': return <IconHardDrive size={size} className={cls} />
    case 'local-models': return <IconFileBox size={size} className={cls} />
    case 'file-processing': return <IconFileCode size={size} className={cls} />
    case 'ocr': return <IconScanText size={size} className={cls} />
    case 'tasks': return <IconCalendarClock size={size} className={cls} />
    case 'channels': return <IconRadio size={size} className={cls} />
    case 'shortcuts': return <IconCommand size={size} className={cls} />
    case 'quick-assistant': return <IconCrop size={size} className={cls} />
    case 'selection-assistant': return <IconScanText size={size} className={cls} />
    case 'screenshot': return <IconCrop size={size} className={cls} />
    case 'notifications': return <IconBell size={size} className={cls} />
    case 'appearance': return <IconPalette size={size} className={cls} />
    case 'dependencies': return <IconTerminal size={size} className={cls} />
    case 'about': return <IconInfo size={size} className={cls} />
    case 'update': return <IconDataDrive size={size} className={cls} />
    default: return <IconSettings2 size={size} className={cls} />
  }
}

function SettingsPanel({ rows, renderSlot, activeId, onSelect, onClose, groupLabels }: PanelProps) {
  const active = rows.find(row => row.id === activeId)?.id ?? rows[0]?.id
  const titleId = useId()
  const closeButton = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    closeButton.current?.focus()
    return () => { document.removeEventListener('keydown', onKeyDown) }
  }, [onClose])

  return (
    <div className={css.overlay} role="presentation">
      <div className={css.mask} aria-hidden="true" onClick={onClose} />
      <div className={clsx(css.panel, 'cc-surface')} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <nav className={css.nav}>
          <div className={css.navTitle} id={titleId}>{renderSlot('settings.header', {})}</div>
          <div className={css.navScroll}>
            {GROUPS.map((group) => {
              const entries = rows.filter(row => row.group === group)
              if (entries.length === 0) return null
              return (
                <section className={css.navGroup} key={group} aria-label={groupLabels[group]}>
{groupLabels[group] === '' ? null : <div className={css.navGroupTitle}>{groupLabels[group]}</div>}
                  <div className={css.navList}>
                    {entries.map(row => (
                      <button
                        key={row.id}
                        type="button"
                        className={clsx(css.navCell, row.id === active && css.active)}
                        aria-current={row.id === active ? 'page' : undefined}
                        onClick={() => { onSelect(row.id) }}
                      >
                        {navIcon(row.id)}
                        <span className={css.navLabel}>{row.label}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </nav>
        <div className={css.content}>
          <div className={css.header}>
            <div className={css.actions}>{renderSlot('settings.action', {})}</div>
            <button ref={closeButton} type="button" className={css.close} onClick={onClose}>
              <IconCloseOutline16 size={14} />
              <span className={css.hiddenLabel}>{renderSlot('settings.close', {})}</span>
            </button>
          </div>
          <div className={css.options}>
            {active === undefined ? null : renderSlot('settings.section', { close: onClose }, { only: active })}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Render the settings trigger, Cherry-style panel, and ordered onboarding stage. */
export function SettingsRoot(props: SettingsRootComponentProps) {
  const { wide, useSections, useOnboardingSteps, useSessions, renderSlot, labels } = props
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | undefined>(undefined)
  const [completedOnboarding, setCompletedOnboarding] = useState<ReadonlySet<string>>(() => new Set())
  const close = useCallback(() => {
    setOpen(false)
    setActiveId(undefined)
  }, [])
  const openSection = useCallback((id: string) => {
    setActiveId(id)
    setOpen(true)
  }, [])
  const rows = useSections(state => state)
  const onboardingSteps = useOnboardingSteps(state => state)
  const onboardingActive = useSessions(state =>
    state.phase === 'ready' && (state.current === undefined || state.byId[state.current]?.blank === true))
  const onboardingStep = onboardingActive
    ? onboardingSteps.find(step => !completedOnboarding.has(step.id))
    : undefined

  useEffect(() => {
    if (!onboardingActive) setCompletedOnboarding(new Set())
  }, [onboardingActive])

  // Bridge: workspaces request the settings shell to open a section
  // (e.g. ModelSelector's "配置自定义模型").
  useEffect(() => {
    const onOpenSection = (event: Event): void => {
      const section = (event as CustomEvent<string>).detail
      if (typeof section === 'string' && section.length > 0) openSection(section)
    }
    window.addEventListener('cc:open-settings-section', onOpenSection)
    return () => { window.removeEventListener('cc:open-settings-section', onOpenSection) }
  }, [openSection])

  const completeOnboardingStep = useCallback((id: string) => {
    setCompletedOnboarding(previous => previous.has(id) ? previous : new Set([...previous, id]))
  }, [])

  return (
    <>
      <button
        type="button"
        className={clsx(css.trigger, !wide && css.rail)}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => { setOpen(true) }}
      >
        {renderSlot('settings.trigger', { wide })}
      </button>
      {open
        ? (
          <SettingsPanel
            rows={rows}
            renderSlot={renderSlot}
            activeId={activeId}
            onSelect={setActiveId}
            onClose={close}
            groupLabels={labels}
          />
        )
        : null}
      {onboardingStep === undefined
        ? null
        : renderSlot('settings.onboarding', {
            stepId: onboardingStep.id,
            complete: () => { completeOnboardingStep(onboardingStep.id) },
            openSection,
          }, { only: onboardingStep.id })}
    </>
  )
}
