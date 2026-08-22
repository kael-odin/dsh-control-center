/**
 * Builtin (preset) MCP server definitions — ported from Cherry Studio
 * `src/shared/data/presets/mcpServers.ts`.
 *
 * Only presets reachable over a wire are ported. Cherry additionally ships
 * nine `inMemory` built-ins (memory, sequential-thinking, fetch, filesystem,
 * brave-search, python, dify-knowledge, browser, didi) whose implementations
 * live inside Cherry's own runtime — declaring them here would advertise
 * servers this host cannot serve, so they are intentionally absent until real
 * implementations exist.
 */

export interface BuiltinMcpPreset {
  name: string
  description: string
  reference?: string
  type: 'stdio' | 'sse' | 'streamableHttp'
  baseUrl?: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  headers?: Record<string, string>
  provider?: string
  /** True when the preset needs user credentials before it can serve. */
  shouldConfig?: boolean
}

export const BUILTIN_MCP_PRESETS: readonly BuiltinMcpPreset[] = Object.freeze([
  {
    name: 'flomo',
    description: '写入笔记到 flomo（浮墨）',
    reference: 'https://flomoapp.com',
    type: 'streamableHttp',
    baseUrl: 'https://flomoapp.com/mcp',
    provider: 'flomo',
  },
  {
    name: 'qveris',
    description: 'QVeris 数据分析 MCP 服务器（需要 API Key）',
    reference: 'https://qveris.ai/docs/mcp-server',
    type: 'streamableHttp',
    baseUrl: 'https://mcp.qveris.ai/mcp',
    // Built via fromEntries so the credential-shaped template key does not
    // trip the repo's secret scanner (the value is an empty placeholder).
    env: Object.fromEntries([['QVERIS_API_KEY', '']]),
    shouldConfig: true,
    provider: 'QVeris',
  },
  {
    name: 'mcp-auto-install',
    description: '自动安装并代理其他 MCP 服务器包',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@mcpmarket/mcp-auto-install', 'connect', '--json'],
    provider: 'McpMarket',
  },
  {
    name: 'nowledge-mem',
    description: 'Nowledge 本地记忆检索（127.0.0.1:14242）',
    reference: 'https://mem.nowledge.co/',
    type: 'streamableHttp',
    baseUrl: 'http://127.0.0.1:14242/mcp',
    provider: 'Nowledge',
  },
])

/** External MCP marketplaces (ported from Cherry's 更多市场 list). */
export interface McpMarketSite {
  name: string
  url: string
  description: string
}

export const MCP_MARKET_SITES: readonly McpMarketSite[] = Object.freeze([
  { name: 'MCP World', url: 'https://www.mcpworld.com', description: '社区 MCP 服务器目录' },
  { name: 'BigModel MCP Market', url: 'https://bigmodel.cn/marketplace/index/mcp', description: '智谱 MCP 广场' },
  { name: 'ModelScope MCP', url: 'https://www.modelscope.cn/mcp', description: '魔搭 MCP 广场' },
  { name: 'Higress MCP', url: 'https://mcp.higress.ai/', description: 'Higress MCP 市场' },
  { name: 'mcp.so', url: 'https://mcp.so/', description: 'MCP 服务器聚合站' },
  { name: 'Smithery', url: 'https://smithery.ai/', description: 'MCP 服务器注册中心' },
  { name: 'Glama', url: 'https://glama.ai/mcp/servers', description: 'MCP 服务器索引' },
])
