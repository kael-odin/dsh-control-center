/**
 * The 请求选项 panel behind the header's bolt icon (Cherry's API options
 * drawer, mapped to what the profile really serves): the route's custom
 * request headers, a first-class pi-ai profile field (`headers` dict) that
 * every request to this provider carries.
 *
 * Edits are path ops against the stored section — `headers` is set wholesale
 * (an absent dict and an empty one are the same wire request, so an emptied
 * panel unsets rather than storing `{}`), with the namespace revision captured
 * at open so a concurrent edit elsewhere is a refusal, not an overwrite.
 */
import type { ReactNode } from 'react';
import type { IApiClient, SettingsNamespaceView } from '@deepseek-ai/dsh-api-remotes/client';
import type { SettingsSchemaOperations } from './schema-operations.ts';
import type { en } from './locales.ts';
export interface RequestOptionsPanelProps {
    open: boolean;
    /** The owning namespace view (revision + redacted value). */
    namespace: SettingsNamespaceView;
    /** Path to the provider profile inside the section. */
    settingsPath: readonly string[];
    api: Pick<IApiClient, 'settings'>;
    schema: SettingsSchemaOperations;
    t: (key: keyof typeof en) => string;
    readOnly: boolean;
    onClose: () => void;
    /** Called after a successful save (the owner reloads). */
    onSaved: () => void;
}
/**
 * Render the custom-headers editor for one provider profile.
 * @param props - open state, profile address, wire face, and copy.
 * @returns the dialog, or null while closed.
 */
export declare function RequestOptionsPanel(props: RequestOptionsPanelProps): ReactNode;
//# sourceMappingURL=RequestOptionsPanel.d.ts.map