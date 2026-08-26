import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON_WEBSEARCH } from './websearch-codec.ts'

const methods: ReadonlyArray<{ method: string; implementation?: string; parameters: string[] }> = [
  { method: 'getConfig', parameters: [] },
  { method: 'updateConfig', parameters: ['params'] },
  { method: 'listProviders', parameters: [] },
  { method: 'getProvider', parameters: ['params'] },
  { method: 'updateProviderOverride', parameters: ['params'] },
  { method: 'checkProviderReady', parameters: ['params'] },
  { method: 'checkProvider', parameters: ['params'] },
]

/** Client descriptor contribution for the Control Center web search service. */
const webSearchRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, implementation, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterWebSearch/${method}`,
    service: 'controlCenterWebSearch',
    namespace: 'controlCenterWebSearch',
    method,
    ...(implementation === undefined ? {} : { implementation }),
    invocation: { kind: 'direct' },
    parameters: parameters.map(name => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON_WEBSEARCH })),
    result: STRICT_JSON_WEBSEARCH,
  })),
}

export default webSearchRemote
