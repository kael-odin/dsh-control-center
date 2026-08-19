/** Cherry-style settings shell over DSH's additive settings slots. */
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  IconAgentPresetOutline16,
  IconApiOutline14,
  IconBranchOutline16,
  IconCloseOutline16,
  IconCodeOutline16,
  IconDataOutline16,
  IconPersonalizationOutline16,
  IconSearchOutline16,
  IconSettingsOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
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
const GROUPS: readonly SettingsSectionRow['group'][] = ['core', 'capabilities', 'personal', 'native', 'system', 'other']

function navIcon(id: string) {
  if (id === 'models') return <IconDataOutline16 className={css.navIcon} size={16} />
  if (id === 'skills') return <IconCodeOutline16 className={css.navIcon} size={16} />
  if (id === 'providers') return <IconApiOutline14 className={css.navIcon} size={14} />
  if (id === 'mcp') return <IconBranchOutline16 className={css.navIcon} size={16} />
  if (id === 'websearch') return <IconSearchOutline16 className={css.navIcon} size={16} />
  if (id === 'agent-presets') return <IconAgentPresetOutline16 className={css.navIcon} size={16} />
  if (id === 'plugins') return <IconPersonalizationOutline16 className={css.navIcon} size={16} />
  return <IconSettingsOutline16 className={css.navIcon} size={16} />
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
                  <div className={css.navGroupTitle}>{groupLabels[group]}</div>
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
