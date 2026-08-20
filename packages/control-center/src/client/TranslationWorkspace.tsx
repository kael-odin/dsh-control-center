/**
 * Translation workspace — Cherry translate page parity:
 * full-bleed toolbar, two equal panes, floating history & settings panels.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote, ModelProviderGroup } from '@deepseek-ai/dsh-api-remotes/client'
import {
  IconCheckOutline16, IconCloseOutline16, IconCopyOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  TranslationHistoryItem, TranslationJobView, TranslationLanguage, TranslationModelSelection,
} from '../translation-types.ts'
import { renderMarkdown } from './markdown.tsx'
import {
  IconArrowLeftRight, IconChevronLeft, IconCirclePause, IconHistory,
  IconLanguages, IconSlidersHorizontal,
} from './cherry-icons.tsx'
import { Combobox, type ComboboxOption } from './Combobox.tsx'
import { ModelSelector, type ModelOption } from './ModelSelector.tsx'
import { TRANSLATE_UPLOAD_ICONS, TRANSLATE_UPLOAD_LABELS } from './translate-upload-icons.ts'
import { useCopy } from './panel-ui.tsx'
import { TranslationHistoryPanel } from './TranslationHistoryPanel.tsx'
import { TranslationSettingsPanel, type TranslationSettingsState } from './TranslationSettingsPanel.tsx'
import css from './TranslationWorkspace.module.css'

export interface TranslationWorkspaceInjected {
  getTranslation: () => NonNullable<ClientRemote['controlCenterTranslation']>
  listModels: () => Promise<readonly ModelProviderGroup[]>
  hooks: { translationReady: HostObservable<boolean> }
}

export type TranslationWorkspaceProps = PropsRuntime<'application.surface', 'translation'> & InjectFace<TranslationWorkspaceInjected>

function selectorModels(groups: readonly ModelProviderGroup[]): ModelOption[] {
  return groups.flatMap(group => group.models.map(model => ({
    value: `${group.id}/${model.id}`,
    label: model.name,
    providerId: group.id,
    providerName: group.name,
  })))
}

function modelOptions(groups: readonly ModelProviderGroup[]) {
  return groups.flatMap(group => group.models.map(model => ({
    value: `${group.id}/${model.id}`,
    label: `${group.name} · ${model.name}`,
    selection: {
      provider: group.id,
      model: model.id,
      ...(model.reasoning?.defaultEffort === undefined ? {} : { reasoningEffort: model.reasoning.defaultEffort }),
    } satisfies TranslationModelSelection,
  })))
}

const PREFS_KEY = 'cc.translate.settings'

const LANGUAGE_EMOJIS: Record<string, string> = {
  'zh-CN': '🇨🇳', 'zh-TW': '🇹🇼', 'en': '🇺🇸', 'ja': '🇯🇵', 'ko': '🇰🇷',
  'fr': '🇫🇷', 'de': '🇩🇪', 'es': '🇪🇸', 'it': '🇮🇹', 'pt': '🇵🇹',
  'ru': '🇷🇺', 'ar': '🇸🇦', 'hi': '🇮🇳', 'th': '🇹🇭', 'vi': '🇻🇳',
  'id': '🇮🇩', 'tr': '🇹🇷', 'nl': '🇳🇱', 'pl': '🇵🇱', 'uk': '🇺🇦',
  'sv': '🇸🇪', 'cs': '🇨🇿', 'el': '🇬🇷', 'he': '🇮🇱', 'auto': '🌐',
}

function languageEmojiOf(id: string): string {
  return LANGUAGE_EMOJIS[id] ?? '🌐'
}

/** Local script-based language detection for the 算法 method (zero cost). */
function detectLanguageHeuristic(text: string): string | null {
  const sample = text.slice(0, 3000)
  let han = 0
  let kana = 0
  let hangul = 0
  let cyrillic = 0
  let latin = 0
  let arabic = 0
  let thai = 0
  for (const ch of sample) {
    const code = ch.codePointAt(0) ?? 0
    if (code >= 0x4e00 && code <= 0x9fff) han++
    else if (code >= 0x3040 && code <= 0x30ff) kana++
    else if (code >= 0xac00 && code <= 0xd7af) hangul++
    else if (code >= 0x0400 && code <= 0x04ff) cyrillic++
    else if (code >= 0x0600 && code <= 0x06ff) arabic++
    else if (code >= 0x0e00 && code <= 0x0e7f) thai++
    else if (/[a-zA-Z]/.test(ch)) latin++
  }
  const total = han + kana + hangul + cyrillic + latin + arabic + thai
  if (total === 0) return null
  const ratio = (n: number): number => n / total
  if (ratio(han) > 0.5 && ratio(kana) < 0.2) return 'zh-CN'
  if (ratio(kana) > 0.3) return 'ja'
  if (ratio(hangul) > 0.5) return 'ko'
  if (ratio(cyrillic) > 0.5) return 'ru'
  if (ratio(arabic) > 0.5) return 'ar'
  if (ratio(thai) > 0.5) return 'th'
  if (ratio(latin) > 0.8) return 'en'
  return null
}

