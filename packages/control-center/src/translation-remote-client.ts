import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'
const methods: ReadonlyArray<{ method: string; implementation?: string; parameters: string[] }> = [
  { method: 'start', parameters: ['request'] },
  { method: 'get', parameters: ['jobId'] },
  { method: 'cancel', parameters: ['jobId'] },
  { method: 'history', implementation: 'listHistory', parameters: ['cursor', 'limit'] },
  { method: 'deleteHistory', parameters: ['id'] },
  { method: 'starHistory', parameters: ['id', 'starred'] },
  { method: 'clearHistory', parameters: [] },
  { method: 'getPrompt', parameters: [] },
  { method: 'setPrompt', parameters: ['prompt'] },
  { method: 'languages', parameters: [] },
  { method: 'putLanguage', parameters: ['id', 'label'] },
  { method: 'deleteLanguage', parameters: ['id'] },
]

/** Client descriptor contribution for the Control Center translation service. */
const translationRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, implementation, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterTranslation/${method}`,
    service: 'controlCenterTranslation',
    namespace: 'controlCenterTranslation',
    method,
    ...(implementation === undefined ? {} : { implementation }),
    invocation: { kind: 'direct' },
    parameters: parameters.map(name => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON,
  })),
}

export default translationRemote
