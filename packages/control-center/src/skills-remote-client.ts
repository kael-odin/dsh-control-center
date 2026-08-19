import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'

const methods: ReadonlyArray<{ method: string; implementation?: string; parameters: string[] }> = [
  { method: 'list', parameters: ['query'] },
  { method: 'getById', parameters: ['skillId'] },
  { method: 'update', parameters: ['skillId', 'dto'] },
  { method: 'install', parameters: ['options'] },
  { method: 'uninstall', parameters: ['skillId'] },
  { method: 'searchMarketplace', parameters: ['query'] }
]

/** Client descriptor contribution for the Control Center skills service. */
const skillsRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, implementation, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterSkills/${method}`,
    service: 'controlCenterSkills',
    namespace: 'controlCenterSkills',
    method,
    ...(implementation === undefined ? {} : { implementation }),
    invocation: { kind: 'direct' },
    parameters: parameters.map((name) => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON
  }))
}

export default skillsRemote
