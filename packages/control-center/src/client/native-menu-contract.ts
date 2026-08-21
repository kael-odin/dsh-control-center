/** JSON-safe native menu contract shared by the DSH renderer and Electron bridge. */
export type NativeMenuItem =
  | { type: 'separator' }
  | {
      type: 'command'
      command: string
      label: string
      enabled: boolean
      checked?: boolean
      accelerator?: string
    }
  | {
      type: 'submenu'
      label: string
      enabled: boolean
      children: NativeMenuItem[]
    }

export interface NativeMenuContextSnapshot {
  sessionId?: string
  workspace?: string
  selection?: string
  focusedElement?: string
}

export interface NativeMenuModel {
  id: string
  location: 'webcontents.context' | 'app.menu'
  items: NativeMenuItem[]
  context: NativeMenuContextSnapshot
}

export interface NativeMenuOpenResult {
  ok: boolean
  action?: { type: 'command'; command: string }
  error?: string
}

export const NATIVE_MENU_COMMANDS = ['app.settings.open', 'app.zoom.in', 'app.zoom.out', 'app.zoom.reset'] as const
export type NativeMenuCommand = (typeof NATIVE_MENU_COMMANDS)[number]

const COMMAND_SET = new Set<string>(NATIVE_MENU_COMMANDS)

export function isNativeMenuCommand(value: unknown): value is NativeMenuCommand {
  return typeof value === 'string' && COMMAND_SET.has(value)
}

export function createNativeMenuModel(
  id: string,
  context: NativeMenuContextSnapshot = {},
): NativeMenuModel {
  return {
    id,
    location: 'webcontents.context',
    context: {
      ...(typeof context.sessionId === 'string' ? { sessionId: context.sessionId } : {}),
      ...(typeof context.workspace === 'string' ? { workspace: context.workspace } : {}),
      ...(typeof context.selection === 'string' ? { selection: context.selection.slice(0, 4096) } : {}),
      ...(typeof context.focusedElement === 'string' ? { focusedElement: context.focusedElement } : {}),
    },
    items: [
      { type: 'command', command: 'app.settings.open', label: '设置', enabled: true },
      { type: 'separator' },
      { type: 'command', command: 'app.zoom.in', label: '放大界面', enabled: true, accelerator: 'CommandOrControl+=' },
      { type: 'command', command: 'app.zoom.out', label: '缩小界面', enabled: true, accelerator: 'CommandOrControl+-' },
      { type: 'command', command: 'app.zoom.reset', label: '重置缩放', enabled: true, accelerator: 'CommandOrControl+0' },
    ],
  }
}

export function validateNativeMenuModel(model: unknown): NativeMenuModel {
  if (typeof model !== 'object' || model === null) throw new Error('native menu model must be an object')
  const value = model as Partial<NativeMenuModel>
  if (typeof value.id !== 'string' || value.id.length < 1 || value.id.length > 128) throw new Error('native menu id is invalid')
  if (!Array.isArray(value.items) || value.items.length > 100) throw new Error('native menu items are invalid')
  for (const item of value.items) validateNativeMenuItem(item)
  const context = value.context
  if (typeof context !== 'object' || context === null) throw new Error('native menu context is invalid')
  return value as NativeMenuModel
}

function validateNativeMenuItem(item: unknown): void {
  if (typeof item !== 'object' || item === null) throw new Error('native menu item is invalid')
  const value = item as Partial<NativeMenuItem>
  if (value.type === 'separator') return
  if (value.type === 'command') {
    if (!isNativeMenuCommand(value.command) || typeof value.label !== 'string' || typeof value.enabled !== 'boolean') {
      throw new Error('native menu command is not allowlisted')
    }
    return
  }
  if (value.type === 'submenu') {
    if (typeof value.label !== 'string' || !Array.isArray(value.children) || value.children.length > 100) throw new Error('native submenu is invalid')
    for (const child of value.children) validateNativeMenuItem(child)
    return
  }
  throw new Error('native menu item type is invalid')
}

export function createNativeMenuDisposer(dispose: () => void): () => void {
  let disposed = false
  return () => {
    if (disposed) return
    disposed = true
    dispose()
  }
}
