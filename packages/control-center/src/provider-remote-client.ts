import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'

const methods: ReadonlyArray<{ method: string; implementation?: string; parameters: string[] }> = [
  { method: 'list', parameters: [] },
  { method: 'get', parameters: ['providerId'] },
  { method: 'create', parameters: ['dto'] },
  { method: 'update', parameters: ['providerId', 'dto'] },
  { method: 'delete', parameters: ['providerId'] },
  { method: 'testConnection', parameters: ['providerId'] },
  { method: 'discoverModels', parameters: ['providerId'] },
  { method: 'updateModel', parameters: ['providerId', 'modelId', 'dto'] }
]

/** Client descriptor contribution for the Control Center providers service. */
const providersRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, implementation, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterProviders/${method}`,
    service: 'controlCenterProviders',
    namespace: 'controlCenterProviders',
    method,
    ...(implementation === undefined ? {} : { implementation }),
    invocation: { kind: 'direct' },
    parameters: parameters.map((name) => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON
  }))
}

export default providersRemote
