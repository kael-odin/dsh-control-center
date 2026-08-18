import { useSyncExternalStore } from 'react'

export interface SnapshotStore<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
  update(recipe: (draft: T) => void): void
}

export function createSnapshotStore<T>(initial: T): SnapshotStore<T> {
  let value = structuredClone(initial)
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => value,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener) } },
    update(recipe) {
      const next = structuredClone(value)
      recipe(next)
      value = next
      for (const listener of listeners) listener()
    },
  }
}

export function bindSnapshotSelector<T>(store: SnapshotStore<T>) {
  return <S>(selector: (state: T) => S): S => useSyncExternalStore(
    store.subscribe,
    () => selector(store.getSnapshot()),
  )
}
