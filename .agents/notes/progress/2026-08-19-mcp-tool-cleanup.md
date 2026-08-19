# MCP Tool Cleanup Implementation

**Date**: 2026-08-19
**Commit**: 649e841
**Progress**: MCP Phase 2 ~94% complete (stdio transport + full UI + tool registry + cleanup)

## Completed

### Tool Cleanup on Server Stop (100%)

Implemented complete tool lifecycle management with automatic cleanup:

1. **Runtime State Extension**
   - Added `registeredToolNames: string[]` field to `McpServerRuntimeState`
   - Tracks all tool names registered with DSH tool registry
   - Persists across refresh cycles until server stops

2. **Registration Tracking**
   - During `startServer()`: push tool names to `registeredToolNames` array
   - During `refreshTools()`: push tool names to `registeredToolNames` array
   - Every successfully registered tool is tracked

3. **Cleanup in stopServer()**
   - Iterate through `registeredToolNames` array
   - Call `toolsService.unregister(toolName)` for each tool
   - Clear the array after unregistration
   - Logs each unregistration operation
   - Graceful handling if tools service unavailable

4. **Cleanup in refreshTools()**
   - Unregister all old tools before re-registering
   - Prevents duplicate tool registration
   - Fresh registration on every refresh
   - Old tool names cleared from tracking array

## Architecture

### Tool Lifecycle Flow

```
startServer()
  ↓
Register tools → Track in registeredToolNames[]
  ↓
Server running
  ↓
User calls refreshTools()
  ↓
Unregister all tools in registeredToolNames[]
  ↓
Clear registeredToolNames[]
  ↓
Re-register tools → Track in registeredToolNames[]
  ↓
User calls stopServer()
  ↓
Unregister all tools in registeredToolNames[]
  ↓
Clear registeredToolNames[]
  ↓
Server stopped
```

### Code Pattern

```typescript
// Registration (startServer/refreshTools)
const toolName = `mcp_${serverId}_${tool.name}`
toolsService.register({ name: toolName, ... })
runtime.registeredToolNames.push(toolName)
this.addServerLog(serverId, `Registered tool: ${toolName}`)

// Cleanup (stopServer/refreshTools before re-registering)
const toolsService = this.ctx.optional('tools')
if (toolsService && runtime.registeredToolNames) {
  for (const toolName of runtime.registeredToolNames) {
    try {
      toolsService.unregister(toolName)
      this.addServerLog(serverId, `Unregistered tool: ${toolName}`)
    } catch (error) {
      this.ctx.logger.error(`Failed to unregister tool ${toolName}`, error)
    }
  }
  runtime.registeredToolNames = []
}
```

## File Changes

- `packages/control-center/src/mcp.ts` - Added registeredToolNames tracking and cleanup logic
- `packages/control-center/src/mcp-types.ts` - Extended McpServerRuntimeState interface
- `packages/control-center/MCP-IMPLEMENTATION.md` - Updated progress (~92% → ~94%)

## Testing

- ✅ Build passes (pnpm bundle)
- ✅ Lint passes (oxlint warnings only)
- ⬜ Manual testing with real MCP server needed
- ⬜ Verify tools disappear from registry after server stop
- ⬜ Verify tools refresh correctly on manual refresh
- ⬜ E2E tests not yet written

## Known Limitations

1. No verification that unregister succeeded (toolsService.unregister() doesn't return success/failure)
2. No cleanup if MCP service crashes (runtime state lost)
3. No cleanup on app shutdown (all runtime state lost)
4. Error during unregistration logged but doesn't block other tool cleanup

## Next Priorities

### Priority 3: Additional UI Polish
1. Add server installation flow
   - "Add Server" form with validation
   - Support for different transport types
   - Pre-fill from marketplace templates

### Priority 4: Other Transports
1. SSE transport implementation
2. streamableHttp transport implementation
3. inMemory transport implementation

### Priority 5: Advanced Features
1. OAuth integration
2. Server marketplace integration
3. Trust management UI
4. E2E browser tests

## Alignment with User Requirements

This completes **Priority 2** from the MCP implementation roadmap:
- ✅ Track registered tool names in runtime state
- ✅ Unregister tools in stopServer()
- ✅ Unregister old tools before re-registering in refreshTools()
- ✅ Add logging for unregistration operations

MCP tools now have complete lifecycle management - registered on startup/refresh, unregistered on stop/refresh, preventing tool registry pollution.
