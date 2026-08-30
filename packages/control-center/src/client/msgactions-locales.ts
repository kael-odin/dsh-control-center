/** Locale keys + dictionaries for the assistant message actions slot entry. */

export type MsgActionsKey = keyof typeof msgActionsEn

interface MsgActionsDict {
  groupLabel: string
  saveNotes: string
  saveNotesDone: string
  saveKnowledge: string
  saveKnowledgeDone: string
  pickBase: string
  noBases: string
  noText: string
  messageFallback: string
  saving: string
  failed: string
  translate: string
  noTranslateRoute: string
  translating: string
  translationLabel: string
  close: string
  moreMenu: string
  copyText: string
  exportMarkdown: string
}

export const msgActionsZh: MsgActionsDict = {
  groupLabel: '消息动作（Control Center）',
  saveNotes: '存为笔记',
  saveNotesDone: '已存为笔记',
  saveKnowledge: '存入知识库',
  saveKnowledgeDone: '已存入知识库',
  pickBase: '选择知识库',
  noBases: '没有可用的知识库',
  noText: '未读到消息文本',
  messageFallback: '消息笔记',
  saving: '保存中…',
  failed: '失败',
  translate: '翻译',
  noTranslateRoute: '未配置翻译模型',
  translating: '翻译中…',
  translationLabel: '译文',
  close: '收起译文',
  moreMenu: '更多操作',
  copyText: '复制原文',
  exportMarkdown: '导出 Markdown',
}

export const msgActionsEn: MsgActionsDict = {
  groupLabel: 'Message actions (Control Center)',
  saveNotes: 'Save as note',
  saveNotesDone: 'Saved as note',
  saveKnowledge: 'Save to knowledge',
  saveKnowledgeDone: 'Saved to knowledge',
  pickBase: 'Pick a knowledge base',
  noBases: 'No knowledge bases available',
  noText: 'No message text read',
  messageFallback: 'Message note',
  saving: 'Saving…',
  failed: 'Failed',
  translate: 'Translate',
  noTranslateRoute: 'No translation model configured',
  translating: 'Translating…',
  translationLabel: 'Translation',
  close: 'Hide translation',
  moreMenu: 'More actions',
  copyText: 'Copy raw text',
  exportMarkdown: 'Export Markdown',
}
