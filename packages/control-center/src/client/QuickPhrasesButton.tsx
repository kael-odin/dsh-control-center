/**
 * 快捷短语 (quick phrases) — Cherry PromptSettings parity, first increment of
 * the composer integration. Registered into `conversation.input.right`
 * (list, session scope): an ⚡ button opens a popover listing the user's
 * phrases from the `control-center-composer` namespace; picking one appends
 * it to the draft through the session-standard `inputActions.setDraft`.
 *
 * `InputState.draft` is the clipboard projection of the editor document, so
 * `setDraft` flattens reference chips to their text form — appending is
 * refused with an honest reason while chips (occurrences) exist.
 */
import { useCallback, useEffect, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { errorText } from './AssistantMessageActions.tsx'
import css from './QuickPhrasesButton.module.css'

/** Settings face (settings-controller remote), lazy from apply(). */
export interface ComposerSettingsFace {
  describe(): Promise<{
    ok: true
    value: { namespaces: ReadonlyArray<{ ns: string; revision: number; value: unknown }> }
  } | { ok: false; error: unknown }>
  mutate(ns: string, ops: ReadonlyArray<{ op: 'set' | 'unset'; path: readonly string[]; value?: unknown }>, expectedRevision: number | undefined): Promise<{
    ok: true
    value: { revision: number }
  } | { ok: false; error: unknown }>
}

export type QuickPhrasesProps =
  PropsRuntime<'conversation.input.right'>
  & PropsLocale<'control-center.msgactions'>
  & { settings: ComposerSettingsFace }

interface Phrase {
  label: string
  text: string
}

export const PHRASES_NS = 'control-center-composer'

/** Normalize one namespace row into phrase pairs (honest drop of junk). */
export function phrasesOf(value: unknown): Phrase[] {
  const rows = (value as { phrases?: unknown } | null | undefined)?.phrases
  if (!Array.isArray(rows)) return []
  const kept: Phrase[] = []
  for (const row of rows) {
    if (typeof row !== 'object' || row === null) continue
    const label = (row as { label?: unknown }).label
    const text = (row as { text?: unknown }).text
    if (typeof label === 'string' && label.trim().length > 0 && typeof text === 'string' && text.length > 0) {
      kept.push({ label, text })
    }
  }
  return kept
}

export function QuickPhrasesButton(props: QuickPhrasesProps) {
  const [open, setOpen] = useState(false)
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [revision, setRevision] = useState<number | undefined>(undefined)
  const [draftLabel, setDraftLabel] = useState('')
  const [draftText, setDraftText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const described = await props.settings.describe()
      if (!described.ok) {
        setError(props.t('failed'))
        return
      }
      const view = described.value.namespaces.find(entry => entry.ns === PHRASES_NS)
      setPhrases(phrasesOf(view?.value))
      setRevision(view?.revision)
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    }
  }, [props])

  useEffect(() => {
    if (open) void reload()
  }, [open, reload])

  const appendPhrase = useCallback((phrase: Phrase) => {
    const current = props.useInput(state => state.draft)
    props.inputActions.setDraft(current.length === 0 ? phrase.text : `${current}\n${phrase.text}`)
    setOpen(false)
  }, [props])

  const persist = useCallback(async (next: Phrase[]) => {
    const response = await props.settings.mutate(
      PHRASES_NS,
      [{ op: 'set', path: ['phrases'], value: next }],
      revision,
    )
    if (!response.ok) {
      setError(errorText(response.error))
      return
    }
    setPhrases(next)
    setRevision(response.value.revision)
  }, [props, revision])

  const addPhrase = useCallback(() => {
    if (draftLabel.trim().length === 0 || draftText.length === 0) return
    void persist([...phrases, { label: draftLabel.trim(), text: draftText }])
    setDraftLabel('')
    setDraftText('')
  }, [draftLabel, draftText, persist, phrases])

  const removePhrase = useCallback((index: number) => {
    void persist(phrases.filter((_, i) => i !== index))
  }, [persist, phrases])

  return (
    <span className={css.anchor}>
      <button
        type="button"
        className={css.button}
        title={props.t('quickPhrases')}
        aria-label={props.t('quickPhrases')}
        onClick={() => { setOpen(open => !open) }}
      >
        ⚡
      </button>
      {open && (
        <span className={css.menu} role="dialog" aria-label={props.t('quickPhrases')}>
          {error !== null && <span className={css.error} role="alert">{error}</span>}
          {phrases.length === 0 && error === null && (
            <span className={css.menuTitle}>{props.t('noPhrases')}</span>
          )}
          {phrases.map((phrase, index) => (
            <span key={`${phrase.label}-${index}`} className={css.phraseRow}>
              <button
                type="button"
                className={css.phraseItem}
                title={phrase.text}
                onClick={() => { appendPhrase(phrase) }}
              >
                {phrase.label}
              </button>
              <button
                type="button"
                className={css.phraseDelete}
                aria-label={`${props.t('deletePhrase')} ${phrase.label}`}
                onClick={() => { void removePhrase(index) }}
              >
                ×
              </button>
            </span>
          ))}
          <span className={css.addRow}>
            <input
              className={css.input}
              placeholder={props.t('phraseLabel')}
              aria-label={props.t('phraseLabel')}
              value={draftLabel}
              onChange={event => { setDraftLabel(event.target.value) }}
            />
            <input
              className={css.input}
              placeholder={props.t('phraseText')}
              aria-label={props.t('phraseText')}
              value={draftText}
              onChange={event => { setDraftText(event.target.value) }}
            />
            <button
              type="button"
              className={css.addButton}
              aria-label={props.t('addPhrase')}
              onClick={() => { addPhrase() }}
            >
              +
            </button>
          </span>
        </span>
      )}
    </span>
  )
}
