/**
 * Cherry-style actions on one finalized assistant message (PARITY_LEDGER §三
 * message actions, first increment): 存为笔记 and 存入知识库, wired through the
 * plugin's own notes/knowledge host services.
 *
 * The slot owner (`conversation.chat.assistant-actions`, list, session scope)
 * supplies only the durable `messageId`; the entry row renders beneath the
 * just-closed Turn, so the target text is the newest assistant message in the
 * session's opening history window — the same placement rule the shipped
 * MessageIconActions row uses for its copy text.
 */
import { useCallback, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionSelectModelRequest } from '@deepseek-ai/dsh-api-session-controller'
import css from './AssistantMessageActions.module.css'

/** The branded session id shape carried by the session-standard props. */
type SessionId = SessionSelectModelRequest['sessionId']

/** Wire faces the actions need, injected from apply() (throw before mount). */
export interface AssistantMessageActionsServices {
  getNotes: () => {
    write(params: { path: string; content: string }): Promise<{ ok: true; value: unknown } | { ok: false; error: unknown }>
  }
  getKnowledge: () => {
    listBases(): Promise<{ ok: true; value: ReadonlyArray<{ id: string; name?: string }> } | { ok: false; error: unknown }>
    addText(request: { baseId: string; name: string; text: string }): Promise<{ ok: true; value: unknown } | { ok: false; error: unknown }>
  }
  /** Newest assistant text in the session's opening window, from one follow shot. */
  readAssistantText: (sessionId: SessionId) => Promise<string | undefined>
}

/** Normalize a wire failure (string or {code,message,details}) to display text. */
export function errorText(error: unknown): string {
  if (typeof error === 'string') return error
  if (typeof error === 'object' && error !== null) {
    const record = error as { message?: unknown }
    if (typeof record.message === 'string' && record.message.length > 0) return record.message
  }
  return String(error)
}

type ActionKey = 'notes' | 'knowledge'
type ActionStatus = 'idle' | 'saving' | 'ok' | { error: string }

export type AssistantMessageActionsProps =
  PropsRuntime<'conversation.chat.assistant-actions'>
  & PropsLocale<'control-center.msgactions'>
  & AssistantMessageActionsServices

