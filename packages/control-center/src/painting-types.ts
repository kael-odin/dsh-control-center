/** Stable ids and wire-safe contracts for the Control Center Painting workspace. */

export type PaintingHistoryId = string

/** One resolved image-capable provider route (endpoint + credential ref). */
export interface PaintingProviderRoute {
  providerId: string
  displayName: string
  baseURL: string
  apiKey: string
}

/** A generation request, provider-agnostic with a canonical param bag. */
export interface PaintingRequest {
  providerId: string
  model: string
  prompt: string
  params: Record<string, unknown>
  sampleCount: number
}

export interface PaintingStartResult {
  jobId: string
}

export interface PaintingJobView {
  jobId: string
  status: 'running' | 'completed' | 'cancelled' | 'error'
  providerId: string
  model: string
  prompt: string
  params: Record<string, unknown>
  sampleCount: number
  progress: number
  error?: string
  createdImages: PaintingImageRef[]
  createdAt: number
  updatedAt: number
  historyId?: PaintingHistoryId
}

/** A generated image: a durable DSH attachment reference plus base64 bytes for browser rendering. */
export interface PaintingImageRef {
  attachmentId: string
  mediaType: string
  bytes: number
  width: number
  height: number
  /** Base64-encoded image bytes, used for in-browser display; the durable identity is attachmentId. */
  dataUrl: string
}

export interface PaintingHistoryItem {
  id: PaintingHistoryId
  prompt: string
  model: string
  providerId: string
  images: PaintingImageRef[]
  createdAt: number
}

export interface PaintingHistoryPage {
  items: PaintingHistoryItem[]
  nextCursor?: string
}

export interface PaintingCatalogModel {
  providerId: string
  id: string
  label: string
}

export interface PaintingCatalogView {
  models: PaintingCatalogModel[]
  errors: string[]
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    controlCenterPainting: {
      catalog(): Promise<{ ok: true; value: PaintingCatalogView } | { ok: false; error: { code: string; message: string; details: object } }>
      start(request: PaintingRequest): Promise<{ ok: true; value: PaintingStartResult } | { ok: false; error: { code: string; message: string; details: object } }>
      get(jobId: string): Promise<{ ok: true; value: PaintingJobView } | { ok: false; error: { code: string; message: string; details: object } }>
      cancel(jobId: string): Promise<{ ok: true; value: PaintingJobView } | { ok: false; error: { code: string; message: string; details: object } }>
      history(cursor: string | null, limit: number): Promise<{ ok: true; value: PaintingHistoryPage } | { ok: false; error: { code: string; message: string; details: object } }>
      deleteHistory(id: PaintingHistoryId): Promise<{ ok: true; value: { absent: true } } | { ok: false; error: { code: string; message: string; details: object } }>
    }
  }
}
