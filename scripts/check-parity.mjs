#!/usr/bin/env node
/**
 * PARITY_LEDGER 验收脚本 — the "机器可读台账" long-term-mechanism item.
 *
 * Walks every markdown table in docs/PARITY_LEDGER.md that carries a 状态
 * column and enforces the anti-rot contract:
 *   - every data row's status cell starts with one of ✅ ⚠️ ❌ 🔄 ⛔
 *     (suffixes like `✅*` or `⛔/❌` are allowed);
 *   - the evidence cell (last column) is non-boilerplate — a status without
 *     a path, date, or explanation is not ledger-keeping, it's decoration.
 *
 * Exits non-zero on any violation and prints a per-status summary so the
 * ledger doubles as a progress report.
 */
import { readFileSync } from 'node:fs'

const LEDGER = 'docs/PARITY_LEDGER.md'
const STATUSES = ['✅', '⚠️', '❌', '🔄', '⛔']

const lines = readFileSync(LEDGER, 'utf8').split(/\r?\n/)

let header = null
let statusIndex = -1
const problems = []
const counts = Object.fromEntries(STATUSES.map(s => [s, 0]))

function cellsOf(line) {
  return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  const isRow = line.startsWith('|')
  if (!isRow) {
    header = null
    statusIndex = -1
    continue
  }
  const cells = cellsOf(line)
  if (header === null) {
    // Header row: remember where 状态 sits; separator rows (---) are skipped.
    const index = cells.indexOf('状态')
    if (index >= 0 && !cells.every(c => /^:?-+:?$/.test(c))) {
      header = cells
      statusIndex = index
    }
    continue
  }
  if (cells.every(c => /^:?-+:?$/.test(c))) continue
  const status = (cells[statusIndex] ?? '').replace(/\*/g, '')
  const mark = STATUSES.find(s => status.startsWith(s))
  const where = `${LEDGER}:${i + 1}`
  if (mark === undefined) {
    problems.push(`${where}: 状态列不是合法词表（✅ ⚠️ ❌ 🔄 ⛔）: "${cells[statusIndex] ?? ''}"`)
    continue
  }
  counts[mark] += 1
  const evidence = cells.at(-1) ?? ''
  if (evidence.length < 4) {
    problems.push(`${where}: ${mark} 行缺证据（备注/对照说明列过短）: "${evidence}"`)
  }
}

if (problems.length > 0) {
  console.error(`parity ledger check failed (${problems.length}):\n${problems.join('\n')}`)
  process.exit(1)
}
const total = Object.values(counts).reduce((a, b) => a + b, 0)
console.log(`parity ledger check: ${total} rows OK — ${STATUSES.map(s => `${s} ${counts[s]}`).join(', ')}`)
