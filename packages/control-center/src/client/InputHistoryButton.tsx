/**
 * 输入历史 (input history) — Cherry composer parity, §1.4 increment. A 🕘
 * button in `conversation.input.right`: picking an entry replaces the draft
 * with that earlier prompt (recall semantics, like an up-arrow history).
 * The session journal stays the single fact source; nothing is stored twice.
 */
import { useCallback, useEffect, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { errorText } from './AssistantMessageActions.tsx'
import { userTextsOf, type SessionHistoryFace } from './input-history.ts'
import css from './QuickPhrasesButton.module.css'

export type InputHistoryProps =
  PropsRuntime<'conversation.input.right'>
  & PropsLocale<'control-center.msgactions'>
  & { history: SessionHistoryFace }

export const HISTORY_LIMIT = 20

export function InputHistoryButton(props: InputHistoryProps) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const described = await props.history.history({ sessionId: props.sessionId, maxMessages: 100 })
      if (!described.ok) {
        setError(errorText(described.error))
        return
      }
      setEntries(userTextsOf(described.value, HISTORY_LIMIT))
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    }
  }, [props])

  useEffect(() => {
    if (open) void reload()
  }, [open, reload])

  const recall = useCallback((text: string) => {
    props.inputActions.setDraft(text)
    setOpen(false)
  }, [props])

  return (
    <span className={css.anchor}>
      <button
        type="button"
        className={css.button}
        title={props.t('inputHistory')}
        aria-label={props.t('inputHistory')}
        onClick={() => { setOpen(open => !open) }}
      >
        🕘
      </button>
      {open && (
        <span className={css.menu} role="dialog" aria-label={props.t('inputHistory')}>
          {error !== null && <span className={css.error} role="alert">{error}</span>}
          {entries.length === 0 && error === null && (
            <span className={css.menuTitle}>{props.t('noHistory')}</span>
          )}
          {entries.map((text, index) => (
            <button
              key={`history-${index}`}
              type="button"
              className={css.phraseItem}
              title={text}
              onClick={() => { recall(text) }}
            >
              {text.length > 60 ? `${text.slice(0, 60)}…` : text}
            </button>
          ))}
        </span>
      )}
    </span>
  )
}
