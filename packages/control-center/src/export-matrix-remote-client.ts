import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'

const methods: ReadonlyArray<{ method: string; parameters: string[] }> = [
  { method: 'getConfig', parameters: [] },
  { method: 'setConfig', parameters: ['patch'] },
  { method: 'exportToNotion', parameters: ['params'] },
  { method: 'exportToYuque', parameters: ['params'] },
  { method: 'exportToJoplin', parameters: ['params'] },
  { method: 'exportToSiyuan', parameters: ['params'] },
  { method: 'exportToObsidian', parameters: ['params'] },
]

/** Client descriptor contribution for the export-matrix service (`controlCenterExport`). */
const exportMatrixRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterExport/${method}`,
    service: 'controlCenterExport',
    namespace: 'controlCenterExport',
    method,
    invocation: { kind: 'direct' },
    parameters: parameters.map(name => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON,
  })),
}

export default exportMatrixRemote
