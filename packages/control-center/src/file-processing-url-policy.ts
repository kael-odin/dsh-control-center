/** Narrow network policy for provider-issued document upload and result URLs. */

export type RemoteDocumentProvider = 'mineru' | 'doc2x'
export type RemoteStorageUrlKind = 'upload' | 'download'

interface RemoteStorageUrlOptions {
  provider: RemoteDocumentProvider
  apiHost: string
  kind: RemoteStorageUrlKind
}

const MAX_REMOTE_URL_LENGTH = 16 * 1024
const MAX_SIGNED_HEADER_LENGTH = 8 * 1024

const CLOUD_STORAGE_HOSTS: Record<RemoteDocumentProvider, Record<RemoteStorageUrlKind, readonly string[]>> = {
  mineru: {
    upload: ['mineru.oss-cn-shanghai.aliyuncs.com'],
    download: ['cdn-mineru.openxlab.org.cn'],
  },
  doc2x: {
    upload: ['doc2x-pdf.oss-cn-beijing.aliyuncs.com'],
    download: ['doc2x-backend.s3.cn-north-1.amazonaws.com.cn'],
  },
}

const SIGNED_HEADER_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/u
const FORBIDDEN_SIGNED_HEADERS = new Set([
  'authorization',
  'connection',
  'content-length',
  'cookie',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

function parseHttpUrl(rawUrl: string, label: string): URL {
  if (rawUrl.length === 0 || rawUrl.length > MAX_REMOTE_URL_LENGTH) {
    throw new Error(`${label} is invalid`)
  }
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error(`${label} is invalid`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${label} must use HTTP or HTTPS`)
  }
  if (url.username !== '' || url.password !== '' || url.hash !== '') {
    throw new Error(`${label} is unsafe`)
  }
  return url
}

function normalizedPort(url: URL): string {
  if (url.port !== '') return url.port
  return url.protocol === 'https:' ? '443' : '80'
}

function sameOrigin(left: URL, right: URL): boolean {
  return left.protocol === right.protocol
    && left.hostname.toLowerCase() === right.hostname.toLowerCase()
    && normalizedPort(left) === normalizedPort(right)
}

function isKnownCloudHost(url: URL, provider: RemoteDocumentProvider, kind: RemoteStorageUrlKind): boolean {
  return url.protocol === 'https:'
    && normalizedPort(url) === '443'
    && CLOUD_STORAGE_HOSTS[provider][kind].includes(url.hostname.toLowerCase())
}

/**
 * Validate a URL returned by MinerU or Doc2X before the host sends data to it.
 * Self-hosted providers may use their configured origin; cloud providers may use
 * only the documented object-storage/CDN hosts for the operation.
 */
export function sanitizeRemoteStorageUrl(rawUrl: string, options: RemoteStorageUrlOptions): URL {
  const candidate = parseHttpUrl(rawUrl, 'Remote provider URL')
  const configured = parseHttpUrl(options.apiHost, 'Configured provider endpoint')
  if (sameOrigin(candidate, configured) || isKnownCloudHost(candidate, options.provider, options.kind)) {
    return candidate
  }
  throw new Error('Remote provider URL is not an allowed storage endpoint')
}

/** Restrict provider-returned signed headers to storage-request-safe fields. */
export function sanitizeSignedUploadHeaders(rawHeaders: unknown): Record<string, string> | undefined {
  if (rawHeaders === undefined) return undefined
  if (typeof rawHeaders !== 'object' || rawHeaders === null || Array.isArray(rawHeaders)) {
    throw new Error('Remote provider upload headers are invalid')
  }
  const safe: Record<string, string> = {}
  for (const [name, value] of Object.entries(rawHeaders)) {
    const normalizedName = name.toLowerCase()
    if (!SIGNED_HEADER_NAME.test(name) || FORBIDDEN_SIGNED_HEADERS.has(normalizedName)) {
      throw new Error('Remote provider returned an unsafe upload header')
    }
    if (typeof value !== 'string' || value.length > MAX_SIGNED_HEADER_LENGTH || /[\r\n]/u.test(value)) {
      throw new Error('Remote provider returned an invalid upload header')
    }
    if (
      normalizedName !== 'content-type'
      && normalizedName !== 'content-md5'
      && !normalizedName.startsWith('x-amz-')
      && !normalizedName.startsWith('x-ms-')
      && !normalizedName.startsWith('x-oss-')
    ) {
      throw new Error('Remote provider returned an unsupported upload header')
    }
    safe[name] = value
  }
  return safe
}

/** Read a response without allowing an unbounded body into memory. */
export async function readBoundedResponseBytes(response: Response, maxBytes: number, signal?: AbortSignal): Promise<Uint8Array> {
  const rawLength = response.headers.get('content-length')
  if (rawLength !== null) {
    const contentLength = Number(rawLength)
    if (!Number.isSafeInteger(contentLength) || contentLength < 0 || contentLength > maxBytes) {
      throw new Error('Remote provider response exceeds the size limit')
    }
  }
  if (response.body === null) throw new Error('Remote provider response has no body')

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    while (true) {
      if (signal?.aborted) throw signal.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError')
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined)
        throw new Error('Remote provider response exceeds the size limit')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return merged
}

/** Parse a provider JSON body only after enforcing the same response budget. */
export async function readBoundedResponseJson<T>(response: Response, maxBytes: number, signal?: AbortSignal): Promise<T> {
  const bytes = await readBoundedResponseBytes(response, maxBytes, signal)
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new Error('Remote provider response is not valid UTF-8')
  }
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('Remote provider response is not valid JSON')
  }
}

/** A ZIP response may carry parameters, but not a different media type. */
export function isZipContentType(contentType: string | null): boolean {
  return contentType?.split(';', 1)[0]?.trim().toLowerCase() === 'application/zip'
}
