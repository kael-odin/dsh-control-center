import { describe, expect, it } from 'vitest'
import { parseServerSpec, parseProtocolServers } from '../src/client/mcp-import.ts'

describe('parseServerSpec', () => {
  it('parses an npx command line, dropping yes-flags', () => {
    const result = parseServerSpec('npx -y @modelcontextprotocol/server-filesystem')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.spec).toMatchObject({
      type: 'stdio',
      command: 'npx',
      args: ['@modelcontextprotocol/server-filesystem'],
      name: 'server-filesystem',
    })
  })

  it('parses a bare JSON definition with env and explicit type', () => {
    const json = JSON.stringify({
      command: 'uvx',
      args: ['mcp-server-git'],
      env: { GIT_REPO: 'file:///repo' },
    })
    const result = parseServerSpec(json)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.spec.type).toBe('stdio')
    expect(result.spec.command).toBe('uvx')
    expect(result.spec.env).toEqual({ GIT_REPO: 'file:///repo' })
  })

  it('unwraps an mcpServers wrapper and names from the key', () => {
    const json = JSON.stringify({
      mcpServers: { 'my-git': { command: 'uvx', args: ['mcp-server-git'] } },
    })
    const result = parseServerSpec(json)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.spec.name).toBe('my-git')
    expect(result.spec.command).toBe('uvx')
  })

  it('maps a URL to streamableHttp with hostname as the name', () => {
    const result = parseServerSpec('https://mcp.example.com/rpc')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.spec.type).toBe('streamableHttp')
    expect(result.spec.baseUrl).toBe('https://mcp.example.com/rpc')
    expect(result.spec.name).toBe('mcp.example.com')
  })

  it('refuses unrecognizable input with readable copy', () => {
    const result = parseServerSpec('hello world')
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('无法识别') })
    expect(parseServerSpec('   ')).toMatchObject({ ok: false })
    expect(parseServerSpec('{broken')).toMatchObject({ ok: false, error: expect.stringContaining('JSON') })
  })
})

describe('parseProtocolServers', () => {
  it('parses a JSON array into multiple server installs', () => {
    const result = parseProtocolServers(JSON.stringify([
      { name: 'git', command: 'npx', args: ['-y', 'mcp-git'] },
      { name: 'memory', url: 'https://mcp.example.com/memory' },
    ]))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.servers).toHaveLength(2)
    expect(result.servers[0]).toMatchObject({ name: 'git', type: 'stdio', command: 'npx', args: ['-y', 'mcp-git'] })
    expect(result.servers[1]).toMatchObject({ name: 'memory', type: 'streamableHttp', baseUrl: 'https://mcp.example.com/memory' })
  })

  it('parses a mcpServers keyed object', () => {
    const result = parseProtocolServers(JSON.stringify({
      mcpServers: {
        serverA: { url: 'https://a.example.com/mcp', type: 'sse' },
        serverB: { command: 'uvx', args: ['tool-b'] },
      },
    }))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.servers).toHaveLength(2)
    expect(result.servers.find(s => s.name === 'serverA')).toMatchObject({ type: 'sse' })
    expect(result.servers.find(s => s.name === 'serverB')).toMatchObject({ type: 'stdio', command: 'uvx' })
  })

  it('refuses non-batch input', () => {
    expect(parseProtocolServers('npx -y some-pkg')).toMatchObject({ ok: false })
    expect(parseProtocolServers('')).toMatchObject({ ok: false })
    expect(parseProtocolServers('42')).toMatchObject({ ok: false })
  })
})
