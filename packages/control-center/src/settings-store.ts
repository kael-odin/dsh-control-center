/**
 * Self-owned settings persistence for Control Center namespaces.
 *
 * Upstream 0.2.0 removed the plugin-namespaces settings API: SettingsForms now
 * projects plugin Config schemas into loader-entry-keyed forms with
 * restart-on-config-change semantics, which cannot hold user state (one toggle
 * write would restart the whole plugin). This service keeps the OLD contract
 * alive on a self-owned store: one KvTable row per namespace carrying
 * { revision, value } over the storage-domain seam (the same backend the
 * file-processing task store uses), with schema-default resolution on read.
 *
 * Semantics mirror the removed API exactly:
 * - `register(ns, schema, { base })` returns a scope with SYNC `get()` and
 *   awaitable `update(patch)` (shallow merge), so host call sites only swap
 *   the service they resolve, not their shapes.
 * - Reads before the storage facility opens fall back to in-memory pending
 *   writes and the registered base; flushed into the table on open.
 * - Without a storage facility the store degrades to in-memory (logged once).
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import type { Domain, DomainFacility, KvTable } from '@deepseek-ai/dsh-storage-domain'
import { z } from 'zod'

/** One persisted namespace row. */
const entrySchema = z.object({
  revision: z.number().int().nonnegative(),
  value: z.record(z.string(), z.unknown()),
})

export interface ControlCenterSettingsEntry {
  revision: number
  value: Record<string, unknown>
}

const settingsDomain = defineDomain({
  name: 'control_center_settings',
  version: 1,
  tables: { namespaces: domainTable<string, ControlCenterSettingsEntry>(entrySchema) },
})

/** Namespace handle shaped like the removed 0.1.6 SettingsScope. */
export interface ControlCenterNamespaceScope<T = unknown> {
  get(): T
  /** Deliberately loose: host callers pass typed config objects without
   * index signatures, and scope handles must stay assignable across shapes. */
  update(patch: object | ((current: any) => object)): Promise<void>
  /** Subscribe to post-merge changes of this namespace; returns the disposer. */
  watch(listener: () => void): () => void
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Self-owned namespace store replacing the removed settings API. */
    controlCenterSettings: ControlCenterSettings
  }
}

/** Any schemastery schema; `never` param keeps every concrete schema assignable. */
type SchemaLike = (value: never) => unknown

export class ControlCenterSettings extends Service {
  static inject = [] as const

  private readonly schemas = new Map<string, SchemaLike>()
  private readonly bases = new Map<string, unknown>()
  /** Writes that happened before the storage facility opened (or without one). */
  private readonly pending = new Map<string, ControlCenterSettingsEntry>()
  private readonly listeners = new Map<string, Set<() => void>>()
  private table: KvTable<string, ControlCenterSettingsEntry> | undefined

  constructor(ctx: Context) {
    super(ctx, 'controlCenterSettings')
    void this.open()
  }

  /** Open the durable table; pre-open writes are flushed over loaded rows. */
  private async open(): Promise<void> {
    try {
      const facility = this.ctx.get('storageDomain') as DomainFacility | undefined
      if (facility === undefined) {
        console.error('[control-center-settings] storageDomain service absent; namespaces persist in memory only for this process')
        return
      }
      const domain = await facility.open(settingsDomain) as Domain<typeof settingsDomain>
      this.table = domain.table('namespaces')
      for (const [ns, entry] of this.pending) await this.table.put(ns, entry)
      this.pending.clear()
    } catch (error) {
      this.table = undefined
      console.error(`[control-center-settings] durable open failed; namespaces persist in memory only: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /** Register one namespace; returns a scope handle shaped like the old API. */
  register<T>(ns: string, schema: SchemaLike, opts: { base?: T } = {}): ControlCenterNamespaceScope<T> {
    this.schemas.set(ns, schema)
    if (opts.base !== undefined && !this.pending.has(ns) && this.table?.get(ns) === undefined) {
      this.bases.set(ns, opts.base)
    }
    return {
      get: () => this.getValue<T>(ns),
      update: async (patch) => { await this.update(ns, patch) },
      watch: (listener) => {
        let set = this.listeners.get(ns)
        if (set === undefined) { set = new Set(); this.listeners.set(ns, set) }
        set.add(listener)
        return () => { set.delete(listener) }
      },
    }
  }

  /** Sync read of one namespace (whole value, schema defaults applied). */
  get<T = unknown>(ns: string): T | undefined {
    return this.getValue<T>(ns)
  }

  /** All known namespaces as { ns, value } views (stored + pending + registered-empty). */
  describe(): Array<{ ns: string; value: unknown }> {
    const out: Array<{ ns: string; value: unknown }> = []
    const seen = new Set<string>()
    const push = (ns: string, value: unknown): void => {
      if (seen.has(ns)) return
      seen.add(ns)
      out.push({ ns, value })
    }
    if (this.table !== undefined) {
      for (const [ns, row] of this.table.entries()) push(ns, row.value)
    }
    for (const [ns, row] of this.pending) push(ns, row.value)
    for (const ns of this.schemas.keys()) push(ns, this.getValue(ns))
    return out
  }

  private getValue<T>(ns: string): T {
    const row = this.table?.get(ns) ?? this.pending.get(ns)
    const raw = row !== undefined ? row.value : this.bases.get(ns)
    const schema = this.schemas.get(ns)
    if (schema !== undefined && raw !== undefined && typeof raw === 'object') {
      try {
        return (schema as unknown as (value: unknown) => unknown)(raw) as T
      } catch {
        // Schema mismatch (e.g. stored shape older than the schema): serve raw.
      }
    }
    return (raw === undefined ? {} as T : raw) as T
  }

  /**
   * Shallow-merge one namespace (object patch or mutator), bump the revision,
   * and persist. Resolves after the durable write when the table is open;
   * pre-open writes land in memory and flush on open.
   */
  async update(ns: string, patch: object | ((current: any) => object)): Promise<void> {
    const row = this.table?.get(ns) ?? this.pending.get(ns)
    const current = (row !== undefined ? row.value : this.bases.get(ns) ?? {}) as Record<string, unknown>
    const next = (typeof patch === 'function' ? patch(current) : { ...current, ...patch }) as Record<string, unknown>
    const entry: ControlCenterSettingsEntry = { revision: (row?.revision ?? 0) + 1, value: next }
    if (this.table !== undefined) {
      await this.table.put(ns, entry)
    } else {
      this.pending.set(ns, entry)
      // Still opening: keep pending; open() flushes it over loaded rows.
    }
    for (const listener of this.listeners.get(ns) ?? []) {
      try { listener() } catch { /* listener errors never break the write */ }
    }
  }
}
