import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { FileProcessingService } from '../src/file-processing.ts'
import type { FileProcessorId } from '../src/file-processing-types.ts'
import {
  canResumeRemoteTask,
  taskView,
  type FileProcessingTaskRecord,
} from '../src/file-processing-tasks.ts'
import {
  isZipContentType,
  readBoundedResponseBytes,
  readBoundedResponseJson,
  sanitizeRemoteStorageUrl,
  sanitizeSignedUploadHeaders,
} from '../src/file-processing-url-policy.ts'

const DEFAULT_SETTINGS = {
  defaultDocumentProcessor: 'local-document' as const,
  defaultImageProcessor: 'system' as const,
  overrides: {},
}

/** Minimal host capabilities needed to exercise the service's real readiness checks. */
async function setup() {
  const stored = new Map<string, unknown>([['value', structuredClone(DEFAULT_SETTINGS)]])
  const secrets = new Map<string, string>([['CC_FILE_PROCESSING_PADDLEOCR_API_KEY_1', 'fixture-key']])
  const taskRows = new Map<string, unknown>()
  const credentials = {
    describe: async (ref: string) => ({ configured: secrets.has(ref), writable: true }),
    resolve: async (ref: string) => {
      const value = secrets.get(ref)
      return value === undefined ? undefined : { value, source: 'test' }
    },
    set: async (ref: string, value: string) => { secrets.set(ref, value) },
    unset: async (ref: string) => { secrets.delete(ref) },
  }
  const storageDomain = {
    open: async () => ({
      table: () => ({
        get: (key: string) => taskRows.get(key),
        entries: () => taskRows.entries(),
        put: async (key: string, value: unknown) => { taskRows.set(key, value) },
        update: async (key: string, mutate: (current: never) => unknown) => {
          const current = taskRows.get(key)
          if (current === undefined) throw new Error(`missing-key: ${key}`)
          const next = mutate(current as never)
          taskRows.set(key, next)
          return next
        },
      }),
      close: async () => {},
    }),
  }
  const ctx = new Context()
  ctx.reflect.provide('credentials', credentials)
  ctx.reflect.provide('storageDomain', storageDomain)
  ;(ctx as unknown as { settings: unknown }).settings = {
    get: () => stored.get('value'),
    update: async (_namespace: string, value: unknown) => { stored.set('value', value) },
    register: () => ({
      get: () => stored.get('value'),
      update: async (patch: object) => {
        const current = stored.get('value') as object
        stored.set('value', { ...current, ...patch })
      },
    }),
  } as never
  const service = new FileProcessingService(ctx)
  // `ctx.inject()` activates on the next turn; wait until the durable task store is open.
  await new Promise<void>(resolve => setTimeout(resolve, 0))
  return { service, secrets }
}

describe('FileProcessingService Cherry processor parity', () => {
  it('exposes six document processors and five dedicated OCR processors', async () => {
    const { service } = await setup()
    const processors = await service.listProcessors()
    const documents = processors.filter(processor => processor.features.includes('document_to_markdown')).map(processor => processor.id)
    const ocr = processors.filter(processor => processor.features.includes('image_to_text')).map(processor => processor.id)

    expect(documents).toEqual(['paddleocr', 'mistral', 'local-document', 'mineru', 'doc2x', 'open-mineru'])
    expect(ocr).toEqual(['system', 'tesseract', 'paddleocr', 'local-paddleocr', 'ovocr', 'mistral'])
  })

  it('deep-merges feature settings without discarding the other feature', async () => {
    const { service } = await setup()
    const processor: FileProcessorId = 'paddleocr'
    await service.setOverride(processor, {
      capabilities: { image_to_text: { apiHost: 'https://ocr.example', modelId: 'PP-OCRv6' } },
    })
    await service.setOverride(processor, {
      capabilities: { document_to_markdown: { apiHost: 'https://docs.example', modelId: 'PaddleOCR-VL-1.6' } },
    })

    const config = await service.getConfig()
    expect(config.overrides.paddleocr?.capabilities).toEqual({
      image_to_text: { apiHost: 'https://ocr.example', modelId: 'PP-OCRv6' },
      document_to_markdown: { apiHost: 'https://docs.example', modelId: 'PaddleOCR-VL-1.6' },
    })
  })

  it('accepts PaddleOCR as a document default', async () => {
    const { service } = await setup()
    await service.setDefault('document_to_markdown', 'paddleocr')
    const config = await service.getConfig()
    expect(config.defaultDocumentProcessor).toBe('paddleocr')
  })
})

