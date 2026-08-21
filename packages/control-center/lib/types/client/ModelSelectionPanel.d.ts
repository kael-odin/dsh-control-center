import type { ReactNode } from 'react';
import type { IApiClient, ModelProviderGroup, ModelSelection } from '@deepseek-ai/dsh-api-remotes/client';
import type { SessionId } from '@deepseek-ai/dsh-api-remotes/client';
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots';
import type { SessionListState, SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { ModelsKey } from './locales.ts';
import type { SettingsSchemaOperations } from './schema-operations.ts';
export interface ModelSelectionState {
    status: 'idle' | 'loading' | 'ready' | 'saving' | 'error';
    error: string | null;
    defaultSelection: ModelSelection | null;
    defaultRevision: number | null;
    currentSessionId: SessionId | undefined;
    currentAddressed: boolean;
    currentSelection: ModelSelection | null;
    currentRoutable: boolean | null;
    groups: readonly ModelProviderGroup[];
    currentResult: 'idle' | 'both-updated' | 'current-only';
}
export declare class ModelSelectionStore {
    private readonly api;
    private readonly schema;
    readonly store: SnapshotStore<ModelSelectionState>;
    private generation;
    constructor(api: Pick<IApiClient, 'settings' | 'sessions' | 'llm'>, schema: SettingsSchemaOperations);
    load(sessionId: SessionId | undefined, addressed?: boolean): Promise<void>;
    saveDefault(selection: ModelSelection): Promise<boolean>;
    selectCurrent(selection: ModelSelection): Promise<boolean>;
}
export interface ModelSelectionPanelProps {
    controller: ModelSelectionStore;
    useSnapshot: SnapshotSelectorHook<ModelSelectionState>;
    useSessions: SnapshotSelectorHook<SessionListState>;
    load: (sessionId: SessionId | undefined, addressed: boolean) => void;
    t: (key: ModelsKey) => string;
    schema: SettingsSchemaOperations;
}
/** Render distinct future-session default and current-session model controls. */
export declare function ModelSelectionPanel(props: ModelSelectionPanelProps): ReactNode;
//# sourceMappingURL=ModelSelectionPanel.d.ts.map