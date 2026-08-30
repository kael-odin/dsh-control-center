import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON_KNOWLEDGE } from './knowledge-codec.ts'

const methods: ReadonlyArray<{ method: string; implementation?: string; parameters: string[] }> = [
  { method: 'listBases', parameters: [] },
  { method: 'createBase', parameters: ['request'] },
  { method: 'getBase', parameters: ['baseId'] },
  { method: 'deleteBase', parameters: ['baseId'] },
  { method: 'renameBase', parameters: ['baseId', 'name'] },
  { method: 'getBaseConfig', parameters: ['baseId'] },
  { method: 'setBaseConfig', parameters: ['baseId', 'config'] },
  { method: 'addText', parameters: ['request'] },
  { method: 'addUrl', parameters: ['request'] },
  { method: 'addFile', parameters: ['request'] },
  { method: 'addDirectory', parameters: ['request'] },
  { method: 'addNotesSource', parameters: ['request'] },
  { method: 'syncNotesSource', parameters: ['request'] },
  { method: 'listSources', parameters: ['baseId'] },
  { method: 'deleteSource', parameters: ['baseId', 'sourceId'] },
  { method: 'indexBase', parameters: ['baseId'] },
  { method: 'listChunks', parameters: ['baseId', 'cursor', 'limit'] },
  { method: 'retrieve', parameters: ['request'] },
]

/** Client descriptor contribution for the Control Center knowledge service. */
const knowledgeRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, implementation, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterKnowledge/${method}`,
    service: 'controlCenterKnowledge',
    namespace: 'controlCenterKnowledge',
    method,
    ...(implementation === undefined ? {} : { implementation }),
    invocation: { kind: 'direct' },
    parameters: parameters.map(name => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON_KNOWLEDGE })),
    result: STRICT_JSON_KNOWLEDGE,
  })),
}

export default knowledgeRemote
