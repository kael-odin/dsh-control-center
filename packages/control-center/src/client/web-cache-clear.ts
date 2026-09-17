/**
 * 清除缓存 (Cherry DataSettings parity, Data §clear_cache): clears the
 * browser-side caches the Control Center surface accumulates — CacheStorage
 * entries and sessionStorage — while deliberately leaving localStorage
 * settings keys (`cc.settings.*`, `cc.backup.*`, `cc.painting.prompts`, …)
 * untouched: those are user configuration, not cache.
 *
 * Pure-ish module: storage handles are injected so the behavior is testable
 * in jsdom and honest about failures (a denied CacheStorage never pretends
 * to have been cleared).
 */

export interface CacheClearReport {
  /** CacheStorage entries deleted. */
  caches: number
  /** sessionStorage keys removed. */
  sessionStorageKeys: number
}

export interface WebCacheHandles {
  caches?: (
    | {
        keys(): Promise<readonly string[]>
        delete(name: string): Promise<boolean>
      }
    | undefined
  )
  sessionStorage?: (
    | {
        length: number
        key(index: number): string | null
        removeItem(key: string): void
      }
    | undefined
  )
}

export async function clearWebCaches(handles: WebCacheHandles): Promise<CacheClearReport> {
  const report: CacheClearReport = { caches: 0, sessionStorageKeys: 0 }
  if (handles.caches !== undefined) {
    try {
      const names = await handles.caches.keys()
      for (const name of names) {
        if (await handles.caches.delete(name)) report.caches += 1
      }
    } catch { /* CacheStorage unavailable or denied — reported as 0, not faked */ }
  }
  const session = handles.sessionStorage
  if (session !== undefined) {
    for (let i = session.length - 1; i >= 0; i -= 1) {
      const key = session.key(i)
      if (key === null) continue
      session.removeItem(key)
      report.sessionStorageKeys += 1
    }
  }
  return report
}
