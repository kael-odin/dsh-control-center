import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'

const methods: ReadonlyArray<{ method: string; implementation?: string; parameters: string[] }> = [
  { method: 'list', parameters: [] },
  { method: 'getById', parameters: ['serverId'] },
  { method: 'create', parameters: ['dto'] },
  { method: 'update', parameters: ['serverId', 'dto'] },
  { method: 'delete', parameters: ['serverId'] },
  { method: 'reorder', parameters: ['serverIds'] },
  { method: 'stopServer', parameters: ['serverId'] },
  { method: 'refreshTools', parameters: ['serverId'] },
  { method: 'getServerLogs', parameters: ['serverId', 'lines'] },
  { method: 'getCapabilities', parameters: ['serverId'] },
  { method: 'searchNpxRegistry', parameters: ['scope'] }
]

/** Client descriptor contribution for the Control Center MCP service. */
const mcpRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, implementation, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterMcp/${method}`,
    service: 'controlCenterMcp',
    namespace: 'controlCenterMcp',
    method,
    ...(implementation === undefined ? {} : { implementation }),
    invocation: { kind: 'direct' },
    parameters: parameters.map((name) => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON
  }))
}

export default mcpRemote
