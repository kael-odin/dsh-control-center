/**
 * Quick assistant / selection assistant / screenshot preferences.
 *
 * Moved off renderer localStorage into a DSH settings namespace so the
 * desktop shell can consume them (host pushes to the native bridge) and the
 * Data page's snapshot export/import covers them like every other setting.
 */

export interface ScreenshotPrefs {
  enabled: boolean
  autoOcr: boolean
}

export interface QuickPrefs {
  enabled: boolean
  clickTrayToShow: boolean
  readClipboardAtStartup: boolean
  modelMode: 'model' | 'assistant'
  agentPresetId: string
}

export interface SelectionAction {
  id: string
  name: string
  icon: string
  enabled: boolean
  builtin: boolean
  prompt?: string
  searchEngine?: string
}

export interface SelectionPrefs {
  enabled: boolean
  triggerMode: 'selected' | 'ctrlkey' | 'shortcut'
  compact: boolean
  followToolbar: boolean
  rememberWinSize: boolean
  autoClose: boolean
  autoPin: boolean
  opacity: number
  filterMode: 'default' | 'whitelist' | 'blacklist'
  filterList: string[]
  actions: SelectionAction[]
}

export interface AssistantPrefs {
  screenshot: ScreenshotPrefs
  quick: QuickPrefs
  selection: SelectionPrefs
}

/** Typert envelope shared by the assistant remote methods. */
export type AssistantEnvelope<T> = { ok: true; value: T } | { ok: false; error: { code: string; message: string; details: object } }

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    controlCenterAssistant: {
      get(): Promise<AssistantEnvelope<AssistantPrefs>>
      set(params: { screenshot?: Partial<ScreenshotPrefs>; quick?: Partial<QuickPrefs>; selection?: Partial<SelectionPrefs> }): Promise<AssistantEnvelope<AssistantPrefs>>
    }
  }
}
