/** Manual Typert remote markers for external builds that cannot lower `@Remote` decorators. */
import { Remote } from '@deepseek-ai/dsh-typert-protocol'

/**
 * Apply `Remote(exportName)` method markers to a service instance for every
 * (method, exportName) pair. The external build cannot lower `@Remote`
 * decorators, so the host calls this after constructing the service.
 * @param instance - service instance whose prototype methods get marked.
 * @param entries - (prototype method name, wire export name) pairs.
 */
export function markRemoteMethods(
  instance: object,
  entries: ReadonlyArray<readonly [string, string]>,
): void {
  const initializers: Array<(this: object) => void> = []
  const prototype = Object.getPrototypeOf(instance) as object
  for (const [method, exportName] of entries) {
    const implementation = Reflect.get(prototype, method) as (this: unknown, ...args: never[]) => unknown
    const decorator = Remote(exportName as never)
    decorator(implementation, {
      kind: 'method', name: method, static: false, private: false,
      access: { has: value => method in value, get: value => Reflect.get(value, method) as never },
      addInitializer: initializer => { initializers.push(initializer) },
      metadata: undefined,
    })
  }
  for (const initialize of initializers) initialize.call(instance)
}
