import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'

const methods: ReadonlyArray<{ method: string; parameters: string[] }> = [
  { method: 'status', parameters: [] },
  { method: 'start', parameters: [] },
  { method: 'stop', parameters: [] },
]

/** Client descriptor contribution for the Control Center gateway service. */
const gatewayRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterGateway/${method}`,
    service: 'controlCenterGateway',
    namespace: 'controlCenterGateway',
    method,
    invocation: { kind: 'direct' },
    parameters: parameters.map((name) => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON,
  })),
}

export default gatewayRemote
