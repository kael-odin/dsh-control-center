/**
 * Data management Host service: export / import / clear the Control Center
 * settings namespaces as one JSON snapshot (credentials stay in the DSH
 * credentials store and are never part of the export).
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { readFileSync, writeFileSync } from 'node:fs'

/**
 * Every settings namespace the Control Center plugin owns — the full backup
 * surface. Credentials stay in the DSH credentials store and are never part of
 * an export.
 */
export const DATA_NAMESPACES = [
  'control-center-providers',
  'control-center-provider-stash',
  'control-center-repos',
  'control-center-skills',
  'control-center-mcp',
  'control-center-websearch',
  'control-center-file-processing',
  'control-center-model-prefs',
  'control-center-translation',
  'control-center-channels',
  'control-center-tasks',
  'control-center-local-models',
  'control-center-appearance',
  'control-center-notifications',
].map(name => settingsNamespace(name))

export interface DataExport {
  version: 1
  exportedAt: string
  namespaces: Record<string, unknown>
}

export class DataService extends Service {
  static inject = ['settings'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterData')

  constructor(ctx: Context, _config?: { logger?: Context['logger'] }) {
    super(ctx, 'controlCenterData')
  }

  async exportControlCenter(): Promise<DataExport> {
    const namespaces: Record<string, unknown> = {}
    for (const ns of DATA_NAMESPACES) {
      namespaces[ns] = this.ctx.settings.get(ns)
    }
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      namespaces,
    }
  }

  async importControlCenter(snapshot: DataExport): Promise<{ absent: true }> {
    if (snapshot?.version !== 1 || typeof snapshot.namespaces !== 'object' || snapshot.namespaces === null) {
      throw new Error('Invalid Control Center data snapshot')
    }
    for (const ns of DATA_NAMESPACES) {
      const value = snapshot.namespaces[ns]
      if (value !== undefined && typeof value === 'object' && value !== null) {
        await this.ctx.settings.update(ns, value as object)
      }
    }
    this.ctx.logger.info('Imported Control Center data snapshot', { namespaces: Object.keys(snapshot.namespaces).length })
    return { absent: true }
  }

  /** Reset every Control Center settings namespace to its default. */
  async clearControlCenter(): Promise<{ absent: true }> {
    for (const ns of DATA_NAMESPACES) {
      await this.ctx.settings.update(ns, {})
    }
    this.ctx.logger.info('Cleared Control Center data')
    return { absent: true }
  }

  /** Write the snapshot to a file (backup to a local path). */
  async exportToFile(path: string): Promise<{ absent: true }> {
    const snapshot = await this.exportControlCenter()
    writeFileSync(path, JSON.stringify(snapshot, null, 2), 'utf8')
    return { absent: true }
  }

  /** Read a snapshot from a file and import it. */
  async importFromFile(path: string): Promise<{ absent: true }> {
    const raw = readFileSync(path, 'utf8')
    const snapshot = JSON.parse(raw) as DataExport
    return this.importControlCenter(snapshot)
  }

  [Symbol.dispose]() {
    // Nothing to release.
  }
}
