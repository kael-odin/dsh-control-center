/**
 * Backup export matrix — Host service wiring for Cherry's 5 external targets:
 * Notion / Yuque / Obsidian / Joplin / Siyuan. Credentials live in
 * `control-center-export` settings (keys are secret-role, values never leave
 * Host except as auth headers). Markdown conversion itself stays on the
 * client (messageToMarkdown etc.); Host exposes only the network/file
 * operations so the browser never handles tokens.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { settingsNamespace, type SettingsScope } from '@deepseek-ai/dsh-settings'
import Schema from '@deepseek-ai/schemastery'

const EXPORT_NS = settingsNamespace('control-center-export')

export interface ExportMenuToggles {
  image: boolean
  markdown: boolean
  markdown_reason: boolean
  notion: boolean
  yuque: boolean
  joplin: boolean
  obsidian: boolean
  siyuan: boolean
  docx: boolean
  plain_text: boolean
}

interface ExportSettings {
  notion: { apiKey: string; databaseId: string; pageNameKey: string; exportReasoning: boolean }
  yuque: { token: string; repoId: string }
  obsidian: { vault: string }
  joplin: { url: string; token: string; exportReasoning: boolean }
  siyuan: { apiUrl: string; token: string; boxId: string; rootPath: string }
  menus: ExportMenuToggles
}

function sanitizeObsidianFileName(name: string): string {
  let s = name.replace(/[#|\^[\]]/g, '').replace(/[<>:"/\\|?*]/g, '').replace(/^\.+/, '').trim().slice(0, 245)
  return s.length === 0 ? 'Untitled' : s
}

export class ExportMatrixService extends Service {
  static inject = ['settings'] as const
  readonly typertRemote = bindTypertRemote(this, 'controlCenterExport')
  private scope: SettingsScope<ExportSettings>

  constructor(ctx: Context) {
    super(ctx, 'controlCenterExport')
    this.scope = ctx.settings.register(EXPORT_NS, Schema.object({
      notion: Schema.object({
        apiKey: Schema.string().role('secret').default(''),
        databaseId: Schema.string().default(''),
        pageNameKey: Schema.string().default('Name'),
        exportReasoning: Schema.boolean().default(false),
      }).default({ apiKey: '', databaseId: '', pageNameKey: 'Name', exportReasoning: false }),
      yuque: Schema.object({
        token: Schema.string().role('secret').default(''),
        repoId: Schema.string().default(''),
      }).default({ token: '', repoId: '' }),
      obsidian: Schema.object({
        vault: Schema.string().default(''),
      }).default({ vault: '' }),
      joplin: Schema.object({
        url: Schema.string().default(''),
        token: Schema.string().role('secret').default(''),
        exportReasoning: Schema.boolean().default(false),
      }).default({ url: '', token: '', exportReasoning: false }),
      siyuan: Schema.object({
        apiUrl: Schema.string().default(''),
        token: Schema.string().role('secret').default(''),
        boxId: Schema.string().default(''),
        rootPath: Schema.string().default('/CherryStudio'),
      }).default({ apiUrl: '', token: '', boxId: '', rootPath: '/CherryStudio' }),
      menus: Schema.object({
        image: Schema.boolean().default(true),
        markdown: Schema.boolean().default(true),
        markdown_reason: Schema.boolean().default(false),
        notion: Schema.boolean().default(true),
        yuque: Schema.boolean().default(true),
        joplin: Schema.boolean().default(true),
        obsidian: Schema.boolean().default(true),
        siyuan: Schema.boolean().default(true),
        docx: Schema.boolean().default(false),
        plain_text: Schema.boolean().default(true),
      }).default({ image: true, markdown: true, markdown_reason: false, notion: true, yuque: true, joplin: true, obsidian: true, siyuan: true, docx: false, plain_text: true }),
    }), {
      base: {
        notion: { apiKey: '', databaseId: '', pageNameKey: 'Name', exportReasoning: false },
        yuque: { token: '', repoId: '' },
        obsidian: { vault: '' },
        joplin: { url: '', token: '', exportReasoning: false },
        siyuan: { apiUrl: '', token: '', boxId: '', rootPath: '/CherryStudio' },
        menus: { image: true, markdown: true, markdown_reason: false, notion: true, yuque: true, joplin: true, obsidian: true, siyuan: true, docx: false, plain_text: true },
      },
    })
  }

  async getConfig(): Promise<ExportSettings> { return this.scope.get() }

  async setConfig(patch: Partial<ExportSettings>): Promise<{ absent: true }> {
    await this.ctx.settings.update(EXPORT_NS, patch as object)
    return { absent: true }
  }

  async exportToNotion(params: { title: string; markdown: string }): Promise<{ ok: boolean; message: string }> {
    const { notion } = this.scope.get()
    if (notion.apiKey === '' || notion.databaseId === '') return { ok: false, message: 'Notion 未配置（需 apiKey + databaseId）' }
    const title = params.title.length > 32 ? `${params.title.slice(0, 29)}...` : params.title
    try {
      const pageRes = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${notion.apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          parent: { database_id: notion.databaseId },
          properties: { [notion.pageNameKey || 'Name']: { title: [{ text: { content: title } }] } },
        }),
      })
      if (!pageRes.ok) return { ok: false, message: `Notion 创建页面失败: ${String(pageRes.status)} ${await pageRes.text()}` }
      const page = await pageRes.json() as { id: string }
      const blocks = markdownToNotionBlocks(params.markdown)
      const appendRes = await fetch(`https://api.notion.com/v1/blocks/${page.id}/children`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${notion.apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({ children: blocks }),
      })
      if (!appendRes.ok) return { ok: false, message: `Notion 写入块失败: ${String(appendRes.status)} ${await appendRes.text()}` }
      return { ok: true, message: '已导出到 Notion' }
    } catch (error) {
      return { ok: false, message: String((error as Error).message) }
    }
  }

  async exportToYuque(params: { title: string; markdown: string }): Promise<{ ok: boolean; message: string }> {
    const { yuque } = this.scope.get()
    if (yuque.token === '' || yuque.repoId === '') return { ok: false, message: '语雀未配置（需 token + repoId）' }
    try {
      const res = await fetch(`https://www.yuque.com/api/v2/repos/${yuque.repoId}/docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': yuque.token, 'User-Agent': 'CherryAI' },
        body: JSON.stringify({ title: params.title, slug: String(Date.now()), format: 'markdown', body: params.markdown }),
      })
      if (!res.ok) return { ok: false, message: `语雀创建失败: ${String(res.status)} ${await res.text()}` }
      const data = await res.json() as { data: { id: number } }
      const tocRes = await fetch(`https://www.yuque.com/api/v2/repos/${yuque.repoId}/toc`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': yuque.token, 'User-Agent': 'CherryAI' },
        body: JSON.stringify({ action: 'appendNode', action_mode: 'sibling', doc_ids: [data.data.id] }),
      })
      if (!tocRes.ok) return { ok: false, message: `语雀目录更新失败: ${String(tocRes.status)} ${await tocRes.text()}` }
      return { ok: true, message: '已导出到语雀' }
    } catch (error) {
      return { ok: false, message: String((error as Error).message) }
    }
  }

  async exportToJoplin(params: { title: string; markdown: string }): Promise<{ ok: boolean; message: string }> {
    const { joplin } = this.scope.get()
    if (joplin.url === '' || joplin.token === '') return { ok: false, message: 'Joplin 未配置（需 url + token）' }
    try {
      const base = joplin.url.endsWith('/') ? joplin.url : `${joplin.url}/`
      const res = await fetch(`${base}notes?token=${encodeURIComponent(joplin.token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: params.title, body: params.markdown, source: 'DSH Control Center' }),
      })
      if (!res.ok) return { ok: false, message: `Joplin 创建失败: ${String(res.status)} ${await res.text()}` }
      const data = await res.json() as { error?: unknown }
      if (data?.error) return { ok: false, message: `Joplin 返回错误: ${JSON.stringify(data.error)}` }
      return { ok: true, message: '已导出到 Joplin' }
    } catch (error) {
      return { ok: false, message: String((error as Error).message) }
    }
  }

  async exportToSiyuan(params: { title: string; markdown: string }): Promise<{ ok: boolean; message: string }> {
    const { siyuan } = this.scope.get()
    if (siyuan.apiUrl === '' || siyuan.token === '' || siyuan.boxId === '') return { ok: false, message: '思源未配置（需 apiUrl + token + boxId）' }
    try {
      const testRes = await fetch(`${siyuan.apiUrl}/api/notebook/lsNotebooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${siyuan.token}` },
      })
      if (!testRes.ok) return { ok: false, message: `思源连接失败: ${String(testRes.status)}` }
      const testData = await testRes.json() as { code: number; msg?: string }
      if (testData.code !== 0) return { ok: false, message: testData.msg ?? '思源返回错误' }
      const rootPath = siyuan.rootPath.startsWith('/') ? siyuan.rootPath : `/${siyuan.rootPath || 'CherryStudio'}`
      const docTitle = params.title.replace(/[#|\^[\]]/g, '')
      const docPath = `${rootPath}/${docTitle}`
      const createRes = await fetch(`${siyuan.apiUrl}/api/filetree/createDocWithMd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${siyuan.token}` },
        body: JSON.stringify({ notebook: siyuan.boxId, path: docPath, markdown: params.markdown }),
      })
      const createData = await createRes.json() as { code: number; msg?: string }
      if (createData.code !== 0) return { ok: false, message: createData.msg ?? '思源创建失败' }
      return { ok: true, message: '已导出到思源' }
    } catch (error) {
      return { ok: false, message: String((error as Error).message) }
    }
  }

  async exportToObsidian(params: { title: string; markdown: string; vault?: string; folder?: string }): Promise<{ ok: boolean; message: string; url?: string }> {
    const vault = params.vault ?? this.scope.get().obsidian.vault
    if (vault === '') return { ok: false, message: 'Obsidian 未配置 vault' }
    if (params.title.trim() === '') return { ok: false, message: '标题不能为空' }
    const folder = params.folder ?? ''
    const isFile = folder.endsWith('.md')
    const filePath = isFile ? folder : `${folder !== '' && !folder.endsWith('/') ? `${folder}/` : folder}${sanitizeObsidianFileName(params.title)}.md`
    const url = `obsidian://new?file=${encodeURIComponent(filePath)}&vault=${encodeURIComponent(vault)}&clipboard`
    return { ok: true, message: 'Obsidian 链接已生成（需在客户端打开）', url }
  }
}

function markdownToNotionBlocks(markdown: string): unknown[] {
  const blocks: unknown[] = []
  for (const line of markdown.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '') continue
    if (trimmed.startsWith('# ')) blocks.push({ object: 'block', type: 'heading_1', heading_1: { rich_text: [{ type: 'text', text: { content: trimmed.slice(2) } }] } })
    else if (trimmed.startsWith('## ')) blocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: trimmed.slice(3) } }] } })
    else if (trimmed.startsWith('### ')) blocks.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: trimmed.slice(4) } }] } })
    else blocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: line } }] } })
  }
  return blocks
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    controlCenterExport: {
      getConfig(): Promise<ExportSettings>
      setConfig(patch: Partial<ExportSettings>): Promise<{ absent: true }>
      exportToNotion(params: { title: string; markdown: string }): Promise<{ ok: boolean; message: string }>
      exportToYuque(params: { title: string; markdown: string }): Promise<{ ok: boolean; message: string }>
      exportToJoplin(params: { title: string; markdown: string }): Promise<{ ok: boolean; message: string }>
      exportToSiyuan(params: { title: string; markdown: string }): Promise<{ ok: boolean; message: string }>
      exportToObsidian(params: { title: string; markdown: string; vault?: string; folder?: string }): Promise<{ ok: boolean; message: string; url?: string }>
    }
  }
}
