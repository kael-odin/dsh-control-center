/**
 * File Processing (document to markdown) and OCR (image to text) types.
 *
 * Processor settings hold only non-secret configuration. API key values live
 * in the DSH credential provider and are never returned over the Typert wire.
 */

export type FileProcessorFeature = 'document_to_markdown' | 'image_to_text'

export type FileProcessorId =
  | 'system'
  | 'tesseract'
  | 'paddleocr'
  | 'local-paddleocr'
  | 'ovocr'
  | 'local-document'
  | 'mineru'
  | 'doc2x'
  | 'mistral'
  | 'open-mineru'

/** Current host readiness of one advertised processor capability. */
export type FileProcessorStatusCode =
  | 'ready'
  | 'needs-credential'
  | 'needs-runtime'
  | 'unsupported-platform'
  | 'unavailable'

export interface FileProcessorStatus {
  code: FileProcessorStatusCode
  message: string
}

/** One processor entry in the catalog and its host-observed capability state. */
export interface FileProcessorEntry {
  id: FileProcessorId
  name: string
  description: string
  apiKeyWebsite: string | null
  features: FileProcessorFeature[]
  requiresApiKey: boolean
  /** Default API host per supported feature, matching Cherry capability presets. */
  apiHostDefaults?: Partial<Record<FileProcessorFeature, string>>
  /** Default model per supported feature, matching Cherry capability presets. */
  modelDefaults?: Partial<Record<FileProcessorFeature, string>>
  /** Language code options for OCR processors. */
  languageOptions: string[]
  /** True when a local model must be installed before execution. */
  requiresLocalModel?: boolean
  /** Runtime status per feature. Settings alone never make a processor ready. */
  status: Partial<Record<FileProcessorFeature, FileProcessorStatus>>
}

export interface FileProcessorCapabilityOverride {
  apiHost?: string
  modelId?: string
}

/**
 * Stored non-secret processor settings.
 *
 * `apiKeys` remains only for one-time migration of older settings files. New
 * callers write values through `setApiKey()` and never receive them back.
 */
export interface FileProcessorOverride {
  /** Cherry-compatible per-feature endpoint/model overrides. */
  capabilities?: Partial<Record<FileProcessorFeature, FileProcessorCapabilityOverride>>
  /** Cherry-compatible OCR language options. */
  options?: { langs?: string[] }
  /** Stable credential reference names, never their values. */
  credentialRefs?: string[]
  /** Legacy fields retained for existing settings snapshots. */
  languages?: string[]
  apiHost?: string
  model?: string
  /** Legacy on-disk secret field. It is stripped after migration. */
  apiKeys?: string[]
}

/** The non-secret override accepted from browser settings. */
export type FileProcessorOverrideInput = Omit<FileProcessorOverride, 'apiKeys' | 'credentialRefs'>

/** A credential reference projected safely for configuration UI. */
export interface FileProcessorCredentialView {
  ref: string
  configured: boolean
  writable: boolean
  source?: string
}

export type FileProcessorOverrideView = Omit<FileProcessorOverride, 'apiKeys'>

/** Safe settings projection returned by `getConfig()`. */
export interface FileProcessingConfigView {
  defaultDocumentProcessor: FileProcessorId
  defaultImageProcessor: FileProcessorId
  overrides: Partial<Record<FileProcessorId, FileProcessorOverrideView>>
  credentials: Partial<Record<FileProcessorId, FileProcessorCredentialView[]>>
}

/** Conversion request. The host validates the path before any provider request. */
export interface FileConvertRequest {
  processor: FileProcessorId
  path: string
  /** Target language for OCR processors (defaults to the override). */
  language?: string
}

/** Conversion result for immediately completed processing. */
export interface FileConvertResult {
  processor: FileProcessorId
  feature: FileProcessorFeature
  text: string
  bytes: number
  /** Present when an asynchronous document conversion has been queued. */
  taskId?: string
}

export type FileProcessingTaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'interrupted'

/** Public persisted state for a remote document conversion. */
export interface FileProcessingTaskView {
  taskId: string
  processor: FileProcessorId
  feature: FileProcessorFeature
  status: FileProcessingTaskStatus
  progress: number
  createdAt: string
  updatedAt: string
  detail?: string
  resultAvailable: boolean
}

/** A task status paired with its completed Markdown, when available. */
export interface FileProcessingTaskResult {
  task: FileProcessingTaskView
  text?: string
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    controlCenterFileProcessing: {
      listProcessors(): Promise<{ ok: true; value: FileProcessorEntry[] } | { ok: false; error: { code: string; message: string; details: object } }>
      getConfig(): Promise<{ ok: true; value: FileProcessingConfigView } | { ok: false; error: { code: string; message: string; details: object } }>
      setDefault(feature: FileProcessorFeature, processor: FileProcessorId): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
      setOverride(processor: FileProcessorId, override: FileProcessorOverrideInput): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
      setApiKey(processor: FileProcessorId, slot: number, value: string): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
      clearApiKey(processor: FileProcessorId, slot: number): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
      convert(request: FileConvertRequest): Promise<{ ok: true; value: FileConvertResult } | { ok: false; error: { code: string; message: string; details: object } }>
      listTasks(): Promise<{ ok: true; value: FileProcessingTaskView[] } | { ok: false; error: { code: string; message: string; details: object } }>
      getTask(taskId: string): Promise<{ ok: true; value: FileProcessingTaskView } | { ok: false; error: { code: string; message: string; details: object } }>
      getTaskResult(taskId: string): Promise<{ ok: true; value: FileProcessingTaskResult } | { ok: false; error: { code: string; message: string; details: object } }>
      cancelTask(taskId: string): Promise<{ ok: true; value: FileProcessingTaskView } | { ok: false; error: { code: string; message: string; details: object } }>
    }
  }
}
