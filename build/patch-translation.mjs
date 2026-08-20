import { readFileSync, writeFileSync } from 'node:fs'
const p = 'packages/control-center/src/client/TranslationWorkspace.tsx'
let s = readFileSync(p, 'utf8')

// 1. imports
s = s.replace(`import {
  IconArrowLeftRight, IconChevronLeft, IconCirclePause, IconHistory,
  IconLanguages, IconSlidersHorizontal,
} from './cherry-icons.tsx'`, `import {
  IconArrowLeftRight, IconChevronLeft, IconCirclePause, IconHistory,
  IconLanguages, IconSlidersHorizontal,
} from './cherry-icons.tsx'
import { Combobox, type ComboboxOption } from './Combobox.tsx'
import { ModelSelector, type ModelOption } from './ModelSelector.tsx'
import { TRANSLATE_UPLOAD_ICONS, TRANSLATE_UPLOAD_LABELS } from './translate-upload-icons.ts'`)

// 2. language emoji map + selectorModels helper
s = s.replace(`const PREFS_KEY = 'cc.translate.settings'`, `const PREFS_KEY = 'cc.translate.settings'

const LANGUAGE_EMOJIS: Record<string, string> = {
  'zh-CN': '🇨🇳', 'zh-TW': '🇹🇼', 'en': '🇺🇸', 'ja': '🇯🇵', 'ko': '🇰🇷',
  'fr': '🇫🇷', 'de': '🇩🇪', 'es': '🇪🇸', 'it': '🇮🇹', 'pt': '🇵🇹',
  'ru': '🇷🇺', 'ar': '🇸🇦', 'hi': '🇮🇳', 'th': '🇹🇭', 'vi': '🇻🇳',
  'id': '🇮🇩', 'tr': '🇹🇷', 'nl': '🇳🇱', 'pl': '🇵🇱', 'uk': '🇺🇦',
  'sv': '🇸🇪', 'cs': '🇨🇿', 'el': '🇬🇷', 'he': '🇮🇱', 'auto': '🌐',
}

function languageEmojiOf(id: string): string {
  return LANGUAGE_EMOJIS[id] ?? '🌐'
}`)

// 3. selectorModels helper after modelOptions
s = s.replace(`function modelOptions(groups: readonly ModelProviderGroup[]) {`, `function selectorModels(groups: readonly ModelProviderGroup[]): ModelOption[] {
  return groups.flatMap(group => group.models.map(model => ({
    value: \`\${group.id}/\${model.id}\`,
    label: model.name,
    providerId: group.id,
    providerName: group.name,
  })))
}

function modelOptions(groups: readonly ModelProviderGroup[]) {`)

// 4. state: fileRef
s = s.replace(`  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const outputRef = useRef<HTMLDivElement | null>(null)`, `  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const outputRef = useRef<HTMLDivElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)`)

// 5. option memos + upload handler after languagesAll
s = s.replace(`  const output = job?.output ?? ''
  const languagesAll = useMemo(() => [...languages], [languages])`, `  const output = job?.output ?? ''
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
      setError(\`「\${file.name}」暂不支持直接翻译；请将内容复制到左侧输入框\`)
      return
    }
    const text = await file.text()
    if (text.length > 100_000) { setError('文件过大（超过 10 万字符），请截取片段'); return }
    setInput(text)
    setError(null)
  }`)

// 6. top bar: language Comboboxes
s = s.replace(`        {!settings.bidirectional ? (
          <>
            <span className={css.langSelectWrap}>
              <select
                aria-label="源语言"
                className={css.langSelect}
                value={sourceLanguage}
                onChange={event => { setSourceLanguage(event.target.value) }}
              >
                {languagesAll.map(item => <option key={item.id} value={item.id}>{item.id === 'auto' ? '自动检测' : item.label}</option>)}
              </select>
              <IconChevronDownOutline14 size={12} className={css.langChevron} />
            </span>
            <button type="button" className={css.swapBtn} title="交换源语言与目标语言" disabled={sourceLanguage === 'auto'} onClick={swapLanguages}>
              <IconArrowLeftRight size={14} />
            </button>
            <span className={css.langSelectWrap}>
              <select
                aria-label="目标语言"
                className={css.langSelect}
                value={targetLanguage}
                onChange={event => { setTargetLanguage(event.target.value) }}
              >
                {languagesAll.filter(item => item.id !== 'auto').map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
              <IconChevronDownOutline14 size={12} className={css.langChevron} />
            </span>
          </>
        ) : (`, `        {!settings.bidirectional ? (
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
        ) : (`)

// 7. model select -> ModelSelector
s = s.replace(`        <div className={css.rightCluster}>
          <span className={css.modelSelectWrap}>
            <select
              aria-label="翻译模型"
              className={css.modelSelect}
              value={selection === null ? '' : \`\${selection.provider}/\${selection.model}\`}
              onChange={event => { setSelection(options.find(item => item.value === event.target.value)?.selection ?? null) }}
            >
              {options.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <IconChevronDownOutline14 size={12} className={css.langChevron} />
          </span>
          <button type="button" className={\`\${css.iconBtn} \${historyOpen ? css.active : ''}\`} title="翻译历史" aria-pressed={historyOpen} onClick={openHistory}>`, `        <div className={css.rightCluster}>
          <ModelSelector
            models={selectorModels(models)}
            value={selection === null ? '' : \`\${selection.provider}/\${selection.model}\`}
            onChange={(value) => { setSelection(options.find(item => item.value === value)?.selection ?? null) }}
            ariaLabel="翻译模型"
            placeholder="选择翻译模型"
            align="end"
            onConfigure={() => { window.dispatchEvent(new CustomEvent('cc:open-settings-section', { detail: 'models' })) }}
          />
          <button type="button" className={\`\${css.iconBtn} \${historyOpen ? css.active : ''}\`} title="翻译历史" aria-pressed={historyOpen} onClick={openHistory}>`)

// 8. upload zone in the input pane
s = s.replace(`        <section className={css.pane}>
          <div className={css.textareaScroll} ref={inputScrollRef} onScroll={() => { onScrollSync('input') }}>
            <textarea
              ref={inputRef}
              aria-label="待翻译文本"
              className={css.inputArea}
              value={input}`, `        <section className={css.pane}>
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
              value={input}`)

// 9. hidden file input
s = s.replace(`      {settingsOpen && (
        <TranslationSettingsPanel`, `      <input
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
        <TranslationSettingsPanel`)

writeFileSync(p, s)
console.log('translation workspace patched')
