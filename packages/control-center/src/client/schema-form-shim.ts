/**
 * Inline schema-form helpers to avoid bundler path issues.
 * Copied from apps/desktop/.materialized/harness/packages/client/schema-form/lib/index.js
 */

/** Rehydrate a serialized schema envelope. */
export function rehydrateSchema(serialized: unknown): unknown {
  // Dynamic import not needed - schemastery bundled with platform
  const Schema = require('@deepseek-ai/schemastery').default
  return new Schema(serialized)
}

/** Validate a draft against a rehydrated schema. */
export function validateDraft(schema: unknown, draft: unknown): string | undefined {
  try {
    ;(schema as CallableFunction)(draft)
    return undefined
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

/** Resolve the schema node at a settings path. */
export function nodeAtPath(root: unknown, path: string[]): unknown {
  let node: any = root
  for (const key of path) {
    if (node === undefined) return undefined
    if (node.type === 'object') node = node.dict?.[key]
    else if (node.type === 'dict' || node.type === 'array') node = node.inner
    else return undefined
  }
  return node
}

/** Read a nested value by path. */
export function getPath(value: unknown, path: string[]): unknown {
  let current: any = value
  for (const key of path) {
    if (Array.isArray(current)) {
      current = current[Number(key)]
      continue
    }
    if (typeof current !== 'object' || current === null) return undefined
    current = current[key]
  }
  return current
}

/** Whether a draft explicitly carries the path. */
export function hasPath(value: unknown, path: string[]): boolean {
  if (path.length === 0) return value !== undefined
  const parent = getPath(value, path.slice(0, -1))
  const key = path[path.length - 1]!
  if (Array.isArray(parent)) return Number(key) < parent.length
  if (typeof parent !== 'object' || parent === null) return false
  return key in parent
}

function cloneContainer(container: unknown, key: string): any {
  if (Array.isArray(container)) return [...container]
  if (typeof container === 'object' && container !== null) return { ...container }
  return /^\d+$/.test(key) ? [] : {}
}

function cloneSpine(root: Record<string, unknown>, path: string[]): {
  result: Record<string, unknown>
  parent: any
  leaf: string
} {
  const result = { ...root }
  let target: any = result
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!
    const child = cloneContainer(
      Array.isArray(target) ? target[Number(key)] : target[key],
      path[i + 1]!,
    )
    if (Array.isArray(target)) target[Number(key)] = child
    else target[key] = child
    target = child
  }
  return {
    result,
    parent: target,
    leaf: path[path.length - 1]!,
  }
}

/** Immutably set a nested value. */
export function setPath(root: Record<string, unknown>, path: string[], value: unknown): unknown {
  if (path.length === 0) throw new Error('schema-form: setPath needs a non-empty path')
  const { result, parent, leaf } = cloneSpine(root, path)
  if (Array.isArray(parent)) parent[Number(leaf)] = value
  else parent[leaf] = value
  return result
}

/** Immutably remove a nested key. */
export function deletePath(root: Record<string, unknown>, path: string[]): unknown {
  if (path.length === 0) throw new Error('schema-form: deletePath needs a non-empty path')
  if (!hasPath(root, path)) return root
  const { result, parent, leaf } = cloneSpine(root, path)
  if (Array.isArray(parent)) parent.splice(Number(leaf), 1)
  else Reflect.deleteProperty(parent, leaf)
  return result
}
