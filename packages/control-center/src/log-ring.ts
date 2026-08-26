/**
 * Plugin-side diagnostic log ring (About 诊断日志包 third source). The DSH
 * host logs to stdout only, so a support bundle cannot read host files; the
 * next best source is the plugin's own view of every logger call it makes.
 * A module-level ring keeps the last N entries; the system page drains it
 * into the downloadable diagnostic bundle.
 */

export interface PluginLogEntry {
  time: string
  level: string
  message: string
}

/** Minimal structural logger — avoids importing cordis types into a leaf module. */
interface LoggerLike {
  debug?: (...parts: unknown[]) => void
  info?: (...parts: unknown[]) => void
  warn?: (...parts: unknown[]) => void
  error?: (...parts: unknown[]) => void
}

const RING_CAPACITY = 500
const ring: PluginLogEntry[] = []

/** Mirror one logger call into the ring. Long payloads are truncated. */
export function recordPluginLog(level: string, parts: unknown[]): void {
  const message = parts
    .map(part => {
      if (typeof part === 'string') return part
      try { return JSON.stringify(part) } catch { return String(part) }
    })
    .join(' ')
    .slice(0, 2_000)
  ring.push({ time: new Date().toISOString(), level, message })
  if (ring.length > RING_CAPACITY) ring.splice(0, ring.length - RING_CAPACITY)
}

/** Newest-last copy of the ring for the diagnostic bundle. */
export function drainPluginLogs(): PluginLogEntry[] {
  return [...ring]
}

/**
 * Wrap the context logger so every debug/info/warn/error the plugin emits is
 * mirrored into the ring. The original methods still run first — this is a
 * tap, never a replacement.
 */
export function installLogRing(ctx: { logger: LoggerLike }): void {
  const logger = ctx.logger as unknown as Record<string, ((...parts: unknown[]) => void) | undefined>
  if (typeof logger !== 'object' || logger === null) return
  for (const level of ['debug', 'info', 'warn', 'error']) {
    const original = logger[level]
    if (typeof original !== 'function') continue
    logger[level] = (...parts: unknown[]): void => {
      original.apply(logger, parts)
      recordPluginLog(level, parts)
    }
  }
}
