/**
 * Extract an npx MCP config sample from a package README — ported from
 * Cherry Studio `src/renderer/utils/mcp.ts getMcpConfigSampleFromReadme`.
 *
 * Scans for a `"mcpServers": { ... }` JSON block (one nesting level deep),
 * takes its first entry, and accepts it only when the command is `npx` — the
 * one shape our stdio installer can serve directly.
 */

export interface McpConfigSample {
  command: string
  args?: string[]
  env?: Record<string, string>
}

export function getMcpConfigSampleFromReadme(readme: string): McpConfigSample | null {
  if (readme.length === 0) return null
  try {
    const regex = /"mcpServers"\s*:\s*({(?:[^{}]*|{(?:[^{}]*|{[^{}]*})*})*})/g
    for (const match of readme.matchAll(regex)) {
      let sample = JSON.parse(match[1] ?? '{}') as Record<string, unknown>
      const firstKey = Object.keys(sample)[0]
      if (firstKey === undefined) continue
      sample = (sample[firstKey] ?? {}) as Record<string, unknown>
      if ((sample as { command?: unknown }).command === 'npx') {
        return {
          command: 'npx',
          ...(Array.isArray(sample.args) ? { args: sample.args.filter((a): a is string => typeof a === 'string') } : {}),
          ...(typeof sample.env === 'object' && sample.env !== null && !Array.isArray(sample.env)
            ? {
                env: Object.fromEntries(
                  Object.entries(sample.env as Record<string, unknown>)
                    .flatMap(([k, v]): Array<[string, string]> => typeof v === 'string' ? [[k, v]] : []),
                ),
              }
            : {}),
        }
      }
    }
  } catch {
    // Malformed README JSON is normal across npm; fall through to null.
  }
  return null
}
