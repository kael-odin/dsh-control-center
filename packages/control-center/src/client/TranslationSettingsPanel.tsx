/**
 * Translate settings side panel: Cherry TranslateSettings parity —
 * Markdown preview / auto-copy / scroll sync switches, detection method,
 * bidirectional pair, custom translation prompt, custom languages.
 */
import { useEffect, useRef, useState } from 'react'
import type { TranslationLanguage } from '../translation-types.ts'
import css from './TranslationWorkspace.module.css'
import { IconArrowLeftRight, IconPenLine, IconPlus, IconTrash2 } from './cherry-icons.tsx'
import { IconButton, PanelShell, Segmented, Switch } from './panel-ui.tsx'

export interface TranslationSettingsState {
  markdown: boolean
  autoCopy: boolean
  scrollSync: boolean
  detectMethod: 'auto' | 'algo' | 'llm'
  bidirectional: boolean
  pairSource: string
  pairTarget: string
}

export interface TranslationSettingsPanelProps {
  languages: readonly TranslationLanguage[]
  customLanguages: readonly TranslationLanguage[]
  settings: TranslationSettingsState
  onChange: (patch: Partial<TranslationSettingsState>) => void
  prompt: string
  onSavePrompt: (prompt: string) => void
  onResetPrompt: () => void
  onAddLanguage: (id: string, label: string) => Promise<boolean>
  onEditLanguage: (id: string, label: string) => Promise<boolean>
  onDeleteLanguage: (id: string) => void
  onClose: () => void
}

const BUILTIN_PROMPT = 'Translate the text faithfully and completely.'

