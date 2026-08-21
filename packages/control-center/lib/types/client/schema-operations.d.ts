/**
 * Plain schema callbacks for Control Center stores and presentation
 * components, adapted from the DSH rc.8 `ui-settings` service API.
 *
 * rc.8 moved the former `dsh-client-schema-form` helper functions into the
 * `ctx.settingsSchema` Cordis service. This module mirrors the harness's own
 * `ui-settings-models/schema-operations.ts` convention: hide the service
 * identity behind bound callbacks so React components never see the Cordis
 * context, while staying source-compatible with the rc.7 helper signatures
 * the Control Center pages already use.
 */
import type { SettingsSchemaService } from '@deepseek-ai/dsh-client-ui-settings/client';
/** Schema introspection and immutable settings-draft edits. */
export type SettingsSchemaOperations = Pick<SettingsSchemaService, 'rehydrate' | 'validate' | 'nodeAtPath' | 'getPath' | 'hasPath' | 'setPath' | 'deletePath'>;
/**
 * Bind the settings-owned schema service to plain callbacks.
 * @param service - settings-owned schema service available in the apply context.
 * @returns callbacks that cannot expose the service context to React components.
 */
export declare function createSettingsSchemaOperations(service: SettingsSchemaService): SettingsSchemaOperations;
//# sourceMappingURL=schema-operations.d.ts.map