/**
 * Translate history side panel: Cherry list + detail views (star filter,
 * clear all, row hover star, chips, detail with reuse/copy actions).
 */
import { useEffect, useRef, useState } from 'react'
import type { TranslationHistoryItem } from '../translation-types.ts'
import css from './TranslationWorkspace.module.css'
import {
  IconArrowLeftRight, IconCheck, IconChevronLeft, IconCopy,
  IconHistory, IconStar, IconTrash2,
} from './cherry-icons.tsx'
import { ConfirmDialog, IconButton, PanelShell, useCopy } from './panel-ui.tsx'

export interface TranslationHistoryPanelProps {
  history: readonly TranslationHistoryItem[]
  total: number
  nextCursor: string | null
  starredOnly: boolean
  onStarredOnlyChange: (next: boolean) => void
  onLoadMore: () => void
  onStar: (id: string, starred: boolean) => void
  onDelete: (id: string) => void
  onClearAll: () => void
  onReuse: (item: TranslationHistoryItem) => void
  onClose: () => void
}

const LANGUAGE_EMOJI: Record<string, string> = {
  'auto': '🌐',
  'zh-CN': '🇨🇳',
  'en': '🇺🇸',
  'ja': '🇯🇵',
  'ko': '🇰🇷',
  'fr': '🇫🇷',
  'de': '🇩🇪',
  'es': '🇪🇸',
}

export function formatHistoryTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
  const pad = (value: number): string => String(value).padStart(2, '0')
  const clock = `${pad(date.getHours())}:${pad(date.getMinutes())}`
  if (sameDay) return clock
  return `${date.getMonth() + 1}月${date.getDate()}日 ${clock}`
}

export function languageEmoji(id: string): string {
  return LANGUAGE_EMOJI[id] ?? '🌐'
}

