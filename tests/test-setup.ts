/**
 * Test bootstrap: Node 23+ exposes its own inert `localStorage` global, which
 * shadows jsdom's origin-backed Storage inside the vitest jsdom environment.
 * Whenever the exposed object lacks the Storage methods, install a functional
 * in-memory stand-in so specs exercise real storage semantics.
 */
const existing = globalThis.localStorage as Storage | undefined
if (existing === undefined || typeof existing.clear !== 'function') {
  const data = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => (data.has(key) ? (data.get(key) as string) : null),
      setItem: (key: string, value: string) => { data.set(key, String(value)) },
      removeItem: (key: string) => { data.delete(key) },
      clear: () => { data.clear() },
      key: (index: number) => [...data.keys()][index] ?? null,
      get length() { return data.size },
    },
  })
}
