import { describe, expect, it } from 'vitest'
import z from '@deepseek-ai/schemastery'
import { auditSecretSchema, assertSecretSchemaSafe } from '../src/secret-schema.ts'

describe('secret schema audit', () => {
  it('accepts secrets reachable through object, dict, and array containers', () => {
    const schema = z.object({
      direct: z.string().role('secret'),
      providers: z.dict(z.object({ key: z.string().role('secret') })),
      fallbacks: z.array(z.object({ key: z.string().role('secret') })),
      opaque: z.object({ nested: z.string() }).role('secret'),
    })
    expect(auditSecretSchema(schema)).toEqual([])
    expect(auditSecretSchema(schema.toJSON())).toEqual([])
  })

  it('rejects secret descendants behind unsupported wrappers', () => {
    const union = z.object({ credential: z.union([
      z.object({ key: z.string().role('secret') }),
      z.object({ token: z.string() }),
    ]) })
    expect(auditSecretSchema(union)).toEqual([{ path: ['credential'], type: 'union' }])
    expect(() => assertSecretSchemaSafe('unsafe-provider', union.toJSON()))
      .toThrow('credential (union)')
  })
})