/** Filename segment from a session title (or fallback), trimmed and sanitized. */
function noteSlug(title: string | undefined): string {
  const base = (title ?? '').trim().replace(/[\\/:*?"<>|\s]+/g, '-').replace(/^-+|-+$/g, '')
  return (base.length > 0 ? base : '会话').slice(0, 60)
}

export function AssistantMessageActions(props: AssistantMessageActionsProps) {
  const [status, setStatus] = useState<Partial<Record<ActionKey, ActionStatus>>>({})
  const [bases, setBases] = useState<ReadonlyArray<{ id: string; name?: string }>>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [cachedText, setCachedText] = useState<string | null>(null)

  const title = props.useSessions(state => state.byId[props.sessionId]?.displayTitle)

  const setStatusFor = useCallback((key: ActionKey, next: ActionStatus) => {
    setStatus(previous => ({ ...previous, [key]: next }))
    if (next === 'ok' || typeof next === 'object') {
      window.setTimeout(() => {
        setStatus(previous => (previous[key] === next ? { ...previous, [key]: 'idle' } : previous))
      }, 4000)
    }
  }, [])

  const loadText = useCallback(async (): Promise<string | undefined> => {
    if (cachedText !== null && cachedText.length > 0) return cachedText
    const text = await props.readAssistantText(props.sessionId)
    if (text !== undefined && text.length > 0) setCachedText(text)
    return text
  }, [cachedText, props.sessionId, props.readAssistantText])

  const addToBase = useCallback(async (base: { id: string; name?: string }) => {
    setPickerOpen(false)
    setStatusFor('knowledge', 'saving')
    try {
      const text = await loadText()
      if (text === undefined || text.length === 0) {
        setStatusFor('knowledge', { error: props.t('noText') })
        return
      }
      const added = await props.getKnowledge().addText({
        baseId: base.id,
        name: `${title ?? props.t('messageFallback')} · ${new Date().toLocaleString()}`,
        text,
      })
      if (!added.ok) {
        setStatusFor('knowledge', { error: errorText(added.error) })
        return
      }
      setStatusFor('knowledge', 'ok')
    } catch (error) {
      setStatusFor('knowledge', { error: error instanceof Error ? error.message : String(error) })
    }
  }, [loadText, props, setStatusFor, title])

  const saveToNotes = useCallback(async () => {
    setStatusFor('notes', 'saving')
    try {
      const text = await loadText()
      if (text === undefined || text.length === 0) {
        setStatusFor('notes', { error: props.t('noText') })
        return
      }
      const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
      const path = `会话/${noteSlug(title)}-${stamp}.md`
      const written = await props.getNotes().write({
        path,
        content: `# ${title ?? props.t('messageFallback')}\n\n${text}\n`,
      })
      if (!written.ok) {
        setStatusFor('notes', { error: errorText(written.error) })
        return
      }
      setStatusFor('notes', 'ok')
    } catch (error) {
      setStatusFor('notes', { error: error instanceof Error ? error.message : String(error) })
    }
  }, [loadText, props, setStatusFor, title])

  const openKnowledgePicker = useCallback(async () => {
    setStatusFor('knowledge', 'saving')
    try {
      const listed = await props.getKnowledge().listBases()
      if (!listed.ok) {
        setStatusFor('knowledge', { error: errorText(listed.error) })
        return
      }
      if (listed.value.length === 0) {
        setStatusFor('knowledge', { error: props.t('noBases') })
        return
      }
      if (listed.value.length === 1) {
        await addToBase(listed.value[0]!)
        return
      }
      setBases(listed.value)
      setPickerOpen(true)
      setStatusFor('knowledge', 'idle')
    } catch (error) {
      setStatusFor('knowledge', { error: error instanceof Error ? error.message : String(error) })
    }
  }, [addToBase, props, setStatusFor])

  const titleFor = (key: ActionKey): string => {
    const current = status[key]
    if (current === 'ok') return props.t(key === 'notes' ? 'saveNotesDone' : 'saveKnowledgeDone')
    if (typeof current === 'object') return `${props.t('failed')}: ${current.error}`
    if (current === 'saving') return props.t('saving')
    return props.t(key === 'notes' ? 'saveNotes' : 'saveKnowledge')
  }

  const glyphFor = (key: ActionKey): string => {
    const current = status[key]
    if (current === 'ok') return '✓'
    if (typeof current === 'object') return '!'
    if (current === 'saving') return '…'
    return key === 'notes' ? '📝' : '📚'
  }

  const stateOf = (key: ActionKey): string | undefined => {
    const current = status[key]
    if (current === 'ok') return 'ok'
    if (typeof current === 'object') return 'error'
    return undefined
  }

  return (
    <span className={css.actions} role="group" aria-label={props.t('groupLabel')}>
      <button
        type="button"
        className={css.button}
        data-status={stateOf('notes')}
        title={titleFor('notes')}
        aria-label={titleFor('notes')}
        onClick={() => { void saveToNotes() }}
      >
        {glyphFor('notes')}
      </button>
      <span className={css.anchor}>
        <button
          type="button"
          className={css.button}
          data-status={stateOf('knowledge')}
          title={titleFor('knowledge')}
          aria-label={titleFor('knowledge')}
          onClick={() => { void openKnowledgePicker() }}
        >
          {glyphFor('knowledge')}
        </button>
        {pickerOpen && (
          <span className={css.menu} role="menu" aria-label={props.t('pickBase')}>
            <span className={css.menuTitle}>{props.t('pickBase')}</span>
            {bases.map(base => (
              <button
                key={base.id}
                type="button"
                role="menuitem"
                className={css.menuItem}
                onClick={() => { void addToBase(base) }}
              >
                {base.name ?? base.id}
              </button>
            ))}
          </span>
        )}
      </span>
    </span>
  )
}
