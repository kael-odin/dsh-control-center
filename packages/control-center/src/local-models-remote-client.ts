import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'

const localModelsMethods: ReadonlyArray<{ method: string; parameters: string[] }> = [
  { method: 'listServers', parameters: [] },
  { method: 'addServer', parameters: ['input'] },
  { method: 'removeServer', parameters: ['serverId'] },
  { method: 'discoverModels', parameters: ['serverId'] }
]

const updateMethods: ReadonlyArray<{ method: string; parameters: string[] }> = [
  { method: 'checkForUpdates', parameters: [] },
  { method: 'listReleases', parameters: [] },
]

function descriptors(methods: ReadonlyArray<{ method: string; parameters: string[] }>, namespace: string): TypertRemoteContribution['descriptors'] {
  return methods.map(({ method, parameters }) => ({
    id: `@dsh-control-center/control-center#${namespace}/${method}`,
    service: namespace,
    namespace,
    method,
    invocation: { kind: 'direct' },
    parameters: parameters.map((name) => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON
  }))
}

/** Client descriptor contributions for local models + update services. */
const localModelsRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: descriptors(localModelsMethods, 'controlCenterLocalModels'),
}

const updateRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: descriptors(updateMethods, 'controlCenterUpdate'),
}

export { localModelsRemote, updateRemote }
