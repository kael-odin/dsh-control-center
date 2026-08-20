/**
 * Artboard toolbar icons (lucide-style strokes).
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

export const IconZoomIn = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.3-4.3" />
    <path d="M11 8v6" />
    <path d="M8 11h6" />
  </svg>
)

export const IconZoomOut = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.3-4.3" />
    <path d="M8 11h6" />
  </svg>
)

export const IconRotateLeft = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M2.5 9a9 9 0 1 1 2.3 5.3" />
    <path d="M2 4v5h5" />
  </svg>
)

export const IconRotateRight = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M21.5 9a9 9 0 1 0-2.3 5.3" />
    <path d="M22 4v5h-5" />
  </svg>
)

export const IconSettings2 = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

export const IconPaperclip = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
)

export const IconPalette = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
)

export const IconImageUp = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10" />
    <circle cx="9" cy="9" r="2" />
    <path d="M21 15l-3-3-3 3" />
    <path d="M15 21h6" />
  </svg>
)

export const IconImageDown = (props: CherryIconProps) => (
  <svg {...base(props)}>
    <path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10" />
    <circle cx="9" cy="9" r="2" />
    <path d="M15 15l3 3 3-3" />
    <path d="M18 12v6" />
  </svg>
)
