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
  child.kill('SIGTERM')
  await new Promise<void>(resolveStop => child.once('exit', () => { resolveStop() }))
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
    await page.goto(started.url, { waitUntil: 'load' })
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
    const openSidebar = page.getByRole('button', { name: '打开侧边栏' })
    if (await openSidebar.count() > 0) await openSidebar.click()
    await page.getByRole('button', { name: '设置', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: '设置' })
    await dialog.getByRole('button', { name: '模型' }).click()
    await dialog.getByText('Control Center E2E', { exact: true }).waitFor({ timeout: 15_000 })
    await dialog.getByRole('button', { name: '编辑 Control Center E2E (control-center-e2e)' }).click()
    await dialog.getByText('自定义设置').click()
    await dialog.getByRole('button', { name: '获取可用模型' }).click()
    const chooser = page.getByRole('dialog', { name: '选择要添加的模型' })
    await chooser.getByText('cc-e2e-beta', { exact: true }).waitFor({ timeout: 15_000 })
    await chooser.getByRole('button', { name: '取消' }).click()
    await dialog.getByRole('button', { name: '关闭设置' }).click()

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
