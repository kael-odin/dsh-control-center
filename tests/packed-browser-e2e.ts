import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawn, type ChildProcess } from 'node:child_process'
import { chromium } from 'playwright'
import { startOpenAiFixture } from './openai-fixture.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DSH = resolve(ROOT, '..', 'deepseek-harness')
const PACKS = join(ROOT, '.packs')
const CLI = join(DSH, 'apps/cli/src/bin.ts')
const TSX = join(DSH, 'node_modules/tsx/dist/loader.mjs')

async function run(args: string[], env: NodeJS.ProcessEnv): Promise<{ code: number; output: string }> {
  const loader = pathToFileURL(TSX).href
  return await new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, ['--import', loader, CLI, ...args], { cwd: DSH, env, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', chunk => { output += chunk.toString() })
    child.stderr.on('data', chunk => { output += chunk.toString() })
    child.on('error', reject)
    child.on('close', code => { resolveRun({ code: code ?? 1, output }) })
  })
}

async function startHost(home: string, port: number): Promise<{ child: ChildProcess; url: string }> {
  const child = spawn(process.execPath, ['--import', pathToFileURL(TSX).href, CLI, 'web', '--host', '127.0.0.1', '--port', String(port)], {
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
      if (match?.[1] !== undefined) {
        clearTimeout(timeout)
        resolveUrl(match[1])
      }
    }
    child.stdout.on('data', consume)
    child.stderr.on('data', consume)
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`DSH exited ${String(code)}\n${output}`)) })
  })
  return { child, url }
}

async function stopHost(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null) return
  const exited = await new Promise<boolean>((resolveExit) => {
    const timeout = setTimeout(() => resolveExit(false), 10_000)
    child.once('exit', () => { clearTimeout(timeout); resolveExit(true) })
    child.kill('SIGTERM')
  })
  if (exited || child.exitCode !== null) return
  child.kill('SIGKILL')
  await new Promise<void>(resolveExit => { child.once('exit', () => { resolveExit() }) })
}

async function expectPoll<T>(read: () => Promise<T>, expected: T, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await read() === expected) return
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  throw new Error(`poll timed out waiting for ${String(expected)}`)
}

