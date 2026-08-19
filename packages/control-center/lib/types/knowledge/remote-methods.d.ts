/**
 * Apply `Remote(exportName)` method markers to a service instance for every
 * (method, exportName) pair. The external build cannot lower `@Remote`
 * decorators, so the host calls this after constructing the service.
 * @param instance - service instance whose prototype methods get marked.
 * @param entries - (prototype method name, wire export name) pairs.
 */
export declare function markRemoteMethods(instance: object, entries: ReadonlyArray<readonly [string, string]>): void;
//# sourceMappingURL=remote-methods.d.ts.map