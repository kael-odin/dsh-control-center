/** Resolve a configured DSH provider's endpoint and credential through the same authority the Models page reads. */
import type { SettingsProvider } from '@deepseek-ai/dsh-settings'
import type { CredentialProvider } from '@deepseek-ai/dsh-credentials'
import type { LlmRuntime } from '@deepseek-ai/dsh-llm'
import { getPath } from '@deepseek-ai/dsh-client-schema-form'

/** Provider profile value: a plain object with optional endpoint and key-ref. */
interface ProviderProfile {
  baseURL?: unknown
  apiKeyEnv?: unknown
}

function providerProfile(settings: SettingsProvider, ns: string, path: readonly string[]): ProviderProfile {
  const view = settings.describe().find(candidate => candidate.ns === ns)
  const raw = view === undefined ? undefined : getPath(view.value, path)
  return (typeof raw === 'object' && raw !== null ? raw : {}) as ProviderProfile
}

/** A provider route that is fully configured: display name, endpoint, and its settings identity. */
export interface ResolvedProvider {
  name: string
  baseURL: string
  settingsNs: string
  settingsPath: readonly string[]
}

/**
 * Resolve a configured provider's endpoint from settings through the same
 * authority the Models page reads.
 */
export async function resolveProvider(
  settings: SettingsProvider,
  llm: LlmRuntime,
  providerId: string,
): Promise<ResolvedProvider> {
  const directory = llm.listConfigurableProviders()
  const entry = directory.find(candidate => candidate.provider === providerId)
  if (entry === undefined) throw new Error(`provider "${providerId}" has no configurable route`)
  const settingsNs = entry.settingsNs
  const settingsPath = [...entry.settingsPath]
  const baseURLValue = providerProfile(settings, settingsNs, settingsPath).baseURL
  const baseURL = typeof baseURLValue === 'string' && baseURLValue.trim().length > 0
    ? baseURLValue.trim().replace(/\/$/, '')
    : undefined
  if (baseURL === undefined) throw new Error(`provider "${providerId}" has no endpoint configured`)
  return { name: entry.displayName, baseURL, settingsNs, settingsPath }
}

/**
 * Get the provider credential value through the DSH credentials authority.
 * @returns the resolved secret value, or '' when unconfigured.
 */
export async function resolveKey(
  settings: SettingsProvider,
  credentials: CredentialProvider,
  providerId: string,
  ns: string,
  path: readonly string[],
): Promise<string> {
  const refName = providerProfile(settings, ns, path).apiKeyEnv
  if (typeof refName !== 'string' || refName.length === 0) return ''
  const resolved = await credentials.resolve(refName as never)
  if (resolved === undefined) throw new Error(`provider "${providerId}" has no credential configured for ${refName}`)
  return resolved.value.trim()
}
