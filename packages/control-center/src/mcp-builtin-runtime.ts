/**
 * In-process MCP servers — Cherry's 9 inMemory built-ins, hosted inside this
 * process (no stdio/HTTP hop). The MCP settings schema already carries an
 * `inMemory` server type; these are the runtimes that make that type real.
 *
 * Currently implemented: sequential-thinking (structured reasoning), memory
 * (knowledge-graph memory). The rest of Cherry's set (fetch, filesystem,
 * brave-search, python, dify-knowledge, browser, didi) map onto DSH-native
 * capabilities and are listed but not yet provided in-process.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { z } from 'zod'

/** A running in-memory server paired with its client transport. */
export interface RunningInMemoryServer {
  server: McpServer
  clientTransport: InMemoryTransport
}

/** Runtime keys that have a real in-process implementation on the host. */
export const AVAILABLE_INMEMORY_RUNTIMES: readonly string[] = Object.freeze(['sequential-thinking', 'memory'])

/**
 * Create one in-process MCP server for a builtin runtime, linked to a client
 * transport. The caller connects the client to `clientTransport`.
 */
export function createInMemoryServer(name: string): RunningInMemoryServer {
  if (name === 'sequential-thinking') return createSequentialThinking()
  if (name === 'memory') return createMemory()
  throw new Error(`未实现的内置服务器: ${name}`)
}

function link(server: McpServer): { clientTransport: InMemoryTransport } {
  const [client, serverTransport] = InMemoryTransport.createLinkedPair()
  void server.connect(serverTransport)
  return { clientTransport: client }
}

/** sequential-thinking — modelcontextprotocol/servers reference implementation. */
function createSequentialThinking(): RunningInMemoryServer {
  interface Thought {
    thought: string
    thoughtNumber: number
    totalThoughts: number
    nextThoughtNeeded: boolean
    isRevision?: boolean
    revisesThought?: number
    branchFromThought?: number
    branchId?: string
    needsMoreThoughts?: boolean
  }
  const sessions = new Map<string, Thought[]>()

  const server = new McpServer({ name: 'sequential-thinking', version: '1.0.0' })
  server.registerTool('sequentialthinking', {
    title: 'Sequential Thinking',
    description: '按顺序记录思考链，供多步推理使用。每次调用追加一条思考。',
    inputSchema: z.object({
      thought: z.string().describe('当前的思考内容'),
      thoughtNumber: z.number().int().optional().describe('当前思考编号（从 1 开始）'),
      totalThoughts: z.number().int().optional().describe('预计思考总数'),
      nextThoughtNeeded: z.boolean().describe('是否需要继续思考'),
      isRevision: z.boolean().optional().describe('是否修订之前某条思考'),
      revisesThought: z.number().int().optional().describe('被修订的思考编号'),
      branchFromThought: z.number().int().optional().describe('从此思考分叉'),
      branchId: z.string().optional().describe('分叉标识'),
      needsMoreThoughts: z.boolean().optional().describe('是否还需要更多思考'),
    }),
  }, async (args, extra) => {
    const sessionId = extra.sessionId ?? 'default'
    const list = sessions.get(sessionId) ?? []
    const thought: Thought = {
      thought: String(args.thought ?? ''),
      thoughtNumber: typeof args.thoughtNumber === 'number' ? args.thoughtNumber : list.length + 1,
      totalThoughts: typeof args.totalThoughts === 'number' ? args.totalThoughts : list.length + 1,
      nextThoughtNeeded: args.nextThoughtNeeded === true,
      ...(args.isRevision === true ? { isRevision: true } : {}),
      ...(typeof args.revisesThought === 'number' ? { revisesThought: args.revisesThought } : {}),
      ...(typeof args.branchFromThought === 'number' ? { branchFromThought: args.branchFromThought } : {}),
      ...(typeof args.branchId === 'string' ? { branchId: args.branchId } : {}),
      ...(args.needsMoreThoughts === true ? { needsMoreThoughts: true } : {}),
    }
    list.push(thought)
    sessions.set(sessionId, list)
    return { content: [{ type: 'text', text: JSON.stringify({ thoughtList: list }, null, 2) }] }
  })

  return { ...link(server), server }
}

