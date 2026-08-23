/**
 * API key list drawer — Cherry ProviderApiKeyListDrawer parity: a bordered
 * list of labeled key slots, each with edit / delete icon buttons and an
 * enable switch, an add draft row (Enter saves, Escape cancels), and the
 * "N / M enabled" footer summary. Raw values never reach the renderer, so
 * rows show label plus configured state instead of Cherry's masked key.
 */

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { Switch } from './panel-ui.tsx'
import { ApiKeysController, type ApiKeySlotView, type ApiKeysState } from './api-keys-store.ts'
import type { en } from './locales.ts'
import css from './ApiKeyListDrawer.module.css'

export interface ApiKeyListDrawerProps {
  open: boolean
  onClose: () => void
  /** A fresh controller per open, built from the editor's live faces. */
  buildController: () => ApiKeysController | undefined
  t: (key: keyof typeof en) => string
}

/** One display row: label, configured state, actions, enable switch. */
function SlotRow({ slot, busy, t, onToggle, onRemove, onEditLabel }: {
  slot: ApiKeySlotView
  busy: boolean
  t: (key: keyof typeof en) => string
  onToggle: (next: boolean) => void
  onRemove: () => void
  onEditLabel: () => void
}): ReactNode {
  return (
    <div className={css['keyRow']}>
      <div className={css['keyTextBlock']}>
        <span className={css['keyLabel']}>{slot.label === '' ? t('keysUnnamed') : slot.label}</span>
        <span className={css['keyMeta']}>
          {slot.active ? `${t('keysActive')} · ` : ''}
          {slot.configured ? t('keysConfigured') : t('keysMissing')}
        </span>
      </div>
      <div className={css['keyActions']}>
        <button type="button" className={css['keyIcon']} aria-label={t('keysRename')} title={t('keysRename')} disabled={busy} onClick={onEditLabel}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
          </svg>
        </button>
        <button type="button" className={`${css['keyIcon']} ${css['keyDanger']}`} aria-label={t('remove')} title={t('remove')} disabled={busy} onClick={onRemove}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14" />
          </svg>
        </button>
        <Switch checked={slot.isEnabled} disabled={busy} label={t('keysEnable')} onChange={onToggle} />
      </div>
    </div>
  )
}

