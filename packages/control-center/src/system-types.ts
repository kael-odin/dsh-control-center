/** System & plugin lifecycle types shared between Host and Client. */
export interface SystemInfo {
  controlCenterVersion: string
  dshSupportedVersion: string
  dshSourceBaseline: string
  platform: string
  arch: string
  release: string
  nodeVersion: string
  dshHome: string
  hostname: string
}

export interface DependencyEntry { name: string; version: string; client: boolean }

export interface PluginInventory {
  profile: string
  profileDir: string
  dependencies: Array<{ name: string; spec: string; bundle: boolean; active: boolean }>
  bundles: string[]
  restartRequired: boolean
  unsupported: string[]
}
export type PluginOperation = 'add' | 'remove' | 'update'
export interface PluginOperationResult {
  profile: string
  operation: PluginOperation
  spec: string
  exitCode: number
  stdout: string
  stderr: string
  inventory: PluginInventory
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    controlCenterSystem: {
      getInfo(): Promise<{ ok: true; value: SystemInfo } | { ok: false; error: { code: string; message: string; details: object } }>
      listDependencies(): Promise<{ ok: true; value: DependencyEntry[] } | { ok: false; error: { code: string; message: string; details: object } }>
      listPlugins(profile: string): Promise<{ ok: true; value: PluginInventory } | { ok: false; error: { code: string; message: string; details: object } }>
      managePlugin(profile: string, operation: PluginOperation, spec: string): Promise<{ ok: true; value: PluginOperationResult } | { ok: false; error: { code: string; message: string; details: object } }>
    }
  }
}
