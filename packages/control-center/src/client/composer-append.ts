/**
 * Shared draft-append helper for composer slot entries.
 *
 * `InputState.draft` is the clipboard projection of the editor document, so
 * `inputActions.setDraft` flattens reference chips to their text form. Both
 * composer entries (quick phrases, knowledge chip) therefore refuse to append
 * while chips exist and report an honest reason instead of corrupting a draft.
 */
import type { MsgActionsKey } from './msgactions-locales.ts'

export interface DraftAppendFace {
  useInput: (selector: (state: { draft: string; occurrences?: readonly unknown[] }) => unknown) => unknown
  inputActions: { setDraft(text: string): void }
  t: (key: MsgActionsKey) => string
}

export type DraftAppendOutcome = 'ok' | 'chips'

/** Append one line of text to the session draft (newline-joined when non-empty). */
export function appendDraftText(face: DraftAppendFace, text: string): DraftAppendOutcome {
  const state = face.useInput(input => input) as { draft: string; occurrences?: readonly unknown[] }
  const occurrences = state.occurrences ?? []
  if (occurrences.length > 0) return 'chips'
  const draft = state.draft
  face.inputActions.setDraft(draft.length === 0 ? text : `${draft}\n${text}`)
  return 'ok'
}
