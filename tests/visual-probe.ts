/**
 * One-off visual probe: boot the packed bundle the same way the browser E2E
 * does, open 设置 → 模型服务, and screenshot the provider page regions.
 * Run: npx tsx tests/visual-probe.ts
 */
import { mkdtemp, writeFile, writeFile as write } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawn, type ChildProcess } from 'node:child_process'
import { chromium } from 'playwright'
import { bundlePack } from './packs.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DSH = resolve(ROOT, '..', 'deepseek-harness')
const CLI = join(DSH, 'apps/cli/src/bin.ts')
const SHOTS = join(ROOT, 'shots')

async function run(args: string[], env: NodeJS.ProcessEnv): Promise<{ code: number; output: string }> {
  const loader = pathToFileURL(join(DSH, 'node_modules/tsx/dist/loader.mjs')).href
  return await new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, ['--import', loader, CLI, ...args], { cwd: DSH, env, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', chunk => { output += chunk.toString() })
    child.stderr.on('data', chunk => { output += chunk.toString() })
    child.on('error', reject)
    child.on('close', code => { resolveRun({ code: code ?? 1, output }) })
  })
}

async function startHost(home: string): Promise<{ child: ChildProcess; url: string }> {
  const loader = pathToFileURL(join(DSH, 'node_modules/tsx/dist/loader.mjs')).href
  const child = spawn(process.execPath, ['--import', loader, CLI, 'web', '--host', '127.0.0.1', '--port', '3198'], {
    cwd: DSH,
    env: { ...process.env, DSH_HOME: home, DSH_PERMISSION_MODE: 'danger-full-access' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  const url = await new Promise<string>((resolveUrl, reject) => {
    const timeout = setTimeout(() => reject(new Error(`DSH startup timed out\n${output}`)), 45_000)
    const consume = (chunk: Buffer): void => {
      output += chunk.toString()
      const match = /dsh web: (http:\/\/127\.0\.0\.1:\d+)/.exec(output)
      if (match?.[1] !== undefined) { clearTimeout(timeout); resolveUrl(match[1]) }
    }
    child.stdout.on('data', consume)
    child.stderr.on('data', consume)
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`DSH exited ${String(code)}\n${output}`)) })
  })
  return { child, url }
}

async function main(): Promise<void> {
  const pack = bundlePack()
  const home = await mkdtemp(join(tmpdir(), 'dsh-visual-probe-'))
  await writeFile(join(home, '.credentials.yaml'), 'CONTROL_CENTER_E2E_API_KEY: local-fixture-key\n')
  await write(join(home, 'settings.yaml'), [
    'ui-onboarding:',
    '  welcomeNoticeVersion: 2026-08-13.1',
    'llm-pi-ai:',
    '  providers:',
    '    deepseek:',
    '      apiKeyEnv: CONTROL_CENTER_E2E_API_KEY',
    '      api: openai-completions',
    '      baseURL: https://api.deepseek.com/v1',
    '      models:',
    '        - id: deepseek-chat',
    '          name: DeepSeek Chat',
    '        - id: deepseek-reasoner',
    '          name: DeepSeek Reasoner',
    'agent-default-model:',
    '  provider: deepseek',
    '  model: deepseek-chat',
    '',
  ].join('\n'))
  const install = await run(['plugin', '--profile', 'web', 'add', pack], { ...process.env, DSH_HOME: home })
  if (install.code !== 0) throw new Error(`install failed\n${install.output}`)
  const host = await startHost(home)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' })
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') pageErrors.push(message.text()) })
    await page.goto(host.url, { waitUntil: 'load' })
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
    const openSidebar = page.getByRole('button', { name: '打开侧边栏' })
    if (await openSidebar.count() > 0) await openSidebar.click()
    const dialog0 = page.getByRole('dialog')
    if (await dialog0.count() > 0) {
      const dismiss = dialog0.getByRole('button', { name: /知道了|稍后|关闭|继续/ }).last()
      if (await dismiss.count() > 0) await dismiss.click().catch(() => {})
      await page.keyboard.press('Escape')
      await dialog0.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {})
    }
    const settingsButton = page.getByRole('button', { name: '设置', exact: true })
    await settingsButton.evaluate((button: HTMLButtonElement) => { button.click() })
    const dialog = page.getByRole('dialog', { name: '设置' })
    await dialog.waitFor({ timeout: 15_000 })
    await dialog.getByRole('button', { name: '模型服务', exact: true }).click()
    await dialog.getByText('DeepSeek', { exact: true }).first().waitFor({ timeout: 20_000 })
    await page.waitForTimeout(800)
    await page.screenshot({ path: join(SHOTS, 'probe-provider-page.png') })
    // Select the configured provider for the right pane.
    const row = dialog.getByText('DeepSeek', { exact: true }).first().locator('xpath=ancestor-or-self::*[@role="button"][1]')
    await row.evaluate((element: HTMLElement) => { element.click() })
    await page.waitForTimeout(800)
    await page.screenshot({ path: join(SHOTS, 'probe-provider-detail.png') })
    // 通用 settings page.
    const generalBtn = dialog.getByRole('button', { name: '通用', exact: true })
    console.log('PROBE_GENERAL_BTN_COUNT', await generalBtn.count())
    await generalBtn.click()
    await page.waitForTimeout(1200)
    const domProbe = await page.evaluate(() => {
      const dialogs = [...document.querySelectorAll('[role="dialog"]')].map(d => ({ name: d.getAttribute('aria-label'), visible: d.offsetParent !== null }))
      return {
        dialogs,
        bodyHasMarker: document.body.innerText.includes('GENERAL-PAGE-MOUNTED'),
        bodyHasGeneralNav: document.body.innerText.includes('启动行为') || document.body.innerText.includes('通用'),
      }
    })
    console.log('PROBE_DOM', JSON.stringify(domProbe))
    await page.screenshot({ path: join(SHOTS, 'probe-general-debug.png') })
    try {
      await page.getByText('启动行为').first().waitFor({ timeout: 15_000 })
    } catch (error) {
      const body = await page.locator('body').innerText().catch(() => '')
      throw new Error(`general page did not render; browser errors: ${pageErrors.join(' | ')}; body tail: ${body.slice(-800)}`, { cause: error })
    }
    await page.waitForTimeout(600)
    await page.screenshot({ path: join(SHOTS, 'probe-general.png') })
    console.log('screenshots written to shots/')
  } finally {
    await browser.close()
    host.child.kill('SIGTERM')
  }
}

await main()
