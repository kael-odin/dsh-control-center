import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'

const methods: ReadonlyArray<{ method: string; parameters: string[] }> = [
  { method: 'listProcessors', parameters: [] },
  { method: 'getConfig', parameters: [] },
  { method: 'setDefault', parameters: ['feature', 'processor'] },
  { method: 'setOverride', parameters: ['processor', 'override'] },
  { method: 'setApiKey', parameters: ['processor', 'slot', 'value'] },
  { method: 'clearApiKey', parameters: ['processor', 'slot'] },
  { method: 'convert', parameters: ['request'] },
  { method: 'listTasks', parameters: [] },
  { method: 'getTask', parameters: ['taskId'] },
  { method: 'getTaskResult', parameters: ['taskId'] },
  { method: 'cancelTask', parameters: ['taskId'] },
]

/** Client descriptor contribution for the Control Center file-processing service. */
const fileProcessingRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterFileProcessing/${method}`,
    service: 'controlCenterFileProcessing',
    namespace: 'controlCenterFileProcessing',
    method,
    invocation: { kind: 'direct' },
    parameters: parameters.map((name) => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON
  }))
}

export default fileProcessingRemote
