/**
 * Local declaration for `use-sync-external-store`'s with-selector shim.
 *
 * The published `@types/use-sync-external-store` types cannot be resolved by
 * TypeScript 6 against the package's `exports` map for the
 * `shim/with-selector.js` subpath (the same resolution ui-renderer performs
 * internally). Control Center declares the one member it uses, matching the
 * upstream shim signature.
 */
declare module 'use-sync-external-store/shim/with-selector.js' {
  export function useSyncExternalStoreWithSelector<Snapshot, Selection>(
    subscribe: (onStoreChange: () => void) => () => void,
    getSnapshot: () => Snapshot,
    getServerSnapshot: undefined | (() => Snapshot),
    selector: (snapshot: Snapshot) => Selection,
    isEqual?: (a: Selection, b: Selection) => boolean,
  ): Selection
}
