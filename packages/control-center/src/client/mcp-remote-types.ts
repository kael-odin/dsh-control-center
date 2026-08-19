/**
 * Client-side type augmentation for MCP remote methods
 */

import type {
  McpServerView,
  CreateMcpServerDto,
  UpdateMcpServerDto,
  McpServerCapabilities,
} from '../mcp-types.ts'

declare module '@deepseek-ai/dsh-api-remotes/client' {
  interface TypertClientRemote {
    controlCenterMcp?: {
      list(): Promise<McpServerView[]>
      getById(params: { serverId: string }): Promise<McpServerView | null>
      create(params: { dto: CreateMcpServerDto }): Promise<McpServerView>
      update(params: { serverId: string; dto: UpdateMcpServerDto }): Promise<McpServerView>
      delete(params: { serverId: string }): Promise<void>
      reorder(params: { serverIds: string[] }): Promise<void>
      stopServer(params: { serverId: string }): Promise<void>
      refreshTools(params: { serverId: string }): Promise<void>
      getServerLogs(params: { serverId: string; lines?: number }): Promise<string[]>
      getCapabilities(params: { serverId: string }): Promise<McpServerCapabilities | null>
    }
  }
}
