/** Safe projections for file-processing settings and legacy secret cleanup. */

import type { FileProcessorOverride, FileProcessorOverrideView } from './file-processing-types.ts'

/** Remove legacy API key values from one processor override. */
export function stripProcessorSecrets(override: FileProcessorOverride | undefined): FileProcessorOverrideView | undefined {
  if (override === undefined) return undefined
  const { apiKeys: _apiKeys, ...safe } = override
  return safe
}

/** Remove every legacy API key array from a file-processing settings record. */
export function stripFileProcessingSecrets(value: unknown): object {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
  const input = value as Record<string, unknown>
  const rawOverrides = input.overrides
  const overrides = typeof rawOverrides === 'object' && rawOverrides !== null && !Array.isArray(rawOverrides)
    ? Object.fromEntries(Object.entries(rawOverrides as Record<string, unknown>).map(([processor, raw]) => {
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return [processor, {}]
        return [processor, stripProcessorSecrets(raw as FileProcessorOverride) ?? {}]
      }))
    : {}
  return { ...input, overrides }
}
