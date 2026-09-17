import { describe, expect, it } from 'vitest'
import { unzipSync, strFromU8 } from 'fflate'
import { blockXml, documentXml, docxFromMarkdown, inlineRuns, xmlEscape } from '../src/client/markdown-docx.ts'

describe('xmlEscape', () => {
  it('escapes markup-significant characters', () => {
    expect(xmlEscape(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&apos;')
  })
})

describe('inlineRuns', () => {
  it('splits bold, italic, and code runs while keeping plain text', () => {
    expect(inlineRuns('plain **bold** and *it* plus `code` end')).toEqual([
      { text: 'plain ' },
      { text: 'bold', bold: true },
      { text: ' and ' },
      { text: 'it', italic: true },
      { text: ' plus ' },
      { text: 'code', code: true },
      { text: ' end' },
    ])
  })

  it('keeps a line without markup as one run', () => {
    expect(inlineRuns('no markup')).toEqual([{ text: 'no markup' }])
  })
})

describe('blockXml', () => {
  it('maps headings, lists, quotes, and code fences to Word styles', () => {
    expect(blockXml('## 标题')).toContain('<w:pStyle w:val="Heading2"/>')
    expect(blockXml('- a\n- b')).toContain('<w:numId w:val="1"/>')
    expect(blockXml('1. a\n2. b')).toContain('<w:numId w:val="2"/>')
    expect(blockXml('> quoted')).toContain('<w:pStyle w:val="Quote"/>')
    const code = blockXml('```js\nconst x = 1;\n```')
    expect(code).toContain('<w:pStyle w:val="Code"/>')
    expect(code).toContain('const x = 1;')
  })

  it('escapes XML inside text content', () => {
    expect(blockXml('a < b & c')).toContain('a &lt; b &amp; c')
  })
})

describe('docxFromMarkdown', () => {
  it('produces a real ZIP package with a document part', async () => {
    const bytes = await docxFromMarkdown('会话标题', '# 摘要\n\n正文段落，带 **强调**。\n\n- 列表项')
    // ZIP local file header magic
    expect(Array.from(bytes.slice(0, 2))).toEqual([0x50, 0x4b])
    const files = unzipSync(bytes)
    expect(Object.keys(files).sort()).toEqual([
      '[Content_Types].xml',
      '_rels/.rels',
      'word/document.xml',
    ])
    const document = strFromU8(files['word/document.xml'])
    expect(document).toContain('会话标题')
    expect(document).toContain('<w:pStyle w:val="Heading1"/>')
    expect(document).toContain('<w:pStyle w:val="Title"/>')
    expect(document).toContain('强调')
    expect(document).toContain('列表项')
  })
})
