import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { IconDataOutline16, IconGlobeOutline14, IconSparkle16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ProductWorkspaceId } from './product-workspace-contract.ts'
import css from './ProductWorkspaceNavItem.module.css'

export interface ProductWorkspaceNavItemProps extends PropsRuntime<'application.navigation'> {
  id: ProductWorkspaceId
  label: string
}

function WorkspaceIcon({ id }: { id: ProductWorkspaceId }) {
  if (id === 'translation') return <IconGlobeOutline14 size={16} />
  if (id === 'painting') return <IconSparkle16 size={16} />
  return <IconDataOutline16 size={16} />
}

/** Render one product-workspace navigation action. */
export function ProductWorkspaceNavItem({ id, label, wide, activeId, select }: ProductWorkspaceNavItemProps) {
  const active = activeId === id
  return (
    <button
      type="button"
      className={css.item}
      data-active={active || undefined}
      data-wide={wide || undefined}
      aria-label={label}
      aria-pressed={active}
      onClick={() => { select(id) }}
    >
      <WorkspaceIcon id={id} />
      {wide ? <span>{label}</span> : null}
    </button>
  )
}
