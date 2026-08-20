/**
 * Painting template showcase: Cherry-style 5-position carousel with smooth
 * centering. Clicking a card fills the prompt; the active card shows its label.
 */
import { useMemo, useState } from 'react'
import { PAINTING_TEMPLATES, type PaintingTemplate } from './painting-templates-data.ts'
import css from './PaintingWorkspace.module.css'

/** Deterministic shuffle so the preview order changes per mount but is stable for a page session. */
function shuffled(): readonly PaintingTemplate[] {
  const list = [...PAINTING_TEMPLATES]
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(((i * 2654435761) % list.length) * Math.random()) % (i + 1)
    const tmp = list[i]!
    list[i] = list[j]!
    list[j] = tmp
  }
  return list
}

interface PositionStyle {
  transform: string
  zIndex: number
  opacity: number
}

/** Cherry carousel positions for offsets -2..+2 (translate/rotate/scale). */
function positionStyle(offset: number): PositionStyle {
  const x = offset * 18
  const abs = Math.abs(offset)
  const rotate = offset * 3.5
  const scale = 1.12 - abs * 0.1
  const lift = abs * 6
  return {
    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${lift}px)) rotate(${rotate}deg) scale(${scale})`,
    zIndex: 40 - abs * 10,
    opacity: Math.max(0, 1 - abs * 0.15),
  }
}

export interface PaintingShowcaseProps {
  onSelect: (prompt: string) => void
}

export function PaintingShowcase({ onSelect }: PaintingShowcaseProps) {
  const templates = useMemo(shuffled, [])
  const [active, setActive] = useState(0)

  const around = (index: number): number => {
    const length = templates.length
    const offset = (index % length + length) % length
    return offset
  }

  const cards = [-2, -1, 0, 1, 2].map(offset => {
    const index = around(active + offset)
    const template = templates[index]!
    const hidden = Math.abs(offset) > 2
    return { index, offset, template, hidden }
  })

  return (
    <section className={css.showcase} data-testid="painting-template-stage" aria-label="提示词模板">
      <div className={css.showcaseInner}>
        <h1 className={css.showcaseTitle}>给你的下一幅杰作，留一个位置。</h1>
        <div className={css.showcaseCarousel}>
          {cards.map(card => (
            <button
              key={card.template.id}
              type="button"
              className={`${css.carouselCard} ${card.offset === 0 ? css.selected : ''} ${card.hidden ? css.hidden : ''}`}
              style={positionStyle(card.offset)}
              aria-hidden={card.hidden || undefined}
              tabIndex={card.hidden ? -1 : 0}
              title={card.template.label}
              onClick={() => {
                setActive(card.index)
                onSelect(card.template.prompt)
              }}
            >
              <span className={css.carouselCardImage}>
                <img src={card.template.image} alt={card.template.label} draggable={false} />
              </span>
              {card.offset === 0 && <span className={css.carouselLabel}>{card.template.label}</span>}
            </button>
          ))}
        </div>
        <p className={css.showcaseCaption}>选择一个模板作为起点，再在下方把提示词改成你的表达。</p>
      </div>
    </section>
  )
}
