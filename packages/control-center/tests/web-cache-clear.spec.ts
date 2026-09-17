import { describe, expect, it } from 'vitest'
import { clearWebCaches } from '../src/client/web-cache-clear.ts'

function memoryStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed))
  return {
    length: data.size,
    key(index: number): string | null {
      return [...data.keys()][index] ?? null
    },
    removeItem(key: string): void { data.delete(key) },
    _data: data,
  }
}

describe('clearWebCaches', () => {
  it('deletes every CacheStorage entry and counts them', async () => {
    const deleted: string[] = []
    const handles = {
      caches: {
        keys: async () => ['a', 'b'],
        delete: async (name: string) => { deleted.push(name); return true },
      },
    }
    const report = await clearWebCaches(handles)
    expect(report.caches).toBe(2)
    expect(deleted).toEqual(['a', 'b'])
  })

  it('clears sessionStorage keys without touching settings storage', async () => {
    const session = memoryStorage({ 'transient': '1' })
    const report = await clearWebCaches({ sessionStorage: session })
    expect(report.sessionStorageKeys).toBe(1)
    expect(session._data.size).toBe(0)
  })

  it('reports zero honestly when CacheStorage is unavailable or denied', async () => {
    const report = await clearWebCaches({
      caches: {
        keys: async () => { throw new Error('denied') },
        delete: async () => false,
      },
    })
    expect(report.caches).toBe(0)
  })

  it('does nothing and reports zeros with no handles at all', async () => {
    expect(await clearWebCaches({})).toEqual({ caches: 0, sessionStorageKeys: 0 })
  })
})