function loadSettings(): TranslationSettingsState {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw === null) throw new Error('no prefs')
    const parsed = JSON.parse(raw) as Partial<TranslationSettingsState>
    return {
      markdown: parsed.markdown ?? false,
      autoCopy: parsed.autoCopy ?? false,
      scrollSync: parsed.scrollSync ?? false,
      detectMethod: parsed.detectMethod ?? 'auto',
      bidirectional: parsed.bidirectional ?? false,
      pairSource: parsed.pairSource ?? 'zh-CN',
      pairTarget: parsed.pairTarget ?? 'en',
    }
  } catch {
    return { markdown: false, autoCopy: false, scrollSync: false, detectMethod: 'auto', bidirectional: false, pairSource: 'zh-CN', pairTarget: 'en' }
  }
}

/** Full Translation product workspace over the Control Center Host service. */
export function TranslationWorkspace({ getTranslation, listModels, useTranslationReady, close }: TranslationWorkspaceProps) {
  const translationReady = useTranslationReady(value => value)
  const translation = translationReady ? getTranslation() : undefined
  const [languages, setLanguages] = useState<TranslationLanguage[]>([])
  const [sourceLanguage, setSourceLanguage] = useState('auto')
  const [targetLanguage, setTargetLanguage] = useState('zh-CN')
  const [models, setModels] = useState<readonly ModelProviderGroup[]>([])
  const [selection, setSelection] = useState<TranslationModelSelection | null>(null)
  const [input, setInput] = useState('')
  const [job, setJob] = useState<TranslationJobView | null>(null)
  const [history, setHistory] = useState<TranslationHistoryItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [starredOnly, setStarredOnly] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<TranslationSettingsState>(loadSettings)
  const [prompt, setPrompt] = useState('')
  const [customLanguages, setCustomLanguages] = useState<TranslationLanguage[]>([])
  const [error, setError] = useState<string | null>(null)
  const options = useMemo(() => modelOptions(models), [models])
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const outputRef = useRef<HTMLDivElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const inputScrollRef = useRef<HTMLDivElement | null>(null)
  const { copied: copiedOutput, copy: copyOutput } = useCopy()
  const { copied: copiedInput, copy: copyInput } = useCopy()

  const running = job?.status === 'running'
  const couldTranslate = selection !== null && input.trim() !== '' && !running
  const output = job?.output ?? ''
  const languagesAll = useMemo(() => [...languages], [languages])
  const sourceOptions = useMemo<ComboboxOption[]>(() => languagesAll.map(item => ({
    value: item.id,
    label: item.id === 'auto' ? '自动检测' : item.label,
    icon: <span style={{ fontSize: 14 }}>{languageEmojiOf(item.id)}</span>,
  })), [languagesAll])
  const targetOptions = useMemo<ComboboxOption[]>(() => languagesAll.filter(item => item.id !== 'auto').map(item => ({
    value: item.id,
    label: item.label,
    icon: <span style={{ fontSize: 14 }}>{languageEmojiOf(item.id)}</span>,
  })), [languagesAll])

  const handleUpload = async (file: File): Promise<void> => {
    const textish = /(txt|md|markdown|html?|csv|json|ya?ml|xml|tsx?|jsx?|py|go|rs|java|css|sh|log)$/i
    if (!file.type.startsWith('text/') && !textish.test(file.name)) {
      setError(`「${file.name}」暂不支持直接翻译；请将内容复制到左侧输入框`)
      return
    }
    const text = await file.text()
    if (text.length > 100_000) { setError('文件过大（超过 10 万字符），请截取片段'); return }
    setInput(text)
    setError(null)
  }

  // Persist client prefs.
  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(settings)) } catch { /* best effort */ }
  }, [settings])

  const refreshHistory = useCallback(async (cursor: string | null, append = false): Promise<void> => {
    if (translation === undefined) return
    const result = await translation.history(cursor, 20)
    if (!result.ok) throw new Error(result.error.message)
    setHistory(previous => append ? [...previous, ...result.value.items] : result.value.items)
    setNextCursor(result.value.nextCursor ?? null)
  }, [translation])

  useEffect(() => {
    if (!translationReady) return
    let active = true
    void listModels().then((groups) => {
      if (!active) return
      setModels(groups)
      setSelection(current => current ?? modelOptions(groups)[0]?.selection ?? null)
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : String(reason)) })
    void Promise.all([translation!.languages(), translation!.history(null, 20), translation!.getPrompt()])
      .then(([languageResult, historyResult, promptResult]) => {
        if (!active) return
        if (!languageResult.ok) throw new Error(languageResult.error.message)
        if (!historyResult.ok) throw new Error(historyResult.error.message)
        setLanguages(languageResult.value.source)
        setCustomLanguages(languageResult.value.target.filter(item => !item.builtin))
        setHistory(historyResult.value.items)
        setNextCursor(historyResult.value.nextCursor ?? null)
        if (promptResult.ok) setPrompt(promptResult.value)
      })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : String(reason)) })
    return () => { active = false }
  }, [listModels, translation, translationReady])

  useEffect(() => {
    if (job?.status !== 'running') return
    const timer = window.setInterval(() => {
      void translation!.get(job.jobId).then((result) => {
        if (!result.ok) { setError(result.error.message); return }
        setJob(result.value)
        if (result.value.status === 'completed') {
          if (settings.autoCopy && result.value.output.length > 0) {
            void navigator.clipboard.writeText(result.value.output).catch(() => {})
          }
          void refreshHistory(null).catch(reason => { setError(String(reason)) })
        }
      })
    }, 250)
    return () => { window.clearInterval(timer) }
  }, [job?.jobId, job?.status, translation, settings.autoCopy, refreshHistory])

  const translate = useCallback(async (): Promise<void> => {
    if (selection === null || input.trim() === '' || running) return
    setError(null)
    let source = sourceLanguage
    if (source === 'auto' && settings.detectMethod !== 'auto') {
      if (settings.detectMethod === 'algo') {
        const detected = detectLanguageHeuristic(input)
        if (detected !== null) source = detected
      } else {
        const detection = await translation!.detectLanguage(input, selection)
        if (detection.ok && detection.value.language !== null) source = detection.value.language
      }
    }
    const result = await translation!.start({ sourceLanguage: source, targetLanguage, text: input, selection })
    if (!result.ok) { setError(result.error.message); return }
    const view = await translation!.get(result.value.jobId)
    if (!view.ok) { setError(view.error.message); return }
    setJob(view.value)
  }, [selection, input, running, translation, sourceLanguage, targetLanguage])

  // Ctrl/Cmd+Enter to translate.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') void translate()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('keydown', onKeyDown) }
  }, [translate])

  const stop = useCallback(async (): Promise<void> => {
    if (job === null || !running) return
    const result = await translation!.cancel(job.jobId)
    if (!result.ok) { setError(result.error.message); return }
    setJob(result.value)
  }, [job, running, translation])

  const swapLanguages = (): void => {
    if (sourceLanguage === 'auto') return
    setSourceLanguage(targetLanguage)
    setTargetLanguage(sourceLanguage)
  }

  const clearInput = (): void => {
    setInput('')
    inputRef.current?.focus()
  }

  const onScrollSync = (source: 'input' | 'output'): void => {
    if (!settings.scrollSync) return
    const inputEl = inputScrollRef.current
    const outputEl = outputRef.current
    if (inputEl === null || outputEl === null) return
    const from = source === 'input' ? inputEl : outputEl
    const to = source === 'input' ? outputEl : inputEl
    const max = from.scrollHeight - from.clientHeight
    if (max <= 0) return
    const ratio = from.scrollTop / max
    to.scrollTop = ratio * (to.scrollHeight - to.clientHeight)
  }

  const updateSettings = (patch: Partial<TranslationSettingsState>): void => {
    setSettings(current => ({ ...current, ...patch }))
  }

  const openHistory = (): void => { setHistoryOpen(true); setSettingsOpen(false) }
  const openSettings = (): void => { setSettingsOpen(true); setHistoryOpen(false) }

  const addLanguage = async (id: string, label: string): Promise<boolean> => {
    if (translation === undefined) return false
    const result = await translation.putLanguage(id, label)
    if (!result.ok) return false
    setLanguages(current => [...current, result.value].sort((left, right) => left.label.localeCompare(right.label)))
    setCustomLanguages(current => [...current, result.value].sort((left, right) => left.label.localeCompare(right.label)))
    return true
  }

  const editLanguage = async (id: string, label: string): Promise<boolean> => {
    if (translation === undefined) return false
    // Host keys languages by id; emulate rename by delete + re-add when the id changed.
    const existing = customLanguages.find(item => item.id === id)
    const result = await translation.putLanguage(id, label)
    if (!result.ok) return false
    if (existing !== undefined && existing.label !== label) {
      setLanguages(current => current.map(item => item.id === id ? { ...item, label } : item))
      setCustomLanguages(current => current.map(item => item.id === id ? { ...item, label } : item))
    }
    return true
  }

  const deleteLanguage = async (id: string): Promise<void> => {
    if (translation === undefined) return
    const result = await translation.deleteLanguage(id)
    if (result.ok) {
      setLanguages(current => current.filter(item => item.id !== id))
      setCustomLanguages(current => current.filter(item => item.id !== id))
    }
  }

  const starHistory = async (id: string, starred: boolean): Promise<void> => {
    if (translation === undefined) return
    const result = await translation.starHistory(id, starred)
    if (!result.ok) return
    setHistory(current => current.map(item => item.id === id ? { ...item, starred } : item))
    if (starredOnly && !starred) setHistory(current => current.filter(item => item.id !== id))
  }

  const deleteHistoryItem = async (id: string): Promise<void> => {
    if (translation === undefined) return
    const result = await translation.deleteHistory(id)
    if (result.ok) setHistory(current => current.filter(item => item.id !== id))
  }

  const clearHistory = async (): Promise<void> => {
    if (translation === undefined) return
    const result = await translation.clearHistory()
    if (result.ok) {
      setHistory([])
      setNextCursor(null)
    }
  }

  const reuseHistory = (item: TranslationHistoryItem): void => {
    setSourceLanguage(item.sourceLanguage)
    setTargetLanguage(item.targetLanguage)
    setInput(item.sourceText)
    setHistoryOpen(false)
  }

  if (!translationReady) {
    return <main className=" cc-surface"><p role="status" style={{ padding: 24 }}>正在连接翻译服务…</p></main>
  }

  return (
    <main className={`${css.root} cc-surface`} data-ui="translate.view">
      <div className={css.topBar}>
        <button type="button" className={css.backButton} title="返回对话" onClick={close}>
          <IconChevronLeft size={16} />
        </button>
        {!settings.bidirectional ? (
          <>
            <Combobox
              value={sourceLanguage}
              options={sourceOptions}
              onChange={setSourceLanguage}
              ariaLabel="源语言"
              searchable
              width={190}
            />
            <button type="button" className={css.swapBtn} title="交换源语言与目标语言" disabled={sourceLanguage === 'auto'} onClick={swapLanguages}>
              <IconArrowLeftRight size={14} />
            </button>
            <Combobox
              value={targetLanguage}
              options={targetOptions}
              onChange={setTargetLanguage}
              ariaLabel="目标语言"
              searchable
              width={190}
            />
          </>
        ) : (
          <div className={css.pairChip} title={`${sourceLanguage} ⇆ ${targetLanguage}`}>
            <span>{languagesAll.find(item => item.id === settings.pairSource)?.label ?? settings.pairSource}</span>
            <IconArrowLeftRight size={12} />
            <span>{languagesAll.find(item => item.id === settings.pairTarget)?.label ?? settings.pairTarget}</span>
          </div>
        )}
        {running
          ? (
            <button type="button" className={css.stopBtn} onClick={() => { void stop() }}>
              <IconCirclePause size={14} />
              <span>停止</span>
            </button>
          )
          : (
            <button type="button" className={css.translateBtn} disabled={!couldTranslate} onClick={() => { void translate() }}>
              <IconLanguages size={14} />
              <span>翻译</span>
            </button>
          )}
        <span className={css.spacer} />
        <div className={css.rightCluster}>
          <ModelSelector
            models={selectorModels(models)}
            value={selection === null ? '' : `${selection.provider}/${selection.model}`}
            onChange={(value) => { setSelection(options.find(item => item.value === value)?.selection ?? null) }}
            ariaLabel="翻译模型"
            placeholder="选择翻译模型"
            align="end"
            onConfigure={() => { window.dispatchEvent(new CustomEvent('cc:open-settings-section', { detail: 'models' })) }}
          />
          <button type="button" className={`${css.iconBtn} ${historyOpen ? css.active : ''}`} title="翻译历史" aria-pressed={historyOpen} onClick={openHistory}>
            <IconHistory size={14} />
          </button>
          <button type="button" className={`${css.iconBtn} ${settingsOpen ? css.active : ''}`} title="翻译设置" aria-pressed={settingsOpen} onClick={openSettings}>
            <IconSlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      {error === null ? null : <div className={css.errorBanner} role="alert">{error}</div>}

      <div className={css.panes}>
        <section className={css.pane}>
          <div className={css.textareaScroll} ref={inputScrollRef} onScroll={() => { onScrollSync('input') }}>
            {input.length === 0 && (
              <div className={css.uploadZone} role="button" tabIndex={0}
                onClick={() => { fileRef.current?.click() }}
                onKeyDown={(event) => { if (event.key === 'Enter') fileRef.current?.click() }}
                onDragOver={(event) => { event.preventDefault() }}
                onDrop={(event) => {
                  event.preventDefault()
                  const file = event.dataTransfer.files?.[0]
                  if (file !== undefined) void handleUpload(file)
                }}
              >
                <div className={css.uploadIcons}>
                  {TRANSLATE_UPLOAD_ICONS.map(([name, svg]) => (
                    <span key={name} className={css.uploadIcon} title={TRANSLATE_UPLOAD_LABELS[name]} dangerouslySetInnerHTML={{ __html: svg }} />
                  ))}
                </div>
                <span>拖入或点击上传图片/文档</span>
              </div>
            )}
            <textarea
              ref={inputRef}
              aria-label="待翻译文本"
              className={css.inputArea}
              value={input}
              onChange={event => { setInput(event.target.value) }}
              placeholder="请输入文本..."
              spellCheck={false}
            />
          </div>
          <div className={css.paneCorner}>
            <button type="button" className={`${css.smallIconBtn} ${input.length === 0 ? css.smallIconBtnEmpty : ''}`} title="复制" onClick={() => { if (input.length > 0) copyInput(input) }}>
              {copiedInput ? <IconCheckOutline16 size={14} /> : <IconCopyOutline16 size={14} />}
            </button>
          </div>
          <div className={css.paneFooter}>
            <span className={css.count}>{input.length} 字符</span>
            {input.length === 0 ? null : (
              <button type="button" className={css.clearBtn} onClick={clearInput}>
                <IconCloseOutline16 size={12} />
                <span>清除</span>
              </button>
            )}
          </div>
        </section>
        <section className={`${css.pane} ${css.outputPane}`}>
          <div className={css.textareaScroll} ref={outputRef} onScroll={() => { onScrollSync('output') }} aria-label="翻译结果" role="region">
            {job?.status === 'running' ? (
              <div className={css.translating} style={{ padding: '16px 48px 16px 16px' }}>
                <span className={css.spinner} />
                <span>翻译中...</span>
              </div>
            ) : output.length === 0 ? (
              <div className={css.outputArea} style={{ color: 'var(--muted-foreground)' }}>翻译结果将在这里显示</div>
            ) : settings.markdown ? (
              <div className={`${css.outputArea} ${css.md}`}>{renderMarkdown(output)}</div>
            ) : (
              <div className={css.outputArea}>{output}</div>
            )}
          </div>
          <div className={css.paneCorner}>
            <button type="button" className={`${css.smallIconBtn} ${output.length === 0 ? css.smallIconBtnEmpty : ''}`} title="复制" onClick={() => { if (output.length > 0) copyOutput(output) }}>
              {copiedOutput ? <IconCheckOutline16 size={14} /> : <IconCopyOutline16 size={14} />}
            </button>
          </div>
          <div className={css.paneFooter}>
            <span className={css.count}>
              {job === null ? '' : job.status === 'running' ? '翻译中...' : job.status === 'error' ? '翻译失败' : job.status === 'cancelled' ? '翻译中止' : `${output.length} 字符`}
            </span>
          </div>
        </section>
      </div>

      {historyOpen && (
        <TranslationHistoryPanel
          history={starredOnly ? history.filter(item => item.starred) : history}
          total={history.length}
          nextCursor={starredOnly ? null : nextCursor}
          starredOnly={starredOnly}
          onStarredOnlyChange={setStarredOnly}
          onLoadMore={() => { void refreshHistory(nextCursor, true).catch(reason => { setError(String(reason)) }) }}
          onStar={(id, starred) => { void starHistory(id, starred) }}
          onDelete={(id) => { void deleteHistoryItem(id) }}
          onClearAll={() => { void clearHistory() }}
          onReuse={reuseHistory}
          onClose={() => { setHistoryOpen(false) }}
        />
      )}
      <input
        ref={fileRef}
        type="file"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file !== undefined) void handleUpload(file)
          event.target.value = ''
        }}
      />

      {settingsOpen && (
        <TranslationSettingsPanel
          languages={languagesAll}
          customLanguages={customLanguages}
          settings={settings}
          onChange={updateSettings}
          prompt={prompt}
          onSavePrompt={async (value) => {
            const result = await translation!.setPrompt(value)
            if (result.ok) setPrompt(value)
          }}
          onResetPrompt={async () => {
            const result = await translation!.setPrompt('')
            if (result.ok) setPrompt('')
          }}
          onAddLanguage={addLanguage}
          onEditLanguage={editLanguage}
          onDeleteLanguage={(id) => { void deleteLanguage(id) }}
          onClose={() => { setSettingsOpen(false) }}
        />
      )}
    </main>
  )
}