export function TranslationSettingsPanel(props: TranslationSettingsPanelProps) {
  const {
    languages, customLanguages, settings, onChange, prompt,
    onSavePrompt, onResetPrompt, onAddLanguage, onEditLanguage, onDeleteLanguage, onClose,
  } = props
  const [promptDraft, setPromptDraft] = useState(prompt)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [formId, setFormId] = useState('')
  const [formLabel, setFormLabel] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const saveTimer = useRef<number | null>(null)
  const promptDirty = promptDraft.trim() !== '' && promptDraft !== prompt

  // Reflect host prompt changes (after reset / debounced save).
  useEffect(() => { setPromptDraft(prompt) }, [prompt])

  const updatePrompt = (value: string): void => {
    setPromptDraft(value)
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => { onSavePrompt(value) }, 400)
  }

  const resetPrompt = (): void => {
    setPromptDraft('')
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
    onResetPrompt()
  }

  const startAdd = (): void => {
    setEditing(null)
    setFormId('')
    setFormLabel('')
    setFormError(null)
    setAdding(true)
  }

  const startEdit = (item: TranslationLanguage): void => {
    setAdding(false)
    setEditing(item.id)
    setFormId(item.id)
    setFormLabel(item.label)
    setFormError(null)
  }

  const submitForm = async (): Promise<void> => {
    const id = formId.trim().toLowerCase()
    const label = formLabel.trim()
    if (id === '' || label === '') { setFormError('语言名称和语言代码均为必填项'); return }
    if (!/^[a-z]{2,3}(-[a-z]{2,3})?$/.test(id)) {
      setFormError('语言代码格式：2~3 位小写字母，可选 [-区域]（如 zh-cn）')
      return
    }
    const ok = editing === null
      ? await onAddLanguage(id, label)
      : await onEditLanguage(editing, label)
    if (!ok) { setFormError('保存失败（语言代码可能已存在）'); return }
    setAdding(false)
    setEditing(null)
  }

  const targetOptions = languages.filter(item => item.id !== 'auto' && item.id !== settings.pairSource)

  return (
    <PanelShell title="翻译设置" onClose={onClose}>
      <div className={css.settingsSection}>
        <div className={css.settingRow}>
          <div>
            <div className={css.settingLabel}>Markdown 预览</div>
            <div className={css.settingHint}>翻译结果按 Markdown 渲染</div>
          </div>
          <Switch checked={settings.markdown} onChange={next => { onChange({ markdown: next }) }} label="Markdown 预览" />
        </div>
        <div className={css.settingRow}>
          <div>
            <div className={css.settingLabel}>翻译完成后自动复制</div>
          </div>
          <Switch checked={settings.autoCopy} onChange={next => { onChange({ autoCopy: next }) }} label="翻译完成后自动复制" />
        </div>
        <div className={css.settingRow}>
          <div>
            <div className={css.settingLabel}>滚动同步设置</div>
            <div className={css.settingHint}>原文与译文滚动位置保持同步</div>
          </div>
          <Switch checked={settings.scrollSync} onChange={next => { onChange({ scrollSync: next }) }} label="滚动同步设置" />
        </div>
        <div className={css.settingRow}>
          <div>
            <div className={css.settingLabel}>自动检测方法</div>
            <div className={css.settingHint}>自动检测输入语言时使用的方法</div>
          </div>
          <Segmented
            options={[
              { value: 'auto', label: '自动' },
              { value: 'algo', label: '算法', disabled: true },
              { value: 'llm', label: 'LLM', disabled: true },
            ]}
            value={settings.detectMethod}
            onChange={next => { onChange({ detectMethod: next }) }}
          />
        </div>
        <div className={css.settingRow}>
          <div>
            <div className={css.settingLabel}>双向翻译设置</div>
            <div className={css.settingHint}>开启后，仅支持在源语言和目标语言之间进行双向翻译</div>
          </div>
          <Switch checked={settings.bidirectional} onChange={next => { onChange({ bidirectional: next }) }} label="双向翻译设置" />
        </div>

        {settings.bidirectional && (
          <div className={css.pairRow}>
            <select
              aria-label="双向源语言"
              className={css.langSelect}
              value={settings.pairSource}
              onChange={event => { onChange({ pairSource: event.target.value }) }}
            >
              {languages.filter(item => item.id !== 'auto').map(item => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            <IconArrowLeftRight size={12} />
            <select
              aria-label="双向目标语言"
              className={css.langSelect}
              value={settings.pairTarget}
              onChange={event => { onChange({ pairTarget: event.target.value }) }}
            >
              {targetOptions.map(item => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <div className={css.sectionTitle}>
            <span>翻译提示词</span>
            {promptDirty && (
              <button type="button" className={css.resetLink} onClick={resetPrompt}>重置</button>
            )}
          </div>
          <textarea
            className={css.settingsTextarea}
            value={promptDraft}
            onChange={event => { updatePrompt(event.target.value) }}
            placeholder={BUILTIN_PROMPT}
          />
          <div className={css.settingHint}>留空使用内置提示词；会附加源语言与目标语言指令。</div>
        </div>

        <div>
          <div className={css.sectionTitle}>
            <span>自定义语言 <span className={css.countBadge}>{customLanguages.length} 个</span></span>
          </div>
          {customLanguages.length === 0
            ? <div className={css.settingsEmpty}>无结果</div>
            : customLanguages.map(item => (
              <div key={item.id} className={css.langRow}>
                <span className={css.langName}>{item.label}</span>
                <span className={css.langCode}>{item.id}</span>
                <span className={css.langRowActions}>
                  <IconButton title="编辑" onClick={() => { startEdit(item) }}>
                    <IconPenLine size={10} />
                  </IconButton>
                  <IconButton title="删除" onClick={() => { onDeleteLanguage(item.id) }}>
                    <IconTrash2 size={10} />
                  </IconButton>
                </span>
              </div>
            ))}
          <button type="button" className={css.langAdd} onClick={startAdd}>
            <IconPlus size={13} />
            <span>添加语言</span>
          </button>
          {adding && (
            <div className={css.langForm}>
              <div className={css.langFormRow}>
                <label className={css.langFormLabel} htmlFor="cc-lang-name">语言名称</label>
                <input
                  id="cc-lang-name"
                  className={css.langInput}
                  placeholder="中文"
                  value={formLabel}
                  onChange={event => { setFormLabel(event.target.value) }}
                />
              </div>
              <div className={css.langFormRow}>
                <label className={css.langFormLabel} htmlFor="cc-lang-code">语言代码</label>
                <input
                  id="cc-lang-code"
                  className={css.langInput}
                  placeholder="zh-cn"
                  value={formId}
                  onChange={event => { setFormId(event.target.value) }}
                />
              </div>
              {formError === null ? null : <div className={css.langFormError}>{formError}</div>}
              <div className={css.langFormActions}>
                <button type="button" className={css.btn} onClick={() => { setAdding(false) }}>取消</button>
                <button type="button" className={`${css.btn} ${css.btnPrimary}`} onClick={() => { void submitForm() }}>添加</button>
              </div>
            </div>
          )}
          {editing !== null && (
            <div className={css.langForm}>
              <div className={css.langFormRow}>
                <label className={css.langFormLabel} htmlFor="cc-lang-name-edit">语言名称</label>
                <input
                  id="cc-lang-name-edit"
                  className={css.langInput}
                  placeholder="中文"
                  value={formLabel}
                  onChange={event => { setFormLabel(event.target.value) }}
                />
              </div>
              {formError === null ? null : <div className={css.langFormError}>{formError}</div>}
              <div className={css.langFormActions}>
                <button type="button" className={css.btn} onClick={() => { setEditing(null) }}>取消</button>
                <button type="button" className={`${css.btn} ${css.btnPrimary}`} onClick={() => { void submitForm() }}>保存</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PanelShell>
  )
}
