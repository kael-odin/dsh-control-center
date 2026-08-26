/**
 * Local Models + Update types (shared between Host and Client).
 */

import type { LocalModelServer, LocalModelEntry } from './local-models.ts'
import type { UpdateInfo, ReleaseEntry, PreparedUpdate } from './update.ts'
import type { CapabilityProbe } from './compat-probe.ts'

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    controlCenterLocalModels: {
      listServers(): Promise<{ ok: true; value: LocalModelServer[] } | { ok: false; error: { code: string; message: string; details: object } }>
      addServer(input: { name: string; kind: LocalModelServer['kind']; baseUrl?: string }): Promise<{ ok: true; value: LocalModelServer } | { ok: false; error: { code: string; message: string; details: object } }>
      removeServer(serverId: string): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
      discoverModels(serverId: string): Promise<{ ok: true; value: LocalModelEntry[] } | { ok: false; error: { code: string; message: string; details: object } }>
    }
    controlCenterUpdate: {
      checkForUpdates(): Promise<{ ok: true; value: UpdateInfo } | { ok: false; error: { code: string; message: string; details: object } }>
      listReleases(): Promise<{ ok: true; value: ReleaseEntry[] } | { ok: false; error: string }>
      prepareUpdate(): Promise<{ ok: true; value: PreparedUpdate } | { ok: false; error: string }>
      getPreparedUpdate(): Promise<{ ok: true; value: PreparedUpdate | null }>
    }
    controlCenterCompat: {
      probe(): Promise<{ ok: true; value: CapabilityProbe[] }>
    }
  }
}

export type { LocalModelServer, LocalModelEntry, UpdateInfo, ReleaseEntry, PreparedUpdate, CapabilityProbe }
