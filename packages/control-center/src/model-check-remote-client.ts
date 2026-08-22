import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'
import type { ModelCheckResult } from './model-check.ts'

const methods: ReadonlyArray<{ method: string; parameters: string[] }> = [
  { method: 'check', parameters: ['provider', 'model'] },
]

/** Client descriptor contribution for the Control Center model-check service. */
const modelCheckRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterModelCheck/${method}`,
    service: 'controlCenterModelCheck',
    namespace: 'controlCenterModelCheck',
    method,
    invocation: { kind: 'direct' },
    parameters: parameters.map((name) => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON
  }))
}

export default modelCheckRemote

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    controlCenterModelCheck: {
      check(provider: string, model: string): Promise<{ ok: true; value: ModelCheckResult } | { ok: false; error: { code: string; message: string; details: object } }>
    }
  }
}
