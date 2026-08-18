import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { IconDataOutline16, IconGlobeOutline14, IconSparkle16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ProductWorkspaceId } from './product-workspace-contract.ts'
import css from './ProductWorkspaceSurface.module.css'

export interface ProductWorkspaceSurfaceProps extends PropsRuntime<'application.surface', ProductWorkspaceId> {
  id: ProductWorkspaceId
  title: string
  description: string
  closeLabel: string
}

function WorkspaceIcon({ id }: { id: ProductWorkspaceId }) {
  if (id === 'translation') return <IconGlobeOutline14 size={22} />
  if (id === 'painting') return <IconSparkle16 size={22} />
  return <IconDataOutline16 size={22} />
}

/** Render the capability-owned product workspace frame. */
export function ProductWorkspaceSurface({ id, title, description, closeLabel, close }: ProductWorkspaceSurfaceProps) {
  return (
    <main className={css.root}>
      <header className={css.header}>
        <div className={css.identity}>
          <span className={css.icon}><WorkspaceIcon id={id} /></span>
          <div>
            <p className={css.eyebrow}>DSH Control Center</p>
            <h1>{title}</h1>
          </div>
        </div>
        <button type="button" className={css.close} onClick={close}>{closeLabel}</button>
      </header>
      <section className={css.body}>
        <p>{description}</p>
      </section>
    </main>
  )
}
