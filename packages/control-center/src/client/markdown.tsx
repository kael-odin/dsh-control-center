/**
 * Tiny markdown renderer for the translate output pane (Cherry parity for
 * the "Markdown 预览" setting). Supports the common inline/block shapes;
 * anything unrecognized falls through to plain pre-wrap text.
 */
import { Fragment, type ReactNode } from 'react'

interface Token {
  type: 'text' | 'code' | 'bold' | 'italic' | 'link'
  value: string
  href?: string
}

const TOKEN_RE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]\n]+\]\([^)\s]+\))/g

function inlineTokens(text: string): Token[] {
  const tokens: Token[] = []
  let last = 0
  for (const match of text.matchAll(TOKEN_RE)) {
    const index = match.index ?? 0
    if (index > last) tokens.push({ type: 'text', value: text.slice(last, index) })
    const raw = match[0]
    if (raw.startsWith('**') && raw.endsWith('**')) tokens.push({ type: 'bold', value: raw.slice(2, -2) })
    else if (raw.startsWith('`') && raw.endsWith('`')) tokens.push({ type: 'code', value: raw.slice(1, -1) })
    else if (raw.startsWith('[') && raw.endsWith(')')) {
      const close = raw.indexOf('](')
      tokens.push({ type: 'link', value: raw.slice(1, close), href: raw.slice(close + 2, -1) })
    } else if (raw.startsWith('*') && raw.endsWith('*')) tokens.push({ type: 'italic', value: raw.slice(1, -1) })
    else tokens.push({ type: 'text', value: raw })
    last = index + raw.length
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) })
  return tokens
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return inlineTokens(text).map((token, index) => {
    const key = `${keyPrefix}-${index}`
    switch (token.type) {
      case 'bold': return <strong key={key}>{token.value}</strong>
      case 'italic': return <em key={key}>{token.value}</em>
      case 'code': return <code key={key}>{token.value}</code>
      case 'link': return <a key={key} href={token.href} target="_blank" rel="noreferrer">{token.value}</a>
      default: return <Fragment key={key}>{token.value}</Fragment>
    }
  })
}

const HEADING_RE = /^(#{1,4})\s+(.+)$/
const FENCE_RE = /^```(?:\w+)?\s*$/
const UL_RE = /^\s*[-*]\s+(.+)$/
const OL_RE = /^\s*\d+[.)]\s+(.+)$/
const QUOTE_RE = /^\s*>\s?(.+)$/
const HR_RE = /^\s*(---+|\*\*\*+)\s*$/

export function renderMarkdown(source: string): ReactNode[] {
  const lines = source.split(/\r?\n/)
  const nodes: ReactNode[] = []
  let paragraph: string[] = []
  let fence: string[] | null = null
  let list: { ordered: boolean; items: string[]; key: number } | null = null
  let key = 0

  const flushParagraph = (): void => {
    if (paragraph.length === 0) return
    nodes.push(<p key={key++}>{renderInline(paragraph.join(' '), `p${key}`)}</p>)
    paragraph = []
  }

  const flushList = (): void => {
    if (list === null) return
    const { ordered, items, key: listKey } = list
    const Tag = ordered ? 'ol' : 'ul'
    nodes.push(
      <Tag key={listKey}>
        {items.map((item, index) => <li key={`${listKey}-${index}`}>{renderInline(item, `li${listKey}-${index}`)}</li>)}
      </Tag>,
    )
    list = null
  }

  for (const line of lines) {
    // Fenced code block.
    if (FENCE_RE.test(line.trim())) {
      if (fence === null) {
        flushParagraph(); flushList()
        fence = []
      } else {
        nodes.push(<pre key={key++}><code>{fence.join('\n')}</code></pre>)
        fence = null
      }
      continue
    }
    if (fence !== null) {
      fence.push(line)
      continue
    }
    if (line.trim() === '') {
      flushParagraph(); flushList()
      continue
    }
    const heading = HEADING_RE.exec(line)
    if (heading !== null) {
      flushParagraph(); flushList()
      const level = heading[1]!.length
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4'
      nodes.push(<Tag key={key++}>{renderInline(heading[2]!, `h${key}`)}</Tag>)
      continue
    }
    if (HR_RE.test(line)) {
      flushParagraph(); flushList()
      nodes.push(<hr key={key++} />)
      continue
    }
    const quote = QUOTE_RE.exec(line)
    if (quote !== null) {
      flushParagraph(); flushList()
      nodes.push(<blockquote key={key++}>{renderInline(quote[1]!, `q${key}`)}</blockquote>)
      continue
    }
    const ul = UL_RE.exec(line)
    const ol = OL_RE.exec(line)
    if (ul !== null || ol !== null) {
      flushParagraph()
      if (list === null || list.ordered !== (ol !== null)) {
        flushList()
        list = { ordered: ol !== null, items: [], key: key++ }
      }
      list.items.push(ul?.[1] ?? ol?.[1] ?? '')
      continue
    }
    flushList()
    paragraph.push(line)
  }
  flushParagraph(); flushList()
  if (fence !== null) nodes.push(<pre key={key++}><code>{fence.join('\n')}</code></pre>)
  return nodes
}
