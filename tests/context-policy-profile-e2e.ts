import { randomUUID } from 'node:crypto'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createServer } from 'node:net'
import { spawn, type ChildProcess } from 'node:child_process'
import { startOpenAiFixture } from './openai-fixture.ts'
import { bundlePack } from './packs.ts'

/**
 * STATUS (2026-09-18): blocked on the harness snapshot's own defects, in
 * both boot modes, with different signatures —
 *  - built CLI (lib/bin.js): `session/create` args descriptor rejects the
 *    `cwd`/`agentPreset` fields that SessionCreateRequest itself declares;
 *  - tsx source CLI: `session/create` reports "strict definition was
 *    withdrawn" right after boot.
 * The 0.1.6 wire adaptations here (launch-token cookie auth, slash
 * endpoints, `{args}` envelope) are correct regardless. Re-run once the
 * harness checkout boots its own surface cleanly.
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DSH = process.env.DSH_REPO !== undefined ? resolve(process.env.DSH_REPO) : resolve(ROOT, '..', 'deepseek-harness')
/**
 * Prefer the harness's compiled CLI (lib/bin.js): 0.1.6 typert enforces strict
 * compiled definitions, so the host and the served client bundles must come
 * from the same built tree. The tsx source path stays as the checkout
 * fallback for hack days when lib has not been built.
 */
const CLI_LIB = join(DSH, 'apps/cli/lib/bin.js')
const CLI_SRC = join(DSH, 'apps/cli/src/bin.ts')
// DSH_E2E_FORCE_SOURCE=1 boots the tsx source CLI instead — the Node-RPC
// e2e validates against the host's source registry and never loads client
// bundles, so strict-definition coupling with compiled artifacts is moot.
const CLI = existsSync(CLI_LIB) && process.env.DSH_E2E_FORCE_SOURCE !== '1' ? CLI_LIB : CLI_SRC
const CLI_SRC_LOADER = join(DSH, 'node_modules/tsx/dist/loader.mjs')
const bootArgs = (args: string[]): string[] =>
  CLI.endsWith('.ts') ? ['--import', pathToFileURL(CLI_SRC_LOADER).href, CLI, ...args] : [CLI, ...args]


interface RpcFailure {
  message: string
}

interface RpcEnvelope<T> {
  result: { ok: true; value: T } | { ok: false; error: RpcFailure }
}

async function run(args: string[], env: NodeJS.ProcessEnv): Promise<{ code: number; output: string }> {
  return await new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, bootArgs(args), {
      cwd: DSH,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    child.stdout.on('data', chunk => { output += chunk.toString() })
    child.stderr.on('data', chunk => { output += chunk.toString() })
    child.on('error', reject)
    child.on('close', code => { resolveRun({ code: code ?? 1, output }) })
  })
}

async function reservePort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolveListen, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolveListen)
  })
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('could not reserve a local port')
  await new Promise<void>((resolveClose, reject) => { server.close(error => error === undefined ? resolveClose() : reject(error)) })
  return address.port
}

