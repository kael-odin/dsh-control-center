/**
 * 消息内搜索 entry (§1.3) — a 🔍 button in `conversation.input.left` opening
 * a search strip over the host-rendered chat flow: live match count,
 * previous/next cycling with scroll-into-view, honest scope ("当前已加载
 * 消息" — the host may virtualize distant messages).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import {
  collectMatches, ensureSearchFlashStyle, focusHit, type SearchHit,
} from './search-dom.ts'
import css from './QuickPhrasesButton.module.css'

export type MessageSearchProps =
  PropsRuntime<'conversation.input.left'>
  & PropsLocale<'control-center.msgactions'>

export function MessageSearchButton(props: MessageSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setInput] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    ensureSearchFlashStyle(document)
  }, [])

  const run = useCallback((raw: string) => {
    const found = collectMatches(document, raw)
    setHits(found)
    setIndex(0)
  }, [])

  const onInput = useCallback((raw: string) => {
    setInput(raw)
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = setTimeout(() => { run(raw) }, 200)
  }, [run])

  const jump = useCallback((delta: number) => {
    const hit = hits[index]
    if (hit === undefined) return
    const next = (index + delta + hits.length) % hits.length
    setIndex(next)
    focusHit(hits[next] ?? hit)
  }, [hits, index])

  return (
    <span className={css.anchor}>
      <button
        type="button"
        className={css.button}
        title={props.t('messageSearch')}
        aria-label={props.t('messageSearch')}
        onClick={() => {
          setOpen(open => !open)
          setTimeout(() => { inputRef.current?.focus() }, 0)
        }}
      >
        🔍
      </button>
      {open && (
        <span className={css.menu} role="dialog" aria-label={props.t('messageSearch')}>
          <span className={css.addRow}>
            <input
              ref={inputRef}
              className={css.input}
              type="text"
              placeholder={props.t('searchPlaceholder')}
              aria-label={props.t('searchPlaceholder')}
              value={query}
              onChange={event => { onInput(event.target.value) }}
              onKeyDown={event => {
                if (event.key === 'Enter') jump(event.shiftKey === true ? -1 : 1)
              }}
            />
            <span aria-live="polite" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
              {query.trim() === '' ? '' : `${hits.length === 0 ? 0 : index + 1}/${hits.length}`}
            </span>
            <button
              type="button"
              className={css.addButton}
              aria-label={props.t('searchPrev')}
              disabled={hits.length === 0}
              onClick={() => { jump(-1) }}
            >
              ↑
            </button>
            <button
              type="button"
              className={css.addButton}
              aria-label={props.t('searchNext')}
              disabled={hits.length === 0}
              onClick={() => { jump(1) }}
            >
              ↓
            </button>
          </span>
          <span className={css.menuTitle}>{props.t('searchScope')}</span>
        </span>
      )}
    </span>
  )
}
