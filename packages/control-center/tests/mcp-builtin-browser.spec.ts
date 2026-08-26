import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { afterEach, describe, expect, it } from 'vitest'
import { AVAILABLE_INMEMORY_RUNTIMES, createInMemoryServer } from '../src/mcp-builtin-runtime.ts'

const realFetch = globalThis.fetch

afterEach(() => { globalThis.fetch = realFetch })

async function callTool(name: string, args: Record<string, unknown>): Promise<{ text: string; isError: boolean }> {
  const running = createInMemoryServer(name)
  const client = new Client({ name: 'test-client', version: '1.0.0' })
  await client.connect(running.clientTransport)
  const result = await client.callTool({ name: 'fetch_page', arguments: args }) as {
    content?: Array<{ type: string; text?: string }>
    isError?: boolean
  }
  await client.close()
  return {
    text: result.content?.map(part => part.text ?? '').join('') ?? '',
    isError: result.isError === true,
  }
}

describe('browser builtin MCP server', () => {
  it('is listed as available and instantiates', () => {
    expect(AVAILABLE_INMEMORY_RUNTIMES).toContain('browser')
    expect(() => createInMemoryServer('browser')).not.toThrow()
  })

  it('refuses private-network URLs without touching the network', async () => {
    let fetched = false
    globalThis.fetch = (async () => { fetched = true; throw new Error('should not fetch') }) as unknown as typeof fetch
    const result = await callTool('browser', { url: 'http://127.0.0.1:8080/admin' })
    expect(result.isError).toBe(true)
    expect(result.text).toContain('私有')
    expect(fetched).toBe(false)
  })

  it('fetches a page and returns title plus readable text', async () => {
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      arrayBuffer: async () => new TextEncoder().encode(
        '<html><head><title>示例页面</title></head><body><p>第一段内容</p><script>evil()</script><p>第二段 &amp; 符号</p></body></html>',
      ).buffer as ArrayBuffer,
    })) as unknown as typeof fetch
    const result = await callTool('browser', { url: 'https://example.com/page' })
    expect(result.isError).toBe(false)
    expect(result.text).toContain('# 示例页面')
    expect(result.text).toContain('第一段内容')
    expect(result.text).toContain('第二段 & 符号')
    expect(result.text).not.toContain('evil()')
  })

  it('reports http errors honestly', async () => {
    globalThis.fetch = (async () => ({
      ok: false,
      status: 404,
      headers: new Headers(),
      arrayBuffer: async () => new ArrayBuffer(0),
    })) as unknown as typeof fetch
    const result = await callTool('browser', { url: 'https://example.com/missing' })
    expect(result.text).toContain('404')
  })
})
