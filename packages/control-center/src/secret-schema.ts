/** Fail-closed audit for settings schemas that contain secret-role nodes. */

interface SchemaNode {
  type?: string
  meta?: { role?: unknown }
  dict?: Record<string, SchemaNode>
  inner?: SchemaNode
  list?: SchemaNode[]
  uid?: number
  refs?: Record<string, SchemaNode | number>
}

export interface SecretSchemaViolation {
  path: string[]
  type: string
}

const SAFE_CONTAINERS = new Set(['object', 'dict', 'array'])
const UNSUPPORTED_CONTAINERS = new Set(['union', 'intersect', 'transform', 'tuple', 'lazy'])

function containsSecret(node: SchemaNode | undefined, seen = new Set<SchemaNode>()): boolean {
  if (node === undefined || seen.has(node)) return false
  seen.add(node)
  if (node.meta?.role === 'secret') return true
  for (const child of Object.values(node.dict ?? {})) {
    if (containsSecret(child, seen)) return true
  }
  if (containsSecret(node.inner, seen)) return true
  return (node.list ?? []).some(child => containsSecret(child, seen))
}

function audit(
  node: SchemaNode | undefined,
  path: string[],
  violations: SecretSchemaViolation[],
  seen: Set<SchemaNode>,
): void {
  if (node === undefined || seen.has(node)) return
  seen.add(node)
  if (node.meta?.role === 'secret') return
  const type = node.type ?? 'unknown'
  if (UNSUPPORTED_CONTAINERS.has(type) && containsSecret(node)) {
    violations.push({ path, type })
    return
  }
  if (type === 'object') {
    for (const [key, child] of Object.entries(node.dict ?? {})) audit(child, [...path, key], violations, seen)
    return
  }
  if (type === 'dict' || type === 'array') {
    audit(node.inner, [...path, type === 'array' ? '*' : '{}'], violations, seen)
    return
  }
  if (SAFE_CONTAINERS.has(type)) return
  if (containsSecret(node)) violations.push({ path, type })
}

function rehydrateSerialized(schema: unknown): SchemaNode {
  const root = schema as SchemaNode
  if (root.refs === undefined || root.uid === undefined) return root
  const nodes = new Map<number, SchemaNode>()
  for (const [key, value] of Object.entries(root.refs)) {
    if (typeof value !== 'number') nodes.set(Number(key), { ...value })
  }
  const resolve = (value: SchemaNode | number | undefined): SchemaNode | undefined =>
    typeof value === 'number' ? nodes.get(value) : value
  for (const node of nodes.values()) {
    const inner = resolve(node.inner as SchemaNode | number | undefined)
    if (inner === undefined) delete node.inner
    else node.inner = inner
    const list = node.list?.map(entry => resolve(entry as SchemaNode | number) ?? {})
    if (list === undefined) delete node.list
    else node.list = list
    if (node.dict !== undefined) {
      node.dict = Object.fromEntries(Object.entries(node.dict).map(([key, value]) => [key, resolve(value as SchemaNode | number) ?? {}]))
    }
  }
  return nodes.get(root.uid) ?? root
}

/** Return unsupported wrapper locations that can hide secret-role descendants. */
export function auditSecretSchema(schema: unknown): SecretSchemaViolation[] {
  const violations: SecretSchemaViolation[] = []
  audit(rehydrateSerialized(schema), [], violations, new Set())
  return violations
}

/** Throw before a namespace with an unsafe secret schema is exposed by Control Center. */
export function assertSecretSchemaSafe(namespace: string, schema: unknown): void {
  const violations = auditSecretSchema(schema)
  if (violations.length === 0) return
  const detail = violations
    .map(violation => `${violation.path.length === 0 ? '<root>' : violation.path.join('.')} (${violation.type})`)
    .join(', ')
  throw new Error(
    `Control Center refuses settings namespace ${JSON.stringify(namespace)}: secret descendants pass through unsupported schema wrappers at ${detail}`,
  )
}
