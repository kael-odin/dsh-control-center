import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it } from 'vitest'
import { KnowledgeService } from '../src/knowledge.ts'
import { LOCAL_EMBEDDING_PROVIDER_ID } from '../src/knowledge/embedding.ts'

function setup() {
  const ctx = new Context()
  const settings = {
    describe: () => [{
      ns: 'llm-pi-ai', applies: 'live' as const, revision: 1, schema: {},
      value: { providers: { deepseek: { baseURL: 'http://127.0.0.1:9/v1', apiKeyEnv: 'DSH_TEST_KEY' } } },
    }],
  }
  const credentials = { resolve: async () => ({ value: 'fixture-key', source: 'env' as const }) }
  const llm = {
    listConfigurableProviders: () => [{
      provider: 'deepseek', displayName: 'DeepSeek', settingsNs: 'llm-pi-ai', settingsPath: ['providers', 'deepseek'],
    }],
  }
  ctx.reflect.provide('settings', settings)
  ctx.reflect.provide('credentials', credentials)
  ctx.reflect.provide('llm', llm)
  const home = mkdtempSync(join(tmpdir(), 'dsh-control-center-knowledge-'))
  const service = new KnowledgeService(ctx, { dshHome: home })
  return { ctx, service, home }
}

afterEach(() => {
  // Temp homes are cleaned by the caller; see cleanup() below.
})

function cleanup(service: KnowledgeService, home: string) {
  try {
    ;(service as unknown as { db: { close(): void } }).db.close()
  } catch {
    // Already closed by the service effect.
  }
  rmSync(home, { recursive: true, force: true })
}

describe('KnowledgeService', () => {
  it('creates a base, adds text, indexes with local-hash, retrieves, and deletes', async () => {
    const { service, home } = setup()
    try {
      const created = service.createBase({ name: '团队手册', description: 'Engineering handbook' })
      expect(created.embedding.providerId).toBe(LOCAL_EMBEDDING_PROVIDER_ID)
      expect(created.sourceCount).toBe(0)

      const baseId = created.id
      const source = service.addText({ baseId, name: 'onboarding.md', text: '新成员需要了解代码规范、提交规范与发布流程。' })
      expect(source.kind).toBe('text')
      expect(source.tokens).toBeGreaterThan(0)
      expect(source.chunks).toBe(0)

      const indexed = await service.indexBase(baseId)
      expect(indexed.sourcesIndexed).toBe(1)
      expect(indexed.chunksWritten).toBeGreaterThan(0)
      expect(indexed.embeddingProvider).toBe(LOCAL_EMBEDDING_PROVIDER_ID)

      const baseAfter = service.getBase(baseId)
      expect(baseAfter.sourceCount).toBe(1)
      expect(baseAfter.chunkCount).toBe(indexed.chunksWritten)

      const chunks = service.listChunks(baseId, null, 10)
      expect(chunks.chunks.length).toBeGreaterThan(0)
      expect(chunks.chunks[0]!.sourceName).toBe('onboarding.md')

      const hits = await service.retrieve({ baseId, query: '发布流程' })
      expect(hits.hits.length).toBeGreaterThan(0)
      expect(hits.hits[0]!.sourceName).toBe('onboarding.md')
      expect(hits.hits[0]!.score).toBeGreaterThan(0)

      const listed = service.listBases()
      expect(listed.bases.some(b => b.id === baseId)).toBe(true)

      service.deleteSource(baseId, source.id)
      expect(service.listSources(baseId).sources).toEqual([])
      service.deleteBase(baseId)
      expect(service.listBases().bases).toEqual([])
    } finally {
      cleanup(service, home)
    }
  })

  it('indexes a text file added as base64', async () => {
    const { service, home } = setup()
    try {
      const baseId = service.createBase({ name: 'docs' }).id
      const content = '第一条规范：所有提交必须通过本地检查。\n第二条规范：发布前需要走完整流程。'
      const dataBase64 = Buffer.from(content, 'utf8').toString('base64')
      const source = service.addFile({ baseId, name: 'rules.md', dataBase64, mediaType: 'text/markdown' })
      expect(source.kind).toBe('file')
      expect(source.tokens).toBeGreaterThan(0)
      const indexed = await service.indexBase(baseId)
      expect(indexed.sourcesIndexed).toBe(1)
      const hits = await service.retrieve({ baseId, query: '发布流程' })
      expect(hits.hits.length).toBeGreaterThan(0)
    } finally {
      cleanup(service, home)
    }
  })

  it('rejects unsupported file types and blank queries', async () => {
    const { service, home } = setup()
    try {
      const baseId = service.createBase({ name: 'rejects' }).id
      expect(() => service.addFile({ baseId, name: 'scan.pdf', dataBase64: Buffer.from('%PDF').toString('base64'), mediaType: 'application/pdf' }))
        .toThrow('not supported')
      await expect(service.retrieve({ baseId, query: '   ' })).rejects.toThrow('must not be blank')
      expect(() => service.createBase({ name: '   ' })).toThrow('must not be blank')
      expect(() => service.getBase('missing')).toThrow('does not exist')
    } finally {
      cleanup(service, home)
    }
  })

  it('requires a model for a non-local embedding provider', async () => {
    const { service, home } = setup()
    try {
      expect(() => service.createBase({ name: 'provider-base', embeddingProvider: 'deepseek' }))
        .toThrow('requires an embedding model')
      const created = service.createBase({ name: 'provider-base', embeddingProvider: 'deepseek', embeddingModel: 'embed-v1' })
      expect(created.embedding.model).toBe('embed-v1')
      expect(created.embedding.providerId).toBe('deepseek')
    } finally {
      cleanup(service, home)
    }
  })
})
