/**
 * Host-side reader for the Cherry 重试设置 persisted in the shared
 * `control-center-model-prefs` namespace.
 *
 * The namespace is owned (registered) by the plugin entry, and duplicate
 * registration fails loud, so consumer services peek through
 * `settings.describe()` — the same pattern the channel bridge already uses
 * for `agent-default-model`. Reading live means a settings edit reaches the
 * next call without a restart; a missing settings service (standalone-service
 * tests) simply disables retry.
 */

/** Cherry 重试设置 facts one host-side call honors. */
export interface HostRetryPolicy {
  readonly enabled: boolean
  readonly maxAttempts: number
  readonly backoff: boolean
  readonly fallbacks: ReadonlyArray<{ readonly provider: string; readonly model: string }>
}

export const NO_RETRY_POLICY: HostRetryPolicy = { enabled: false, maxAttempts: 0, backoff: true, fallbacks: [] }

/** Minimal describe() surface the reader needs. */
export interface RetrySettingsSource {
  describe(): unknown
}

/** Read the persisted retry config; anything malformed disables retry. */
export function readHostRetryPolicy(settings: RetrySettingsSource | undefined): HostRetryPolicy {
  if (settings === undefined) return NO_RETRY_POLICY
  try {
    const described = settings.describe() as Array<{ ns?: unknown; value?: unknown }>
    const found = described.find(entry => String(entry.ns) === 'control-center-model-prefs')
    const value = found?.value
    if (typeof value !== 'object' || value === null) return NO_RETRY_POLICY
    const record = value as Record<string, unknown>
    const rawFallbacks = Array.isArray(record.retryFallbacks) ? record.retryFallbacks : []
    return {
      enabled: record.retryEnabled === true,
      maxAttempts: typeof record.retryMaxAttempts === 'number' && Number.isSafeInteger(record.retryMaxAttempts)
        && record.retryMaxAttempts >= 1 && record.retryMaxAttempts <= 10
        ? record.retryMaxAttempts
        : 3,
      backoff: record.retryBackoff !== false,
      fallbacks: rawFallbacks.flatMap((entry): Array<{ provider: string; model: string }> => {
        if (typeof entry !== 'object' || entry === null) return []
        const provider = (entry as Record<string, unknown>).provider
        const model = (entry as Record<string, unknown>).model
        if (typeof provider !== 'string' || provider.length === 0) return []
        if (typeof model !== 'string' || model.length === 0) return []
        return [{ provider, model }]
      }),
    }
  } catch {
    return NO_RETRY_POLICY
  }
}
