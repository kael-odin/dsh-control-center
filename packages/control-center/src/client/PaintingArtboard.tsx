/**
 * Painting artboard: Cherry Artboard parity — prompt bar, contain-fit image
 * with pan/zoom/rotate, left toolbar rail, multi-image counter, generating
 * skeleton, empty placeholder.
 */
import { useMemo, useRef, useState } from 'react'
import type { PaintingImageRef } from '../painting-types.ts'
import css from './PaintingWorkspace.module.css'
import {
  IconRotateLeft, IconRotateRight, IconZoomIn, IconZoomOut,
} from './painting-icons.tsx'
import { IconChevronLeft, IconChevronRight, IconRefreshCw, IconSparkles } from './cherry-icons.tsx'

export interface PaintingArtboardProps {
  prompt: string
  images: readonly PaintingImageRef[]
  sizeLabel: string
  generating: boolean
  progress: number
}

const MAX_SCALE = 4
const MIN_SCALE = 0.25
const STEP = 0.25

export function PaintingArtboard({ prompt, images, sizeLabel, generating, progress }: PaintingArtboardProps) {
  const [index, setIndex] = useState(0)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  const image = images.length === 0 ? undefined : images[Math.min(index, images.length - 1)]!

  const cells = useMemo(() => {
    const count = 10
    const hash = (seed: number): number => {
      let value = seed * 2654435761
      value = (value ^ (value >> 13)) * 0x5bd1e995
      return ((value ^ (value >> 15)) >>> 0) / 0xffffffff
    }
    return Array.from({ length: count * count }, (_, cellIndex) => ({
      animationDelay: `${(hash(cellIndex + 1) * 2.4).toFixed(2)}s`,
      animationDuration: `${(1.6 + hash(cellIndex + 2) * 1.6).toFixed(2)}s`,
    }))
  }, [])

  const reset = (): void => {
    setScale(1)
    setRotation(0)
    setOffset({ x: 0, y: 0 })
  }

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (scale <= 1 && offset.x === 0 && offset.y === 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { startX: event.clientX, startY: event.clientY, originX: offset.x, originY: offset.y }
    setDragging(true)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current
    if (drag === null) return
    setOffset({ x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY })
  }

  const onPointerUp = (): void => {
    dragRef.current = null
    setDragging(false)
  }

  return (
    <div className={css.artboard}>
      <div className={css.promptBar}>
        <div className={css.promptBarText} title={prompt}>
          <IconSparkles size={14} />
          <span>{prompt || '暂无提示词'}</span>
        </div>
        <span className={css.sizeLabel}>{sizeLabel}</span>
      </div>
      <div className={css.artboardStage}>
        {generating ? (
          <div className={css.skeletonGrid} style={{ ['--cols' as string]: '10', width: 'min(420px, 80%)' }}>
            {cells.map((cell, cellIndex) => (
              <span key={cellIndex} className={css.skeletonCell} style={{ animationDelay: cell.animationDelay, animationDuration: cell.animationDuration }} />
            ))}
            <div className={css.progressText}>{Math.round(progress * 100)}%</div>
          </div>
        ) : image === undefined ? (
          <div className={css.artboardEmpty}>
            <span className={css.artboardEmptyLabel}>暂无图片</span>
          </div>
        ) : (
          <div
            className={`${css.imageBox} ${dragging ? css.dragging : ''}`}
            style={{ touchAction: 'none' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <img
              src={image.dataUrl}
              alt={prompt}
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg) translate(${offset.x}px, ${offset.y}px)`,
                transition: dragging ? 'none' : 'transform 0.2s ease',
              }}
            />
          </div>
        )}

        {!generating && images.length > 0 && (
          <div className={css.toolbarRail} role="toolbar" aria-label="预览">
            {images.length > 1 && (
              <>
                <button type="button" className={css.toolbarButton} title="上一张图片" onClick={() => { setIndex(current => (current - 1 + images.length) % images.length); reset() }}>
                  <IconChevronLeft size={16} />
                </button>
                <button type="button" className={css.toolbarButton} title="下一张图片" onClick={() => { setIndex(current => (current + 1) % images.length); reset() }}>
                  <IconChevronRight size={16} />
                </button>
                <span className={css.toolbarDivider} />
              </>
            )}
            <button type="button" className={css.toolbarButton} title="缩小" disabled={scale <= MIN_SCALE} onClick={() => { setScale(current => Math.max(MIN_SCALE, current - STEP)) }}>
              <IconZoomOut size={16} />
            </button>
            <button type="button" className={css.toolbarButton} title="放大" disabled={scale >= MAX_SCALE} onClick={() => { setScale(current => Math.min(MAX_SCALE, current + STEP)) }}>
              <IconZoomIn size={16} />
            </button>
            <button type="button" className={css.toolbarButton} title="向左旋转" onClick={() => { setRotation(current => (current - 90) % 360) }}>
              <IconRotateLeft size={16} />
            </button>
            <button type="button" className={css.toolbarButton} title="向右旋转" onClick={() => { setRotation(current => (current + 90) % 360) }}>
              <IconRotateRight size={16} />
            </button>
            <button type="button" className={css.toolbarButton} title="重置" onClick={reset}>
              <IconRefreshCw size={16} />
            </button>
          </div>
        )}
        {!generating && images.length > 1 && (
          <span className={css.counterPill}>{index + 1} / {images.length}</span>
        )}
      </div>
    </div>
  )
}
