/**
 * Self-hosted inline icons (0.2.0 removed the general set from
 * dsh-client-ui-primitives — only permission glyphs remain upstream).
 * Names deliberately match the removed primitives exports so call sites only
 * swap the import source. Lucide-style 24×24 stroke paths, currentColor.
 */
import type { ReactNode } from 'react'

export interface CcIconProps {
  size?: number
  className?: string | undefined
}

function icon(paths: ReactNode): (props: CcIconProps) => ReactNode {
  return function CcIcon({ size = 16, className }: CcIconProps): ReactNode {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {paths}
      </svg>
    )
  }
}

export const IconCloseOutline16 = icon(<><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>)

export const IconCopyOutline16 = icon(<><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>)

export const IconPlusOutline16 = icon(<><path d="M12 5v14" /><path d="M5 12h14" /></>)

export const IconTrashOutline16 = icon(<><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></>)

export const IconSearchOutline16 = icon(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.5-4.5" /></>)

export const IconChevronDownOutline14 = icon(<path d="M6 9l6 6 6-6" />)

export const IconChevronLeftOutline14 = icon(<path d="M15 6l-6 6 6 6" />)

export const IconChevronRightOutline14 = icon(<path d="M9 6l6 6-6 6" />)

export const IconCheckOutline16 = icon(<path d="M4 12l5 5L20 7" />)

export const IconGlobeOutline14 = icon(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.8 3.4 2.8 14.6 0 18" /><path d="M12 3c-2.8 3.4-2.8 14.6 0 18" /></>)

export const IconDataOutline16 = icon(<><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>)

export const IconLoadingOutline16 = icon(<path d="M21 12a9 9 0 1 1-9-9" />)

export const IconPauseOutline16 = icon(<><path d="M9 5v14" /><path d="M15 5v14" /></>)

export const IconSendOutline14 = icon(<><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></>)

export const IconSparkle16 = icon(<path d="M12 3l1.9 5.8 5.8 1.9-5.8 1.9L12 18.4l-1.9-5.8-5.8-1.9 5.8-1.9L12 3z" />)

export const IconSettingsOutline14 = icon(<><path d="M21 4h-7" /><path d="M10 4H3" /><path d="M21 12h-9" /><path d="M8 12H3" /><path d="M21 20h-5" /><path d="M12 20H3" /><path d="M14 2v4" /><path d="M8 10v4" /><path d="M16 18v4" /></>)

export const IconSettingsOutline16 = IconSettingsOutline14
