# MCP Tool Cleanup Implementation

**Date**: 2026-08-19
**Commit**: TBD (disposer pattern fix)
**Progress**: MCP Phase 2 ~94% complete (stdio transport + full UI + tool registry + cleanup)

## Completed

### Tool Cleanup on Server Stop (100%)

Implemented complete tool lifecycle management using DSH's disposer pattern:

1. **Runtime State Extension**
   - Added `toolDisposers: Array<() => void>` field to `McpServerRuntimeState`
   - Tracks disposer functions returned by `toolService.register()`
   - Persists across refresh cycles until server stops

2. **Registration with Disposer Capture**
   - During `startServer()`: capture disposer from each `toolService.register()` call
   - During `refreshTools()`: capture disposers from re-registration
   - Every successfully registered tool's disposer is stored

3. **Cleanup in stopServer()**
   - Iterate through `toolDisposers` array
   - Call each disposer function to unregister tools
   - Clear the array after disposal
   - Logs total count of unregistered tools
   - Graceful handling if tools service unavailable

4. **Cleanup in refreshTools()**
   - Call all old disposers before re-registering
   - Prevents duplicate tool registration
   - Fresh registration on every refresh
   - Old disposers cleared from tracking array

5. **Scope Fix**
   - Moved `toolDisposers` declaration to function scope in `startServer()`
   - Ensures variable is always available even if server has no tools capability
   - Prevents TypeScript TS18004 scope error

## Architecture

### Tool Lifecycle Flow

```
startServer()
  ↓
Register tools → Capture disposers in toolDisposers[]
  ↓
Server running
  ↓
User calls refreshTools()
  ↓
Call all disposers in toolDisposers[]
  ↓
Clear toolDisposers[]
  ↓
Re-register tools → Capture disposers in toolDisposers[]
  ↓
User calls stopServer()
  ↓
Call all disposers in toolDisposers[]
  ↓
Clear toolDisposers[]
  ↓
Server stopped
```

### Code Pattern

```typescript
// Registration (startServer/refreshTools)
const toolDisposers: Array<() => void> = []
const toolService = this.ctx.get('tools', false)

if (toolService) {
  for (const tool of capabilities.tools) {
    const toolName = `mcp_${serverId}_${tool.name}`
    const dispose = toolService.register({
      name: toolName,
      schema: tool.inputSchema,
      handler: async (input) => {
        const result = await client.callTool({ name: tool.name, arguments: input })
        return result.content
      }
    })
    toolDisposers.push(dispose)
    this.addServerLog(serverId, `Registered tool: ${tool.name}`)
  }
}

// Cleanup (stopServer/refreshTools before re-registering)
if (state.toolDisposers) {
  for (const dispose of state.toolDisposers) {
    try {
      dispose()
    } catch (error) {
      this.ctx.logger.warn(`Failed to dispose tool`, error)
    }
  }
  this.addServerLog(params.serverId, `Unregistered ${state.toolDisposers.length} tools`)
}
```

## File Changes

- `packages/control-center/src/mcp.ts` - Added registeredToolNames tracking and cleanup logic
- `packages/control-center/src/mcp-types.ts` - Extended McpServerRuntimeState interface
- `packages/control-center/MCP-IMPLEMENTATION.md` - Updated progress (~92% → ~94%)

## Testing

- ✅ Build passes (pnpm build)
- ✅ Lint passes (oxlint warnings only)
- ✅ TypeScript compilation succeeds (scope issue fixed)
- ✅ Disposer pattern correctly implemented per DSH API
- ⬜ Manual testing with real MCP server needed
- ⬜ Verify tools disappear from registry after server stop
- ⬜ Verify tools refresh correctly on manual refresh
- ⬜ E2E tests not yet written

## Known Limitations

1. No verification that disposer succeeded (disposer functions don't return success/failure)
2. No cleanup if MCP service crashes (runtime state lost)
3. No cleanup on app shutdown (all runtime state lost)
4. Error during disposal logged but doesn't block other tool cleanup

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
- ✅ Track tool disposers in runtime state (not tool names)
- ✅ Call disposers in stopServer() to unregister tools
- ✅ Call old disposers before re-registering in refreshTools()
- ✅ Add logging for disposal operations
- ✅ Use correct DSH API pattern (disposer functions, not unregister method)
- ✅ Fix variable scope to prevent TypeScript errors

MCP tools now have complete lifecycle management using DSH's standard disposer pattern - disposers captured on startup/refresh, called on stop/refresh, preventing tool registry pollution.
