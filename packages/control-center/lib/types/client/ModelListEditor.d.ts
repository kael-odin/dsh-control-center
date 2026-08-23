/**
 * The model list of one pi-ai provider profile, plus the action that asks the
 * provider what it serves.
 *
 * The list is the profile's `models` array as the card holds it: an empty list
 * means "serve this route's built-in catalog", and any entry replaces that
 * catalog, so a row is only ever added deliberately. Fetching asks the endpoint
 * **the form currently shows** — including a key typed but not yet saved — so
 * adding a provider is one pass instead of save-then-return; the reply is
 * candidates the user picks from, never configuration written behind them.
 *
 * A provider that cannot be interrogated (an unreachable endpoint, a protocol
 * with no readable listing) is not a dead end: the failure is shown next to the
 * rows the user can still fill in by hand.
 */
import type { ReactNode } from 'react';
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client';
import type { DeepSeekModelDraft } from './DeepSeekModelsEditor.tsx';
import type { en } from './locales.ts';
/**
 * One configured model row. Structurally open, exactly like the DeepSeek
 * catalog editor's rows: a profile field this card does not edit — one a future
 * schema adds, or one hand-written in `settings.yaml` — has to survive being
 * edited here rather than being dropped by a rebuild.
 */
export type ModelDraft = DeepSeekModelDraft;
/** What an interrogation needs, taken from the live form. */
export interface ProbeTarget {
    /** Settings namespace whose adapter family answers. */
    settingsNs: string;
    /**
     * Route being edited, when the card edits one. An adapter that already
     * describes it answers from its own registry, so such a card can ask without
     * an endpoint at all.
     */
    provider?: string;
    /** Endpoint as the form currently shows it. */
    baseURL?: string;
    /** Wire protocol the form names, when it names one. */
    api?: string;
    /** Key typed into the form and not yet stored, when there is one. */
    apiKey?: string;
}
/** Props of {@link ModelListEditor}. */
export interface ModelListEditorProps {
    /** The rows as currently drafted. */
    models: readonly ModelDraft[];
    /** Whether the user layer currently owns the whole array; absent on a create. */
    overridden?: boolean;
    /** Replace the drafted rows. */
    onChange: (models: ModelDraft[]) => void;
    /** Remove the user-owned array and return to inheritance; absent on a create. */
    onReset?: () => void;
    /** Endpoint facts for the fetch action. */
    probe: ProbeTarget;
    /**
     * Copy key naming why the fetch action is unavailable, or `undefined` when
     * it is. The card owns this because the key it would send is judged there:
     * asking with a key the form has already refused spends a round trip to be
     * told what the field already says.
     */
    probeBlocked?: keyof typeof en | undefined;
    /** Wire face the fetch action calls. */
    api: Pick<IApiClient, 'llm'>;
    /** Provider docs/models URL for Cherry's FileText header link; absent = no link. */
    docsUrl?: string | undefined;
    /** Section copy. */
    t: (key: keyof typeof en) => string;
    /** Disable every control (read-only deployment or a pending write). */
    disabled: boolean;
    /**
     * The host's current default model selection; the row matching it under
     * this provider shows the filled default marker.
     */
    defaultModel?: {
        provider?: unknown;
        model?: unknown;
    };
    /** Mark a row as the default model for future sessions. */
    onSetDefault?: (modelId: string) => void;
    /**
     * The provider's full served-catalog candidates (`llm.models` for this
     * route): entries missing from the profile array render as disabled rows
     * that an eye-click re-enables. Presence in the profile array IS the
     * enabled state — pi-ai serves exactly what the array lists (or its whole
     * catalog when the array is absent).
     */
    catalogModels?: readonly {
        id: string;
        name?: string;
    }[];
}
/** The bucket an id with no derivable family lands in (sorts last). */
export declare const UNGROUPED_MODEL_GROUP_KEY = "__ungrouped__";
/**
 * Cherry's group derivation: a slash-prefixed id uses its provider segment
 * (`openai/gpt-4o` → `openai`); a flat id uses the family before the first
 * dash (`deepseek-v4-pro` → `deepseek`). An id that yields no family (a bare
 * `glm`) lands in the trailing ungrouped bucket.
 * @param id - the model id as configured.
 * @returns the group name, or `undefined` for the ungrouped bucket.
 */
export declare function modelGroupName(id: string): string | undefined;
/**
 * Render the model list with its fetch action.
 * @param props - the drafted rows, probe target, wire face, and copy.
 * @returns the model-list editor.
 */
export declare function ModelListEditor(props: ModelListEditorProps): ReactNode;
//# sourceMappingURL=ModelListEditor.d.ts.map