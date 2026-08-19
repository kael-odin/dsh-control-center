import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { PaintingService } from '../src/painting.ts'

// A minimal 1x1 PNG.
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

async function setup({ baseURL }: { baseURL: string }) {
  const ctx = new Context()
  const settings = {
    describe: () => [{
      ns: 'llm-pi-ai', applies: 'live' as const, revision: 1, schema: {},
      value: { providers: { deepseek: { baseURL } } },
    }],
  }
  const credentials = { resolve: async () => ({ value: 'fixture-key', source: 'env' as const }) }
  const attachments = {
    imageLimits: { maxImagesPerMessage: 10, maxMessageImageBytes: 10_000_000, maxImageBytes: 1_000_000, mediaTypes: ['image/png'], maxImagePixels: 4_000_000 },
    saveImage: async (input: { data: Uint8Array; mediaType: string; name?: string }) => ({
      attachmentId: 'att-1' as never, mediaType: input.mediaType as never,
      bytes: input.data.byteLength as never, width: 1024 as never, height: 1024 as never, name: input.name,
    }),
    saveImages: async () => [],
    validateImage: async () => {},
    readImage: async () => ({ ref: {} as never, data: new Uint8Array(0) }),
  }
  const llm = {
    listConfigurableProviders: () => [{
      provider: 'deepseek', displayName: 'DeepSeek', settingsNs: 'llm-pi-ai', settingsPath: ['providers', 'deepseek'],
    }],
    listModels: async () => [{ provider: 'deepseek', id: 'image-1', name: 'Image One' }],
  }
  ctx.reflect.provide('settings', settings)
  ctx.reflect.provide('credentials', credentials)
  ctx.reflect.provide('attachments', attachments)
  ctx.reflect.provide('llm', llm)
  const service = new PaintingService(ctx)
  return { ctx, service }
}

describe('PaintingService', () => {
  it('generates an image through a real provider HTTP call and records history', async () => {
    const requests: Array<{ url: string; body: unknown }> = []
    const { createServer } = await import('node:http')
    const server = createServer(async (req, res) => {
      let body = ''
      req.setEncoding('utf8')
      for await (const chunk of req) body += chunk
      requests.push({ url: req.url ?? '/', body: JSON.parse(body || '{}') })
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ data: [{ b64_json: PNG_B64 }] }))
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    const baseURL = typeof address === 'object' && address !== null ? `http://127.0.0.1:${address.port}/v1` : ''
    try {
      if (!baseURL) throw new Error('no port')
      const { service } = await setup({ baseURL })
      const catalog = await service.catalog()
      expect(catalog.models.some(m => m.id === 'image-1')).toBe(true)

      const started = service.start({ providerId: 'deepseek', model: 'image-1', prompt: 'a cat in a hat', params: { size: '1024x1024' }, sampleCount: 1 })
      const view = await settle(service, started.jobId)
      expect(view.status).toBe('completed')
      expect(view.createdImages).toHaveLength(1)
      expect(requests.length).toBe(1)
      expect(requests[0]!.body).toMatchObject({ model: 'image-1', prompt: 'a cat in a hat', size: '1024x1024' })

      const history = service.listHistory(null, 20)
      expect(history.items).toHaveLength(1)
      service.deleteHistory(history.items[0]!.id)
      expect(service.listHistory(null, 20).items).toEqual([])
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })

  it('rejects a blank prompt before any provider call', async () => {
    const { service } = await setup({ baseURL: 'http://127.0.0.1:9/v1' })
    expect(() => service.start({ providerId: 'deepseek', model: 'image-1', prompt: '   ', params: {}, sampleCount: 1 }))
      .toThrow('must not be blank')
  })
})

async function settle(service: PaintingService, jobId: string) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const job = service.get(jobId)
    if (job.status !== 'running') return job
    await new Promise(resolve => setTimeout(resolve, 5))
  }
  throw new Error('painting job did not settle')
}

