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

/* ---------- Settings nav icons (Cherry settings menu parity) ---------- */

export const IconPackage = (props: CherryIconProps) => (
  <svg {...base(props)}><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" /></svg>
)

export const IconToolCase = (props: CherryIconProps) => (
  <svg {...base(props)}><path d="M10 3h4v2h6v3h-2v11H6V8H4V5h6V3z" /><path d="M14 12h-4" /></svg>
)

export const IconCloud = (props: CherryIconProps) => (
  <svg {...base(props)}><path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z" /></svg>
)

export const IconSearch = (props: CherryIconProps) => (
  <svg {...base(props)}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
)

export const IconUser = (props: CherryIconProps) => (
  <svg {...base(props)}><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 14 0v1" /></svg>
)

export const IconActivity = (props: CherryIconProps) => (
  <svg {...base(props)}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
)

export const IconHardDrive = (props: CherryIconProps) => (
  <svg {...base(props)}><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 12h.01" /><path d="M10 12h.01" /><path d="M15 12h3" /></svg>
)

export const IconFileBox = (props: CherryIconProps) => (
  <svg {...base(props)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
)

export const IconFileCode = (props: CherryIconProps) => (
  <svg {...base(props)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M10 13l-2 2 2 2" /><path d="M14 13l2 2-2 2" /></svg>
)

export const IconScanText = (props: CherryIconProps) => (
  <svg {...base(props)}><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 8h10" /><path d="M7 12h10" /><path d="M7 16h6" /></svg>
)

export const IconCalendarClock = (props: CherryIconProps) => (
  <svg {...base(props)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4" /><path d="M16 3v4" /><path d="M3 10h18" /><circle cx="17" cy="16" r="3" /><path d="M17 14.5V16l1.2 1" /></svg>
)

export const IconRadio = (props: CherryIconProps) => (
  <svg {...base(props)}><circle cx="12" cy="12" r="2" /><path d="M4.9 4.9a10 10 0 0 0 0 14.2" /><path d="M19.1 4.9a10 10 0 0 1 0 14.2" /><path d="M8 8a5 5 0 0 0 0 8" /><path d="M16 8a5 5 0 0 1 0 8" /></svg>
)

export const IconCommand = (props: CherryIconProps) => (
  <svg {...base(props)}><path d="M9 9V4a2 2 0 1 0-2 2h11a2 2 0 1 0-2-2v14a2 2 0 1 0 2-2H7a2 2 0 1 0 2 2" /><path d="M9 9h11" /><path d="M9 15h11" /></svg>
)

export const IconCrop = (props: CherryIconProps) => (
  <svg {...base(props)}><path d="M6 2v14a2 2 0 0 0 2 2h14" /><path d="M18 22V8a2 2 0 0 0-2-2H2" /></svg>
)

export const IconBell = (props: CherryIconProps) => (
  <svg {...base(props)}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
)

export const IconPalette = (props: CherryIconProps) => (
  <svg {...base(props)}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" /></svg>
)

export const IconTerminal = (props: CherryIconProps) => (
  <svg {...base(props)}><path d="M4 17l6-6-6-6" /><path d="M12 19h8" /></svg>
)

export const IconInfo = (props: CherryIconProps) => (
  <svg {...base(props)}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
)

export const IconDataDrive = (props: CherryIconProps) => (
  <svg {...base(props)}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 12h16" /><path d="M12 12v8" /></svg>
)

/** Gear (settings) glyph. */
export const IconSettings2 = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

/** Picture-in-picture (quick-assistant window) glyph; lucide picture-in-picture-2. */
export const IconPictureInPicture2 = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4" />
    <rect width="10" height="7" x="12" y="13" rx="2" />
  </svg>
)

/** Text-cursor-with-input glyph; lucide text-cursor-input. */
export const IconTextCursorInput = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M12 20h-1a2 2 0 0 1-2-2 2 2 0 0 1-2 2H6" />
    <path d="M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7" />
    <path d="M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1" />
    <path d="M6 4h1a2 2 0 0 1 2 2 2 2 0 0 1 2-2h1" />
    <path d="M9 6v12" />
  </svg>
)

/** Broadcast-tower glyph for the unified API gateway; Font Awesome solid. */
export const IconGateway = (props: CherryIconProps) => (
  <svg {...base(props)} fill="currentColor" stroke="none" viewBox="0 0 640 640">
    <path d="M119.9 75.5c-11.3-6.9-26.1-3.2-33 8.1c-24.8 41-39 89.1-39 140.4s14.2 99.4 39 140.4c6.9 11.3 21.6 15 33 8.1s15-21.6 8.1-33c-20.3-33.6-32-73.2-32-115.5s11.7-81.9 32.1-115.6c6.9-11.3 3.2-26.1-8.1-33zm400.1 0c-11.3 6.9-15 21.6-8.1 33c20.4 33.7 32.1 73.3 32.1 115.6s-11.7 81.9-32.1 115.6c-6.9 11.3-3.2 26.1 8.1 33s26.1 3.2 33-8.1c24.8-41 39-89.1 39-140.4s-14.2-99.6-39-140.6c-6.9-11.3-21.6-15-33-8.1M352 279.4c19.1-11.1 32-31.7 32-55.4c0-35.3-28.7-64-64-64s-64 28.7-64 64c0 23.7 12.9 44.4 32 55.4V544c0 17.7 14.3 32 32 32s32-14.3 32-32zM212.2 155c7.2-11.2 3.9-26-7.2-33.2s-26-3.9-33.2 7.2c-17.6 27.4-27.8 60-27.8 95s10.2 67.6 27.8 95c7.2 11.2 22 14.4 33.2 7.2s14.4-22 7.2-33.2c-12.8-19.9-20.2-43.6-20.2-69s7.4-49.1 20.2-69m256-26c-7.2-11.2-22-14.4-33.2-7.2s-14.4 22-7.2 33.2c12.8 19.9 20.2 43.6 20.2 69s-7.4 49.1-20.2 69c-7.2 11.2-3.9 26 7.2 33.2s26 3.9 33.2-7.2c17.6-27.4 27.8-60 27.8-95s-10.2-67.6-27.8-95" />
  </svg>
)