/** memory — knowledge-graph memory server (entities / relations / observations). */
function createMemory(): RunningInMemoryServer {
  interface Entity { name: string; entityType: string; observations: string[] }
  interface Relation { from: string; to: string; relationType: string }
  const entities = new Map<string, Entity>()
  const relations: Relation[] = []

  const server = new McpServer({ name: 'memory', version: '1.0.0' })
  server.registerTool('create_entities', {
    title: 'Create Entities',
    description: '创建知识图谱实体。',
    inputSchema: z.object({
      entities: z.array(z.object({
        name: z.string(), entityType: z.string(), observations: z.array(z.string()),
      })),
    }),
  }, async (args: { entities?: Array<{ name?: unknown; entityType?: unknown; observations?: unknown }> }) => {
    const created: Array<{ name: string }> = []
    for (const raw of args.entities ?? []) {
      const name = String(raw.name ?? '')
      if (name === '') continue
      entities.set(name, {
        name,
        entityType: String(raw.entityType ?? ''),
        observations: Array.isArray(raw.observations) ? raw.observations.map(String) : [],
      })
      created.push({ name })
    }
    return { content: [{ type: 'text', text: JSON.stringify(created) }] }
  })

  server.registerTool('create_relations', {
    title: 'Create Relations',
    description: '在两个实体之间创建关系。',
    inputSchema: z.object({
      relations: z.array(z.object({
        from: z.string(), to: z.string(), relationType: z.string(),
      })),
    }),
  }, async (args: { relations?: Array<{ from?: unknown; to?: unknown; relationType?: unknown }> }) => {
    const created: Array<{ from: string; to: string; relationType: string }> = []
    for (const raw of args.relations ?? []) {
      const relation = { from: String(raw.from ?? ''), to: String(raw.to ?? ''), relationType: String(raw.relationType ?? '') }
      relations.push(relation)
      created.push(relation)
    }
    return { content: [{ type: 'text', text: JSON.stringify(created) }] }
  })

  server.registerTool('add_observations', {
    title: 'Add Observations',
    description: '向已有实体追加观察。',
    inputSchema: z.object({
      observations: z.array(z.object({
        entityName: z.string(), contents: z.array(z.string()),
      })),
    }),
  }, async (args: { observations?: Array<{ entityName?: unknown; contents?: unknown }> }) => {
    const added: Array<{ entityName: string; addedObservations: string[] }> = []
    for (const raw of args.observations ?? []) {
      const name = String(raw.entityName ?? '')
      const entity = entities.get(name)
      const contents = Array.isArray(raw.contents) ? raw.contents.map(String) : []
      if (entity === undefined) return { isError: true, content: [{ type: 'text', text: `实体不存在: ${name}` }] }
      entity.observations.push(...contents)
      added.push({ entityName: name, addedObservations: contents })
    }
    return { content: [{ type: 'text', text: JSON.stringify(added) }] }
  })

  server.registerTool('read_graph', {
    title: 'Read Graph',
    description: '读取整个知识图谱（实体与关系）。',
    inputSchema: z.object({}),
  }, async () => {
    const graph = {
      entities: [...entities.values()],
      relations,
    }
    return { content: [{ type: 'text', text: JSON.stringify(graph, null, 2) }] }
  })

  server.registerTool('search_nodes', {
    title: 'Search Nodes',
    description: '按名称模糊搜索实体。',
    inputSchema: z.object({ query: z.string().describe('搜索关键词') }),
  }, async (args: { query?: unknown }) => {
    const query = String(args.query ?? '').toLowerCase()
    const matches = [...entities.values()].filter(e =>
      e.name.toLowerCase().includes(query) || e.entityType.toLowerCase().includes(query) || e.observations.some(o => o.toLowerCase().includes(query)))
    return { content: [{ type: 'text', text: JSON.stringify(matches.map(e => ({ name: e.name, entityType: e.entityType, observations: e.observations.slice(-10) }))) }] }
  })

  return { ...link(server), server }
}
