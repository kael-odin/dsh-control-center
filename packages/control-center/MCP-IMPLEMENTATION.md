# MCP Implementation Status

## Phase 2: Protocol Implementation 🚧 IN PROGRESS

### Completed: stdio Transport Basic Infrastructure
1. ✅ MCP SDK dependencies added (@modelcontextprotocol/sdk ^1.30.0)
2. ✅ Client and Transport types imported
3. ✅ Runtime state extended with client/transport/logs fields
4. ✅ Basic stdio transport connection logic implemented
5. ✅ Tool/prompt/resource discovery with proper optional field handling
6. ✅ Server capabilities caching in runtime state

### Working: stdio Transport Server Startup
Current implementation in `startServer()`:
- Spawns child process with command/args/env from server configuration
- Creates StdioClientTransport with stderr logging
- Connects MCP Client and performs handshake
- Discovers and caches server capabilities (tools/prompts/resources)
- Updates runtime state (connecting → connected/error)
- Proper error handling with lastError tracking

**Status**: Basic implementation complete, needs real-world testing with actual MCP servers

### Next Steps (Priority Order)

#### Priority 1: Server Lifecycle Completion
1. Implement `stopServer()` with actual shutdown
   - Close MCP client connection gracefully
   - Kill child process
   - Clean up transport resources
   - Clear runtime state

2. Implement `getServerLogs()` with actual log buffer
   - Circular buffer for stdout/stderr (last 1000 lines)
   - Line-based filtering
   - Timestamp tracking

#### Priority 2: Tool Registration
1. Implement `refreshTools()` with DSH tool registry
   - Parse cached capabilities.tools
   - Register with DSH via ctx.get('tools')
   - Handle tool schema conversion
   - Tool enable/disable support

2. Tool catalog caching improvements
   - Prewarm on server startup
   - Cache invalidation on refresh
   - Concurrent refresh handling

#### Priority 3: Configuration UI
1. Server configuration sections in McpSection.tsx:
   - Command/Args editor (stdio transport)
   - Environment variables editor
   - Timeout settings
   - Long-running toggle

2. Tool/Prompt/Resource listing
   - Fetch from getCapabilities
   - Display in detail pane
   - Enable/disable individual tools

#### Priority 4: Other Transports
1. SSE transport implementation
   - EventSource connection
   - Base URL + headers
   - Retry logic

2. streamableHttp transport implementation
   - HTTP streaming
   - Request/response handling

3. inMemory transport
   - Built-in server instances
   - Direct function calls

#### Priority 5: Advanced Features
1. OAuth integration
   - Token acquisition flow
   - Token refresh
   - Secure storage

2. Server installation flows
   - Marketplace browser
   - Local directory import
   - URL-based installation

3. Trust management UI
   - Trust confirmation dialog
   - Trusted timestamp display
   - Untrust action

4. E2E browser tests
   - Server CRUD operations
   - Tool discovery
   - Connection state transitions

## Phase 1: Basic Structure ✅ COMPLETE

### Backend Service (Host)
- **mcp-types.ts**: Complete type definitions (~30 fields)
  - McpServerRecord, McpServerView, CreateMcpServerDto, UpdateMcpServerDto
  - TypertRemoteNamespaceMap declaration for type safety
  - Transport types: stdio, sse, streamableHttp, inMemory
  - Runtime states: connecting, connected, error, disabled

- **mcp.ts**: Complete McpService (~330 lines)
  - Settings namespace: `control-center-mcp`
  - TypertRemote namespace: `controlCenterMcp`
  - CRUD operations: list, getById, create, update, delete, reorder
  - Runtime state tracking with Map<serverId, RuntimeState>
  - Methods exposed: stopServer, refreshTools, getServerLogs, getCapabilities
  - **TODO markers** for actual protocol implementation

- **mcp-remote-client.ts**: Simple re-export for client mounting

### Frontend UI (Client)
- **McpSection.tsx**: Split-pane component (~320 lines)
  - 248px fixed left sidebar with search, server list, add button
  - Flexible right detail pane with header, meta, scroll area
  - Server selection state, search filtering
  - Delete functionality wired up
  - **TODO**: Configuration UI sections (command, args, env, headers, timeout)

- **McpSection.module.css**: Design tokens (~440 lines)
  - Exact copy of ProvidersSection style
  - 248px sidebar, 32px inputs, 10px border-radius
  - DSH design token system integration
  - Active dot indicator, hover states

### Integration
- **src/index.ts**: Service instantiation + remote contribution
- **src/client/index.ts**: Remote mounting + settings section registration
  - Order: 40 (after Providers at 30)
  - Label: 'MCP'