/** The rename draft: one inline input replacing the label, Enter/Esc to end. */
function RenameRow({ initial, busy, t, onSave, onCancel }: {
  initial: string
  busy: boolean
  t: (key: keyof typeof en) => string
  onSave: (label: string) => void
  onCancel: () => void
}): ReactNode {
  const [draft, setDraft] = useState(initial)
  return (
    <div className={css['keyDraftRow']}>
      <input
        className={`${css['keyInput']} ${css['keyLabelInput']}`}
        value={draft}
        autoFocus
        aria-label={t('keysRename')}
        disabled={busy}
        onChange={(event) => { setDraft(event.target.value) }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') { event.preventDefault(); onSave(draft) }
          if (event.key === 'Escape') { event.preventDefault(); onCancel() }
        }}
      />
      <div className={css['keyActions']}>
        <button type="button" className={`${css['keyIcon']} ${css['keySave']}`} aria-label={t('apply')} title={t('apply')} disabled={busy} onClick={() => { onSave(draft) }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </button>
        <button type="button" className={css['keyIcon']} aria-label={t('cancel')} title={t('cancel')} disabled={busy} onClick={onCancel}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/** The add draft: label + new key inputs, Enter saves, Escape cancels. */
function AddRow({ busy, t, onSave, onCancel }: {
  busy: boolean
  t: (key: keyof typeof en) => string
  onSave: (label: string, key: string) => void
  onCancel: () => void
}): ReactNode {
  const [label, setLabel] = useState('')
  const [key, setKey] = useState('')
  return (
    <div className={css['keyDraftRow']}>
      <div className={css['keyDraftInputs']}>
        <input
          className={`${css['keyInput']} ${css['keyLabelInput']}`}
          value={label}
          placeholder={t('keysLabelPlaceholder')}
          aria-label={t('keysLabelPlaceholder')}
          disabled={busy}
          onChange={(event) => { setLabel(event.target.value) }}
        />
        <input
          className={css['keyInput']}
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={key}
          placeholder={t('keysNewPlaceholder')}
          aria-label={t('keysNewPlaceholder')}
          disabled={busy}
          autoFocus
          onChange={(event) => { setKey(event.target.value) }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') { event.preventDefault(); onSave(label, key) }
            if (event.key === 'Escape') { event.preventDefault(); onCancel() }
          }}
        />
      </div>
      <div className={css['keyActions']}>
        <button type="button" className={`${css['keyIcon']} ${css['keySave']}`} aria-label={t('apply')} title={t('apply')} disabled={busy} onClick={() => { onSave(label, key) }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </button>
        <button type="button" className={css['keyIcon']} aria-label={t('cancel')} title={t('cancel')} disabled={busy} onClick={onCancel}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/** The drawer: loads slot state, renders the bordered list + actions. */
export function ApiKeyListDrawer({ open, onClose, buildController, t }: ApiKeyListDrawerProps): ReactNode {
  const [controller, setController] = useState<ApiKeysController | undefined>(undefined)
  const [data, setData] = useState<ApiKeysState | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<{ mode: 'add' } | { mode: 'rename'; ref: string } | undefined>(undefined)
  const [failure, setFailure] = useState<string | undefined>(undefined)
  const buildRef = useRef(buildController)
  buildRef.current = buildController

  // Rebuild the controller for the current editor faces on each open.
  useEffect(() => {
    if (!open) return
    const next = buildRef.current()
    if (next === undefined) return
    let stale = false
    setController(next)
    setFailure(undefined)
    next.load()
      .then(state => { if (!stale) setData(state) })
      .catch((error: unknown) => { if (!stale) setFailure(error instanceof Error ? error.message : String(error)) })
    return () => {
      stale = true
      setController(undefined)
      setData(undefined)
      setEditing(undefined)
      setFailure(undefined)
    }
  }, [open])

  const refresh = async (): Promise<void> => {
    const active = controller
    if (active === undefined) return
    try {
      setData(await active.load())
    } catch (error) {
      setFailure(error instanceof Error ? error.message : String(error))
    }
  }

  const run = async (step: () => Promise<string | undefined>): Promise<void> => {
    setBusy(true)
    setFailure(undefined)
    try {
      const error = await step()
      if (error !== undefined) setFailure(error)
      else await refresh()
    } catch (error) {
      setFailure(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  const handleAdd = (label: string, key: string): void => {
    const trimmedKey = key.trim()
    if (trimmedKey.length === 0) return
    void run(() => controller!.add(trimmedKey, label.trim()))
  }
  const handleToggle = (ref: string, isEnabled: boolean): void => {
    void run(() => controller!.setEnabled(ref, isEnabled))
  }
  const handleRemove = (ref: string): void => {
    void run(() => controller!.remove(ref))
  }
  const handleRename = (ref: string, label: string): void => {
    void run(async () => {
      const error = await controller!.setLabel(ref, label.trim())
      if (error === undefined) setEditing(undefined)
      return error
    })
  }

  const slots = data?.slots ?? []
  const enabledCount = slots.filter(slot => slot.isEnabled).length

  return (
    <Modal open={open} onClose={onClose} title={t('keysTitle')} closeLabel={t('close')}>
      <div className={css['shell']}>
        {failure === undefined ? null : <p className={css['error']}>{failure}</p>}
        <p className={css['helper']}>{t('keysRotationNote')}</p>
        <div className={css['listWrap']}>
          <div className={css['listScroller']}>
            {slots.length === 0 && editing?.mode !== 'add'
              ? <div className={css['empty']}>{t('keysEmpty')}</div>
              : null}
            {slots.map(slot => (
              <div key={slot.ref} className={css['keyRow']}>
                {editing?.mode === 'rename' && editing.ref === slot.ref
                  ? (
                    <RenameRow
                      initial={slot.label}
                      busy={busy}
                      t={t}
                      onSave={(label) => { handleRename(slot.ref, label) }}
                      onCancel={() => { setEditing(undefined) }}
                    />
                  )
                  : (
                    <SlotRow
                      slot={slot}
                      busy={busy}
                      t={t}
                      onToggle={(next) => { handleToggle(slot.ref, next) }}
                      onRemove={() => { handleRemove(slot.ref) }}
                      onEditLabel={() => { setEditing({ mode: 'rename', ref: slot.ref }) }}
                    />
                  )}
              </div>
            ))}
            {editing?.mode === 'add'
              ? (
                <div className={css['keyRow']}>
                  <AddRow
                    busy={busy}
                    t={t}
                    onSave={handleAdd}
                    onCancel={() => { setEditing(undefined) }}
                  />
                </div>
              )
              : null}
          </div>
        </div>
        <div className={css['actionRow']}>
          <span className={css['summaryMeta']}>
            {`${String(enabledCount)} / ${String(slots.length)} ${t('keysEnabledSuffix')}`}
          </span>
          <button
            type="button"
            className={css['addButton']}
            disabled={editing !== undefined || busy}
            onClick={() => { setEditing({ mode: 'add' }) }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            {t('add')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
