import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { settingsNamespace, type SettingsScope } from '@deepseek-ai/dsh-settings'
import Schema from '@deepseek-ai/schemastery'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { getMcpConfigSampleFromReadme } from './mcp-readme-sample.ts'
import type {
  CreateMcpServerDto,
  McpNpxPackage,
  McpServerCapabilities,
  McpServerRecord,
  McpServerView,
  UpdateMcpServerDto,
} from './mcp-types'

const MCP_NAMESPACE = settingsNamespace('control-center-mcp')

declare module '@deepseek-ai/dsh-api-remotes/client' {
  interface TypertClientRemote {
    controlCenterMcp?: {
      list(): Promise<{ ok: true; value: McpServerView[] } | { ok: false; error: { code: string; message: string; details: object } }>
      getById(params: { serverId: string }): Promise<{ ok: true; value: McpServerView | null } | { ok: false; error: { code: string; message: string; details: object } }>
      create(params: { dto: CreateMcpServerDto }): Promise<{ ok: true; value: McpServerView } | { ok: false; error: { code: string; message: string; details: object } }>
      update(params: { serverId: string; dto: UpdateMcpServerDto }): Promise<{ ok: true; value: McpServerView } | { ok: false; error: { code: string; message: string; details: object } }>
      delete(params: { serverId: string }): Promise<{ ok: true; value: null } | { ok: false; error: { code: string; message: string; details: object } }>
      reorder(params: { serverIds: string[] }): Promise<{ ok: true; value: null } | { ok: false; error: { code: string; message: string; details: object } }>
      stopServer(params: { serverId: string }): Promise<{ ok: true; value: null } | { ok: false; error: { code: string; message: string; details: object } }>
      refreshTools(params: { serverId: string }): Promise<{ ok: true; value: null } | { ok: false; error: { code: string; message: string; details: object } }>
      getServerLogs(params: { serverId: string; lines?: number }): Promise<{ ok: true; value: string[] } | { ok: false; error: { code: string; message: string; details: object } }>
      getCapabilities(params: { serverId: string }): Promise<{ ok: true; value: McpServerCapabilities | null } | { ok: false; error: { code: string; message: string; details: object } }>
    }
  }
}

interface McpServerSettings {
  servers: McpServerRecord[]
}

interface McpServerRuntimeState {
  serverId: string
  state: 'connecting' | 'connected' | 'error'
  lastError?: string
  version?: string
  capabilities?: McpServerCapabilities
  connectedAt?: string
  client?: Client
  transport?: Transport
  logs?: string[]
  /** Disposer functions for registered tools (returned by toolService.register()) */
  toolDisposers?: Array<() => void>
}

