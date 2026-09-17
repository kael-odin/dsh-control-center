/**
 * 导出 Word — Cherry message-action parity (§1.1): turn one assistant
 * message's Markdown into a minimal, valid .docx (a ZIP of WordprocessingML)
 * without any runtime dependency beyond fflate, which the export matrix
 * already carries.
 *
 * Supported Markdown subset — headings, unordered/ordered lists, blockquotes,
 * fenced code blocks, paragraphs; inline bold/italic/inline code become runs.
 * Everything else degrades to plain paragraph text: an export must never
 * silently drop a paragraph.
 */

/** XML-escape text destined for a WordprocessingML text node. */
export function xmlEscape(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

interface InlineRun {
  text: string
  bold?: boolean
  italic?: boolean
  code?: boolean
}

/** Split one line into styled runs: **bold**, *italic*, `code`. */
export function inlineRuns(line: string): InlineRun[] {
  const runs: InlineRun[] = []
  const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g
  let cursor = 0
  for (const match of line.matchAll(pattern)) {
    const start = match.index ?? 0
    if (start > cursor) runs.push({ text: line.slice(cursor, start) })
    if (match[1] !== undefined) runs.push({ text: match[1], bold: true })
    else if (match[2] !== undefined) runs.push({ text: match[2], italic: true })
    else runs.push({ text: match[3] ?? '', code: true })
    cursor = start + match[0].length
  }
  if (cursor < line.length) runs.push({ text: line.slice(cursor) })
  return runs
}

function paraXml(line: string, pPr?: string): string {
  const runs = inlineRuns(line)
  if (runs.length === 0) return pPr === undefined ? '<w:p/>' : `<w:p>${pPr}</w:p>`
  const body = runs.map(({ text, bold, italic, code }) => {
    const props = [
      bold === true ? '<w:b/>' : '',
      italic === true ? '<w:i/>' : '',
      code === true ? '<w:rStyle w:val="CodeChar"/>' : '',
    ].join('')
    return `<w:r>${props === '' ? '' : `<w:rPr>${props}</w:rPr>`}<w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r>`
  }).join('')
  return `<w:p>${pPr ?? ''}${body}</w:p>`
}

/** Map one Markdown block to its WordprocessingML paragraph XML. */
export function blockXml(block: string): string {
  const fence = /^```(\w*)\n([\s\S]*?)\n?```$/.exec(block.trim())
  if (fence !== null) {
    const body = fence[2] ?? ''
    return body.split('\n').map((line) => {
      const text = xmlEscape(line)
      return `<w:p><w:pPr><w:pStyle w:val="Code"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`
    }).join('')
  }
  const heading = /^(#{1,6})\s+(.*)$/.exec(block.trim())
  if (heading !== null) {
    const level = (heading[1] ?? '#').length
    return `<w:p><w:pPr><w:pStyle w:val="Heading${level}"/></w:pPr><w:r><w:t xml:space="preserve">${xmlEscape(heading[2] ?? '')}</w:t></w:r></w:p>`
  }
  const trimmed = block.trim()
  if (trimmed.startsWith('- ')) {
    return trimmed.split('\n')
      .map(line => paraXml(line.replace(/^-\s+/, ''), '<w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>'))
      .join('')
  }
  if (/^\d+\.\s+/.test(trimmed)) {
    return trimmed.split('\n')
      .map(line => paraXml(line.replace(/^\d+\.\s+/, ''), '<w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr>'))
      .join('')
  }
  if (trimmed.startsWith('> ')) {
    return trimmed.split('\n')
      .map(line => paraXml(line.replace(/^>\s+/, ''), '<w:pPr><w:pStyle w:val="Quote"/></w:pPr>'))
      .join('')
  }
  return paraXml(trimmed)
}

/** Whole-document body XML: title heading then each Markdown block. */
export function documentXml(title: string, markdown: string): string {
  const blocks = markdown
    .split(/\n{2,}/)
    .map(b => b.trim())
    .filter(b => b.length > 0)
  const titleXml = `<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t xml:space="preserve">${xmlEscape(title)}</w:t></w:r></w:p>`
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>',
    titleXml,
    ...blocks.map(blockXml),
    '<w:sectPr><w:sz w:val="24"/><w:szCs w:val="24"/></w:sectPr>',
    '</w:body></w:document>',
  ].join('')
}

const CONTENT_TYPES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
const RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'

/**
 * Build the .docx bytes for one message: `title` becomes a Title-style
 * heading, `markdown` the body. Returns a ZIP (PK) that Word, WPS, and
 * LibreOffice all open.
 */
export async function docxFromMarkdown(title: string, markdown: string): Promise<Uint8Array> {
  const { zipSync, strToU8 } = await import('fflate')
  return zipSync({
    '[Content_Types].xml': strToU8(CONTENT_TYPES),
    '_rels/.rels': strToU8(RELS),
    'word/document.xml': strToU8(documentXml(title, markdown)),
  })
}
