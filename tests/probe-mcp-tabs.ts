/**
 * One-off visual probe: MCP subnav tabs + server detail tabs, light & dark,
 * plus computed-style audit of native selects on web search / file processing /
 * OCR / scheduled tasks. Run: npx tsx tests/probe-mcp-tabs.ts
 */
import { mkdtemp, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawn, type ChildProcess } from 'node:child_process'
import { chromium } from 'playwright'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DSH = resolve(ROOT, '..', 'deepseek-harness')
const PACKS = join(ROOT, '.packs')
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
  const child = spawn(process.execPath, ['--import', loader, CLI, 'web', '--host', '127.0.0.1', '--port', '3199'], {
    cwd: DSH,
    env: { ...process.env, DSH_HOME: home, DSH_PERMISSION_MODE: 'danger-full-access' },
    stdio: ['ignore', 'pipe', 'pipe']
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
  const pack = join(PACKS, 'dsh-control-center-bundle-0.1.0.tgz')
  if (!existsSync(pack)) throw new Error('packed bundle missing; run pnpm pack:check first')
  const home = await mkdtemp(join(tmpdir(), 'dsh-probe-mcp-'))
  await writeFile(join(home, '.credentials.yaml'), 'CONTROL_CENTER_E2E_API_KEY: local-fixture-key\n')
  await writeFile(join(home, 'settings.yaml'), [
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
    'agent-default-model:',
    '  provider: deepseek',
    '  model: deepseek-chat',
    'control-center-mcp:',
    '  servers:',
    '    - id: demo-server',
    '      name: Demo Server',
    '      type: stdio',
    '      description: 探针用演示服务器',
    '      baseUrl: ""',
    '      command: node',
    '      registryUrl: ""',
    '      args: []',
    '      env: {}',
    '      headers: {}',
    '      provider: ""',
    '      providerUrl: ""',
    '      logoUrl: ""',
    '      tags: []',
    '      longRunning: false',
    '      timeout: 60',
    '      dxtVersion: ""',
    '      dxtPath: ""',
    '      reference: ""',
    '      searchKey: ""',
    '      disabledTools: []',
    '      disabledAutoApproveTools: []',
    '      shouldConfig: false',
    '      sortOrder: 0',
    '      isActive: false',
    '      installSource: manual',
    '      isTrusted: true',
    '      trustedAt: 0',
    '      installedAt: 0',
    '      createdAt: "2026-08-25T00:00:00.000Z"',
    '      updatedAt: "2026-08-25T00:00:00.000Z"',
    '',
  ].join('\n'))
  const install = await run(['plugin', '--profile', 'web', 'add', pack], { ...process.env, DSH_HOME: home })
  if (install.code !== 0) throw new Error(`install failed\n${install.output}`)
  const host = await startHost(home)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' })
    await page.goto(host.url, { waitUntil: 'load' })
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
    const dialog0 = page.getByRole('dialog')
    if (await dialog0.count() > 0) {
      const dismiss = dialog0.getByRole('button', { name: /知道了|稍后|关闭|继续/ }).last()
      if (await dismiss.count() > 0) await dismiss.click().catch(() => {})
      await page.keyboard.press('Escape')
      await dialog0.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {})
    }
    await page.getByRole('button', { name: '设置', exact: true }).evaluate((b: HTMLButtonElement) => { b.click() })
    const dialog = page.getByRole('dialog', { name: '设置' })
    await dialog.waitFor({ timeout: 15_000 })

    // ── MCP page, light ──
    await dialog.getByRole('button', { name: 'MCP', exact: true }).click()
    await dialog.getByRole('button', { name: '服务器', exact: true }).waitFor({ timeout: 15_000 })
    await page.waitForTimeout(600)
    await page.screenshot({ path: join(SHOTS, 'probe-mcp-servers-light.png') })

    // Click each subnav tab, screenshot after click (focus retained)
    for (const tab of ['内置服务器', '市场', '提供商配置'] as const) {
      await dialog.getByRole('button', { name: tab, exact: true }).click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: join(SHOTS, `probe-mcp-tab-${tab}.png`) })
    }

    // Back to servers, select the demo server, screenshot detail tabs
    await dialog.getByRole('button', { name: '服务器', exact: true }).click()
    await page.waitForTimeout(400)
    await dialog.getByText('Demo Server', { exact: true }).first().click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: join(SHOTS, 'probe-mcp-detail-tabs.png') })

    // Audit tab button computed styles after click (focus ring / border)
    const tabAudit = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button')].filter(b =>
        ['服务器', '内置服务器', '市场', '提供商配置', '设置', '描述', '日志'].includes(b.textContent?.trim() ?? ''))
      return buttons.map(b => {
        const s = getComputedStyle(b)
        return {
          text: b.textContent?.trim(),
          outline: s.outline,
          outlineColor: s.outlineColor,
          border: s.border,
          boxShadow: s.boxShadow,
          matchesFocus: b.matches(':focus'),
          matchesFocusVisible: b.matches(':focus-visible'),
        }
      })
    })
    console.log('TAB_AUDIT', JSON.stringify(tabAudit, null, 1))

    // ── Dark mode ──
    await page.evaluate(() => {
      document.body.setAttribute('data-ds-dark-theme', '')
      document.documentElement.style.colorScheme = 'dark'
    })
    await page.waitForTimeout(400)
    await page.screenshot({ path: join(SHOTS, 'probe-mcp-servers-dark.png') })

    // Web search page dark + select computed styles
    await dialog.getByRole('button', { name: '网络搜索', exact: true }).click()
    await page.waitForTimeout(800)
    await page.screenshot({ path: join(SHOTS, 'probe-websearch-dark.png') })
    const selectAudit = await page.evaluate(() => {
      const selects = [...document.querySelectorAll('select')]
      return selects.map(sel => {
        const s = getComputedStyle(sel)
        const opt = sel.querySelector('option')
        const o = opt ? getComputedStyle(opt) : null
        return {
          selectBg: s.backgroundColor,
          selectColor: s.color,
          optionBg: o?.backgroundColor,
          optionColor: o?.color,
          colorScheme: s.colorScheme,
        }
      })
    })
    console.log('SELECT_AUDIT', JSON.stringify(selectAudit, null, 1))

    // Tasks page dark
    await dialog.getByRole('button', { name: '定时任务', exact: true }).click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: join(SHOTS, 'probe-tasks-dark.png') })

    console.log('screenshots written to shots/')
  } finally {
    await browser.close()
    host.child.kill('SIGTERM')
  }
}

await main()
