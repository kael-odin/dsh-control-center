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
  }
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
