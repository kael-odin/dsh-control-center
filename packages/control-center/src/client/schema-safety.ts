/** Browser-side fail-closed gate for settings namespaces used by Provider editors. */
import Schema from '@deepseek-ai/schemastery'
import type { SettingsNamespaceView } from '@deepseek-ai/dsh-api-remotes/client'
import { assertSecretSchemaSafe } from '../secret-schema.ts'

/** Reject a wire descriptor whose secret descendants use unsupported wrappers. */
export function assertProviderSchemasSafe(views: readonly SettingsNamespaceView[]): void {
  for (const view of views) {
    if (view.ns !== 'llm-deepseek' && view.ns !== 'llm-pi-ai' && view.ns !== 'agent-default-model') continue
    assertSecretSchemaSafe(view.ns, new Schema(view.schema as Schema))
  }
}