### Verification
- ✅ TypeScript compilation passes
- ✅ Lint passes (oxlint)
- ✅ All 37 tests pass
- ✅ Build completes successfully

## Phase 2: Protocol Implementation 🔜 NEXT

### Priority 1: stdio Transport Server Startup
1. Implement `startServer()` for stdio transport
   - Spawn child process with command/args/env
   - Capture stdout/stderr for logs
   - Connection handshake
   - Error handling and state updates

2. Implement `stopServer()` actual shutdown
   - Kill child process gracefully
   - Clean up resources
   - Update runtime state

3. Implement `getServerLogs()` with actual log buffer
   - Ring buffer for stdout/stderr
   - Line-based filtering
   - Timestamp tracking

### Priority 2: Tool Discovery and Registration
1. Implement `refreshTools()` with actual MCP protocol
   - tools/list request
   - Parse tool schemas
   - Register with DSH tool registry via ctx.get('tools')

2. Tool catalog caching (like Cherry's McpCatalogService)
   - Prewarm on server startup
   - Cache invalidation
   - Concurrent refresh handling

### Priority 3: Configuration UI
1. Server configuration sections in McpSection.tsx:
   - Command/Args editor (stdio transport)
   - Environment variables editor
   - Headers editor (sse/http transports)
   - Base URL editor (sse/http transports)
   - Timeout settings
   - Long-running toggle

2. Tool/Prompt/Resource listing
   - Fetch from server capabilities
   - Display in detail pane
   - Enable/disable individual tools

### Priority 4: Other Transports
1. SSE transport implementation
   - EventSource connection
   - Base URL + headers
   - Retry logic

2. streamableHttp transport implementation
   - HTTP streaming
   - Request/response handling

3. inMemory transport
   - Built-in server instances
   - Direct function calls

### Priority 5: Advanced Features
1. OAuth integration
   - Token acquisition flow
   - Token refresh
   - Secure storage

2. Server installation flows
   - Marketplace browser
   - Local directory import
   - URL-based installation
   - Built-in servers

3. Trust management UI
   - Trust confirmation dialog
   - Trusted timestamp display
   - Untrust action

4. E2E browser tests
   - Server CRUD operations
   - Tool discovery
   - Connection state transitions

## Architecture Decisions

### Settings vs Database
- **Decision**: Use Settings for server configuration (not SQLite like Cherry)
- **Rationale**: DSH's Settings system provides namespace isolation, type safety, and persistence out of the box

### Runtime State Separation
- **Decision**: Separate runtime state (connection status) from persisted configuration
- **Rationale**: Connection state is ephemeral and should not be persisted; only configuration should be stored

### TypertRemote Pattern
- **Decision**: Use bindTypertRemote() for RPC rather than IPC
- **Rationale**: DSH's standard pattern for host-client communication; works with web edition

### Optional Field Handling
- **Decision**: Use `field !== undefined` checks instead of direct optional spreading
- **Rationale**: TypeScript's exactOptionalPropertyTypes requires explicit handling

### Split-Pane UI Pattern
- **Decision**: Exact copy of ProvidersSection layout (248px sidebar)
- **Rationale**: User requested "100% UI parity" across settings pages

## Known Limitations

1. **Partial MCP protocol**: stdio transport basic connection implemented, needs testing
2. **No actual server shutdown**: stopServer() just clears runtime state, doesn't close client/transport
3. **No tool registration**: refreshTools() doesn't register with DSH tool registry yet
4. **No log capture**: getServerLogs() returns empty array, stderr goes to logger only
5. **No configuration UI**: Detail pane shows placeholder text
6. **No OAuth**: Authentication not implemented
7. **No marketplace**: Installation flows not implemented
8. **No E2E tests**: Browser tests not written
9. **No SSE/HTTP transports**: Only stdio implemented
10. **Test flakiness**: providers.spec.ts has transient EPERM failures on Windows (unrelated to MCP changes)

## Next Steps

1. Test stdio transport with real MCP server (e.g., @modelcontextprotocol/server-filesystem)
2. Implement actual stopServer() with client/transport cleanup
3. Implement log buffer capture (stdout/stderr ring buffer)
4. Implement tool registration with DSH tool registry
5. Build configuration UI sections
6. Add E2E browser tests
7. Implement remaining transports (sse, streamableHttp, inMemory)
8. Add OAuth support
9. Build marketplace and installation flows

## Progress Tracking

**Control Center Web Edition: 5/26 features complete (19.2%)**

✅ Translation Workspace
✅ Painting Workspace  
✅ Knowledge Workspace
✅ Provider Management
🚧 MCP (Phase 2 stdio transport in progress - ~40% complete)
⬜ Skills Backend Service
⬜ 20 remaining features...
