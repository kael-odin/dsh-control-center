import { describe, expect, it } from 'vitest'
import { parseVendorConversations, renderArchiveMarkdown } from '../src/client/vendor-import.ts'

describe('vendor conversation import', () => {
  it('parses ChatGPT conversations.json mapping trees', () => {
    const raw = JSON.stringify([
      {
        title: '测试对话',
        mapping: {
          a: { message: { author: { role: 'user' }, content: { parts: ['你好'] } } },
          b: { message: { author: { role: 'assistant' }, content: { parts: ['你好！有什么可以帮你？'] } } },
          c: {},
        },
      },
    ])
    const result = parseVendorConversations('conversations.json', raw)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toHaveLength(1)
    expect(result.value[0]!.title).toBe('测试对话')
    expect(result.value[0]!.lines.join('\n')).toContain('### 用户')
    expect(result.value[0]!.lines.join('\n')).toContain('你好！')
  })

  it('parses Claude export arrays', () => {
    const raw = JSON.stringify([
      {
        name: 'Claude 对话',
        chat_messages: [
          { sender: 'human', text: '解释一下 zstd' },
          { sender: 'assistant', text: 'zstd 是压缩算法…' },
        ],
      },
    ])
    const result = parseVendorConversations('claude-export.json', raw)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value[0]!.lines).toEqual(['### 用户\n\n解释一下 zstd', '### 助手\n\nzstd 是压缩算法…'])
  })

  it('rejects non-vendor json honestly', () => {
    const result = parseVendorConversations('random.json', JSON.stringify({ hello: 1 }))
    expect(result).toMatchObject({ ok: false })
  })

  it('renders an archive document with separators', () => {
    const markdown = renderArchiveMarkdown([
      { title: 'A', lines: ['### 用户\n\nq'] },
      { title: 'B', lines: ['### 助手\n\na'] },
    ])
    expect(markdown).toContain('# A')
    expect(markdown).toContain('# B')
    expect(markdown).toContain('---')
  })
})
