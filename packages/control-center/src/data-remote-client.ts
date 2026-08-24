import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { STRICT_JSON } from './translation-codec.ts'

const methods: ReadonlyArray<{ method: string; parameters: string[] }> = [
  { method: 'exportControlCenter', parameters: [] },
  { method: 'importControlCenter', parameters: ['snapshot'] },
  { method: 'clearControlCenter', parameters: [] },
  { method: 'exportToFile', parameters: ['path'] },
  { method: 'importFromFile', parameters: ['path'] },
  { method: 'backupToDirectory', parameters: ['dir', 'maxBackups'] },
  { method: 'listBackupFiles', parameters: ['dir'] },
  { method: 'getWebdavConfig', parameters: ['vendor'] },
  { method: 'setWebdavConfig', parameters: ['config', 'vendor'] },
  { method: 'testWebdavConnection', parameters: ['vendor'] },
  { method: 'webdavBackup', parameters: ['vendor'] },
  { method: 'webdavRestore', parameters: ['fileName', 'vendor'] },
  { method: 'listWebdavBackups', parameters: ['vendor'] },
  { method: 'getS3Config', parameters: [] },
  { method: 'setS3Config', parameters: ['config'] },
  { method: 'testS3Connection', parameters: [] },
  { method: 's3Backup', parameters: [] },
  { method: 's3Restore', parameters: ['fileName'] },
  { method: 'listS3Backups', parameters: [] }
]

/** Client descriptor contribution for the Control Center data service. */
const dataRemote: TypertRemoteContribution = {
  package: '@dsh-control-center/control-center',
  descriptors: methods.map(({ method, parameters }) => ({
    id: `@dsh-control-center/control-center#controlCenterData/${method}`,
    service: 'controlCenterData',
    namespace: 'controlCenterData',
    method,
    invocation: { kind: 'direct' },
    parameters: parameters.map((name) => ({ name, wire: name, source: 'json' as const, codec: STRICT_JSON })),
    result: STRICT_JSON
  }))
}

export default dataRemote
