/**
 * Capability-gated settings pages for desktop-bound automation features
 * (Channels, shortcuts, quick/selection assistants, screenshots).
 *
 * The web edition runs in a browser without a companion process, so these
 * integrations are presented honestly: what the web edition supports, and
 * why the rest is unavailable (spec: unsupported platform integrations are
 * presented accurately through capability detection).
 */

import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import css from './UsageSection.module.css'

export interface CapabilityGateSectionProps {
  title: string
  description: string
  supported: string[]
  unavailable: string[]
  note: string
}

export interface CapabilityGateInjected {
  hooks: { gateReady: HostObservable<boolean> }
}

export type CapabilityGateProps = PropsRuntime<'settings.section'> & CapabilityGateSectionProps & InjectFace<CapabilityGateInjected>

export function CapabilityGateSection({ title, description, supported, unavailable, note }: CapabilityGateProps) {
  return (
    <div className={css.root}>
      <div>
        <h2 className={css.pageTitle}>{title}</h2>
        <p className={css.pageDescription}>{description}</p>
      </div>

      <div className="cc-card">
        <div className="cc-card-title">Web 版已支持</div>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {supported.map(item => (
            <li key={item} style={{ fontSize: 13, color: 'var(--foreground)' }}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="cc-card">
        <div className="cc-card-title">需要桌面环境（不可用）</div>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {unavailable.map(item => (
            <li key={item} style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{item}</li>
          ))}
        </ul>
        <p className="cc-card-description">{note}</p>
      </div>
    </div>
  )
}
