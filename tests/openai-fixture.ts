import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'

export interface OpenAiFixture {
  baseURL: string
  requests: Array<{ path: string; body: unknown }>
  close(): Promise<void>
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk: string) => { body += chunk })
    request.on('end', () => { resolve(body) })
    request.on('error', reject)
  })
}

function sendJson(response: ServerResponse, value: unknown): void {
  const body = JSON.stringify(value)
  response.writeHead(200, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body),
  })
  response.end(body)
}

/** Start a keyless OpenAI-compatible models + streaming chat fixture. */
export async function startOpenAiFixture(): Promise<OpenAiFixture> {
  const requests: OpenAiFixture['requests'] = []
  const server: Server = createServer(async (request, response) => {
    const path = request.url ?? '/'
    if (request.method === 'GET' && path === '/v1/models') {
      sendJson(response, {
        object: 'list',
        data: [
          { id: 'cc-e2e-alpha', name: 'Control Center Alpha', context_window: 65536, max_output_tokens: 4096 },
          { id: 'cc-e2e-beta', name: 'Control Center Beta', context_window: 131072, max_output_tokens: 8192 },
        ],
      })
      return
    }
    if (request.method === 'POST' && path === '/v1/chat/completions') {
      const body = JSON.parse(await readBody(request)) as { messages?: Array<{ content?: unknown }>; max_tokens?: number }
      requests.push({ path, body })
      const title = body.max_tokens === 64
      const text = title ? 'Control Center test' : 'CONTROL_CENTER_E2E_RESPONSE'
      response.writeHead(200, { 'content-type': 'text/event-stream' })
      response.end([
        `data: ${JSON.stringify({ choices: [{ delta: { role: 'assistant', content: text } }] })}`,
        `data: ${JSON.stringify({ choices: [{ delta: { content: '' }, finish_reason: 'stop' }], usage: { prompt_tokens: 3, completion_tokens: 1 } })}`,
        'data: [DONE]',
        '',
      ].join('\n\n'))
      return
    }
    response.writeHead(404)
    response.end()
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('OpenAI fixture did not bind')
  return {
    baseURL: `http://127.0.0.1:${String(address.port)}/v1`,
    requests,
    close: () => new Promise((resolve, reject) => {
      server.close(error => { if (error === undefined) resolve(); else reject(error) })
    }),
  }
}
