/**
 * Cherry-style actions on one finalized assistant message (PARITY_LEDGER §三
 * message actions): 存为笔记 / 存入知识库 / 翻译 inline, 复制原文 / 导出 Markdown
 * behind a more-menu, all driven by the ported action registry
 * (`actions/action-registry.ts` — Cherry `chat/actions` pattern).
 *
 * The slot owner (`conversation.chat.assistant-actions`, list, session scope)
 * supplies only the durable `messageId`; the entry row renders beneath the
 * just-closed Turn, so the target text is the newest assistant message in the
 * session's opening history window — the same placement rule the shipped
 * MessageIconActions row uses for its copy text.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionSelectModelRequest } from '@deepseek-ai/dsh-api-session-controller'
import {
  createActionRegistry,
  type ResolvedAction,
} from './actions/action-registry.ts'
import type { MsgActionsKey } from './msgactions-locales.ts'
import css from './AssistantMessageActions.module.css'

/** The branded session id shape carried by the session-standard props. */
type SessionId = SessionSelectModelRequest['sessionId']

/** Wire faces the actions need, injected from apply() (lazy, throw on use). */
export interface AssistantMessageActionsServices {
  getNotes: () => {
    write(params: { path: string; content: string }): Promise<{ ok: true; value: unknown } | { ok: false; error: unknown }>
  }
  getKnowledge: () => {
    listBases(): Promise<{ ok: true; value: ReadonlyArray<{ id: string; name?: string }> } | { ok: false; error: unknown }>
    addText(request: { baseId: string; name: string; text: string }): Promise<{ ok: true; value: unknown } | { ok: false; error: unknown }>
  }
  getTranslation: () => {
    start(request: { sourceLanguage: string; targetLanguage: string; text: string; selection: { provider: string; model: string } }): { jobId: string }
    get(jobId: string): { status: 'running' | 'completed' | 'cancelled' | 'error'; output: string; failure?: { message?: string } }
  }
  /** Newest assistant text in the session's opening window, from one follow shot. */
  readAssistantText: (sessionId: SessionId) => Promise<string | undefined>
  /** Translation model route: model-prefs translation route, agent-default fallback. */
  resolveTranslationRoute: () => Promise<{ provider: string; model: string }>
}

/** Execution context handed to every registry action. */
export interface MessageActionContext {
  sessionId: SessionId
  title: string | undefined
  t: (key: MsgActionsKey) => string
  loadText: () => Promise<string | undefined>
  runNotes: () => Promise<void>
  runKnowledge: () => Promise<void>
  runTranslate: () => Promise<void>
}

type ActionStatus = 'idle' | 'saving' | 'ok' | { error: string }

interface TranslationState {
  phase: 'idle' | 'running' | 'done'
  text: string
}

export type AssistantMessageActionsProps =
  PropsRuntime<'conversation.chat.assistant-actions'>
  & PropsLocale<'control-center.msgactions'>
  & AssistantMessageActionsServices

/** Normalize a wire failure (string or {code,message,details}) to display text. */
export function errorText(error: unknown): string {
  if (typeof error === 'string') return error
  if (typeof error === 'object' && error !== null) {
    const record = error as { message?: unknown }
    if (typeof record.message === 'string' && record.message.length > 0) return record.message
  }
  return String(error)
}