export class McpService extends Service {
  static inject = ['settings'] as const
  static optional = ['tools'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterMcp')
  private scope: SettingsScope<McpServerSettings>
  private runtimeStates = new Map<string, McpServerRuntimeState>()

  constructor(ctx: Context) {
    super(ctx, 'controlCenterMcp')
    this.scope = ctx.settings.register(MCP_NAMESPACE, Schema.object({
      servers: Schema.array(Schema.object({
        id: Schema.string(),
        name: Schema.string(),
        type: Schema.union(['stdio', 'sse', 'streamableHttp', 'inMemory'] as const),
        description: Schema.string(),
        baseUrl: Schema.string(),
        command: Schema.string(),
        registryUrl: Schema.string(),
        args: Schema.array(Schema.string()),
        env: Schema.dict(Schema.string()),
        headers: Schema.dict(Schema.string()),
        provider: Schema.string(),
        providerUrl: Schema.string(),
        logoUrl: Schema.string(),
        tags: Schema.array(Schema.string()),
        longRunning: Schema.boolean(),
        timeout: Schema.number(),
        dxtVersion: Schema.string(),
        dxtPath: Schema.string(),
        reference: Schema.string(),
        searchKey: Schema.string(),
        disabledTools: Schema.array(Schema.string()),
        disabledAutoApproveTools: Schema.array(Schema.string()),
        shouldConfig: Schema.boolean(),
        sortOrder: Schema.number(),
        isActive: Schema.boolean(),
        installSource: Schema.union(['builtin', 'manual', 'protocol', 'unknown'] as const),
        isTrusted: Schema.boolean(),
        trustedAt: Schema.number(),
        installedAt: Schema.number(),
        createdAt: Schema.string(),
        updatedAt: Schema.string(),
      })).default([])
    }), { base: { servers: [] } })
  }

  private recordToView(record: McpServerRecord): McpServerView {
    const runtimeState = this.runtimeStates.get(record.id)
    const state = record.isActive ? (runtimeState?.state ?? 'disabled') : 'disabled'
    const view: McpServerView = {
      id: record.id,
      name: record.name,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      runtimeState: state,
    }
    if (record.type !== undefined) view.type = record.type
    if (record.description !== undefined) view.description = record.description
    if (record.baseUrl !== undefined) view.baseUrl = record.baseUrl
    if (record.command !== undefined) view.command = record.command
    if (record.registryUrl !== undefined) view.registryUrl = record.registryUrl
    if (record.args !== undefined) view.args = record.args
    if (record.env !== undefined) view.env = record.env
    if (record.headers !== undefined) view.headers = record.headers
    if (record.provider !== undefined) view.provider = record.provider
    if (record.providerUrl !== undefined) view.providerUrl = record.providerUrl
    if (record.logoUrl !== undefined) view.logoUrl = record.logoUrl
    if (record.tags !== undefined) view.tags = record.tags
    if (record.longRunning !== undefined) view.longRunning = record.longRunning
    if (record.timeout !== undefined) view.timeout = record.timeout
    if (record.disabledTools !== undefined) view.disabledTools = record.disabledTools
    if (record.sortOrder !== undefined) view.sortOrder = record.sortOrder
    if (record.installSource !== undefined) view.installSource = record.installSource
    if (record.isTrusted !== undefined) view.isTrusted = record.isTrusted
    if (runtimeState?.lastError !== undefined) view.lastError = runtimeState.lastError
    if (runtimeState?.version !== undefined) view.version = runtimeState.version
    return view
  }

  async list(): Promise<McpServerView[]> {
    const settings = this.scope.get()
    return settings.servers
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
      .map(record => this.recordToView(record))
  }

  async getById(serverId: string): Promise<McpServerView | null> {
    const settings = this.scope.get()
    const record = settings.servers.find(s => s.id === serverId)
    return record ? this.recordToView(record) : null
  }

  async create(dto: CreateMcpServerDto): Promise<McpServerView> {
    const settings = this.scope.get()

    const now = new Date().toISOString()
    const id = `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const record: McpServerRecord = {
      id,
      name: dto.name,
      isActive: dto.isActive ?? false,
      createdAt: now,
      updatedAt: now,
    }

    if (dto.type !== undefined) record.type = dto.type
    if (dto.description !== undefined) record.description = dto.description
    if (dto.baseUrl !== undefined) record.baseUrl = dto.baseUrl
    if (dto.command !== undefined) record.command = dto.command
    if (dto.args !== undefined) record.args = dto.args
    if (dto.env !== undefined) record.env = dto.env
    if (dto.headers !== undefined) record.headers = dto.headers
    if (dto.provider !== undefined) record.provider = dto.provider
    if (dto.providerUrl !== undefined) record.providerUrl = dto.providerUrl
    if (dto.logoUrl !== undefined) record.logoUrl = dto.logoUrl
    if (dto.tags !== undefined) record.tags = dto.tags
    if (dto.longRunning !== undefined) record.longRunning = dto.longRunning
    if (dto.timeout !== undefined) record.timeout = dto.timeout
    record.sortOrder = settings.servers.length
    record.installSource = dto.installSource ?? 'manual'
    if (dto.isTrusted !== undefined) record.isTrusted = dto.isTrusted
    record.installedAt = Date.now()

    await this.ctx.settings.update(MCP_NAMESPACE, {
      servers: [...settings.servers, record]
    })

    return this.recordToView(record)
  }

  async update(serverId: string, dto: UpdateMcpServerDto): Promise<McpServerView> {
    const settings = this.scope.get()
    const index = settings.servers.findIndex(s => s.id === serverId)

    if (index === -1) {
      throw new Error(`MCP server not found: ${serverId}`)
    }

    const record = settings.servers[index]!
    const now = new Date().toISOString()

    // Update allowed fields - keep required fields unchanged
    const updated: McpServerRecord = {
      ...record,
      name: dto.name ?? record.name,
      isActive: dto.isActive ?? record.isActive,
      updatedAt: now,
    }

    if (dto.description !== undefined) updated.description = dto.description
    if (dto.baseUrl !== undefined) updated.baseUrl = dto.baseUrl
    if (dto.command !== undefined) updated.command = dto.command
    if (dto.args !== undefined) updated.args = dto.args
    if (dto.env !== undefined) updated.env = dto.env
    if (dto.headers !== undefined) updated.headers = dto.headers
    if (dto.longRunning !== undefined) updated.longRunning = dto.longRunning
    if (dto.timeout !== undefined) updated.timeout = dto.timeout
    if (dto.disabledTools !== undefined) updated.disabledTools = dto.disabledTools
    if (dto.isTrusted !== undefined) {
      updated.isTrusted = dto.isTrusted
      if (dto.isTrusted && !record.isTrusted) {
        updated.trustedAt = Date.now()
      }
    }

    // Handle isActive toggle
    if (dto.isActive !== undefined && dto.isActive !== record.isActive) {
      if (dto.isActive) {
        // Start server in background
        void this.startServer(serverId).catch(err => {
          this.ctx.logger.error(`Failed to start MCP server ${serverId}:`, err)
        })
      } else {
        // Stop server
        await this.stopServer(serverId)
      }
    }

    const updatedServers = [...settings.servers]
    updatedServers[index] = updated

    await this.ctx.settings.update(MCP_NAMESPACE, {
      servers: updatedServers
    })

    return this.recordToView(updated)
  }

  async delete(serverId: string): Promise<void> {
    const settings = this.scope.get()
    const record = settings.servers.find(s => s.id === serverId)

    if (!record) {
      throw new Error(`MCP server not found: ${serverId}`)
    }

    // Stop server if active
    if (record.isActive) {
      await this.stopServer(serverId)
    }

    await this.ctx.settings.update(MCP_NAMESPACE, {
      servers: settings.servers.filter(s => s.id !== serverId)
    })
  }

  async reorder(serverIds: string[]): Promise<void> {
    const settings = this.scope.get()

    const updatedServers = settings.servers.map(server => {
      const newOrder = serverIds.indexOf(server.id)
      return newOrder !== -1 ? { ...server, sortOrder: newOrder } : server
    })

    await this.ctx.settings.update(MCP_NAMESPACE, {
      servers: updatedServers
    })
  }

  private async startServer(serverId: string): Promise<void> {
    const settings = this.scope.get()
    const record = settings.servers.find(s => s.id === serverId)

    if (!record) {
      throw new Error(`MCP server not found: ${serverId}`)
    }

    if (!record.isTrusted) {
      throw new Error('Server must be trusted before starting')
    }

    // Set connecting state
    this.runtimeStates.set(serverId, {
      serverId,
      state: 'connecting',
      connectedAt: new Date().toISOString(),
      logs: [],
    })

    try {
      let transport: any
      let client: Client

      // Create transport based on server type
      if (record.type === 'stdio' || !record.type) {
        if (!record.command) {
          throw new Error('Command is required for stdio transport')
        }

        const args = record.args || []
        const env = record.env || {}

        // Merge with process.env to get PATH and other essentials
        // Filter out undefined values
        const processEnv: Record<string, string> = {}
        for (const [key, value] of Object.entries({ ...process.env, ...env })) {
          if (value !== undefined) {
            processEnv[key] = value
          }
        }

        this.ctx.logger.info(`Starting MCP server via stdio`, {
          serverId,
          command: record.command,
          args,
        })

        transport = new StdioClientTransport({
          command: record.command,
          args,
          env: processEnv,
          stderr: 'pipe',
        })

        // Capture stderr for logs
        const stderrStream = (transport as any).stderr
        if (stderrStream && typeof stderrStream.on === 'function') {
          const decoder = new TextDecoder('utf-8', { fatal: false })
          stderrStream.on('data', (data: Buffer) => {
            const msg = decoder.decode(data, { stream: true })
            this.addServerLog(serverId, `[stderr] ${msg.trim()}`)
          })
        }

        client = new Client(
          {
            name: 'dsh-control-center',
            version: '1.0.0',
          },
          {
            capabilities: {},
          }
        )

        // Connect with timeout
        const timeout = (record.timeout || 30) * 1000
        await Promise.race([
          client.connect(transport as Transport),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timeout')), timeout)
          ),
        ])

        this.addServerLog(serverId, 'Server connected')
      } else if (record.type === 'sse') {
        if (!record.baseUrl) {
          throw new Error('Base URL is required for SSE transport')
        }

        this.ctx.logger.info(`Starting MCP server via SSE`, {
          serverId,
          baseUrl: record.baseUrl,
        })

        const { SSEClientTransport } = await import('@modelcontextprotocol/sdk/client/sse.js')

        const headers: Record<string, string> = {}
        if (record.headers) {
          Object.assign(headers, record.headers)
        }

        transport = new SSEClientTransport(new URL(record.baseUrl), {
          eventSourceInit: {
            fetch: async (url, init) => {
              return fetch(typeof url === 'string' ? url : url.toString(), init)
            }
          },
          requestInit: {
            headers
          }
        })

        client = new Client(
          {
            name: 'dsh-control-center',
            version: '1.0.0',
          },
          {
            capabilities: {},
          }
        )

        const timeout = (record.timeout || 30) * 1000
        await Promise.race([
          client.connect(transport as Transport),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timeout')), timeout)
          ),
        ])

        this.addServerLog(serverId, 'SSE server connected')
      } else if (record.type === 'streamableHttp') {
        if (!record.baseUrl) {
          throw new Error('Base URL is required for streamableHttp transport')
        }

        this.ctx.logger.info(`Starting MCP server via streamableHttp`, {
          serverId,
          baseUrl: record.baseUrl,
        })

        const { StreamableHTTPClientTransport } = await import('@modelcontextprotocol/sdk/client/streamableHttp')

        const headers: Record<string, string> = {}
        if (record.headers) {
          Object.assign(headers, record.headers)
        }

        transport = new StreamableHTTPClientTransport(new URL(record.baseUrl), {
          fetch: async (url, init) => {
            return fetch(typeof url === 'string' ? url : url.toString(), init)
          },
          requestInit: {
            headers
          }
        })

        client = new Client(
          {
            name: 'dsh-control-center',
            version: '1.0.0',
          },
          {
            capabilities: {},
          }
        )

        const timeout = (record.timeout || 30) * 1000
        await Promise.race([
          client.connect(transport as Transport),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timeout')), timeout)
          ),
        ])

        this.addServerLog(serverId, 'StreamableHTTP server connected')
      } else {
        throw new Error(`Unsupported transport type: ${record.type}`)
      }

        // Get server capabilities
        const serverCapabilities = client.getServerCapabilities()
        const capabilities: McpServerCapabilities = {}
        const toolDisposers: Array<() => void> = []

        // Fetch tools if available
        if (serverCapabilities?.tools) {
          try {
            const toolsResult = await client.listTools()
            capabilities.tools = toolsResult.tools.map(tool => {
              const mapped: any = { name: tool.name, inputSchema: tool.inputSchema }
              if (tool.description !== undefined) mapped.description = tool.description
              return mapped
            })

            // Register tools with DSH tool registry on startup
            const disabledTools = record.disabledTools || []
            const toolService = this.ctx.get('tools', false)

            if (toolService) {
              for (const tool of capabilities.tools) {
                // Skip disabled tools
                if (disabledTools.includes(tool.name)) {
                  continue
                }

                // Register tool with DSH tool registry
                const toolName = `mcp_${serverId}_${tool.name}`

                const dispose = toolService.register({
                  name: toolName,
                  description: tool.description || `MCP tool: ${tool.name}`,
                  parameters: tool.inputSchema as any,
                  output: {
                    schema: { type: 'object' },
                    render: (_args: unknown, value: any) => {
                      return [{ type: 'text' as const, text: JSON.stringify(value) }]
                    }
                  },
                  execute: async (args: any) => {
                    const result = await client.callTool({ name: tool.name, arguments: args })
                    return result.content
                  }
                })

                toolDisposers.push(dispose)
                this.addServerLog(serverId, `Registered tool: ${tool.name}`)
              }
            }
          } catch (error) {
            this.ctx.logger.warn(`Failed to list tools for ${serverId}`, error)
          }
        }

        // Fetch prompts if available
        if (serverCapabilities?.prompts) {
          try {
            const promptsResult = await client.listPrompts()
            capabilities.prompts = promptsResult.prompts.map(prompt => {
              const mapped: any = { name: prompt.name }
              if (prompt.description !== undefined) mapped.description = prompt.description
              if (prompt.arguments !== undefined) mapped.arguments = prompt.arguments
              return mapped
            })
          } catch (error) {
            this.ctx.logger.warn(`Failed to list prompts for ${serverId}`, error)
          }
        }

        // Fetch resources if available
        if (serverCapabilities?.resources) {
          try {
            const resourcesResult = await client.listResources()
            capabilities.resources = resourcesResult.resources.map(resource => {
              const mapped: any = { uri: resource.uri, name: resource.name }
              if (resource.description !== undefined) mapped.description = resource.description
              if (resource.mimeType !== undefined) mapped.mimeType = resource.mimeType
              return mapped
            })
          } catch (error) {
            this.ctx.logger.warn(`Failed to list resources for ${serverId}`, error)
          }
        }

        // Update to connected state
        this.runtimeStates.set(serverId, {
          serverId,
          state: 'connected',
          version: '1.0.0',
          capabilities,
          connectedAt: new Date().toISOString(),
          client,
          transport,
          logs: this.runtimeStates.get(serverId)?.logs || [],
          toolDisposers,
        })

        this.addServerLog(serverId, 'Server activated')
        this.ctx.logger.info(`MCP server ${serverId} connected successfully`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.addServerLog(serverId, `Error: ${errorMessage}`)
      this.runtimeStates.set(serverId, {
        serverId,
        state: 'error',
        lastError: errorMessage,
        logs: this.runtimeStates.get(serverId)?.logs || [],
      })
      this.ctx.logger.error(`Failed to start MCP server ${serverId}`, error)
      throw error
    }
  }

  async stopServer(serverId: string): Promise<void> {
    const state = this.runtimeStates.get(serverId)
    if (!state) {
      return
    }

    try {
      // Unregister tools from DSH tool registry
      if (state.toolDisposers) {
        for (const dispose of state.toolDisposers) {
          try {
            dispose()
          } catch (error) {
            this.ctx.logger.warn(`Failed to dispose tool`, error)
          }
        }
        this.addServerLog(serverId, `Unregistered ${state.toolDisposers.length} tools`)
      }

      if (state.client) {
        await state.client.close()
        this.addServerLog(serverId, 'Server stopped')
      }
    } catch (error) {
      this.ctx.logger.error(`Error stopping MCP server ${serverId}`, error)
    } finally {
      this.runtimeStates.delete(serverId)
    }
  }

  async refreshTools(serverId: string): Promise<void> {
    const state = this.runtimeStates.get(serverId)
    if (!state || state.state !== 'connected' || !state.client) {
      throw new Error('Server must be connected to refresh tools')
    }

    try {
      const client = state.client
      const serverCapabilities = client.getServerCapabilities()
      const capabilities: McpServerCapabilities = {}

      // Unregister old tools first
      if (state.toolDisposers) {
        for (const dispose of state.toolDisposers) {
          try {
            dispose()
          } catch (error) {
            this.ctx.logger.warn(`Failed to dispose tool`, error)
          }
        }
        this.addServerLog(serverId, `Unregistered ${state.toolDisposers.length} old tools`)
      }

      const toolDisposers: Array<() => void> = []
      const toolService = this.ctx.get('tools', false)

      // Fetch tools if available
      if (serverCapabilities?.tools) {
        const toolsResult = await client.listTools()
        capabilities.tools = toolsResult.tools.map(tool => {
          const mapped: any = { name: tool.name, inputSchema: tool.inputSchema }
          if (tool.description !== undefined) mapped.description = tool.description
          return mapped
        })

        // Register tools with DSH tool registry
        const settings = this.scope.get()
        const serverRecord = settings.servers.find(s => s.id === serverId)
        const disabledTools = serverRecord?.disabledTools || []

        if (toolService) {
          for (const tool of capabilities.tools) {
            // Skip disabled tools
            if (disabledTools.includes(tool.name)) {
              continue
            }

            // Register tool with DSH tool registry
            // Prefix tool name with server ID to avoid naming conflicts
            const toolName = `mcp_${serverId}_${tool.name}`

            const dispose = toolService.register({
              name: toolName,
              description: tool.description || `MCP tool: ${tool.name}`,
              parameters: tool.inputSchema as any,
              output: {
                schema: { type: 'object' },
                render: (_args: unknown, value: any) => {
                  return [{ type: 'text' as const, text: JSON.stringify(value) }]
                }
              },
              execute: async (args: any) => {
                const result = await client.callTool({ name: tool.name, arguments: args })
                return result.content
              }
            })

            toolDisposers.push(dispose)
            this.addServerLog(serverId, `Registered tool: ${tool.name}`)
          }
        } else {
          this.ctx.logger.warn('Tool service not available for registration')
        }
      }

      // Fetch prompts if available
      if (serverCapabilities?.prompts) {
        const promptsResult = await client.listPrompts()
        capabilities.prompts = promptsResult.prompts.map(prompt => {
          const mapped: any = { name: prompt.name }
          if (prompt.description !== undefined) mapped.description = prompt.description
          if (prompt.arguments !== undefined) mapped.arguments = prompt.arguments
          return mapped
        })
      }

      // Fetch resources if available
      if (serverCapabilities?.resources) {
        const resourcesResult = await client.listResources()
        capabilities.resources = resourcesResult.resources.map(resource => {
          const mapped: any = { uri: resource.uri, name: resource.name }
          if (resource.description !== undefined) mapped.description = resource.description
          if (resource.mimeType !== undefined) mapped.mimeType = resource.mimeType
          return mapped
        })
      }

      // Update capabilities in runtime state
      this.runtimeStates.set(serverId, {
        ...state,
        capabilities,
        toolDisposers,
      })

      this.addServerLog(serverId, 'Tools refreshed')
      this.ctx.logger.info(`Refreshed tools for MCP server ${serverId}`)
    } catch (error) {
      this.ctx.logger.error(`Failed to refresh tools for ${serverId}`, error)
      throw error
    }
  }

  async getServerLogs(serverId: string, lines?: number): Promise<string[]> {
    const state = this.runtimeStates.get(serverId)
    if (!state || !state.logs) {
      return []
    }

    const logs = state.logs
    const lineCount = lines || 100

    // Return last N lines
    return logs.slice(-lineCount)
  }

  async getCapabilities(serverId: string): Promise<McpServerCapabilities | null> {
    const state = this.runtimeStates.get(serverId)
    return state?.capabilities || null
  }

  /**
   * Search the public npm registry for MCP servers under one scope (Cherry's
   * Npx 市场列表). Runs on the host so browser CORS never gates it; results
   * are advisory candidates the user still has to add.
   */
  async searchNpxRegistry(scope: string): Promise<McpNpxPackage[]> {
    const trimmed = typeof scope === 'string' ? scope.trim() : ''
    if (trimmed.length === 0) throw new Error('npx search needs a package scope, e.g. @modelcontextprotocol')
    const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(trimmed)}&size=25`
    const response = await fetch(url, { headers: { accept: 'application/json' } })
    if (!response.ok) throw new Error(`npm registry answered ${String(response.status)}`)
    const body = await response.json() as { objects?: Array<{ package?: { name?: unknown; description?: unknown; version?: unknown; links?: { npm?: unknown } } }> }
    const objects = Array.isArray(body.objects) ? body.objects : []
    const candidates = objects
      .map((entry) => entry.package ?? {})
      .filter((pkg): pkg is { name: string; description?: string; version?: string; links?: { npm?: string } } =>
        typeof pkg.name === 'string' && pkg.name.startsWith(trimmed))
      .map(pkg => ({
        fullName: pkg.name,
        name: pkg.name.slice(trimmed.length).replace(/^[-_/]/, ''),
        description: typeof pkg.description === 'string' ? pkg.description : '',
        version: typeof pkg.version === 'string' ? pkg.version : '',
        link: typeof pkg.links?.npm === 'string' ? pkg.links.npm : `https://www.npmjs.com/package/${pkg.name}`,
      }))
    // Enrich the top hits with their README config sample (Cherry's
    // getMcpConfigSampleFromReadme), so 添加 can carry the author's real
    // command/args/env instead of a blind `npx -y`.
    const enriched = await Promise.allSettled(
      candidates.slice(0, 10).map(async (pkg) => {
        try {
          const detailResponse = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg.fullName)}`, {
            headers: { accept: 'application/json' },
          })
          if (!detailResponse.ok) return pkg
          const detail = await detailResponse.json() as { readme?: unknown }
          const sample = getMcpConfigSampleFromReadme(typeof detail.readme === 'string' ? detail.readme : '')
          return sample === null ? pkg : { ...pkg, configSample: sample }
        } catch {
          return pkg
        }
      }),
    )
    return enriched.map((result, index) =>
      result.status === 'fulfilled' ? result.value : candidates[index]!,
    )
  }

  private addServerLog(serverId: string, message: string): void {
    const state = this.runtimeStates.get(serverId)
    if (!state) {
      return
    }

    const timestamp = new Date().toISOString()
    const logLine = `[${timestamp}] ${message}`

    const logs = state.logs || []
    logs.push(logLine)

    // Keep last 1000 lines
    if (logs.length > 1000) {
      logs.shift()
    }

    this.runtimeStates.set(serverId, {
      ...state,
      logs,
    })
  }
}
