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
  copied: string
  translate: string
  noTranslateRoute: string
  translating: string
  translationLabel: string
  close: string
  moreMenu: string
  copyText: string
  copyMarkdown: string
  exportMarkdown: string
  regenerate: string
  branchNew: string
  deleteBranch: string
  quickPhrases: string
  noPhrases: string
  addPhrase: string
  phraseLabel: string
  phraseText: string
  deletePhrase: string
  knowledgeChip: string
  chipsBlock: string
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
  copied: '已复制',
  translate: '翻译',
  noTranslateRoute: '未配置翻译模型',
  translating: '翻译中…',
  translationLabel: '译文',
  close: '收起译文',
  moreMenu: '更多操作',
  copyText: '复制原文',
  copyMarkdown: '复制 Markdown',
  exportMarkdown: '导出 Markdown',
  regenerate: '重新生成',
  branchNew: '新分支',
  deleteBranch: '删除此分支',
  quickPhrases: '快捷短语',
  noPhrases: '还没有短语，在下方添加',
  addPhrase: '添加短语',
  phraseLabel: '名称',
  phraseText: '内容',
  deletePhrase: '删除短语',
  knowledgeChip: '引用知识库',
  chipsBlock: '草稿含引用 chips，追加会摊平它们；请先清空后再插入',
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
  copied: 'Copied',
  translate: 'Translate',
  noTranslateRoute: 'No translation model configured',
  translating: 'Translating…',
  translationLabel: 'Translation',
  close: 'Hide translation',
  moreMenu: 'More actions',
  copyText: 'Copy raw text',
  copyMarkdown: 'Copy as Markdown',
  exportMarkdown: 'Export Markdown',
  regenerate: 'Regenerate',
  branchNew: 'New branch',
  deleteBranch: 'Delete branch',
  quickPhrases: 'Quick phrases',
  noPhrases: 'No phrases yet — add one below',
  addPhrase: 'Add phrase',
  phraseLabel: 'Name',
  phraseText: 'Content',
  deletePhrase: 'Delete phrase',
  knowledgeChip: 'Reference knowledge base',
  chipsBlock: 'Draft contains reference chips; appending would flatten them — clear the draft first',
}
