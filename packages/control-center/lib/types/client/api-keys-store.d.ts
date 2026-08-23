/**
 * Multi-API-key management per provider — Cherry ProviderApiKeyListDrawer +
 * ProviderService.resolveApiKey parity.
 *
 * Cherry stores `apiKeys[{id,key,label,isEnabled}]` on the provider row and
 * rotates round-robin per request. The DSH adapter resolves exactly ONE
 * credential ref per request through the credentials seam, so this port keeps
 * the user-facing model (a labeled, individually toggleable key list) with one
 * honest difference stated in the drawer copy: the FIRST ENABLED slot stays
 * bound to the provider's `apiKeyEnv`; per-request rotation is not
 * configurable here.
 *
 * Secrets never touch settings.yaml: values live only in the DSH credentials
 * document under derived slot refs; the metadata namespace
 * (`control-center-api-keys`) carries labels and enable flags alone.
 */
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client';
import type { SettingsSchemaOperations } from './schema-operations.ts';
export declare const API_KEYS_NAMESPACE = "control-center-api-keys";
/** One managed key slot: a credential ref plus its user-facing metadata. */
export interface ApiKeySlot {
    readonly ref: string;
    readonly label: string;
    readonly isEnabled: boolean;
}
/** One slot joined with live credential state and binding facts. */
export interface ApiKeySlotView extends ApiKeySlot {
    configured: boolean;
    writable: boolean;
    active: boolean;
}
/** What {@link ApiKeysController.load} answers. */
export interface ApiKeysState {
    slots: readonly ApiKeySlotView[];
    /** Ref currently bound to the profile's apiKeyEnv ('' when none). */
    boundRef: string;
    /** Metadata namespace revision at load time (null = namespace absent). */
    keysRevision: number | null;
    /** Provider-profile namespace revision at load time. */
    profileRevision: number | null;
}
/** Derive the nth slot credential ref from the provider's base ref. */
export declare function slotRefOf(baseRef: string, slot: number): string;
/** Read one provider's persisted slots; tolerates junk sections. */
export declare function readSlots(value: unknown, schema: Pick<SettingsSchemaOperations, 'getPath'>, providerId: string): readonly ApiKeySlot[];
/** The next free slot number above every existing numbered slot. */
export declare function nextSlotNumber(slots: readonly ApiKeySlot[]): number;
/** Cherry resolveApiKey rule: the FIRST ENABLED slot serves the provider. */
export declare function firstEnabledRef(slots: readonly ApiKeySlot[]): string | undefined;
/** Wire faces the controller needs — what the provider editor page holds. */
export interface ApiKeysDeps {
    api: Pick<IApiClient, 'settings' | 'credentials'>;
    schema: Pick<SettingsSchemaOperations, 'getPath'>;
    /** Live view of the profile namespace (value + revision). */
    namespaceValue: unknown;
    namespaceRevision: number;
    /** Path of the provider profile inside its namespace. */
    settingsPath: readonly string[];
    /** The profile's current credential ref (empty when unset). */
    baseRef: string;
    /** Provider id (metadata key). */
    providerId: string;
}
/**
 * The multi-key controller. Every operation runs load, mutate, then rebind so
 * revisions stay authoritative; each returns an error message or undefined.
 */
export declare class ApiKeysController {
    private readonly deps;
    constructor(deps: ApiKeysDeps);
    /** Load slots joined with credential state and the active binding. */
    load(): Promise<ApiKeysState>;
    /** Rebind the profile's apiKeyEnv to the first enabled slot. */
    private rebind;
    /** Persist the metadata section. */
    private saveSlots;
    /** Shared shape: load fresh state, hand plain slots to the step. */
    private run;
    /** Add one key into the next free slot, then apply the binding rule. */
    add(key: string, label: string): Promise<string | undefined>;
    /** Toggle one slot's enabled flag, then apply the binding rule. */
    setEnabled(ref: string, isEnabled: boolean): Promise<string | undefined>;
    /** Rename one slot's label. */
    setLabel(ref: string, label: string): Promise<string | undefined>;
    /** Replace one slot's stored key value. */
    replaceValue(ref: string, key: string): Promise<string | undefined>;
    /** Remove one slot: credential first (retryable), then metadata, then rebind. */
    remove(ref: string): Promise<string | undefined>;
}
//# sourceMappingURL=api-keys-store.d.ts.map