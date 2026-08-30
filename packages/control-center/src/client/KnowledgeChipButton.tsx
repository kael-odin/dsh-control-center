/**
 * @知识库 chip — Cherry knowledgeBaseTool parity. Registered into
 * `conversation.input.right` (list, session scope): a 📚 button lists the
 * deployment's knowledge bases (plugin knowledge service, `listBases`);
 * picking one inserts a reference annotation that names the base and points
 * the agent at the `knowledge_retrieve` tool (`base` parameter), so the
 * model restricts retrieval to that base.
 */
import { useCallback, useEffect, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import css from './QuickPhrasesButton.module.css'
import { appendDraftText, type DraftAppendFace } from './composer-append.ts'

/** Knowledge service face (lazy from apply(); shapes match the wire). */
export interface KnowledgeChipKnowledgeFace {
  listBases(): Promise<{
    ok: true
    value: ReadonlyArray<{ id: string; name: string; sourceCount?: number }>
  } | { ok: false; error: unknown }>
}

export type KnowledgeChipProps =
  PropsRuntime<'conversation.input.right'>
  & PropsLocale<'control-center.msgactions'>
  & { getKnowledge: () => KnowledgeChipKnowledgeFace }

function knowledgeAnnotation(baseName: string): string {
  return `【知识库：${baseName}】本条消息请优先调用 knowledge_retrieve（base="${baseName}"）检索相关资料后再回答。`
}

export function KnowledgeChipButton(props: KnowledgeChipProps) {
  const [open, setOpen] = useState(false)
  const [bases, setBases] = useState<ReadonlyArray<{ id: string; name: string; sourceCount?: number }>>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    try {
      const listed = await props.getKnowledge().listBases()
      if (!listed.ok) {
        setError(props.t('failed'))
        return
      }
      setBases(listed.value)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    }
  }, [props])

  useEffect(() => {
    if (open) void reload()
  }, [open, reload])

  const insertChip = useCallback((baseName: string) => {
    const face: DraftAppendFace = {
      useInput: props.useInput,
      inputActions: props.inputActions,
      t: props.t,
    }
    const outcome = appendDraftText(face, knowledgeAnnotation(baseName))
    if (outcome === 'chips') {
      setNotice(props.t('chipsBlock'))
      return
    }
    setNotice(null)
    setOpen(false)
  }, [props])

  return (
    <span className={css.anchor}>
      <button
        type="button"
        className={css.button}
        title={props.t('knowledgeChip')}
        aria-label={props.t('knowledgeChip')}
        onClick={() => { setOpen(open => !open) }}
      >
        📚
      </button>
      {open && (
        <span className={css.menu} role="dialog" aria-label={props.t('knowledgeChip')}>
          {error !== null && <span className={css.error} role="alert">{error}</span>}
          {notice !== null && <span className={css.error} role="alert">{notice}</span>}
          {bases.length === 0 && error === null && notice === null && (
            <span className={css.menuTitle}>{props.t('noBases')}</span>
          )}
          {bases.map(base => (
            <button
              key={base.id}
              type="button"
              className={css.phraseItem}
              title={knowledgeAnnotation(base.name)}
              onClick={() => { insertChip(base.name) }}
            >
              {base.name}
              {base.sourceCount === undefined ? '' : ` (${String(base.sourceCount)})`}
            </button>
          ))}
        </span>
      )}
    </span>
  )
}
