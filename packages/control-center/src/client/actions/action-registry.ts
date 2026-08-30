/**
 * Cherry Studio message action registry, ported from
 * `cherry-studio/src/renderer/components/chat/actions/{actionTypes,actionRegistry}.ts`
 * (trimmed: no confirm-dialog, shortcut, or ReactNode labels — the Control
 * Center menus are text-based; confirm flows live in the actions themselves).
 *
 * Two maps: actions (UI descriptors: surface/group/order/availability) and
 * commands (behavior). Registration returns a disposer, so slot entries can
 * register/unregister dynamically; execution looks the action up in the tree
 * and runs its command with the caller's context.
 */

/** Surfaces an action can declare itself for; each surface renders separately. */
export type ActionSurface = 'menu' | 'toolbar'

export interface ActionAvailability {
  visible: boolean
  enabled: boolean
  /** Shown as the item's description while disabled. */
  reason?: string
}

export type ActionAvailabilityInput = ActionAvailability | boolean

/** Merge: visible=false wins, then enabled=false wins; reasons chain. */
export function combineAvailability(
  left: ActionAvailabilityInput | undefined,
  right: ActionAvailabilityInput | undefined,
): ActionAvailability {
  const leftView = viewOf(left)
  const rightView = viewOf(right)
  if (!leftView.visible || !rightView.visible) {
    const reason = !leftView.visible ? leftView.reason : rightView.reason
    return { visible: false, enabled: false, ...(reason === undefined ? {} : { reason }) }
  }
  if (!leftView.enabled || !rightView.enabled) {
    const reason = !leftView.enabled ? leftView.reason : rightView.reason
    return { visible: true, enabled: false, ...(reason === undefined ? {} : { reason }) }
  }
  return { visible: true, enabled: true }
}

function viewOf(input: ActionAvailabilityInput | undefined): ActionAvailability {
  if (input === undefined) return { visible: true, enabled: true }
  if (typeof input === 'boolean') return { visible: input, enabled: input }
  return input
}

/** Resolved action subtree: availability applied, children materialized. */
export interface ResolvedAction {
  id: string
  label: string
  group: string | undefined
  order: number
  danger: boolean
  availability: ActionAvailability
  run: (context: never) => void | Promise<void>
  children: readonly ResolvedAction[]
}

export interface ActionDescriptor<TContext> {
  id: string
  label: string
  /** Items sharing a group render with a separator between groups. */
  group?: string
  order?: number
  surface?: ActionSurface | readonly ActionSurface[]
  danger?: boolean
  children?: readonly ActionDescriptor<TContext>[] | ((context: TContext) => readonly ActionDescriptor<TContext>[])
  availability?: (context: TContext) => ActionAvailabilityInput
  /** Inline behavior; a commandId indirection is not needed at this scale. */
  run?: (context: TContext) => void | Promise<void>
}

export class ActionRegistry<TContext> {
  private readonly actions = new Map<string, ActionDescriptor<TContext>>()

  /** A same-id registration replaces the earlier one (slot semantics). */
  registerAction(action: ActionDescriptor<TContext>): () => void {
    this.actions.set(action.id, action)
    return () => {
      if (this.actions.get(action.id) === action) this.actions.delete(action.id)
    }
  }

  /** Resolve the action tree for one surface: filter, availability-merge, order. */
  resolve(context: TContext, surface: ActionSurface): readonly ResolvedAction[] {
    const resolved: ResolvedAction[] = []
    for (const action of this.actions.values()) {
      const surfaces = action.surface === undefined
        ? (['menu'] as const)
        : typeof action.surface === 'string' ? [action.surface] : action.surface
      if (!surfaces.includes(surface)) continue
      const availability = viewOf(action.availability?.(context))
      if (!availability.visible) continue
      resolved.push(this.resolveEntry(action, context, availability, surface))
    }
    return resolved.sort((left, right) =>
      left.order - right.order || left.id.localeCompare(right.id))
  }

  private resolveEntry(
    action: ActionDescriptor<TContext>,
    context: TContext,
    availability: ActionAvailability,
    surface: ActionSurface,
  ): ResolvedAction {
    const materialized = typeof action.children === 'function' ? action.children(context) : action.children
    return {
      id: action.id,
      label: action.label,
      group: action.group,
      order: action.order ?? 0,
      danger: action.danger ?? false,
      availability,
      run: context2 => {
        const run = action.run
        if (run === undefined) return undefined
        return run(context2 as TContext)
      },
      children: (materialized ?? []).map(child =>
        this.resolveEntry(child, context, viewOf(child.availability?.(context)), surface)),
    }
  }

  /** Execute an action by id anywhere in the tree. */
  async execute(actionId: string, context: TContext, surface: ActionSurface = 'menu'): Promise<void> {
    const find = (entries: readonly ResolvedAction[]): ResolvedAction | undefined => {
      for (const entry of entries) {
        if (entry.id === actionId) return entry
        const nested = find(entry.children)
        if (nested !== undefined) return nested
      }
      return undefined
    }
    const action = find(this.resolve(context, surface))
    if (action === undefined) throw new Error(`unknown action "${actionId}"`)
    if (!action.availability.enabled) {
      throw new Error(`action "${actionId}" is unavailable${action.availability.reason === undefined ? '' : `: ${action.availability.reason}`}`)
    }
    await action.run(context as never)
  }
}

export function createActionRegistry<TContext>(): ActionRegistry<TContext> {
  return new ActionRegistry<TContext>()
}
