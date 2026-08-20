/**
 * Painting session strip: Cherry PaintingStrip parity — new-session button,
 * thumbnail history rail with hover delete and generating progress.
 */
import { useEffect, useRef, useState } from 'react'
import { IconChevronLeftOutline14, IconLoadingOutline16, IconPlusOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PaintingHistoryItem } from '../painting-types.ts'
import css from './PaintingWorkspace.module.css'
import { IconTrash2 } from './cherry-icons.tsx'
import { ConfirmDialog } from './panel-ui.tsx'

export interface PaintingStripProps {
  history: readonly PaintingHistoryItem[]
  selectedId: string | null
  generating: boolean
  hasMore: boolean
  onNew: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onLoadMore: () => void
  onClose: () => void
}

export function PaintingStrip({ history, selectedId, generating, hasMore, onNew, onSelect, onDelete, onLoadMore, onClose }: PaintingStripProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el === null || history.length === 0) return
    // Auto-load when content doesn't fill the rail.
    if (el.scrollHeight <= el.clientHeight && hasMore) onLoadMore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.length, hasMore])

  const onScroll = (): void => {
    const el = scrollRef.current
    if (el === null || !hasMore) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) onLoadMore()
  }

  return (
    <>
      <aside className={css.strip} aria-label="图片会话" ref={scrollRef} onScroll={onScroll}>
        <div className={css.stripHeader}>
          <button type="button" className={css.backButton} title="返回对话" onClick={onClose}>
            <IconChevronLeftOutline14 size={16} />
          </button>
          <button type="button" className={css.newButton} title="新建图片" onClick={onNew}>
            <IconPlusOutline16 size={16} />
          </button>
        </div>
        {generating && (
          <div className={css.stripItem} aria-label="生成中">
            <span className={css.thumbEmpty}><IconLoadingOutline16 size={18} /></span>
            <span className={css.stripProgress} />
          </div>
        )}
        {history.map(item => (
          <button
            key={item.id}
            type="button"
            className={`${css.stripItem} ${item.id === selectedId ? css.active : ''}`}
            aria-label="选择图片"
            aria-pressed={item.id === selectedId}
            onClick={() => { onSelect(item.id) }}
          >
            <span className={css.thumb}>
              {item.images[0] === undefined
                ? <span className={css.thumbEmpty}><IconLoadingOutline16 size={16} /></span>
                : <img src={item.images[0].dataUrl} alt="" />}
            </span>
            <span
              className={css.stripDelete}
              role="button"
              title="删除图片"
              aria-label="删除图片"
              onClick={(event) => { event.stopPropagation(); setConfirmDelete(item.id) }}
            >
              <IconTrash2 size={11} />
            </span>
          </button>
        ))}
        {hasMore && (
          <span className={css.stripEnd}>
            <IconLoadingOutline16 size={14} />
          </span>
        )}
      </aside>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="确定要删除此图片吗？"
        description="删除后将无法恢复。"
        confirmText="删除"
        destructive
        onConfirm={() => { if (confirmDelete !== null) onDelete(confirmDelete); setConfirmDelete(null) }}
        onCancel={() => { setConfirmDelete(null) }}
      />
    </>
  )
}