async function main(): Promise<void> {
  if (!existsSync(join(PACKS, 'dsh-control-center-bundle-0.1.0.tgz'))) {
    throw new Error('packed bundle missing; run pnpm pack:check first')
  }
  const home = await mkdtemp(join(tmpdir(), 'dsh-control-center-e2e-'))
  const fixture = await startOpenAiFixture()
  let host: ChildProcess | undefined
  const executablePath = process.env.DSH_PLAYWRIGHT_EXECUTABLE_PATH
  const browser = await chromium.launch(executablePath === undefined ? {} : { executablePath })
  try {
    const env = { ...process.env, DSH_HOME: home }
    const install = await run([
      'plugin', '--profile', 'web', 'add', join(PACKS, 'dsh-control-center-bundle-0.1.0.tgz'),
    ], env)
    if (install.code !== 0) throw new Error(`packed install failed\n${install.output}`)
    const profile = join(home, 'profiles/web')
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
    const started = await startHost(home, 3197)
    host = started.child
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, locale: 'zh-CN' })
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    // Name failing requests: a bare "404" console line names no culprit.
    page.on('response', response => {
      if (response.status() >= 400) errors.push(`HTTP ${String(response.status())} ${response.url()}`)
    })
    await page.goto(started.url, { waitUntil: 'load' })
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
    const openSidebar = page.getByRole('button', { name: '打开侧边栏' })
    if (await openSidebar.count() > 0) await openSidebar.click()
    const openOnboarding = page.getByRole('dialog')
    if (await openOnboarding.count() > 0) {
      const dismiss = openOnboarding.getByRole('button', { name: /知道了|稍后|关闭|Close|Later|Got it/ }).last()
      if (await dismiss.count() > 0) await dismiss.click()
      else await page.keyboard.press('Escape')
      await openOnboarding.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})
    }
    const mask = page.locator('[aria-hidden="true"][class*="mask"]')
    if (await mask.count() > 0) {
      await mask.click({ position: { x: 4, y: 4 } })
      await mask.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})
    }
    const settingsButton = page.getByRole('button', { name: '设置', exact: true })
    await settingsButton.evaluate((button: HTMLButtonElement) => { button.click() })
    await expectPoll(async () => await settingsButton.getAttribute('aria-expanded'), 'true', 15_000)
    const dialog = page.getByRole('dialog', { name: '设置' })
    await dialog.waitFor({ timeout: 15_000 })
    await dialog.getByRole('button', { name: '模型服务', exact: true }).evaluate((button: HTMLButtonElement) => { button.click() })
    await dialog.getByText('Control Center E2E', { exact: true }).waitFor({ timeout: 15_000 })
    const betaNotice = page.getByRole('dialog', { name: '内测声明' })
    if (await betaNotice.count() > 0) {
      const continueButton = betaNotice.getByRole('button', { name: '继续' })
      if (await continueButton.count() > 0) await continueButton.evaluate((element: HTMLButtonElement) => { element.click() })
      if (await betaNotice.isVisible().catch(() => false)) await page.keyboard.press('Escape')
      await betaNotice.waitFor({ state: 'hidden', timeout: 15_000 })
    }
    // Select the provider's row; the right pane is an always-expanded editor.
    const e2eRow = dialog.getByText('Control Center E2E', { exact: true }).locator('xpath=ancestor-or-self::*[@role="button"][1]')
    await e2eRow.evaluate((row: HTMLElement) => { row.click() })
    await dialog.getByText('API 密钥').waitFor({ timeout: 15_000 })
    await dialog.getByRole('button', { name: /获取模型列表/ }).click()
    const chooser = page.getByRole('dialog', { name: '选择要添加的模型' })
    await chooser.getByText('cc-e2e-beta', { exact: true }).waitFor({ timeout: 15_000 })
    await chooser.getByRole('button', { name: '取消' }).click()
    // 默认模型 page: Cherry ModelSettings parity — quick model row, topic
    // naming drawer, and the retry group whose save projects real policies.
    await dialog.getByRole('button', { name: '默认模型', exact: true }).evaluate((button: HTMLButtonElement) => { button.click() })
    await dialog.getByText('快捷模型', { exact: true }).waitFor({ timeout: 15_000 })
    await dialog.getByRole('button', { name: '快捷模型设置' }).click()
    const namingDialog = page.getByRole('dialog').filter({ hasText: '会话自动命名已内建' })
    await namingDialog.waitFor({ timeout: 15_000 })
    await namingDialog.getByRole('button', { name: '关闭' }).click()
    await dialog.getByText('失败后自动重试', { exact: true }).waitFor({ timeout: 15_000 })
    // The styled switch hides the native input; click the label instead.
    await dialog.locator('label[title="失败后自动重试"]').click()
    await expectPoll(async () => (await dialog.getByText(/重试设置已保存并应用到/).count()) > 0, true, 15_000)
    await dialog.getByRole('button', { name: '关闭设置' }).click()

    const translationNav = page.getByRole('button', { name: '翻译' })
    await translationNav.waitFor({ timeout: 15_000 })
    await translationNav.click()
    try {
      await page.getByLabel('待翻译文本').waitFor({ timeout: 15_000 })
    } catch (error) {
      const body = await page.locator('body').innerText().catch(() => '')
      const consoleErrors = await page.evaluate(() => (window as unknown as { __ccErrors?: string[] }).__ccErrors ?? []).catch(() => [])
      const remoteProbe = await page.evaluate(() => {
        const root = window as unknown as { __DSH_BOOT__?: unknown }
        return { boot: root.__DSH_BOOT__ !== undefined }
      }).catch(() => ({ boot: false }))
      throw new Error(`translation workspace did not render; browser errors: ${errors.join(' | ')}; console: ${consoleErrors.join(' | ')}; remote: ${JSON.stringify(remoteProbe)}; body: ${body.slice(-3000)}`, { cause: error })
    }
    await page.getByLabel('待翻译文本').fill('Hello translation fixture')
    await expectPoll(async () => await page.getByLabel('翻译模型').count() > 0, true, 15_000)
    // ModelSelector popover: open, then pick the fixture model row.
    await page.getByLabel('翻译模型').click()
    await page.getByRole('listbox').getByRole('button', { name: /Control Center Alpha/ }).click()
    const translateButton = page.getByRole('main').getByRole('button', { name: '翻译', exact: true })
    await translateButton.waitFor({ state: 'visible', timeout: 15_000 })
    await expectPoll(async () => await translateButton.isEnabled(), true, 15_000)
    await translateButton.click()
    try {
      await expectPoll(async () => (await page.getByLabel('翻译结果').innerText()).includes('CONTROL_CENTER_E2E_RESPONSE'), true, 30_000)
    } catch (error) {
      const body = await page.locator('body').innerText()
      throw new Error(`translation response did not render; fixture: ${JSON.stringify(fixture.requests)}; browser: ${errors.join(' | ')}; body: ${body.slice(-3000)}`, { cause: error })
    }
    // History: open the right-hand panel and confirm the entry plus actions.
    await page.getByRole('button', { name: '翻译历史', exact: true }).click()
    await page.getByText('翻译历史 (1)', { exact: true }).waitFor({ timeout: 15_000 })
    await page.getByText('Hello translation fixture', { exact: false }).first().waitFor({ timeout: 15_000 })
    await page.getByRole('button', { name: '关闭' }).first().click()

    // Painting workspace must render, generate against the real provider, and show an image.
    const paintingNav = page.getByRole('button', { name: '绘画' })
    await paintingNav.waitFor({ timeout: 15_000 })
    await paintingNav.click()
    try {
      await page.getByText('给你的下一幅杰作，留一个位置。', { exact: true }).waitFor({ timeout: 15_000 })
    } catch (error) {
      const body = await page.locator('body').innerText().catch(() => '')
      const surface = await page.evaluate(() => {
        const root = window as unknown as { __ccPainting?: string; __ccErrors?: string[] }
        return { paintingConnected: root.__ccPainting, errors: root.__ccErrors }
      }).catch(() => null)
      throw new Error(`painting workspace did not render; body: ${body.slice(-2500)}; diagnostics: ${JSON.stringify(surface)}; browser errors: ${errors.join(' | ')}`, { cause: error })
    }
    await page.getByLabel('待翻译文本').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})
    await expectPoll(async () => await page.getByLabel('图像模型').count() > 0, true, 15_000)
    await page.getByLabel('图像模型').click()
    await page.getByRole('listbox').getByRole('button', { name: /Control Center Alpha/ }).click()
    await page.getByLabel('绘画提示词').fill('a painting fixture image')
    const sendButton = page.getByRole('main').getByRole('button', { name: '发送' })
    await sendButton.waitFor({ state: 'visible', timeout: 15_000 })
    await expectPoll(async () => await sendButton.isEnabled(), true, 15_000)
    await sendButton.click()
    try {
      await page.getByRole('img', { name: 'a painting fixture image' }).first().waitFor({ timeout: 30_000 })
    } catch (error) {
      const body = await page.locator('body').innerText()
      throw new Error(`painting gallery did not render; fixture: ${JSON.stringify(fixture.requests)}; browser: ${errors.join(' | ')}; body: ${body.slice(-3000)}`, { cause: error })
    }
    // The session strip gains a thumbnail for the new generation.
    await page.getByRole('button', { name: '选择图片' }).first().waitFor({ timeout: 15_000 })
    await page.getByRole('button', { name: '返回对话' }).first().click()
    await page.getByRole('button', { name: '发送消息' }).waitFor({ timeout: 15_000 })

    // Knowledge Base workspace: create a base, add a note source, index with
    // local-hash, and recall a citation through the real service.
    const knowledgeNav = page.getByRole('button', { name: '知识库' })
    await knowledgeNav.waitFor({ timeout: 15_000 })
    await knowledgeNav.click()
    try {
      await page.getByRole('button', { name: '新建知识库' }).waitFor({ timeout: 15_000 })
    } catch (error) {
      const body = await page.locator('body').innerText().catch(() => '')
      throw new Error(`knowledge workspace did not render; browser: ${errors.join(' | ')}; body: ${body.slice(-2500)}`, { cause: error })
    }
    await page.getByRole('button', { name: '新建知识库' }).click()
    await page.getByLabel('名称').fill('e2e 手册')
    await page.getByRole('button', { name: '创建', exact: true }).click()
    try {
      await page.getByText('e2e 手册', { exact: true }).first().waitFor({ timeout: 15_000 })
    } catch (error) {
      throw new Error(`knowledge base row did not render; browser: ${errors.join(' | ')}`, { cause: error })
    }
    await page.getByRole('button', { name: '添加数据源' }).click()
    await page.getByRole('button', { name: '笔记', exact: true }).first().click()
    await page.getByLabel('内容').fill('发布流程要求所有变更先经过本地检查，再进入发布流水线。')
    await page.getByRole('button', { name: '添加', exact: true }).click()
    try {
      await page.getByText('更新于', { exact: false }).waitFor({ timeout: 15_000 })
      await page.getByText('就绪', { exact: true }).first().waitFor({ timeout: 15_000 })
    } catch (error) {
      const body = await page.locator('body').innerText()
      throw new Error(`knowledge source did not render; browser: ${errors.join(' | ')}; body: ${body.slice(-2500)}`, { cause: error })
    }
    // Sources auto-index after add (Cherry behavior); the notice confirms it.
    try {
      await page.getByText(/已索引 1 个来源/).waitFor({ timeout: 20_000 })
    } catch (error) {
      const body = await page.locator('body').innerText()
      throw new Error(`knowledge auto-index did not report; browser: ${errors.join(' | ')}; body: ${body.slice(-2500)}`, { cause: error })
    }
    await page.getByRole('button', { name: '召回测试' }).click()
    await page.getByPlaceholder('输入测试 Query...').fill('发布流程')
    await page.getByRole('button', { name: '检索', exact: true }).click()
    try {
      await page.getByText('发布流程要求所有变更先经过本地检查，再进入发布流水线。', { exact: false }).first().waitFor({ timeout: 15_000 })
    } catch (error) {
      const body = await page.locator('body').innerText()
      throw new Error(`knowledge recall returned no hits; browser: ${errors.join(' | ')}; body: ${body.slice(-2500)}`, { cause: error })
    }
    await page.getByRole('button', { name: '关闭' }).first().click()
    await page.getByRole('button', { name: '返回对话' }).click()
    await page.getByRole('button', { name: '发送消息' }).waitFor({ timeout: 15_000 })

    const workspacePath = join(home, 'workspace')
    await mkdir(workspacePath, { recursive: true })
    const created = await page.evaluate(`(async () => {
      const request = async (method, payload) => {
        const rpcId = crypto.randomUUID();
        const response = await fetch('/api/' + method, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ type: 'client-request', rpcId, method, payload }),
        });
        return await response.json();
      };
      const workspace = await request('workspace.create', { path: ${JSON.stringify(workspacePath)} });
      if (!workspace.result.ok) throw new Error(workspace.result.error.message);
      const session = await request('session.create', { workspaceId: workspace.result.value.workspace.workspaceId });
      if (!session.result.ok) throw new Error(session.result.error.message);
      return session.result.value.sessionId;
    })()`) as string
    await page.evaluate((sessionId) => {
      localStorage.setItem('dsh.sessions.current', JSON.stringify({ sessionId }))
      window.location.reload()
    }, created)
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
    const composer = page.locator('textarea:enabled[placeholder="描述你想要构建的内容"]')
    await composer.fill('reply with the fixture marker')
    const sessionErrors: string[] = []
    page.on('response', async (response) => {
      if (!response.url().includes('/api/session.prompt')) return
      sessionErrors.push(await response.text())
    })
    await page.getByRole('button', { name: '发送消息' }).click()
    try {
      await page.getByText('CONTROL_CENTER_E2E_RESPONSE', { exact: false }).last().waitFor({ timeout: 30_000 })
    } catch (error) {
      const errorText = await page.locator('body').innerText().catch(() => '')
      throw new Error(`assistant marker did not render; prompt responses: ${sessionErrors.join(' | ')}; fixture requests: ${JSON.stringify(fixture.requests)}; page: ${errorText.slice(-2000)}`, { cause: error })
    }
    if (errors.length > 0) throw new Error(`browser errors: ${errors.join('\n')}`)
    if (!fixture.requests.some(request => JSON.stringify(request.body).includes('cc-e2e-alpha'))) {
      throw new Error('the configured model did not reach the OpenAI fixture')
    }
    const sessionRoot = join(home, 'sessions')
    const files = await readFile(join(home, 'settings.yaml'), 'utf8')
    if (!files.includes('control-center-e2e')) throw new Error('provider settings did not persist')
    const history = await page.evaluate(`(async () => {
      const method = 'session.history';
      const rpcId = crypto.randomUUID();
      const response = await fetch('/api/' + method, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'client-request', rpcId, method, payload: { sessionId: ${JSON.stringify(created)}, maxMessages: 100 } }),
      });
      return await response.json();
    })()`)
    if (!JSON.stringify(history).includes('CONTROL_CENTER_E2E_RESPONSE')) {
      throw new Error('assistant response was not visible through persisted session history')
    }
    await stopHost(host)
    host = undefined
    const persisted = await import('node:fs/promises').then(async fs => {
      const names = await fs.readdir(sessionRoot, { recursive: true })
      return (await Promise.all(names.filter(name => name.endsWith('.jsonl') || name.endsWith('.jsonl.zstd')).map(async (name) => {
        const data = await fs.readFile(join(sessionRoot, name))
        return { name, bytes: data.byteLength }
      })))
    })
    if (persisted.length === 0 || persisted.some(entry => entry.bytes === 0)) {
      throw new Error(`session artifact was not durably materialized: ${JSON.stringify(persisted)}`)
    }
    process.stdout.write('browser-e2e: provider discovery, settings shell, real session prompt, and persistence verified\n')

    const remove = await run(['plugin', '--profile', 'web', 'remove', '@dsh-control-center/bundle'], env)
    if (remove.code !== 0) throw new Error(`packed remove failed\n${remove.output}`)
    const manifest = JSON.parse(await readFile(join(profile, 'package.json'), 'utf8')) as { dsh?: { profile?: { bundles?: string[] } } }
    if (manifest.dsh?.profile?.bundles?.includes('@dsh-control-center/bundle')) throw new Error('bundle remained active after removal')
    if (!(await readFile(join(home, 'settings.yaml'), 'utf8')).includes('control-center-e2e')) {
      throw new Error('removal damaged DSH settings')
    }
  } finally {
    if (host !== undefined) await stopHost(host).catch(() => {})
    await browser.close()
    await fixture.close()
    await rm(home, { recursive: true, force: true })
  }
}

await main()
