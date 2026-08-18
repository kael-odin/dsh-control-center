import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const cherry = JSON.parse(readFileSync(resolve(root, 'provenance/cherry-source-inventory.json'), 'utf8')) as {
  upstream?: { commit?: string; license?: string }
  files?: Array<{ source?: string; destinations?: string[]; notice?: string; verified?: boolean }>
}
const dsh = JSON.parse(readFileSync(resolve(root, 'provenance/dsh-source-inventory.json'), 'utf8')) as {
  upstream?: { commit?: string; license?: string }
  sourceGroups?: Array<{ sources?: string[]; destinations?: string[]; notice?: string; verified?: boolean }>
}
const notice = readFileSync(resolve(root, 'NOTICE'), 'utf8')
if (cherry.upstream?.commit !== '13687df354e9845c7e2b6d155eac6a9171f6a533') {
  throw new Error('provenance: Cherry baseline commit drifted')
}
if (cherry.upstream.license !== 'AGPL-3.0-only') throw new Error('provenance: Cherry license is missing')
if (!notice.includes(cherry.upstream.commit)) throw new Error('provenance: NOTICE does not name the Cherry baseline')
for (const entry of cherry.files ?? []) {
  if (!entry.source || !entry.destinations?.length || entry.notice !== 'NOTICE' || entry.verified !== true) {
    throw new Error(`provenance: incomplete Cherry inventory row for ${String(entry.source)}`)
  }
  for (const destination of entry.destinations) {
    if (!existsSync(resolve(root, destination))) throw new Error(`provenance: missing adapted destination ${destination}`)
  }
}
if (dsh.upstream?.commit !== '99f6f02fecdb7dff40c3fbc9470f5907c29f74ca') {
  throw new Error('provenance: DSH baseline commit drifted')
}
if (dsh.upstream.license !== 'MIT') throw new Error('provenance: DSH license is missing')
if (!notice.includes(dsh.upstream.commit)) throw new Error('provenance: NOTICE does not name the DSH baseline')
for (const entry of dsh.sourceGroups ?? []) {
  if (!entry.sources?.length || !entry.destinations?.length || entry.notice !== 'NOTICE' || entry.verified !== true) {
    throw new Error(`provenance: incomplete DSH inventory row for ${String(entry.sources?.[0])}`)
  }
  for (const destination of entry.destinations) {
    if (!existsSync(resolve(root, destination))) throw new Error(`provenance: missing adapted destination ${destination}`)
  }
}
const groups = (cherry.files?.length ?? 0) + (dsh.sourceGroups?.length ?? 0)
process.stdout.write(`provenance: ${String(groups)} adapted source groups verified\n`)
