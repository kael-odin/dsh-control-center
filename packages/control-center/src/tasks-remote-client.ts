import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'

const methods: ReadonlyArray<{ method: string; implementation?: string; parameters: string[] }> = [
  { method: 'list', parameters: [] },
  { method: 'listHistory', parameters: [] },
  { method: 'create', parameters: ['input'] },
  { method: 'update', parameters: ['taskId', 'patch'] },
  // Wire name differs from the host method: `remove` collides with the
  // client RemoteNamespaceService.prototype.remove and fails $mount.
  { method: 'removeTask', implementation: 'remove', parameters: ['taskId'] }
]

/** Client descriptor contribution for the Control Center tasks service. */
const tasksRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, implementation, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterTasks/${method}`,
    service: 'controlCenterTasks',
    namespace: 'controlCenterTasks',
    method,
    ...(implementation === undefined ? {} : { implementation }),
    invocation: { kind: 'direct' },
    parameters: parameters.map((name) => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON
  }))
}

export default tasksRemote
