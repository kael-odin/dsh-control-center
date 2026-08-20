/**
 * Lucide-style stroke icons for Cherry-faithful Control Center surfaces.
 * The dsh icon set covers shell chrome but not Cherry's action glyphs
 * (star, history clock, sliders, swap, repeat, flask, etc.).
 */
import type { SVGProps } from 'react'

export interface CherryIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

function base({ size = 14, ...rest }: CherryIconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...rest,
  }
}

/** Star (favorite) glyph; fill via className when active. */
export const IconStar = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.57l-5.9 3.1 1.13-6.58L2.45 9.44l6.6-.96L12 2.5z" />
  </svg>
)

/** History clock glyph. */
export const IconHistory = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l3 2" />
  </svg>
)

/** Horizontal sliders (translate settings trigger). */
export const IconSlidersHorizontal = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M21 4h-7" />
    <path d="M10 4H3" />
    <path d="M21 12h-9" />
    <path d="M8 12H3" />
    <path d="M21 20h-5" />
    <path d="M12 20H3" />
    <path d="M14 2v4" />
    <path d="M8 10v4" />
    <path d="M16 18v4" />
  </svg>
)

/** Swap source/target arrows. */
export const IconArrowLeftRight = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M8 3L4 7l4 4" />
    <path d="M4 7h16" />
    <path d="M16 21l4-4-4-4" />
    <path d="M20 17H4" />
  </svg>
)

/** Reuse / re-run glyph. */
export const IconRepeat = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M17 2l4 4-4 4" />
    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
  </svg>
)

/** Languages glyph (translate button). */
export const IconLanguages = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M5 8l6 6" />
    <path d="M4 14l6-6 2-3" />
    <path d="M2 5h12" />
    <path d="M7 2h1" />
    <path d="M22 22l-5-10-5 10" />
    <path d="M14 18h6" />
  </svg>
)

/** Flask for recall-test actions. */
export const IconFlaskConical = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M10 2v7.5L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9.5V2" />
    <path d="M8.5 2h7" />
    <path d="M7 16h10" />
  </svg>
)

/** Zap for recall submit. */
export const IconZap = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
)

/** Three-dot horizontal more menu. */
export const IconMoreHorizontal = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="19" cy="12" r="1" fill="currentColor" />
    <circle cx="5" cy="12" r="1" fill="currentColor" />
  </svg>
)

/** File text glyph. */
export const IconFileText = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </svg>
)

/** Sticky note glyph. */
export const IconStickyNote = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" />
    <path d="M15 3v6h6" />
  </svg>
)

/** Folder glyph. */
export const IconFolder = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
  </svg>
)

/** Link glyph. */
export const IconLink2 = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M9 17H7A5 5 0 0 1 7 7h2" />
    <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
    <path d="M8 12h8" />
  </svg>
)

/** Sparkles for insight lines. */
export const IconSparkles = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M12 3l1.9 5.7L19.6 10l-5.7 1.3L12 17l-1.9-5.7L4.4 10l5.7-1.3L12 3z" />
    <path d="M19 15l.9 2.6L22.5 18l-2.6.9L19 21.5l-.9-2.6L15.5 18l2.6-.9L19 15z" />
  </svg>
)

/** Pen for custom language edit. */
export const IconPenLine = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
)

/** Eye for view-chunks action. */
export const IconEye = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

/** Refresh cycle for reindex. */
export const IconRefreshCw = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
)

/** Circle alert. */
export const IconCircleAlert = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
)

/** Back arrow (chevron-left alias). */
export const IconChevronLeft = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
)

/** Spinning loader (wraps dsh loading glyph semantics). */
export const IconLoader = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M4.9 4.9l2.8 2.8" />
    <path d="M16.3 16.3l2.8 2.8" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="M4.9 19.1l2.8-2.8" />
    <path d="M16.3 7.7l2.8-2.8" />
  </svg>
)

/** Check glyph (filled variant for copy feedback). */
export const IconCheck = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

/** Trash glyph. */
export const IconTrash2 = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
)

/** Copy glyph. */
export const IconCopy = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

/** Pause circle for stop button. */
export const IconCirclePause = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M10 9v6" />
    <path d="M14 9v6" />
  </svg>
)

/** Chevron right. */
export const IconChevronRight = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M9 18l6-6-6-6" />
  </svg>
)

/** Plus glyph. */
export const IconPlus = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
)

/** X close glyph. */
export const IconX = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
)
