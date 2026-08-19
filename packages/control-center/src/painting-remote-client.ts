import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON_PAINTING } from './painting-codec.ts'

const methods: ReadonlyArray<{ method: string; implementation?: string; parameters: string[] }> = [
  { method: 'catalog', parameters: [] },
  { method: 'start', parameters: ['request'] },
  { method: 'get', parameters: ['jobId'] },
  { method: 'cancel', parameters: ['jobId'] },
  { method: 'history', implementation: 'listHistory', parameters: ['cursor', 'limit'] },
  { method: 'deleteHistory', parameters: ['id'] },
]

/** Client descriptor contribution for the Control Center painting service. */
const paintingRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, implementation, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterPainting/${method}`,
    service: 'controlCenterPainting',
    namespace: 'controlCenterPainting',
    method,
    ...(implementation === undefined ? {} : { implementation }),
    invocation: { kind: 'direct' },
    parameters: parameters.map(name => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON_PAINTING })),
    result: STRICT_JSON_PAINTING,
  })),
}

export default paintingRemote
