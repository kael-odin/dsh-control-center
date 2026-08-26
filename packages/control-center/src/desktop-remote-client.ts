import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'

const methods: ReadonlyArray<{ method: string; parameters: string[] }> = [
  { method: 'check', parameters: [] },
  { method: 'fonts', parameters: [] },
  { method: 'menu', parameters: ['model'] },
  { method: 'adjustZoom', parameters: ['delta', 'reset'] },
  { method: 'relaunch', parameters: [] },
  { method: 'pickFile', parameters: ['properties'] },
  { method: 'pickSaveFile', parameters: ['defaultPath'] },
  { method: 'readFile', parameters: ['path'] },
  { method: 'writeFile', parameters: ['path', 'contentBase64'] },
  { method: 'notify', parameters: ['title', 'body'] },
  { method: 'pushAssistantPrefs', parameters: ['prefs'] },
]

/** Client descriptor contribution for the Control Center desktop service. */
const desktopRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterDesktop/${method}`,
    service: 'controlCenterDesktop',
    namespace: 'controlCenterDesktop',
    method,
    invocation: { kind: 'direct' },
    parameters: parameters.map((name) => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON,
  })),
}

export default desktopRemote
