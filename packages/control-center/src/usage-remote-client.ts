import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'

const methods: ReadonlyArray<{ method: string; parameters: string[] }> = [
  { method: 'getOverview', parameters: [] },
  { method: 'timeline', parameters: ['request'] },
  { method: 'stats', parameters: ['request'] },
  { method: 'entries', parameters: ['request'] },
]

/** Client descriptor contribution for the Control Center usage service. */
const usageRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterUsage/${method}`,
    service: 'controlCenterUsage',
    namespace: 'controlCenterUsage',
    method,
    invocation: { kind: 'direct' },
    parameters: parameters.map((name) => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON
  }))
}

export default usageRemote