async function startHost(home: string, port: number): Promise<{ child: ChildProcess; url: string }> {
  const child = spawn(process.execPath, bootArgs(['web', '--host', '127.0.0.1', '--port', String(port)]), {
    cwd: DSH,
    env: { ...process.env, DSH_HOME: home, DSH_PERMISSION_MODE: 'danger-full-access' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  const url = await new Promise<string>((resolveUrl, reject) => {
    const timeout = setTimeout(() => reject(new Error(`DSH startup timed out\n${output}`)), 45_000)
    const consume = (chunk: Buffer): void => {
      output += chunk.toString()
      const match = /dsh web: (http:\/\/127\.0\.0\.1:\d+\S*)/.exec(output)
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
  const waitForExit = async (signal: NodeJS.Signals): Promise<boolean> => {
    if (child.exitCode !== null) return true
    return await new Promise(resolveExit => {
      const onExit = (): void => {
        clearTimeout(timeout)
        resolveExit(true)
      }
      const timeout = setTimeout(() => {
        child.removeListener('exit', onExit)
        resolveExit(child.exitCode !== null)
      }, 10_000)
      child.once('exit', onExit)
      child.kill(signal)
    })
  }

  if (await waitForExit('SIGTERM')) return
  await waitForExit('SIGKILL')
}

/**
 * 0.1.6 authenticates the web surface with a launch token on the printed URL:
 * the token mints a signed cookie at the root, and every /api call then rides
 * that cookie. Node-side callers exchange the token once and replay the cookie.
 */
async function mintAuthCookie(authenticatedUrl: string): Promise<string> {
  const response = await fetch(authenticatedUrl, { redirect: 'manual' })
  const cookie = response.headers.getSetCookie()[0]?.split(';')[0]
  if (cookie === undefined) throw new Error(`no auth cookie minted from ${authenticatedUrl}`)
  return cookie
}

async function rpc<T>(baseUrl: string, cookie: string, method: string, payload: unknown): Promise<T> {
  const base = new URL(baseUrl)
  base.search = ''
  const response = await fetch(`${base.origin}/api/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ type: 'client-request', rpcId: randomUUID(), method, payload: { args: payload } }),
  })
  const body = await response.json() as RpcEnvelope<T>
  if (!body.result.ok) throw new Error(`${method} failed: ${body.result.error.message}`)
  return body.result.value
}

async function expectPoll(condition: () => boolean, message: string): Promise<void> {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (condition()) return
    await new Promise(resolveWait => setTimeout(resolveWait, 50))
  }
  throw new Error(message)
}

function includesMarker(body: unknown, marker: string): boolean {
  return JSON.stringify(body).includes(marker)
}

async function main(): Promise<void> {
  const bundle = bundlePack()

  const home = await mkdtemp(join(tmpdir(), 'dsh-control-center-context-e2e-'))
  const fixture = await startOpenAiFixture()
  let host: ChildProcess | undefined
  try {
    const env = { ...process.env, DSH_HOME: home }
    const install = await run(['plugin', '--profile', 'web', 'add', bundle], env)
    if (install.code !== 0) throw new Error(`packed install failed\n${install.output}`)

    const settings = [
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
      '        - id: cc-e2e-summary',
      '          name: Control Center Summary',
      'agent-default-model:',
      '  provider: control-center-e2e',
      '  model: cc-e2e-alpha',
      'control-center-general:',
      '  contextEnabled: true',
      '  contextMaxMessages: 1',
      '  contextToolOutputThreshold: 2000',
      '  contextAutoCompress: true',
      '  contextCompressionProvider: control-center-e2e',
      '  contextCompressionModel: cc-e2e-summary',
      '',
    ].join('\n')
    await writeFile(join(home, 'settings.yaml'), settings)
    await writeFile(join(home, '.credentials.yaml'), 'CONTROL_CENTER_E2E_API_KEY: local-fixture-key\n')

    const port = await reservePort()
    const started = await startHost(home, port)
    const cookie = await mintAuthCookie(started.url)
    host = started.child
    const workspace = join(home, 'workspace')
    await mkdir(workspace, { recursive: true })
    const created = await rpc<{ sessionId: string }>(started.url, cookie, 'session/create', {
      cwd: workspace,
      agentPreset: 'standard',
    })
    const sessionId = created.sessionId

    const send = async (targetSessionId: string, text: string): Promise<void> => {
      await rpc(started.url, cookie, 'session/prompt', {
        sessionId: targetSessionId,
        mode: 'queue',
        content: [{ type: 'text', text }],
      })
      await expectPoll(
        () => fixture.requests.some(request => includesMarker(request.body, text)),
        `model request did not contain ${text}`,
      )
    }

    const old = 'CC_CONTEXT_OLD_SENTINEL'
    const recent = 'CC_CONTEXT_RECENT_SENTINEL'
    const current = 'CC_CONTEXT_CURRENT_SENTINEL'
    await send(sessionId, old)
    await send(sessionId, recent)
    await send(sessionId, current)

    const summary = fixture.requests.find(request => {
      const body = request.body as { model?: unknown }
      return body.model === 'cc-e2e-summary'
        && includesMarker(body, 'acting as a compaction engine')
    })
    if (summary === undefined) {
      throw new Error(`configured summary model was not used: ${JSON.stringify(fixture.requests)}`)
    }
    const currentRequest = fixture.requests.find(request => {
      const body = request.body as { model?: unknown }
      return body.model === 'cc-e2e-alpha' && includesMarker(body, current)
    })
    if (currentRequest === undefined) throw new Error('the continued conversation did not use the regular session model')
    if (includesMarker(currentRequest.body, old)) {
      throw new Error('the continued conversation still included the shadowed history sentinel')
    }
    if (!includesMarker(currentRequest.body, 'compacted-summary')) {
      throw new Error('the continued conversation did not include the compaction checkpoint')
    }

    const history = await rpc<{ events: Array<{ event: { type: string; data: unknown } }> }>(
      started.url,
      cookie,
      'session/history',
      { sessionId, maxMessages: 100 },
    )
    const serializedHistory = JSON.stringify(history.events)
    for (const type of ['compaction/start', 'compaction/summary', 'compaction/end']) {
      if (!serializedHistory.includes(type)) throw new Error(`session history did not retain ${type}`)
    }
    if (!serializedHistory.includes('"plugin":"compact"')) {
      throw new Error('session history did not retain the DSH compaction checkpoint provenance')
    }

    const described = await rpc<{
      namespaces: Array<{ ns: string; revision: number }>
    }>(started.url, cookie, 'settings/describe', {})
    const general = described.namespaces.find(namespace => namespace.ns === 'control-center-general')
    if (general === undefined) throw new Error('Control Center general settings namespace was not registered')
    await rpc(started.url, cookie, 'settings/mutate', {
      ns: 'control-center-general',
      expectedRevision: general.revision,
      ops: [{ op: 'set', path: ['contextAutoCompress'], value: false }],
    })

    const omissionSession = await rpc<{ sessionId: string }>(started.url, cookie, 'session/create', {
      cwd: workspace,
      agentPreset: 'standard',
    })
    const omittedOld = 'CC_OMISSION_OLD_SENTINEL'
    const omittedRecent = 'CC_OMISSION_RECENT_SENTINEL'
    const omittedCurrent = 'CC_OMISSION_CURRENT_SENTINEL'
    const requestsBeforeOmission = fixture.requests.length
    await send(omissionSession.sessionId, omittedOld)
    await send(omissionSession.sessionId, omittedRecent)
    await send(omissionSession.sessionId, omittedCurrent)

    const omissionRequests = fixture.requests.slice(requestsBeforeOmission)
    if (omissionRequests.some(request => (request.body as { model?: unknown }).model === 'cc-e2e-summary')) {
      throw new Error('automatic compression disabled still sent a summary-model request')
    }
    const omissionCurrentRequest = omissionRequests.find(request => {
      const body = request.body as { model?: unknown }
      return body.model === 'cc-e2e-alpha' && includesMarker(body, omittedCurrent)
    })
    if (omissionCurrentRequest === undefined) throw new Error('omission session did not continue on the regular model')
    if (includesMarker(omissionCurrentRequest.body, omittedOld)) {
      throw new Error('omission session still included the shadowed history sentinel')
    }
    if (!includesMarker(omissionCurrentRequest.body, 'Earlier conversation history was omitted')) {
      throw new Error('omission session did not include the explicit context-window checkpoint')
    }

    const omissionHistory = await rpc<{ events: Array<{ event: { type: string; data: unknown } }> }>(
      started.url,
      cookie,
      'session/history',
      { sessionId: omissionSession.sessionId, maxMessages: 100 },
    )
    const checkpointIndexes = omissionHistory.events.flatMap((entry, index) => {
      if (entry.event.type !== 'user/message') return []
      const source = (entry.event.data as { source?: { kind?: unknown; plugin?: unknown } }).source
      return source?.kind === 'plugin' && source.plugin === 'control-center-context-policy'
        ? [index]
        : []
    })
    if (checkpointIndexes.length === 0 || checkpointIndexes.some(index =>
      omissionHistory.events[index - 1]?.event.type !== 'compaction/prune')) {
      throw new Error(`omission session did not retain an adjacent shadow price and Control Center checkpoint: ${JSON.stringify(omissionHistory.events)}`)
    }
    process.stdout.write('context-profile-e2e: packed profile applied summary and omission message windows\n')
  } finally {
    if (host !== undefined) await stopHost(host).catch(() => {})
    await fixture.close()
    await rm(home, { recursive: true, force: true })
  }
}

await main()
