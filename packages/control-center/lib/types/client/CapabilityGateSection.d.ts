/**
 * Capability-gated settings pages for desktop-bound automation features
 * (Channels, shortcuts, quick/selection assistants, screenshots).
 *
 * The web edition runs in a browser without a companion process, so these
 * integrations are presented honestly: what the web edition supports, and
 * why the rest is unavailable (spec: unsupported platform integrations are
 * presented accurately through capability detection).
 */
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
export interface CapabilityGateSectionProps {
    title: string;
    description: string;
    supported: string[];
    unavailable: string[];
    note: string;
}
export interface CapabilityGateInjected {
    hooks: {
        gateReady: HostObservable<boolean>;
    };
}
export type CapabilityGateProps = PropsRuntime<'settings.section'> & CapabilityGateSectionProps & InjectFace<CapabilityGateInjected>;
export declare function CapabilityGateSection({ title, description, supported, unavailable, note }: CapabilityGateProps): import("react").JSX.Element;
//# sourceMappingURL=CapabilityGateSection.d.ts.map