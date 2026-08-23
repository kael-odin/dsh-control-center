/**
 * Multi-API-key management per provider — Cherry ProviderApiKeyListDrawer +
 * ProviderService.resolveApiKey parity.
 *
 * Cherry stores `apiKeys[{id,key,label,isEnabled}]` on the provider row and
 * rotates round-robin per request. The DSH adapter resolves exactly ONE
 * credential ref per request through the credentials seam, so this port keeps
 * the user-facing model (a labeled, individually toggleable key list) with one
 * honest difference stated in the drawer copy: the FIRST ENABLED slot stays
 * bound to the provider's `apiKeyEnv`; per-request rotation is not
 * configurable here.
 *
 * Secrets never touch settings.yaml: values live only in the DSH credentials
 * document under derived slot refs; the metadata namespace
 * (`control-center-api-keys`) carries labels and enable flags alone.
 */

import type { CredentialView, IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsPathOpView } from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsSchemaOperations } from './schema-operations.ts'

export const API_KEYS_NAMESPACE = 'control-center-api-keys'

/** One managed key slot: a credential ref plus its user-facing metadata. */
export interface ApiKeySlot {
  readonly ref: string
  readonly label: string
  readonly isEnabled: boolean
}

/** One slot joined with live credential state and binding facts. */
export interface ApiKeySlotView extends ApiKeySlot {
  configured: boolean
  writable: boolean
  active: boolean
}

/** What {@link ApiKeysController.load} answers. */
export interface ApiKeysState {
  slots: readonly ApiKeySlotView[]
  /** Ref currently bound to the profile's apiKeyEnv ('' when none). */
  boundRef: string
  /** Metadata namespace revision at load time (null = namespace absent). */
  keysRevision: number | null
  /** Provider-profile namespace revision at load time. */
  profileRevision: number | null
}

/** Derive the nth slot credential ref from the provider's base ref. */
export function slotRefOf(baseRef: string, slot: number): string {
  return slot === 1 ? baseRef : `${baseRef}__SLOT_${slot}`
}

/** Read one provider's persisted slots; tolerates junk sections. */
export function readSlots(
  value: unknown,
  schema: Pick<SettingsSchemaOperations, 'getPath'>,
  providerId: string,
): readonly ApiKeySlot[] {
  const providers = schema.getPath(value, ['providers'])
  if (typeof providers !== 'object' || providers === null) return []
  const record = schema.getPath(providers, [providerId])
  const rawSlots = schema.getPath(record, ['slots'])
  const slots = Array.isArray(rawSlots)
    ? rawSlots.flatMap((entry): ApiKeySlot[] => {
        if (typeof entry !== 'object' || entry === null) return []
        const ref = schema.getPath(entry, ['ref'])
        if (typeof ref !== 'string' || ref.length === 0) return []
        const label = schema.getPath(entry, ['label'])
        return [{
          ref,
          label: typeof label === 'string' ? label : '',
          isEnabled: schema.getPath(entry, ['isEnabled']) !== false,
        }]
      })
    : []
  return slots
}

/** The next free slot number above every existing numbered slot. */
export function nextSlotNumber(slots: readonly ApiKeySlot[]): number {
  let max = 1
  for (const slot of slots) {
    const match = /__SLOT_(\d+)$/.exec(slot.ref)
    if (match !== null) max = Math.max(max, Number.parseInt(match[1]!, 10))
  }
  return max + 1
}

/** Cherry resolveApiKey rule: the FIRST ENABLED slot serves the provider. */
export function firstEnabledRef(slots: readonly ApiKeySlot[]): string | undefined {
  return slots.find(slot => slot.isEnabled)?.ref
}

/** Wire faces the controller needs — what the provider editor page holds. */
export interface ApiKeysDeps {
  api: Pick<IApiClient, 'settings' | 'credentials'>
  schema: Pick<SettingsSchemaOperations, 'getPath'>
  /** Live view of the profile namespace (value + revision). */
  namespaceValue: unknown
  namespaceRevision: number
  /** Path of the provider profile inside its namespace. */
  settingsPath: readonly string[]
  /** The profile's current credential ref (empty when unset). */
  baseRef: string
  /** Provider id (metadata key). */
  providerId: string
}

/** One metadata section for a provider. */
interface ProviderKeySection {
  nextSlot: number
  slots: Array<{ ref: string; label: string; isEnabled: boolean }>
}

function sectionOf(slots: readonly ApiKeySlot[]): ProviderKeySection {
  return {
    nextSlot: nextSlotNumber(slots),
    slots: slots.map(slot => ({ ref: slot.ref, label: slot.label, isEnabled: slot.isEnabled })),
  }
}

/**
 * The multi-key controller. Every operation runs load, mutate, then rebind so
 * revisions stay authoritative; each returns an error message or undefined.
 */
export class ApiKeysController {
  constructor(private readonly deps: ApiKeysDeps) {}

