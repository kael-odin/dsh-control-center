/**
 * ChatGPT / Claude conversation-import parsing (client-side, Data 导入面板).
 *
 * The DSH host exposes no session-import RPC and its session logs are an
 * internal zstd event stream — writing third-party conversations into it
 * would bypass every durability invariant. So the honest import is an
 * ARCHIVE: parse the vendor export, emit one Markdown file per conversation,
 * and hand them back as a downloadable bundle. Readable, searchable, and
 * clearly labeled as archives rather than native sessions.
 */

export interface ParsedConversation {
  title: string
  lines: string[]
}

/** ChatGPT conversations.json: array of {title, mapping} trees. */
function parseChatGPT(raw: unknown): ParsedConversation[] {
  if (!Array.isArray(raw)) return []
  const out: ParsedConversation[] = []
  for (const entry of raw) {
    const record = entry as { title?: unknown; mapping?: Record<string, unknown> }
    if (typeof record.title !== 'string' || typeof record.mapping !== 'object' || record.mapping === null) continue
    const lines: string[] = []
    for (const node of Object.values(record.mapping)) {
      const message = (node as { message?: { author?: { role?: unknown }; content?: { parts?: unknown } } }).message
      const role = typeof message?.author?.role === 'string' ? message.author.role : undefined
      const parts = Array.isArray(message?.content?.parts) ? message.content?.parts : undefined
      if (role === undefined || parts === undefined) continue
      const text = parts.filter((part): part is string => typeof part === 'string').join('\n').trim()
      if (text.length === 0) continue
      lines.push(`### ${role === 'user' ? '用户' : role === 'assistant' ? '助手' : role}\n\n${text}`)
    }
    if (lines.length > 0) out.push({ title: record.title, lines })
  }
  return out
}

/** Claude export: array of {name, chat_messages:[{sender, text}]}. */
function parseClaude(raw: unknown): ParsedConversation[] {
  if (!Array.isArray(raw)) return []
  const out: ParsedConversation[] = []
  for (const entry of raw) {
    const record = entry as { name?: unknown; chat_messages?: unknown }
    if (typeof record.name !== 'string' || !Array.isArray(record.chat_messages)) continue
    const lines: string[] = []
    for (const item of record.chat_messages) {
      const message = item as { sender?: unknown; text?: unknown }
      if (typeof message.sender !== 'string' || typeof message.text !== 'string') continue
      const text = message.text.trim()
      if (text.length === 0) continue
      const label = message.sender === 'human' ? '用户' : message.sender === 'assistant' ? '助手' : message.sender
      lines.push(`### ${label}\n\n${text}`)
    }
    if (lines.length > 0) out.push({ title: record.name, lines })
  }
  return out
}

/**
 * Parse a vendor export file. Format detection is content-based: both vendors
 * ship a top-level JSON array, distinguished by their element shape.
 */
export function parseVendorConversations(fileName: string, text: string): { ok: true; value: ParsedConversation[] } | { ok: false; error: string } {
  let raw: unknown
  try {
    raw = JSON.parse(text) as unknown
  } catch {
    return { ok: false, error: '文件不是合法的 JSON 导出' }
  }
  const parsed = fileName.toLowerCase().includes('claude') ? parseClaude(raw) : parseChatGPT(raw)
  // Content sniff when the filename gives no hint: Claude entries carry name+chat_messages.
  const chosen = parsed.length > 0 ? parsed : (fileName.toLowerCase().includes('chatgpt') ? [] : parseClaude(raw))
  if (chosen.length === 0 && parsed.length === 0) {
    return { ok: false, error: '未识别出对话内容（支持 ChatGPT conversations.json 与 Claude 导出 JSON）' }
  }
  return { ok: true, value: chosen }
}

/** One Markdown document per conversation, separated by horizontal rules. */
export function renderArchiveMarkdown(conversations: ParsedConversation[]): string {
  return conversations
    .map(conversation => `# ${conversation.title}\n\n${conversation.lines.join('\n\n---\n\n')}`)
    .join('\n\n\n---\n\n\n')
}
