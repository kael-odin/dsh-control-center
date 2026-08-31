/**
 * Builtin (preset) MCP server definitions — ported from Cherry Studio
 * `src/shared/data/presets/mcpServers.ts`.
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
    name: 'ExaMCP',
    description: 'Exa 官方免费 MCP 搜索端点，无需 API Key',
    reference: 'https://exa.ai',
    type: 'streamableHttp',
    baseUrl: 'https://mcp.exa.ai/mcp',
    provider: 'Exa',
  },
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

/**
 * Cherry's 9 inMemory built-in servers — descriptors live here (client bundle
 * safe); the in-process runtimes live in `mcp-builtin-runtime.ts` (host
 * side). All 9 now have real runtimes; four (fetch/filesystem/brave-search/
 * python) delegate to DSH-native capabilities but are provided in-process for
 * parity, with honest credential checks when a key is absent.
 */
export interface BuiltinMemoryServer {
  name: string
  description: string
  /** True when an in-process runtime actually exists on the host. */
  available: boolean
  /** Protocol command key the host runtime dispatches on. */
  runtimeKey: string
}

export const BUILTIN_MEMORY_SERVERS: readonly BuiltinMemoryServer[] = Object.freeze([
  { name: 'sequential-thinking', description: '结构化思考推理（记录思考链）', available: true, runtimeKey: 'sequential-thinking' },
  { name: 'memory', description: '知识图谱记忆（实体/关系/观察）', available: true, runtimeKey: 'memory' },
  { name: 'fetch', description: 'HTTP 抓取（fetch_html/txt/json/markdown，SSRF 防护）', available: true, runtimeKey: 'fetch' },
  { name: 'filesystem', description: '文件系统访问（read/write/edit/ls/delete/glob/grep，工作区沙盒）', available: true, runtimeKey: 'filesystem' },
  { name: 'brave-search', description: 'Brave 搜索（brave_web_search/local_search，需 BRAVE_API_KEY）', available: true, runtimeKey: 'brave-search' },
  { name: 'python', description: 'Python 执行（python_execute，本地 python3 沙盒，超时 60s）', available: true, runtimeKey: 'python' },
  { name: 'dify-knowledge', description: 'Dify 知识库（list_knowledges/search_knowledge，需 DIFY_KEY）', available: true, runtimeKey: 'dify-knowledge' },
  { name: 'browser', description: '网页抓取（fetch_page：URL→可读文本，SSRF 防护）', available: true, runtimeKey: 'browser' },
  { name: 'didi', description: '滴滴出行（maps/打车全链路，需 DIDI_API_KEY）', available: true, runtimeKey: 'didi' },
])
