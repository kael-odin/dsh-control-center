/** Deliver Cherry-compatible conversation-complete notifications from DSH session state. */
import type { IApiClient } from '@deepseek-ai/dsh-client-connection/client';
import type { SessionListState } from '@deepseek-ai/dsh-client-runtime/client';
export declare const NOTIFICATION_SETTINGS_NAMESPACE = "control-center-notifications";
interface SnapshotSource<T> {
    getSnapshot(): T;
    subscribe(listener: () => void): () => void;
}
/**
 * Watches real host session transitions and emits a system notification only
 * when a previously-running conversation becomes idle while this window is not
 * focused. The returned disposer owns the sole list subscription.
 */
export declare class ConversationNotificationRuntime {
    private readonly api;
    private readonly sessions;
    private assistantEnabled;
    private running;
    private stop;
    constructor(api: IApiClient, sessions: SnapshotSource<SessionListState>);
    refreshPreferences(): Promise<void>;
    start(): () => void;
    private onSnapshot;
}
export {};
//# sourceMappingURL=notification-runtime.d.ts.map