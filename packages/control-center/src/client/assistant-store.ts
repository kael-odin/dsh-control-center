/**
 * Shared client store for the assistant prefs (快捷助手 / 划词助手 / 截图).
 *
 * Prefs live in the host `control-center-assistant` settings namespace; this
 * hook loads them over the assistant remote, patches them, and performs the
 * one-time migration off the legacy renderer localStorage keys. The desktop
 * status hook drives the honest per-environment notices.
 */

import { useCallback, useEffect, useState } from 'react'
import type { TypertClientRemote } from '@deepseek-ai/dsh-typert-protocol'
import type { DesktopStatus } from '../desktop-types.ts'
import type { AssistantPrefs } from '../assistant-types.ts'

export type AssistantRemote = NonNullable<TypertClientRemote['controlCenterAssistant']>
export type DesktopRemote = NonNullable<TypertClientRemote['controlCenterDesktop']>

type Envelope<T> = { ok: true; value: T } | { ok: false; error: { code: string; message: string; details: object } }

function unwrap<T>(result: Envelope<T>): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

export interface AssistantStore {
  prefs: AssistantPrefs | null
  update: (patch: Partial<AssistantPrefs>) => Promise<void>
}

/** Load prefs + one-time localStorage migration; optimistic patch then reconcile. */
export function useAssistantStore(assistant: AssistantRemote | undefined, legacyKey: string, legacySlice: keyof AssistantPrefs): AssistantStore {
  const [prefs, setPrefs] = useState<AssistantPrefs | null>(null)

  useEffect(() => {
    if (assistant === undefined) return
    let active = true
    void assistant.get().then(async (result) => {
      if (!active) return
      let value = unwrap(result)
      try {
        const raw = localStorage.getItem(legacyKey)
        if (raw !== null) {
          localStorage.removeItem(legacyKey)
          const legacy = JSON.parse(raw) as object
          const migrated = unwrap(await assistant.set({ [legacySlice]: legacy }))
          value = migrated
        }
      } catch { /* migration is best effort; host value wins */ }
      if (active) setPrefs(value)
    }).catch(() => { if (active) setPrefs(null) })
    return () => { active = false }
  }, [assistant, legacyKey, legacySlice])

  const update = useCallback(async (patch: Partial<AssistantPrefs>) => {
    if (assistant === undefined) return
    setPrefs(previous => previous === null ? previous : {
      screenshot: { ...previous.screenshot, ...patch.screenshot },
      quick: { ...previous.quick, ...patch.quick },
      selection: { ...previous.selection, ...patch.selection },
    })
    try {
      const result = await assistant.set(patch)
      if (result.ok) setPrefs(result.value)
    } catch { /* keep optimistic state; next load reconciles */ }
  }, [assistant])

  return { prefs, update }
}

/** Live desktop capability probe for honest per-environment notices. */
export function useDesktopStatus(desktop: DesktopRemote | undefined): DesktopStatus | null {
  const [status, setStatus] = useState<DesktopStatus | null>(null)
  useEffect(() => {
    if (desktop === undefined) return
    let active = true
    void desktop.check().then((result) => {
      if (active && result.ok) setStatus(result.value)
    }).catch(() => {})
    return () => { active = false }
  }, [desktop])
  return status
}
