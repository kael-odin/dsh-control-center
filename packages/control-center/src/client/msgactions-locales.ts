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
}
