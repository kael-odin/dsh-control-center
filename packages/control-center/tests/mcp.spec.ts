import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { McpService } from '../src/mcp.ts'

describe('McpService.discoverMcpServers', () => {
  function setup() {
    const stored = new Map<string, unknown>()
    const ctx = new Context()
    ;(ctx as unknown as { settings: unknown }).settings = {
      get: (ns: string) => stored.get(String(ns)),
      update: async (ns: string, value: object) => { stored.set(String(ns), structuredClone(value)) },
      register: () => {
        const scope: unknown = { get: () => ({}), update: async () => ({}) }
        return scope
      },
    } as never
    const service = new McpService(ctx)
    return { service }
  }

  const bailianResponse = {
    success: true,
    message: 'ok',
    total: 1,
    data: [
      { id: 'mcp-1', name: '百炼文档', description: '文档处理', operationalUrl: 'https://mcp.example.com/doc', type: 'streamableHttp' },
      { id: 'mcp-2', name: '无 URL 服务', operationalUrl: '', type: 'sse' },
    ],
  }

  it('maps Bailian hosted servers, dropping entries without an operationalUrl', async () => {
    const { service } = setup()
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify(bailianResponse), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })) as unknown as typeof fetch

    const servers = await service.discoverMcpServers('bailian', 'sk-test')
    expect(servers).toHaveLength(1)
    expect(servers[0]).toMatchObject({ name: '百炼文档', operationalUrl: 'https://mcp.example.com/doc', type: 'streamableHttp' })
    // The Authorization header carried the token.
    const [url, init] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    expect(String(url)).toContain('dashscope.aliyuncs.com')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-test')
  })

  it('rejects a 401 as an honest auth error', async () => {
    const { service } = setup()
    globalThis.fetch = vi.fn(async () => new Response('', { status: 401 })) as unknown as typeof fetch
    await expect(service.discoverMcpServers('bailian', 'bad-token')).rejects.toThrow(/认证失败/)
  })

  it('rejects an empty token before any network call', async () => {
    const { service } = setup()
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch
    await expect(service.discoverMcpServers('modelscope', '  ')).rejects.toThrow(/请输入 Token/)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
