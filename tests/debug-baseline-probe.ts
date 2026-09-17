/**
 * Attribution probe: boot the local harness with NO plugin installed and dump
 * whether its own web surface activates. Separates a broken local harness
 * checkout from a plugin-induced boot failure.
 */
import { mkdtemp } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

const ROOT = process.cwd()
const DSH = process.env.DSH_REPO ?? join(ROOT, '..', 'deepseek-harness')
const CLI_LIB = join(DSH, 'apps/cli/lib/bin.js')
const CLI = existsSync(CLI_LIB) ? CLI_LIB : join(DSH, 'apps/cli/src/bin.ts')
const loader = pathToFileURL(join(DSH, 'node_modules/tsx/dist/loader.mjs')).href

const home = await mkdtemp(join(tmpdir(), 'cc-baseline-'))
const args = CLI.endsWith('.ts') ? ['--import', loader, CLI, 'web', '--host', '127.0.0.1', '--port', '3201'] : [CLI, 'web', '--host', '127.0.0.1', '--port', '3201']
const child = spawn(process.execPath, args, {
  cwd: DSH,
  env: { ...process.env, DSH_HOME: home, DSH_PERMISSION_MODE: 'danger-full-access' },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let boot = ''
const url = await new Promise<string>((resolveUrl, reject) => {
  const timer = setTimeout(() => reject(new Error(`boot timeout\n${boot}`)), 45_000)
  const consume = (c: Buffer): void => {
    boot += c.toString()
    const m = /dsh web: (\S+)/.exec(boot)
    if (m?.[1] !== undefined) { clearTimeout(timer); resolveUrl(m[1]) }
  }
  child.stdout.on('data', consume)
  child.stderr.on('data', consume)
})
console.log('baseline host up:', url)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, locale: 'zh-CN' })
const errors: string[] = []
page.on('pageerror', e => errors.push(`pageerror: ${e.message.slice(0, 300)}`))
page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 300)}`) })
await page.goto(url, { waitUntil: 'load' })
try { await page.waitForSelector('[class*="frame"]', { timeout: 20_000 }) } catch { console.log('baseline: frame did not mount') }
await page.waitForTimeout(2_000)
const bodyHead = await page.evaluate(() => document.body.innerText.slice(0, 300)).catch(e => String(e))
console.log(JSON.stringify({ bodyHead, errors: errors.slice(0, 10) }, null, 2))
await browser.close()
child.kill('SIGTERM')
process.exit(0)
