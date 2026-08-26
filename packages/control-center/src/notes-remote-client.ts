import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'

const methods: ReadonlyArray<{ method: string; parameters: string[] }> = [
  { method: 'tree', parameters: [] },
  { method: 'read', parameters: ['params'] },
  { method: 'write', parameters: ['params'] },
  { method: 'create', parameters: ['params'] },
  { method: 'rename', parameters: ['params'] },
  { method: 'remove', parameters: ['params'] },
  { method: 'toggleStar', parameters: ['params'] },
]

/** Client descriptor contribution for the Control Center notes service. */
const notesRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterNotes/${method}`,
    service: 'controlCenterNotes',
    namespace: 'controlCenterNotes',
    method,
    invocation: { kind: 'direct' },
    parameters: parameters.map((name) => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON,
  })),
}

export default notesRemote
