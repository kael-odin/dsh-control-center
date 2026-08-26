import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'

const methods: ReadonlyArray<{ method: string; parameters: string[] }> = [
  { method: 'get', parameters: [] },
  { method: 'set', parameters: ['params'] },
]

/** Client descriptor contribution for the Control Center assistant-prefs service. */
const assistantRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterAssistant/${method}`,
    service: 'controlCenterAssistant',
    namespace: 'controlCenterAssistant',
    method,
    invocation: { kind: 'direct' },
    parameters: parameters.map((name) => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON,
  })),
}

export default assistantRemote
