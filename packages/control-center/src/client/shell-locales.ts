/** Copy dictionaries for the Control Center shell. */

export const en = {
  trigger: 'Settings',
  title: 'Settings',
  close: 'Close settings',
  generalNav: 'General',
  coreGroup: 'Core',
  nativeGroup: 'DSH native',
  otherGroup: 'DSH native / Other',
  openDocument: 'Open configuration file',
  openDocumentError: 'The configuration file could not be opened.',
  workspaceTranslation: 'Translation',
  workspacePainting: 'Painting',
  workspaceKnowledge: 'Knowledge Base',
  workspaceBack: 'Back to conversation',
  workspaceTranslationDescription: 'Streaming translation, language management, and history are being connected to DSH model providers.',
  workspacePaintingDescription: 'Image-generation jobs, model controls, the gallery, and file attachments are being connected.',
  workspaceKnowledgeDescription: 'Ingestion, chunking, embeddings, retrieval, and agent tools are being connected.',
  providersNav: 'API Providers',
  webSearchNav: 'Web Search',
}

export type SettingsKey = keyof typeof en

export const zh: { [Key in SettingsKey]: string } = {
  trigger: '设置',
  title: '设置',
  close: '关闭设置',
  generalNav: '通用',
  coreGroup: '核心',
  nativeGroup: 'DSH 原生',
  otherGroup: 'DSH 原生／其他',
  openDocument: '打开配置文件',
  openDocumentError: '暂时无法打开配置文件。',
  workspaceTranslation: '翻译',
  workspacePainting: '绘画',
  workspaceKnowledge: '知识库',
  workspaceBack: '返回对话',
  workspaceTranslationDescription: '流式翻译、语言管理与历史能力正在接入 DSH 模型提供方。',
  workspacePaintingDescription: '图像生成任务、模型控件、画廊和文件附件能力正在接入。',
  workspaceKnowledgeDescription: '摄取、切分、Embedding、检索和 Agent 工具能力正在接入。',
  providersNav: 'API 提供商',
  webSearchNav: '网络搜索',
}
