/**
 * Settings namespace id branding. DSH 0.1.6 removed the runtime
 * `settingsNamespace()` helper from `@deepseek-ai/dsh-settings` (namespaces
 * are plain pattern-checked strings at the register seam now), but the wire
 * vocabulary is unchanged, so this keeps the plugin's call sites honest with
 * the same validation the old helper performed.
 */
import type { SettingsNamespace } from '@deepseek-ai/dsh-settings'

const NAMESPACE_PATTERN = /^[a-z][a-z0-9-]*$/

/** Validate and brand one settings namespace id. */
export function settingsNamespace(value: string): SettingsNamespace {
  if (!NAMESPACE_PATTERN.test(value)) {
    throw new TypeError(`settings namespace "${value}" must match ${String(NAMESPACE_PATTERN)}`)
  }
  return value as SettingsNamespace
}