/** Filename segment from a session title (or fallback), trimmed and sanitized. */
export function noteSlug(title: string | undefined): string {
  const base = (title ?? '').trim().replace(/[\\/:*?"<>|\s]+/g, '-').replace(/^-+|-+$/g, '')
  return (base.length > 0 ? base : '会话').slice(0, 60)
}

/** Cheap local CJK-open detection: no model round trip for language picking. */
export function looksChinese(text: string): boolean {
  return /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text.trim())
}

export function AssistantMessageActions(props: AssistantMessageActionsProps) {
  const [status, setStatus] = useState<Partial<Record<'notes' | 'knowledge', ActionStatus>>>({})
  const [bases, setBases] = useState<ReadonlyArray<{ id: string; name?: string }>>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cachedText, setCachedText] = useState<string | null>(null)
  const [translation, setTranslation] = useState<TranslationState>({ phase: 'idle', text: '' })
  const [translationOpen, setTranslationOpen] = useState(false)
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const title = props.useSessions(state => state.byId[props.sessionId]?.displayTitle)

  const setStatusFor = useCallback((key: 'notes' | 'knowledge', next: ActionStatus) => {
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
  }, [cachedText, props.readAssistantText, props.sessionId])

  const runNotes = useCallback(async () => {
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
      setStatusFor('notes', { error: errorText(error) })
    }
  }, [loadText, props, setStatusFor, title])

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
      setStatusFor('knowledge', { error: errorText(error) })
    }
  }, [loadText, props, setStatusFor, title])

  const runKnowledge = useCallback(async () => {
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
      setStatusFor('knowledge', { error: errorText(error) })
    }
  }, [addToBase, props, setStatusFor])

  const runTranslate = useCallback(async () => {
    if (translation.phase === 'done') {
      setTranslationOpen(open => !open)
      return
    }
    setTranslation({ phase: 'running', text: '' })
    setTranslationOpen(true)
    try {
      const text = await loadText()
      if (text === undefined || text.length === 0) {
        setTranslation({ phase: 'done', text: props.t('noText') })
        return
      }
      const route = await props.resolveTranslationRoute()
      const { jobId } = props.getTranslation().start({
        sourceLanguage: 'auto',
        targetLanguage: looksChinese(text) ? 'en' : 'zh-CN',
        text,
        selection: { provider: route.provider, model: route.model },
      })
      // Poll the in-process job; the mountedRef guard stops the loop on unmount.
      for (;;) {
        await new Promise(resolve => setTimeout(resolve, 400))
        if (!mountedRef.current) return
        const view = props.getTranslation().get(jobId)
        if (view.status === 'completed') {
          setTranslation({ phase: 'done', text: view.output })
          return
        }
        if (view.status === 'error') {
          setTranslation({ phase: 'done', text: `${props.t('failed')}: ${errorText(view.failure)}` })
          return
        }
        if (view.status === 'cancelled') {
          setTranslation({ phase: 'idle', text: '' })
          setTranslationOpen(false)
          return
        }
      }
    } catch (error) {
      if (!mountedRef.current) return
      setTranslation({ phase: 'done', text: `${props.t('failed')}: ${errorText(error)}` })
    }
  }, [loadText, props, translation.phase])

  const context = useMemo<MessageActionContext>(() => ({
    sessionId: props.sessionId,
    title,
    t: props.t,
    loadText,
    runNotes,
    runKnowledge,
    runTranslate,
  }), [loadText, props.sessionId, props.t, runKnowledge, runNotes, runTranslate, title])

  // Cherry chat/actions pattern: one registry drives toolbar + more-menu.
  const registry = useMemo(() => {
    const instance = createActionRegistry<MessageActionContext>()
    instance.registerAction({
      id: 'notes', label: 'saveNotes', surface: 'toolbar',
      run: context => context.runNotes(),
    })
    instance.registerAction({
      id: 'knowledge', label: 'saveKnowledge', surface: 'toolbar',
      run: context => context.runKnowledge(),
    })
    instance.registerAction({
      id: 'translate', label: 'translate', surface: 'toolbar',
      run: context => context.runTranslate(),
    })
    instance.registerAction({
      id: 'copy-text', label: 'copyText', surface: 'menu',
      run: async context => {
        const text = await context.loadText()
        if (text !== undefined && text.length > 0) await navigator.clipboard.writeText(text)
      },
    })
    instance.registerAction({
      id: 'export-markdown', label: 'exportMarkdown', surface: 'menu', group: 'export',
      run: async context => {
        const text = await context.loadText()
        if (text === undefined || text.length === 0) throw new Error(context.t('noText'))
        const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
        const blob = new Blob([`# ${context.title ?? context.t('messageFallback')}\n\n${text}\n`], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `${noteSlug(context.title)}-${stamp}.md`
        anchor.click()
        URL.revokeObjectURL(url)
      },
    })
    return instance
  }, [])

  const toolbar = useMemo(() => registry.resolve(context, 'toolbar'), [context, registry])
  const menu = useMemo(() => registry.resolve(context, 'menu'), [context, registry])

  const titleFor = (key: 'notes' | 'knowledge'): string => {
    const current = status[key]
    if (current === 'ok') return props.t(key === 'notes' ? 'saveNotesDone' : 'saveKnowledgeDone')
    if (typeof current === 'object') return `${props.t('failed')}: ${current.error}`
    if (current === 'saving') return props.t('saving')
    return props.t(key === 'notes' ? 'saveNotes' : 'saveKnowledge')
  }

  const glyphFor = (key: 'notes' | 'knowledge'): string => {
    const current = status[key]
    if (current === 'ok') return '✓'
    if (typeof current === 'object') return '!'
    if (current === 'saving') return '…'
    return key === 'notes' ? '📝' : '📚'
  }

  const stateOf = (key: 'notes' | 'knowledge'): string | undefined => {
    const current = status[key]
    if (current === 'ok') return 'ok'
    if (typeof current === 'object') return 'error'
    return undefined
  }

  const toolbarGlyphs: Record<string, string> = {
    notes: glyphFor('notes'),
    knowledge: glyphFor('knowledge'),
    translate: translation.phase === 'running'
      ? '…'
      : translation.phase === 'done' && translationOpen ? '✕' : '文A',
  }

  const runMenuItem = (action: ResolvedAction): void => {
    void registry.execute(action.id, context, 'menu').catch((error: unknown) => {
      setStatusFor('knowledge', { error: errorText(error) })
    })
  }

  return (
    <span className={css.actions} role="group" aria-label={props.t('groupLabel')}>
      {toolbar.map(action => (
        <span key={action.id} className={css.anchor}>
          <button
            type="button"
            className={css.button}
            data-status={action.id === 'translate' && translation.phase === 'done' && translationOpen ? 'ok' : stateOf(action.id as 'notes' | 'knowledge')}
            title={action.id === 'notes' || action.id === 'knowledge' ? titleFor(action.id) : props.t(action.label as MsgActionsKey)}
            aria-label={action.id === 'notes' || action.id === 'knowledge' ? titleFor(action.id) : props.t(action.label as MsgActionsKey)}
            onClick={() => { void registry.execute(action.id, context, 'toolbar') }}
          >
            {toolbarGlyphs[action.id] ?? '•'}
          </button>
          {action.id === 'translate' && translation.phase !== 'idle' && translationOpen && (
            <span className={css.translation} role="status" aria-label={props.t('translationLabel')}>
              {translation.phase === 'running' ? props.t('translating') : translation.text}
            </span>
          )}
          {action.id === 'knowledge' && pickerOpen && (
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
      ))}
      <span className={css.anchor}>
        <button
          type="button"
          className={css.button}
          title={props.t('moreMenu')}
          aria-label={props.t('moreMenu')}
          onClick={() => { setMenuOpen(open => !open) }}
        >
          ⋯
        </button>
        {menuOpen && (
          <span className={css.menu} role="menu" aria-label={props.t('moreMenu')}>
            {menu.map((action, index) => {
              const separator = index > 0 && action.group !== undefined
                && action.group !== menu[index - 1]?.group
              return (
                <span key={action.id}>
                  {separator && <span className={css.menuSeparator} role="separator" />}
                  <button
                    type="button"
                    role="menuitem"
                    className={`${css.menuItem}${action.danger ? ` ${css.menuItemDanger}` : ''}`}
                    onClick={() => { setMenuOpen(false); runMenuItem(action) }}
                  >
                    {props.t(action.label as MsgActionsKey)}
                  </button>
                </span>
              )
            })}
          </span>
        )}
      </span>
    </span>
  )
}
