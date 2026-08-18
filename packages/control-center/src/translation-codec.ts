import type { TypertCodec, TypertSchema } from '@deepseek-ai/dsh-typert-protocol'

const jsonSchema: TypertSchema = {
  parse(value: unknown): unknown {
    structuredClone(value)
    return value
  },
}

export const STRICT_JSON: TypertCodec = {
  mode: 'strict',
  typeSymbol: '@dsh-control-center/json',
  schema: jsonSchema,
}