describe('remote storage URL policy', () => {
  it('allows same-origin and documented cloud hosts', () => {
    expect(String(sanitizeRemoteStorageUrl('https://mineru.net/api/v4/put/x', {
      provider: 'mineru', apiHost: 'https://mineru.net', kind: 'upload',
    }))).toBe('https://mineru.net/api/v4/put/x')
    expect(sanitizeRemoteStorageUrl('https://mineru.oss-cn-shanghai.aliyuncs.com/bucket/key', {
      provider: 'mineru', apiHost: 'https://mineru.net', kind: 'upload',
    }).hostname).toBe('mineru.oss-cn-shanghai.aliyuncs.com')
  })

  it('rejects lookalike hosts, wrong ports, credentials, and schemes', () => {
    for (const rawUrl of [
      'https://mineru.oss-cn-shanghai.aliyuncs.com.evil.com/key',
      'https://cdn-mineru.openxlab.org.cn:8443/key',
      'http://cdn-mineru.openxlab.org.cn/key',
      'https://user:pass@cdn-mineru.openxlab.org.cn/key',
      'ftp://cdn-mineru.openxlab.org.cn/key',
    ]) {
      expect(() => sanitizeRemoteStorageUrl(rawUrl, {
        provider: 'mineru', apiHost: 'https://mineru.net', kind: 'download',
      })).toThrow()
    }
  })

  it('restricts signed upload headers to storage-safe fields', () => {
    expect(sanitizeSignedUploadHeaders({ 'x-oss-meta-a': 'v', 'Content-Type': 'application/zip' }))
      .toEqual({ 'x-oss-meta-a': 'v', 'Content-Type': 'application/zip' })
    expect(sanitizeSignedUploadHeaders(undefined)).toBeUndefined()
    for (const headers of [
      { Authorization: 'Bearer x' },
      { Cookie: 'a=b' },
      { Host: 'evil.example' },
      { 'X-Bad': 'line1\nline2' },
      { 'X-Oss-Prefix': {} },
    ]) {
      expect(() => sanitizeSignedUploadHeaders(headers)).toThrow()
    }
  })

  it('bounds response bodies and parses JSON within the budget', async () => {
    const ok = new Response(JSON.stringify({ code: 0 }), { status: 200, headers: { 'content-type': 'application/json' } })
    await expect(readBoundedResponseJson<{ code: number }>(ok, 1024)).resolves.toEqual({ code: 0 })

    const huge = new Response(JSON.stringify({ code: 0 }).padEnd(64, 'x'), {
      status: 200,
      headers: { 'content-length': '999999999' },
    })
    await expect(readBoundedResponseBytes(huge, 16)).rejects.toThrow('size limit')

    const streamed = new Response(new Uint8Array(33).fill(65), { status: 200 })
    await expect(readBoundedResponseBytes(streamed, 32)).rejects.toThrow('size limit')

    const badJson = new Response('not-json', { status: 200 })
    await expect(readBoundedResponseJson(badJson, 1024)).rejects.toThrow('valid JSON')

    expect(isZipContentType('application/zip; charset=utf-8')).toBe(true)
    expect(isZipContentType('application/json')).toBe(false)
    expect(isZipContentType(null)).toBe(false)
  })
})

describe('durable task views', () => {
  function record(overrides: Partial<FileProcessingTaskRecord> = {}): FileProcessingTaskRecord {
    return {
      id: 'file-processing-00000000-0000-4000-8000-000000000000',
      processor: 'doc2x',
      feature: 'document_to_markdown',
      sourcePath: '/home/doc.pdf',
      sourceName: 'doc.pdf',
      sourceBytes: 10,
      apiHost: 'https://v2.doc2x.noedgeai.com',
      modelId: '',
      providerTaskId: 'uid-1',
      stage: 'polling',
      status: 'running',
      progress: 40,
      createdAt: '2026-08-26T00:00:00.000Z',
      updatedAt: '2026-08-26T00:01:00.000Z',
      deadlineAt: '2026-08-26T00:30:00.000Z',
      attempts: 1,
      ...overrides,
    }
  }

  it('projects wire-safe views without host-only fields', () => {
    const view = taskView(record({ error: 'Remote provider URL is not an allowed storage endpoint', artifactPath: '/home/results/x.md' }))
    expect(view.resultAvailable).toBe(true)
    expect(view.detail).toContain('allowed storage endpoint')
    expect(JSON.stringify(view)).not.toContain('/home/doc.pdf')
    expect(JSON.stringify(view)).not.toContain('apiHost')
  })

  it('only resumes running tasks that already hold a provider task id', () => {
    expect(canResumeRemoteTask(record())).toBe(true)
    expect(canResumeRemoteTask(record({ providerTaskId: undefined }))).toBe(false)
    expect(canResumeRemoteTask(record({ status: 'queued', providerTaskId: 'uid' }))).toBe(false)
    expect(canResumeRemoteTask(record({ status: 'cancelled', providerTaskId: 'uid' }))).toBe(false)
  })
})
