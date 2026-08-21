import { Component, type ErrorInfo, type ReactNode } from 'react'
import type { PropsRenderSlots, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import css from './GeneralSection.module.css'

/** Full component props: section owner share plus item render share. */
export type GeneralSectionComponentProps =
  PropsRuntime<'settings.section'> & PropsRenderSlots<'settings.general.item'>

interface GeneralItemsBoundaryProps { children: ReactNode }
interface GeneralItemsBoundaryState { error: Error | null }

/** Keep one unsupported native General item from taking down the settings shell. */
class GeneralItemsBoundary extends Component<GeneralItemsBoundaryProps, GeneralItemsBoundaryState> {
  override state: GeneralItemsBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): GeneralItemsBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('General settings item failed to render:', error, info.componentStack)
  }

  override render(): ReactNode {
    if (this.state.error !== null) {
      return (
        <div className={css.section} role="alert">
          <div className={css.errorTitle}>此设置项暂时不可用</div>
          <div className={css.errorDescription}>{this.state.error.message}</div>
        </div>
      )
    }
    return this.props.children
  }
}

/** Render the General section content column. */
export function GeneralSection({ renderSlot }: GeneralSectionComponentProps) {
  return (
    <GeneralItemsBoundary>
      <div className={css.section}>
        {renderSlot('settings.general.item', {})}
      </div>
    </GeneralItemsBoundary>
  )
}
