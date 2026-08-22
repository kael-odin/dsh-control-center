/**
 * Cherry ProviderAvatar parity (components/ProviderAvatar.tsx +
 * iconDisplayConfig.ts): the brand glyph sits in a rounded container and is
 * scaled per Cherry's 'provider-list' display config — the default renders at
 * 120% and clips to the container; seven "contained" brands render at 5/7
 * with a 5px radius. Providers without a system glyph fall back to the first
 * character on a color generated from that character (Cherry's
 * generateColorFromChar LCG), with black/white contrast text.
 */

import type { ReactNode } from 'react'
import { providerIconSvg } from './provider-icons-data.ts'

/** Cherry iconDisplayConfig 'provider-list' contained set. */
const CONTAINED_ICONS: ReadonlySet<string> = new Set([
  'cherryin', 'aihubmix', 'lmstudio', 'anthropic', 'yi', 'groq', 'aws-bedrock',
])

/** Cherry generateColorFromChar: LCG-seeded pseudo-RGB from the char code. */
function generateColorFromChar(char: string): string {
  const seed = char.charCodeAt(0)
  const a = 1664525
  const c = 1013904223
  const m = 2 ** 32
  let r = (a * seed + c) % m
  let g = (a * r + c) % m
  const b = (a * g + c) % m
  r = Math.floor((r / m) * 256)
  g = Math.floor((g / m) * 256)
  const blue = Math.floor((b / m) * 256)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`
}

/** Cherry getForegroundColor: relative-luminance black/white contrast pick. */
function getForegroundColor(background: string): string {
  const value = background.replace('#', '')
  const channels = [0, 2, 4].map(offset => Number.parseInt(value.slice(offset, offset + 2), 16))
  const srgb = channels.map(channel => {
    const scaled = channel / 255
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * srgb[0]! + 0.7152 * srgb[1]! + 0.0722 * srgb[2]!
  return luminance > 0.179 ? '#000000' : '#FFFFFF'
}

export interface ProviderAvatarProps {
  /** Stable provider id (icon registry key or alias). */
  providerId: string
  /** Human-facing name for the letter fallback. */
  name: string
  /** Box size in px; the glyph scales relative to it. Default 26 (list rows). */
  size?: number
  /**
   * Cherry's display-context scaling. `'provider-list'` renders the glyph at
   * 120% (clipped) or 5/7 + radius for the contained brands; any other value
   * leaves the glyph at 100% — matching how Cherry only applies a config when
   * a context is passed.
   */
  displayContext?: 'provider-list' | undefined
  className?: string | undefined
}

/** One provider brand avatar, rendered exactly like Cherry's list/header use. */
export function ProviderAvatar({ providerId, name, size = 26, displayContext, className }: ProviderAvatarProps): ReactNode {
  const glyph = providerIconSvg(providerId)
  if (glyph !== '') {
    const scaled = displayContext === 'provider-list'
    const contained = scaled && CONTAINED_ICONS.has(providerId)
    return (
      <span
        className={className}
        data-avatar
        style={{ width: size, height: size }}
      >
        <span
          data-avatar-glyph
          {...(contained ? { 'data-contained': 'true' } : {})}
          {...(scaled ? { 'data-scaled': 'true' } : {})}
          dangerouslySetInnerHTML={{ __html: glyph }}
        />
      </span>
    )
  }
  // Unknown/custom id: first character on a generated pastel, Cherry colors.
  const seedChar = name.charAt(0).toUpperCase() || '?'
  const background = generateColorFromChar(seedChar)
  return (
    <span
      className={className}
      data-avatar
      style={{ width: size, height: size, background, color: getForegroundColor(background) }}
    >
      <span data-avatar-letter>{seedChar}</span>
    </span>
  )
}
