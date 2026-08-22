import type { ReactNode } from 'react';
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client';
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots';
import type { ChannelsState } from './channels-store.ts';
import type { ChannelBridgeStatus } from '../channel-bridge.ts';
import { ChannelsStore } from './channels-store.ts';
/** Bridge status slice injected alongside the settings store. */
export interface ChannelBridgeHandle {
    status(): Promise<{
        ok: true;
        value: ChannelBridgeStatus[];
    } | {
        ok: false;
        error: {
            code: string;
            message: string;
            details: object;
        };
    }>;
    getLog(channelId: string, lines?: number): Promise<{
        ok: true;
        value: string[];
    } | {
        ok: false;
        error: {
            code: string;
            message: string;
            details: object;
        };
    }>;
}
/** Injected dependencies delivered by the settings shell. */
export interface ChannelsSectionInjected {
    api: Pick<IApiClient, 'settings'>;
    useChannels: SnapshotSelectorHook<ChannelsState>;
    controller: ChannelsStore;
    /** Lazy handle to the host channel bridge (undefined until mounted). */
    getBridge?: (() => ChannelBridgeHandle) | undefined;
}
/** Props delivered by the slot outlet (partial until injected). */
export type ChannelsSectionProps = Partial<ChannelsSectionInjected>;
/** Comma text -> trimmed, non-empty id list (Cherry's parse rule). */
export declare function parseAllowedIds(text: string): string[];
/**
 * Render the 频道 section. Instances live in the control-center-channels
 * settings namespace — the same section a desktop bridge reads from
 * settings.yaml — and fall back to browser-local persistence (with an honest
 * notice) when the running host predates the namespace.
 */
export declare function ChannelsSection(props: ChannelsSectionProps): ReactNode;
//# sourceMappingURL=ChannelsSection.d.ts.map