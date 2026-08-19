import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'

const methods: ReadonlyArray<{ method: string; parameters: string[] }> = [
  { method: 'exportControlCenter', parameters: [] },
  { method: 'importControlCenter', parameters: ['snapshot'] },
  { method: 'clearControlCenter', parameters: [] },
  { method: 'exportToFile', parameters: ['path'] },
  { method: 'importFromFile', parameters: ['path'] }
]

/** Client descriptor contribution for the Control Center data service. */
const dataRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterData/${method}`,
    service: 'controlCenterData',
    namespace: 'controlCenterData',
    method,
    invocation: { kind: 'direct' },
    parameters: parameters.map((name) => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON
  }))
}

export default dataRemote
