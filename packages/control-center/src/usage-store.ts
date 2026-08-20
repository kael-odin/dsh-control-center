/**
 * Usage record store: append-only JSONL under <dshHome>/control-center/
 * usage.jsonl with a bounded in-memory view. Keyed per DSH home so tests
 * with isolated homes never observe each other.
 */

import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import { appendFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { UsageRecord } from './usage-types.ts'

const MAX_MEMORY_RECORDS = 5_000
const MAX_FILE_LINES = 2_000

const stores = new Map<string, UsageStore>()

export function usageStoreFor(home: string): UsageStore {
  let store = stores.get(home)
  if (store === undefined) {
    store = new UsageStore(home)
    stores.set(home, store)
  }
  return store
}

export class UsageStore {
  private readonly file: string
  private records: UsageRecord[] = []
  private loaded = false

  constructor(home: string) {
    this.file = join(home, 'control-center', 'usage.jsonl')
    try {
      mkdirSync(join(home, 'control-center'), { recursive: true })
    } catch {
      // Read-only home: records stay in memory for the session.
    }
  }

  private ensureLoaded(): void {
    if (this.loaded) return
    this.loaded = true
    if (!existsSync(this.file)) return
    try {
      const lines = readFileSyncSafe(this.file)
      for (const line of lines) {
        if (line.trim().length === 0) continue
        try {
          const record = JSON.parse(line) as UsageRecord
          if (record.id !== undefined && typeof record.createdAt === 'number') {
            this.records.push(record)
          }
        } catch {
          // Skip corrupt lines; the store stays honest about what it can read.
        }
      }
      this.records.sort((left, right) => left.createdAt - right.createdAt)
      this.records = this.records.slice(-MAX_MEMORY_RECORDS)
    } catch {
      this.records = []
    }
  }

  /** Append one record; the file write is fire-and-forget (never blocks calls). */
  record(input: Omit<UsageRecord, 'id' | 'createdAt'>): UsageRecord {
    this.ensureLoaded()
    const record: UsageRecord = {
      id: `usage-${randomUUID()}`,
      createdAt: Date.now(),
      ...input,
    }
    this.records.push(record)
    if (this.records.length > MAX_MEMORY_RECORDS) {
      this.records = this.records.slice(-MAX_MEMORY_RECORDS)
    }
    void appendFile(this.file, `${JSON.stringify(record)}\n`).catch(() => {
      // Best effort; the in-memory view remains authoritative for the session.
    })
    void this.trimFile()
    return record
  }

  private async trimFile(): Promise<void> {
    try {
      const lines = readFileSyncSafe(this.file)
      if (lines.length <= MAX_FILE_LINES) return
      await writeFile(this.file, lines.slice(-MAX_FILE_LINES).join('\n') + '\n')
    } catch {
      // Nothing to trim.
    }
  }

  all(): UsageRecord[] {
    this.ensureLoaded()
    return this.records
  }
}

function readFileSyncSafe(path: string): string[] {
  try {
    return readFileSync(path, 'utf8').split(/\r?\n/)
  } catch {
    return []
  }
}
