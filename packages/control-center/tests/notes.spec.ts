import { Context } from '@deepseek-ai/cordis'
import { mkdtempSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { NotesService } from '../src/notes.ts'

let home: string

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'dsh-notes-'))
  process.env.DSH_HOME = home
})

function makeService(): NotesService {
  const ctx = new Context()
  ;(ctx as unknown as { settings: unknown }).settings = {
    get: () => ({ starred: [...starredStore] }),
    update: async (_ns: unknown, patch: { starred?: string[] }) => {
      if (Array.isArray(patch.starred)) starredStore = new Set(patch.starred)
    },
    describe: () => [{ ns: 'agent-default-model', value: { provider: 'deepseek', model: 'deepseek-chat' } }],
  }
  ctx.reflect.provide('llm', {
    prepareCall: async (config: { provider: string; model: string }) => ({
      config,
      stream: async function* () {
        yield { type: 'text-delta', text: '继续写下去的正文。' }
        yield { type: 'done' }
      },
    }),
  } as never)
  return new NotesService(ctx)
}

let starredStore = new Set<string>()

describe('NotesService (v1)', () => {
  it('creates, reads, and writes markdown files under the notes root', async () => {
    const service = makeService()
    const created = await service.create({ path: 'hello.md' })
    expect(created.ok).toBe(true)
    expect(existsSync(join(home, 'notes', 'hello.md'))).toBe(true)

    const written = await service.write({ path: 'hello.md', content: '# 你好\n\n内容' })
    expect(written.ok).toBe(true)
    const read = await service.read({ path: 'hello.md' })
    expect(read).toMatchObject({ ok: true, value: { content: '# 你好\n\n内容' } })
    expect(readFileSync(join(home, 'notes', 'hello.md'), 'utf8')).toContain('你好')
  })

  it('lists the tree with star flags and toggles them', async () => {
    const service = makeService()
    await service.create({ path: 'a.md' })
    await service.create({ path: 'sub', directory: true })
    await service.create({ path: 'sub/b.md' })

    const tree = await service.tree()
    expect(tree.ok).toBe(true)
    if (!tree.ok) return
    const paths = tree.value.entries.map(entry => entry.path).sort()
    expect(paths).toEqual(['a.md', 'sub', 'sub/b.md'])

    const star = await service.toggleStar({ path: 'a.md' })
    expect(star.value.starred).toBe(true)
    const tree2 = await service.tree()
    if (!tree2.ok) return
    expect(tree2.value.entries.find(entry => entry.path === 'a.md')?.starred).toBe(true)
  })

  it('renames carrying the star flag and refuses traversal', async () => {
    const service = makeService()
    await service.create({ path: 'old.md' })
    await service.toggleStar({ path: 'old.md' })
    const renamed = await service.rename({ from: 'old.md', to: 'new.md' })
    expect(renamed.ok).toBe(true)
    expect(existsSync(join(home, 'notes', 'old.md'))).toBe(false)
    const tree = await service.tree()
    if (!tree.ok) return
    expect(tree.value.entries.find(entry => entry.path === 'new.md')?.starred).toBe(true)

    const traversal = await service.read({ path: '../outside.md' })
    expect(traversal.ok).toBe(false)
    if (!traversal.ok) expect(traversal.error).toContain('越界')
  })

  it('removes files and directories', async () => {
    const service = makeService()
    await service.create({ path: 'dir', directory: true })
    await service.create({ path: 'dir/x.md' })
    const removed = await service.remove({ path: 'dir', directory: true })
    expect(removed.ok).toBe(true)
    expect(existsSync(join(home, 'notes', 'dir'))).toBe(false)
  })
})

describe('NotesService full-text search (v2)', () => {
  it('indexes content on write and returns matching paths with snippets', async () => {
    const service = makeService()
    await service.create({ path: 'alpha.md' })
    await service.write({ path: 'alpha.md', content: '# Alpha\n\n量子计算入门笔记' })
    await service.write({ path: 'beta.md', content: '# Beta\n\n关于量子的进一步思考' })

    // FlexSearch tokenizes on word boundaries; give the index a tick.
    await new Promise(resolve => setTimeout(resolve, 20))

    const hits = await service.search({ query: '量子' })
    expect(hits.ok).toBe(true)
    if (!hits.ok) return
    expect(hits.value.map(h => h.path).sort()).toEqual(['alpha.md', 'beta.md'])
    expect(hits.value[0]?.snippet).toContain('量子')
  })

  it('returns empty for a blank query', async () => {
    const service = makeService()
    const hits = await service.search({ query: '   ' })
    expect(hits).toEqual({ ok: true, value: [] })
  })
})

describe('NotesService AI continuation (v3)', () => {
  it('continues a note through the configured default model route', async () => {
    const service = makeService()
    await service.create({ path: 'idea.md' })
    await service.write({ path: 'idea.md', content: '# 想法\n\n我们需要一个更好的发布流程。' })
    const result = await service.continueText({ path: 'idea.md', content: '# 想法\n\n我们需要一个更好的发布流程。' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.text.length).toBeGreaterThan(0)
    expect(result.value.model).toBe('deepseek-chat')
  })

  it('refuses to continue an empty note', async () => {
    const service = makeService()
    const result = await service.continueText({ path: 'x.md', content: '   ' })
    expect(result.ok).toBe(false)
  })
})