export function TranslationHistoryPanel(props: TranslationHistoryPanelProps) {
  const {
    history, total, nextCursor, starredOnly, onStarredOnlyChange, onLoadMore,
    onStar, onDelete, onClearAll, onReuse, onClose,
  } = props
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const { copied, copy } = useCopy()

  const selected = history.find(item => item.id === selectedId) ?? null

  // Keep the detail view in sync when its item vanishes (deleted/cleared).
  useEffect(() => {
    if (selectedId !== null && !history.some(item => item.id === selectedId)) setSelectedId(null)
  }, [history, selectedId])

  const onScroll = (): void => {
    const el = bodyRef.current
    if (el === null || nextCursor === null) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 160) onLoadMore()
  }

  const handleDelete = (id: string): void => {
    onDelete(id)
    setConfirmDelete(null)
    if (selectedId === id) setSelectedId(null)
  }

  const handleClear = (): void => {
    onClearAll()
    setConfirmClear(false)
    setSelectedId(null)
  }

  return (
    <>
      <PanelShell
        title={`翻译历史 (${total})`}
        onClose={onClose}
        bodyClassName={css.panelBodyScroll}
        headerExtra={selected === null ? (
            <div style={{ display: 'flex', gap: 4, flex: 'none' }}>
              <IconButton title="仅显示收藏" active={starredOnly} on={starredOnly}
                onClick={() => { onStarredOnlyChange(!starredOnly) }}>
                <IconStar size={14} className={starredOnly ? css.starFill : undefined} />
              </IconButton>
              <IconButton title="清空历史" disabled={history.length === 0} onClick={() => { setConfirmClear(true) }}>
                <IconTrash2 size={14} />
              </IconButton>
            </div>
          )
          : null}
      >
        {selected === null ? (
          <div className={css.historyList} onScroll={onScroll} ref={bodyRef}>
            {history.length === 0
              ? (
                <div className={css.historyEmpty}>
                  <IconHistory size={28} className={css.historyEmptyIcon} />
                  <span>{starredOnly ? '暂无收藏' : '暂无翻译历史'}</span>
                </div>
              )
              : history.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={css.historyRow}
                  onClick={() => { setSelectedId(item.id) }}
                >
                  <span className={css.starBtn}>
                    <IconButton title="收藏" on={item.starred}
                      onClick={(event) => {
                        event.stopPropagation()
                        onStar(item.id, !item.starred)
                      }}>
                      <IconStar size={10} className={item.starred ? css.starFill : undefined} />
                    </IconButton>
                  </span>
                  <div className={css.historyRowMeta}>
                    <span className={css.chip}>{languageEmoji(item.sourceLanguage)} {item.sourceLanguage}</span>
                    <IconArrowLeftRight size={10} className={css.chipArrow} />
                    <span className={css.chipTarget}>{languageEmoji(item.targetLanguage)} {item.targetLanguage}</span>
                    <span className={css.rowTime}>{formatHistoryTime(item.createdAt)}</span>
                  </div>
                  <p className={css.rowSource}>{item.sourceText}</p>
                  <p className={css.rowTarget}>{item.translatedText}</p>
                </button>
              ))}
            {nextCursor === null ? null : (
              <button type="button" className={css.loadMore} onClick={onLoadMore}>加载更多</button>
            )}
          </div>
        ) : (
          <div className={css.detail}>
            <button type="button" className={css.detailBack} onClick={() => { setSelectedId(null) }}>
              <IconChevronLeft size={12} />
              <span>返回列表</span>
            </button>
            <div className={css.detailMeta}>
              <span className={css.chip}>{languageEmoji(selected.sourceLanguage)} {selected.sourceLanguage}</span>
              <IconArrowLeftRight size={10} className={css.chipArrow} />
              <span className={css.chipTarget}>{languageEmoji(selected.targetLanguage)} {selected.targetLanguage}</span>
              <span style={{ flex: 1 }} />
              <IconButton title="删除翻译历史" onClick={() => { setConfirmDelete(selected.id) }}>
                <IconTrash2 size={12} />
              </IconButton>
              <IconButton title="收藏" on={selected.starred} onClick={() => { onStar(selected.id, !selected.starred) }}>
                <IconStar size={12} className={selected.starred ? css.starFill : undefined} />
              </IconButton>
              <span className={css.rowTime} style={{ position: 'static' }}>{formatHistoryTime(selected.createdAt)}</span>
            </div>
            <div className={css.detailBlock}>
              <div className={css.detailBlockHeader}>
                <span className={css.detailBlockLabel}>原文</span>
                <IconButton title="复制" onClick={() => { copy(selected.sourceText) }}>
                  {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                </IconButton>
              </div>
              <p className={css.detailText}>{selected.sourceText}</p>
            </div>
            <div className={`${css.detailBlock} ${css.detailBlockTarget}`}>
              <div className={css.detailBlockHeader}>
                <span className={css.detailBlockLabel}>译文</span>
                <IconButton title="复制" onClick={() => { copy(selected.translatedText) }}>
                  {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                </IconButton>
              </div>
              <p className={css.detailText}>{selected.translatedText}</p>
            </div>
            <div className={css.detailActions}>
              <button type="button" className={`${css.detailAction} ${css.reuse}`} onClick={() => { onReuse(selected) }}>
                <IconArrowLeftRight size={12} />
                <span>使用此翻译</span>
              </button>
              <button type="button" className={`${css.detailAction} ${css.copy}`} onClick={() => { copy(selected.translatedText) }}>
                <IconCopy size={12} />
                <span>{copied ? '已复制' : '复制译文'}</span>
              </button>
            </div>
          </div>
        )}
      </PanelShell>

      <ConfirmDialog
        open={confirmClear}
        title="清空历史"
        description="清空历史将删除所有翻译历史记录，是否继续？"
        confirmText="清空历史"
        destructive
        onConfirm={handleClear}
        onCancel={() => { setConfirmClear(false) }}
      />
      <ConfirmDialog
        open={confirmDelete !== null}
        title="删除翻译历史"
        description="确定要删除这条翻译历史记录吗？此操作不可撤销。"
        confirmText="删除翻译历史"
        destructive
        onConfirm={() => { if (confirmDelete !== null) handleDelete(confirmDelete) }}
        onCancel={() => { setConfirmDelete(null) }}
      />
    </>
  )
}
