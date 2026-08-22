import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) {
  const { variant: _variant, size: _size, ...rest } = props
  return <button {...rest} />
}

export function Modal(props: { open: boolean; children?: ReactNode; footer?: ReactNode; title?: string; description?: string; onClose?: () => void; className?: string; closeLabel?: string }) {
  if (!props.open) return null
  return <div role="dialog" aria-label={props.title} className={props.className}><p>{props.description}</p>{props.children}{props.footer}</div>
}

/**
 * Minimal Menu stub: renders the anchor plus, while open, the item rows as
 * plain buttons carrying their ids — enough for selection flows in jsdom.
 */
export function Menu(props: {
  open: boolean
  anchor: ReactNode
  items: ReadonlyArray<{ type?: string; id: string; label: ReactNode; disabled?: boolean; danger?: boolean }>
  onSelect?: (id: string) => void
  onClose?: () => void
}) {
  return (
    <span>
      {props.anchor}
      {props.open
        ? (
          <ul role="menu">
            {props.items.map(item => 'type' in item && item.type === 'separator'
              ? <li key={item.id} role="separator" />
              : (
                <li key={item.id} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    disabled={'disabled' in item && item.disabled === true}
                    onClick={() => { props.onSelect?.(item.id); props.onClose?.() }}
                  >
                    {'label' in item ? item.label : null}
                  </button>
                </li>
              ))}
          </ul>
        )
        : null}
    </span>
  )
}

export function OnboardingSurface(props: { children?: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />
}

const icon = (props: { size?: number; className?: string }) => <span className={props.className} aria-hidden="true" />
export const IconPlusOutline16 = icon
export const IconSettingsOutline14 = icon
export const IconSettingsOutline16 = icon
export const IconCloseOutline16 = icon
export const IconDataOutline16 = icon
export const IconAgentPresetOutline16 = icon
export const IconPersonalizationOutline16 = icon
