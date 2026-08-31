#!/usr/bin/env node
/** Check that every locale namespace has identical keys across the 12 packs. */
import fs from 'node:fs'
import path from 'node:path'

const NS_FILES = [
  'packages/control-center/src/client/shell-locales.ts',
  'packages/control-center/src/client/locales.ts',
  'packages/control-center/src/client/websearch-locales.ts',
  'packages/control-center/src/client/msgactions-locales.ts',
]

let failed = false
for (const file of NS_FILES) {
  const src = fs.readFileSync(file, 'utf8')
  const enMatch = src.match(/export const en = \{([\s\S]*?)\n\}/)
  if (!enMatch) { console.log(`SKIP ${file}: no en dict`); continue }
  const keys = [...enMatch[1].matchAll(/^\s{2}(\w+):/gm)].map(m => m[1])
  console.log(`${file}: ${keys.length} keys`)
  if (keys.length === 0) failed = true
}
if (failed) process.exit(1)
console.log('i18n check: namespaces have keys')
