/**
 * Diagnostic probe: boots the packed bundle against the real harness (same
 * sequence as packed-browser-e2e) and dumps what the page actually renders —
 * console errors, failing requests, body text, and a screenshot — so a UI
 * mount failure can be triaged without guessing.
 *
 * Usage: pnpm exec tsx tests/debug-page-probe.ts   (run pack:check first)
 */
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { startOpenAiFixture } from './openai-fixture.ts'
import { bundlePack } from './packs.ts'

const ROOT = process.cwd()
const DSH = process.env.DSH_REPO ?? join(ROOT, '..', 'deepseek-harness')
const { pathToFileURL } = await import('node:url')
const { existsSync } = await import('node:fs')
const CLI_LIB = join(DSH, 'apps/cli/lib/bin.js')
const CLI = existsSync(CLI_LIB) ? CLI_LIB : join(DSH, 'apps/cli/src/bin.ts')
const CLI_SRC_LOADER = join(DSH, 'node_modules/tsx/dist/loader.mjs')
const bootArgs = (args: string[]): string[] =>
  CLI.endsWith('.ts') ? ['--import', pathToFileURL(CLI_SRC_LOADER).href, CLI, ...args] : [CLI, ...args]

async function run(args: string[], env: NodeJS.ProcessEnv): Promise<{ code: number; output: string }> {
  const { spawn } = await import('node:child_process')
  return await new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, bootArgs(args), { cwd: DSH, env, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', c => { output += c.toString() })
    child.stderr.on('data', c => { output += c.toString() })
    child.on('error', reject)
    child.on('close', code => { resolveRun({ code: code ?? 1, output }) })
  })
}

const home = await mkdtemp(join(tmpdir(), 'cc-debug-probe-'))
const fixture = await startOpenAiFixture()
const env = { ...process.env, DSH_HOME: home }
const install = await run(['plugin', '--profile', 'web', 'add', bundlePack()], env)
if (install.code !== 0) throw new Error(`install failed\n${install.output}`)
const settings = [
  'ui-onboarding:',
  '  welcomeNoticeVersion: 2026-08-13.1',
  'llm-pi-ai:',
  '  providers:',
  '    control-center-e2e:',
  '      displayName: Control Center E2E',
  '      apiKeyEnv: CONTROL_CENTER_E2E_API_KEY',
  '      api: openai-completions',
  `      baseURL: ${fixture.baseURL}`,
  '      models:',
  '        - id: cc-e2e-alpha',
  '          name: Control Center Alpha',
  'agent-default-model:',
  '  provider: control-center-e2e',
  '  model: cc-e2e-alpha',
  '',
].join('\n')
await mkdir(home, { recursive: true })
await writeFile(join(home, 'settings.yaml'), settings)
await writeFile(join(home, '.credentials.yaml'), 'CONTROL_CENTER_E2E_API_KEY: local-fixture-key\n')

const { spawn } = await import('node:child_process')
const child = spawn(process.execPath, bootArgs(['web', '--host', '127.0.0.1', '--port', '3198']), {
  cwd: DSH, env, stdio: ['ignore', 'pipe', 'pipe'],
})
let boot = ''
const url = await new Promise<string>((resolveUrl, reject) => {
  const timer = setTimeout(() => reject(new Error(`boot timeout\n${boot}`)), 45_000)
  const consume = (c: Buffer): void => {
    boot += c.toString()
    const m = /dsh web: (http:\/\/127\.0\.0\.1:\d+\S*)/.exec(boot)
    if (m?.[1] !== undefined) { clearTimeout(timer); resolveUrl(m[1]) }
  }
  child.stdout.on('data', consume)
  child.stderr.on('data', consume)
})
console.log('host up:', url)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, locale: 'zh-CN' })
const errors: string[] = []
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`))
page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${String(r.status())} ${r.url()}`) })
await page.goto(url, { waitUntil: 'load' })
try {
  await page.waitForSelector('[class*="frame"]', { timeout: 20_000 })
} catch {
  console.log('frame did not mount — dumping diagnostics anyway')
}
await page.waitForTimeout(2_000)
const openSidebar = page.getByRole('button', { name: '打开侧边栏' })
if (await openSidebar.count() > 0) await openSidebar.click()
const openOnboarding = page.getByRole('dialog')
if (await openOnboarding.count() > 0) {
  const dismiss = openOnboarding.getByRole('button', { name: /知道了|稍后|关闭|Close|Later|Got it/ }).last()
  if (await dismiss.count() > 0) await dismiss.click()
  else await page.keyboard.press('Escape')
  await openOnboarding.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})
}
const errorsDump = errors.slice(0, 15)
const moduleLoaderStateEarly = await page.evaluate(() => ({
  hasLoader: typeof (window as unknown as Record<string, unknown>).__ModuleLoader__,
  readyState: document.readyState,
  bodyChildren: document.body.children.length,
  bodyHead: document.body.innerText.slice(0, 300),
})).catch(e => ({ error: String(e) }))
console.log(JSON.stringify({ errors: errorsDump, moduleLoaderStateEarly }, null, 2))
const settingsButton = page.getByRole('button', { name: '设置', exact: true })
await settingsButton.evaluate((button: HTMLButtonElement) => { button.click() })
await page.waitForTimeout(2_000)
await page.screenshot({ path: join(ROOT, 'shots', 'debug-settings-open.png') }).catch(() => {})
const dialog = page.getByRole('dialog', { name: '设置' })
const dialogText = await dialog.innerText().catch(() => '<no dialog>')
console.log('--- settings dialog text head ---')
console.log(dialogText.slice(0, 800))
await dialog.getByRole('button', { name: '模型服务', exact: true }).evaluate((button: HTMLButtonElement) => { button.click() }).catch(e => console.log('models click failed:', String(e)))
await page.waitForTimeout(3_000)
await page.screenshot({ path: join(ROOT, 'shots', 'debug-models-page.png') }).catch(() => {})
const afterClick = await dialog.innerText().catch(() => '<no dialog>')
console.log('--- dialog text after models click ---')
console.log(afterClick.slice(0, 1200))
const title = await page.title()
const bodyText = (await page.locator('body').innerText().catch(() => '<no body>')).slice(0, 1500)
const frameCount = await page.locator('[class*="frame"]').count()
const moduleLoaderState = await page.evaluate(() => ({
  hasLoader: typeof (window as unknown as Record<string, unknown>).__ModuleLoader__,
  readyState: document.readyState,
  bodyChildren: document.body.children.length,
})).catch(e => ({ error: String(e) }))
console.log(JSON.stringify({ title, frameCount, moduleLoaderState, errors: errors.slice(0, 25) }, null, 2))
console.log('--- body text head ---')
console.log(bodyText)
await page.screenshot({ path: join(ROOT, 'shots', 'debug-page-probe.png'), fullPage: true }).catch(() => {})
await browser.close()
child.kill('SIGTERM')
process.exit(0)
