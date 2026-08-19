import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'

const methods: ReadonlyArray<{ method: string; implementation?: string; parameters: string[] }> = [
  { method: 'list', parameters: [] },
  { method: 'add', parameters: ['path'] },
  // Wire name differs from the host method: the client Remote namespace
  // service rejects a method named `remove` (RemoteNamespaceService has its
  // own `remove`), which would fail $mount — same trap as skills `install`.
  { method: 'removeRepo', implementation: 'remove', parameters: ['repoId'] },
  { method: 'tree', parameters: ['path', 'dir'] },
  { method: 'readFile', parameters: ['path'] },
  { method: 'getBranch', parameters: ['path'] }
]

/** Client descriptor contribution for the Control Center repository service. */
const reposRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, implementation, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterRepos/${method}`,
    service: 'controlCenterRepos',
    namespace: 'controlCenterRepos',
    method,
    ...(implementation === undefined ? {} : { implementation }),
    invocation: { kind: 'direct' },
    parameters: parameters.map((name) => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON
  }))
}

export default reposRemote
