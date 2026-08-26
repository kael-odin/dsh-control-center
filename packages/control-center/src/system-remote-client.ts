import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'

type SystemMethod = { method: string; parameters: string[] }
const methods: ReadonlyArray<SystemMethod> = [
  { method: 'getInfo', parameters: [] },
  { method: 'listDependencies', parameters: [] },
  { method: 'checkDependencies', parameters: [] },
  { method: 'listPlugins', parameters: ['profile'] },
  { method: 'managePlugin', parameters: ['profile', 'operation', 'spec'] },
  { method: 'collectDiagnosticLogs', parameters: [] },
  { method: 'listCodeClis', parameters: [] },
]

/** Client descriptor contribution for the Control Center system service. */
const systemRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterSystem/${method}`,
    service: 'controlCenterSystem',
    namespace: 'controlCenterSystem',
    method,
    invocation: { kind: 'direct' },
    parameters: parameters.map((name) => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON
  }))
}

export default systemRemote