  /** Load slots joined with credential state and the active binding. */
  async load(): Promise<ApiKeysState> {
    const { api, schema, namespaceValue, settingsPath, providerId } = this.deps
    const describe = await api.settings.describe({})
    if (!describe.result.ok) throw new Error(describe.result.error.message)
    const namespaces = describe.result.value.namespaces
    const keysNs = namespaces.find(view => view.ns === API_KEYS_NAMESPACE)
    const slots = readSlots(keysNs === undefined ? undefined : keysNs.value, schema, providerId)
    const boundRaw = schema.getPath(namespaceValue, [...settingsPath, 'apiKeyEnv'])
    const boundRef = typeof boundRaw === 'string' ? boundRaw : ''
    const knownRefs = [...new Set([...slots.map(slot => slot.ref), ...(boundRef === '' ? [] : [boundRef])])]
    let credentials: Record<string, CredentialView> = {}
    if (knownRefs.length > 0) {
      const response = await api.credentials.describe({ refs: knownRefs })
      if (response.result.ok) credentials = response.result.value.credentials
    }
    const stateOf = (ref: string): { configured: boolean; writable: boolean } => {
      const info = credentials[ref]
      return info === undefined
        ? { configured: false, writable: true }
        : { configured: info.configured === true, writable: info.writable !== false }
    }
    const views: ApiKeySlotView[] = slots.map(slot => ({
      ...slot, ...stateOf(slot.ref), active: slot.ref === boundRef,
    }))
    // The pre-feature single-key world: a bound ref without a metadata row
    // shows up as the implicit first slot so the drawer never starts empty.
    if (boundRef !== '' && !slots.some(slot => slot.ref === boundRef)) {
      views.unshift({ ref: boundRef, label: '', isEnabled: true, ...stateOf(boundRef), active: true })
    }
    return {
      slots: views,
      boundRef,
      keysRevision: keysNs === undefined ? null : keysNs.revision,
      profileRevision: namespaces.find(row => row.ns === 'llm-pi-ai')?.revision ?? null,
    }
  }

  /** Rebind the profile's apiKeyEnv to the first enabled slot. */
  private async rebind(slots: readonly ApiKeySlot[], profileRevision: number | null): Promise<string | undefined> {
    const target = firstEnabledRef(slots) ?? ''
    const boundRaw = this.deps.schema.getPath(this.deps.namespaceValue, [...this.deps.settingsPath, 'apiKeyEnv'])
    const current = typeof boundRaw === 'string' ? boundRaw : ''
    if (target === current || profileRevision === null) return undefined
    const ops: SettingsPathOpView[] = target === ''
      ? [{ op: 'unset', path: [...this.deps.settingsPath, 'apiKeyEnv'] }]
      : [{ op: 'set', path: [...this.deps.settingsPath, 'apiKeyEnv'], value: target }]
    const response = await this.deps.api.settings.mutate({ ns: 'llm-pi-ai', expectedRevision: profileRevision, ops })
    return response.result.ok ? undefined : response.result.error.message
  }

  /** Persist the metadata section. */
  private async saveSlots(keysRevision: number | null, slots: readonly ApiKeySlot[]): Promise<string | undefined> {
    if (keysRevision === null) return API_KEYS_NAMESPACE + ' namespace is unavailable'
    const response = await this.deps.api.settings.mutate({
      ns: API_KEYS_NAMESPACE,
      expectedRevision: keysRevision,
      ops: [{ op: 'set', path: ['providers', this.deps.providerId], value: sectionOf(slots) }],
    })
    return response.result.ok ? undefined : response.result.error.message
  }

  /** Shared shape: load fresh state, hand plain slots to the step. */
  private async run(
    step: (state: ApiKeysState, slots: readonly ApiKeySlot[]) => Promise<string | undefined>,
  ): Promise<string | undefined> {
    try {
      const state = await this.load()
      return await step(state, state.slots.map(({ ref, label, isEnabled }) => ({ ref, label, isEnabled })))
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  /** Add one key into the next free slot, then apply the binding rule. */
  async add(key: string, label: string): Promise<string | undefined> {
    return this.run(async (state, slots) => {
      const ref = slotRefOf(this.deps.baseRef, nextSlotNumber(slots))
      const setResponse = await this.deps.api.credentials.set({ ref, value: key })
      if (!setResponse.result.ok) return setResponse.result.error.message
      const next = [...slots, { ref, label, isEnabled: true }]
      const metaError = await this.saveSlots(state.keysRevision, next)
      if (metaError !== undefined) return metaError
      return this.rebind(next, state.profileRevision)
    })
  }

  /** Toggle one slot's enabled flag, then apply the binding rule. */
  async setEnabled(ref: string, isEnabled: boolean): Promise<string | undefined> {
    return this.run(async (state, slots) => {
      const next = slots.map(slot => (slot.ref === ref ? { ...slot, isEnabled } : slot))
      const metaError = await this.saveSlots(state.keysRevision, next)
      if (metaError !== undefined) return metaError
      return this.rebind(next, state.profileRevision)
    })
  }

  /** Rename one slot's label. */
  async setLabel(ref: string, label: string): Promise<string | undefined> {
    return this.run(async (state, slots) => {
      const next = slots.map(slot => (slot.ref === ref ? { ...slot, label } : slot))
      return this.saveSlots(state.keysRevision, next)
    })
  }

  /** Replace one slot's stored key value. */
  async replaceValue(ref: string, key: string): Promise<string | undefined> {
    const setResponse = await this.deps.api.credentials.set({ ref, value: key })
    return setResponse.result.ok ? undefined : setResponse.result.error.message
  }

  /** Remove one slot: credential first (retryable), then metadata, then rebind. */
  async remove(ref: string): Promise<string | undefined> {
    return this.run(async (state, slots) => {
      const unsetResponse = await this.deps.api.credentials.unset({ ref })
      if (!unsetResponse.result.ok) return unsetResponse.result.error.message
      const next = slots.filter(slot => slot.ref !== ref)
      const metaError = await this.saveSlots(state.keysRevision, next)
      if (metaError !== undefined) return metaError
      return this.rebind(next, state.profileRevision)
    })
  }
}
