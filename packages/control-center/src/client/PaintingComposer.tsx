/**
 * Painting composer: Cherry PaintingComposer parity — model pill, params
 * popover (background/count/quality/size chips), "+" quick panel (attach /
 * prompt library), send/pause.
 */
import { useEffect, useRef, useState } from 'react'
import { IconChevronDownOutline14, IconPauseOutline16, IconPlusOutline16, IconSendOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'

import css from './PaintingWorkspace.module.css'
import { IconMoreHorizontal, IconPlus, IconTrash2, IconX, IconZap } from './cherry-icons.tsx'
import { IconPaperclip, IconSettings2 } from './painting-icons.tsx'
import { ModelSelector, type ModelOption } from './ModelSelector.tsx'

export interface PaintingAttachment {
  name: string
  dataUrl: string
}

export interface PaintingParams {
  background: 'auto' | 'transparent' | 'opaque'
  count: number
  quality: 'auto' | 'low' | 'medium' | 'high'
  size: 'auto' | '1024x1024' | '1536x1024' | '1024x1536'
}

export interface PaintingPromptEntry {
  id: string
  title: string
  content: string
}

export interface PaintingComposerProps {
  models: ReadonlyArray<ModelOption>
  selectedModel: string
  onModelChange: (value: string) => void
  prompt: string
  onPromptChange: (value: string) => void
  attachments: readonly PaintingAttachment[]
  onAddAttachment: (file: File) => void
  onRemoveAttachment: (index: number) => void
  params: PaintingParams
  onParamsChange: (patch: Partial<PaintingParams>) => void
  prompts: readonly PaintingPromptEntry[]
  onAddPrompt: (title: string, content: string) => void
  onDeletePrompt: (id: string) => void
  running: boolean
  canSend: boolean
  onSend: () => void
  onPause: () => void
}

const PROMPTS_KEY = 'cc.painting.prompts'

export function loadPaintingPrompts(): PaintingPromptEntry[] {
  try {
    const raw = localStorage.getItem(PROMPTS_KEY)
    if (raw === null) return []
    const parsed = JSON.parse(raw) as PaintingPromptEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function savePaintingPrompts(prompts: readonly PaintingPromptEntry[]): void {
  try { localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts)) } catch { /* best effort */ }
}

const SIZE_OPTIONS: ReadonlyArray<{ value: PaintingParams['size']; label: string; ratio: string }> = [
  { value: 'auto', label: '自动', ratio: '1' },
  { value: '1024x1024', label: '1024×1024', ratio: '1' },
  { value: '1536x1024', label: '1536×1024', ratio: '3 / 2' },
  { value: '1024x1536', label: '1024×1536', ratio: '2 / 3' },
]

export const DEFAULT_PAINTING_PARAMS: PaintingParams = { background: 'auto', count: 1, quality: 'auto', size: 'auto' }

function sizeLabel(size: PaintingParams['size']): string {
  if (size === 'auto') return '自动'
  return size.replace('x', '×')
}

export function paramsSummary(params: PaintingParams): string {
  const background = params.background === 'auto' ? '背景自动' : params.background === 'transparent' ? '透明' : '不透明'
  const quality = params.quality === 'auto' ? '质量自动' : params.quality
  return `${background} · ${params.count} · ${quality} · ${sizeLabel(params.size)}`
}

export function PaintingComposer(props: PaintingComposerProps) {
  const {
    models, selectedModel, onModelChange, prompt, onPromptChange,
    attachments, onAddAttachment, onRemoveAttachment,
    params, onParamsChange, prompts, onAddPrompt, onDeletePrompt,
    running, canSend, onSend, onPause,
  } = props
  const [paramsOpen, setParamsOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [libOpen, setLibOpen] = useState(false)
  const [addingPrompt, setAddingPrompt] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)

  // Close stacked popovers when the params popover opens.
  useEffect(() => {
    if (paramsOpen) { setQuickOpen(false); setLibOpen(false) }
  }, [paramsOpen])

  const selectPrompt = (content: string): void => {
    onPromptChange(content)
    setLibOpen(false)
  }

  const submitPrompt = (): void => {
    if (formTitle.trim() === '' || formContent.trim() === '') return
    onAddPrompt(formTitle.trim(), formContent.trim())
    setFormTitle('')
    setFormContent('')
    setAddingPrompt(false)
  }

  return (
    <div className={css.composer}>
      {attachments.length > 0 && (
        <div className={css.attachmentTray}>
          {attachments.map((attachment, index) => (
            <div key={index} className={css.attachmentTile}>
              <img src={attachment.dataUrl} alt={attachment.name} />
              <button
                type="button"
                className={css.attachmentDelete}
                title="删除"
                aria-label="删除"
                onClick={() => { onRemoveAttachment(index) }}
              >
                <IconX size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={css.composerTextRow}>
        <button type="button" className={css.addImageButton} title="添加图片" onClick={() => { fileRef.current?.click() }}>
          <IconPlus size={18} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(event) => {
            const files = [...(event.target.files ?? [])]
            for (const file of files) onAddAttachment(file)
            event.target.value = ''
          }}
        />
        <textarea
          className={css.composerTextarea}
          aria-label="绘画提示词"
          value={prompt}
          onChange={event => { onPromptChange(event.target.value) }}
          placeholder="描述你想创建的图片，例如：一个宁静的湖泊，夕阳西下，远处是群山"
          rows={Math.min(6, Math.max(2, Math.ceil(prompt.length / 64)))}
        />
      </div>

      <div className={css.composerToolbar}>
        <div className={css.composerToolbarLeft}>
          <ModelSelector
            models={models}
            value={selectedModel}
            onChange={onModelChange}
            placeholder="选择模型"
            ariaLabel="图像模型"
            onConfigure={() => { window.dispatchEvent(new CustomEvent('cc:open-settings-section', { detail: 'models' })) }}
          />

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={`${css.pillButton} ${css.muted}`}
              aria-label={`设置: ${paramsSummary(params)}`}
              onClick={() => { setParamsOpen(open => !open) }}
            >
              <IconSettings2 size={14} />
              <span className={css.pillSummary}>{paramsSummary(params)}</span>
            </button>
            {paramsOpen && (
              <div className={css.paramsPopover}>
                <div className={css.paramsField}>
                  <div className={css.paramsFieldTitle}><span>背景</span></div>
                  <div className={css.paramsSelectWrap}>
                    <select
                      className={css.paramsSelect}
                      value={params.background}
                      onChange={event => { onParamsChange({ background: event.target.value as PaintingParams['background'] }) }}
                    >
                      <option value="auto">自动</option>
                      <option value="transparent">透明</option>
                      <option value="opaque">不透明</option>
                    </select>
                    <IconChevronDownOutline14 size={12} className={css.chevron} />
                  </div>
                </div>
                <div className={css.paramsField}>
                  <div className={css.paramsFieldTitle}>
                    <span>生成数量</span>
                    <span style={{ textTransform: 'none', letterSpacing: 0 }}>(1-8)</span>
                  </div>
                  <div className={css.countRow}>
                    <input
                      type="range"
                      className={css.countSlider}
                      min={1}
                      max={8}
                      step={1}
                      value={params.count}
                      onChange={event => { onParamsChange({ count: Number(event.target.value) }) }}
                      aria-label="生成数量"
                    />
                    <input
                      type="number"
                      className={css.countInput}
                      min={1}
                      max={8}
                      value={params.count}
                      onChange={event => {
                        const value = Math.min(8, Math.max(1, Number(event.target.value) || 1))
                        onParamsChange({ count: value })
                      }}
                      aria-label="生成数量数值"
                    />
                  </div>
                </div>
                <div className={css.paramsField}>
                  <div className={css.paramsFieldTitle}><span>质量</span></div>
                  <div className={css.paramsSelectWrap}>
                    <select
                      className={css.paramsSelect}
                      value={params.quality}
                      onChange={event => { onParamsChange({ quality: event.target.value as PaintingParams['quality'] }) }}
                    >
                      <option value="auto">自动</option>
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                    </select>
                    <IconChevronDownOutline14 size={12} className={css.chevron} />
                  </div>
                </div>
                <div className={css.paramsField}>
                  <div className={css.paramsFieldTitle}><span>图片尺寸</span></div>
                  <div className={css.sizeGrid}>
                    {SIZE_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        className={`${css.sizeChip} ${params.size === option.value ? css.active : ''}`}
                        onClick={() => { onParamsChange({ size: option.value }) }}
                      >
                        <span className={css.ratioThumb} style={{ ['--ratio' as string]: option.ratio }} />
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={css.roundButton}
              title="输入快捷面板"
              onClick={() => { setQuickOpen(open => !open); setLibOpen(false) }}
            >
              <IconPlusOutline16 size={18} />
            </button>
            {quickOpen && (
              <div className={css.quickPanel}>
                <button
                  type="button"
                  className={css.quickItem}
                  onClick={() => { fileRef.current?.click(); setQuickOpen(false) }}
                >
                  <IconPaperclip size={16} className={css.quickItemIcon} />
                  <span className={css.quickItemLabel}>上传附件</span>
                </button>
                <button
                  type="button"
                  className={css.quickItem}
                  onClick={() => { setLibOpen(true); setQuickOpen(false) }}
                >
                  <IconZap size={16} className={css.quickItemIcon} />
                  <span className={css.quickItemLabel}>提示词管理</span>
                  <IconMoreHorizontal size={12} className={css.quickItemIcon} />
                </button>
              </div>
            )}
            {libOpen && (
              <div className={css.promptLib}>
                <div className={css.promptLibList}>
                  {prompts.length === 0
                    ? <div className={css.promptLibEmpty}>暂无提示词</div>
                    : prompts.map(entry => (
                      <button key={entry.id} type="button" className={css.promptLibItem} onClick={() => { selectPrompt(entry.content) }}>
                        <span className={css.promptLibItemMain}>
                          <span className={css.promptLibTitle}>{entry.title}</span>
                          <span className={css.promptLibContent}>{entry.content}</span>
                        </span>
                        <span
                          className={css.promptLibDelete}
                          role="button"
                          title="删除"
                          onClick={(event) => { event.stopPropagation(); onDeletePrompt(entry.id) }}
                        >
                          <IconTrash2 size={12} />
                        </span>
                      </button>
                    ))}
                </div>
                <div className={css.promptLibFooter}>
                  <button type="button" className={css.quickItem} onClick={() => { setAddingPrompt(true) }}>
                    <IconZap size={14} className={css.quickItemIcon} />
                    <span className={css.quickItemLabel}>添加提示词...</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {running ? (
          <button type="button" className={css.pauseButton} title="暂停" onClick={onPause}>
            <IconPauseOutline16 size={18} />
          </button>
        ) : (
          <button type="button" className={css.sendButton} title="发送" disabled={!canSend} onClick={onSend}>
            <IconSendOutline16 size={20} />
          </button>
        )}
      </div>

      {addingPrompt && (
        <div className={css.addPromptOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setAddingPrompt(false) }}>
          <div className={css.addPromptCard} role="dialog" aria-modal="true" aria-label="添加提示词">
            <h3>添加提示词</h3>
            <div className={css.addPromptField}>
              <label htmlFor="cc-prompt-title">标题</label>
              <input
                id="cc-prompt-title"
                className={css.addPromptInput}
                placeholder="提示词标题"
                value={formTitle}
                onChange={event => { setFormTitle(event.target.value) }}
                autoFocus
              />
            </div>
            <div className={css.addPromptField}>
              <label htmlFor="cc-prompt-content">内容</label>
              <textarea
                id="cc-prompt-content"
                className={css.addPromptTextarea}
                placeholder="提示词内容"
                value={formContent}
                onChange={event => { setFormContent(event.target.value) }}
              />
            </div>
            <div className={css.dialogActions}>
              <button type="button" className={css.btn} onClick={() => { setAddingPrompt(false) }}>取消</button>
              <button type="button" className={`${css.btn} ${css.btnPrimary}`} disabled={formTitle.trim() === '' || formContent.trim() === ''} onClick={submitPrompt}>添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
