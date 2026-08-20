import { randomUUID } from 'node:crypto'
import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { createUserMessage, type LlmFailure, type LlmRuntime, ReasoningEffortId } from '@deepseek-ai/dsh-llm'
import { settingsNamespace, type SettingsScope } from '@deepseek-ai/dsh-settings'
import Schema from '@deepseek-ai/schemastery'
import { bindTypertRemote, Remote } from '@deepseek-ai/dsh-typert-protocol'
import { TRANSLATION_PROMPT_TEMPLATE } from './translation-prompt.ts'
import type {
  TranslationHistoryId, TranslationHistoryItem, TranslationHistoryPage, TranslationJobView,
  TranslationLanguage, TranslationLanguagesView, TranslationModelSelection, TranslationRequest, TranslationStartResult,
} from './translation-types.ts'

const MAX_TEXT_CHARS = 100_000
const MAX_HISTORY_PAGE = 100
const TRANSLATION_NAMESPACE = settingsNamespace('control-center-translation')

/** Best-effort usage recording; standalone-service tests skip it silently. */
function recordUsage(ctx: Context, input: {
  provider: string
  model: string
  kind: 'translation'
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  latencyMs: number
}): void {
  try {
    const usage = ctx.get('controlCenterUsage') as { record(input: unknown): unknown } | undefined
    usage?.record(input)
  } catch {
    // The usage service is optional for translation jobs.
  }
}
const BUILTIN_LANGUAGES: readonly TranslationLanguage[] = Object.freeze([
  { id: 'auto', label: 'Auto detect', builtin: true },
  { id: 'zh-CN', label: '简体中文', builtin: true },
  { id: 'en', label: 'English', builtin: true },
  { id: 'ja', label: '日本語', builtin: true },
  { id: 'ko', label: '한국어', builtin: true },
  { id: 'fr', label: 'Français', builtin: true },
  { id: 'de', label: 'Deutsch', builtin: true },
  { id: 'es', label: 'Español', builtin: true },
])

interface MutableJob {
  view: TranslationJobView
  controller: AbortController
  task: Promise<void>
}

function cloneJob(view: TranslationJobView): TranslationJobView {
  return structuredClone(view)
}

function assertText(text: string): string {
  if (typeof text !== 'string' || text.trim().length === 0) throw new Error('translation text must not be blank')
  if (text.length > MAX_TEXT_CHARS) throw new Error(`translation text exceeds ${MAX_TEXT_CHARS} characters`)
  return text
}

function language(id: string, allowAuto: boolean): string {
  if (typeof id !== 'string' || id.trim().length === 0) throw new Error('translation language must not be blank')
  if (!allowAuto && id === 'auto') throw new Error('target language cannot use auto detection')
  return id.trim()
}

export interface TranslationServiceConfig {
  logger?: Context['logger']
}

function renderPromptTemplate(template: string, request: TranslationRequest): string {
  const targetLabel = BUILTIN_LANGUAGES.find(item => item.id === request.targetLanguage)?.label ?? request.targetLanguage
  const rendered = template
    .replaceAll('{{target_language}}', targetLabel)
    .replaceAll('{{text}}', request.text)
  // Never let the input text get lost: if the template had no {{text}} slot,
  // append the text wrapped like Cherry does.
  if (!template.includes('{{text}}')) {
    return `${rendered}\n\n<translate_input>\n${request.text}\n</translate_input>`
  }
  return rendered
}

function prompt(request: TranslationRequest, customPrompt: string): string {
  const template = customPrompt.trim().length > 0 ? customPrompt.trim() : TRANSLATION_PROMPT_TEMPLATE
  return renderPromptTemplate(template, request)
}

function failureOf(error: unknown): LlmFailure {
  return { message: error instanceof Error ? error.message : String(error), code: 'TRANSLATION_ERROR' }
}

function markTranslationRemoteMethods(service: TranslationService): void {
  const initializers: Array<(this: TranslationService) => void> = []
  for (const [method, exportName] of [
    ['start', 'start'], ['get', 'get'], ['cancel', 'cancel'], ['listHistory', 'history'],
    ['deleteHistory', 'deleteHistory'], ['languages', 'languages'],
    ['putLanguage', 'putLanguage'], ['deleteLanguage', 'deleteLanguage'],
    ['starHistory', 'starHistory'], ['clearHistory', 'clearHistory'],
    ['getPrompt', 'getPrompt'], ['setPrompt', 'setPrompt'],
    ['detectLanguage', 'detectLanguage'],
  ] as const) {
    const implementation = Reflect.get(TranslationService.prototype, method) as (this: TranslationService, ...args: never[]) => unknown
    const decorator = Remote(exportName)
    decorator(implementation, {
      kind: 'method', name: method, static: false, private: false,
      access: { has: value => method in value, get: value => Reflect.get(value, method) as never },
      addInitializer: initializer => { initializers.push(initializer) },
      metadata: undefined,
    })
  }
  for (const initialize of initializers) initialize.call(service)
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    controlCenterTranslation: TranslationService
  }
}

/**
 * One-shot translation jobs and persistent in-process history over DSH LLM routes.
 */
export class TranslationService extends Service {
  static inject = ['llm', 'settings'] as const
  readonly typertRemote = bindTypertRemote(this, 'controlCenterTranslation')

  private readonly llm: LlmRuntime
  private readonly jobs = new Map<string, MutableJob>()
  private readonly history = new Map<TranslationHistoryId, TranslationHistoryItem>()
  private readonly customLanguages = new Map<string, TranslationLanguage>()
  private scope: SettingsScope<{ prompt: string }> | null = null
  private promptOverride: string | null = null
  private accepting = true

  constructor(ctx: Context, _config?: TranslationServiceConfig) {
    super(ctx, 'controlCenterTranslation')
    this.llm = ctx.get('llm') as LlmRuntime
    // Lazy: standalone-service tests construct bare contexts without a
    // settings provider; the prompt override then stays in memory.
    if (ctx.settings !== undefined) {
      this.scope = ctx.settings.register(TRANSLATION_NAMESPACE, Schema.object({
        prompt: Schema.string().default(''),
      }), {
        base: { prompt: '' },
      })
    }
    markTranslationRemoteMethods(this)
    ctx.effect(() => async () => {
      this.accepting = false
      for (const job of this.jobs.values()) job.controller.abort()
      await Promise.allSettled([...this.jobs.values()].map(job => job.task))
      this.jobs.clear()
    }, 'control-center.translation: settle jobs')
  }

  start(request: TranslationRequest): TranslationStartResult {
    if (!this.accepting) throw new Error('translation service is stopping')
    const resolved: TranslationRequest = {
      sourceLanguage: language(request.sourceLanguage, true),
      targetLanguage: language(request.targetLanguage, false),
      text: assertText(request.text),
      selection: structuredClone(request.selection),
    }
    const now = Date.now()
    const jobId = `translation-${randomUUID()}`
    const controller = new AbortController()
    const view: TranslationJobView = {
      jobId,
      status: 'running',
      output: '',
      selection: resolved.selection,
      sourceLanguage: resolved.sourceLanguage,
      targetLanguage: resolved.targetLanguage,
      createdAt: now,
      updatedAt: now,
    }
    const mutable: MutableJob = { view, controller, task: Promise.resolve() }
    this.jobs.set(jobId, mutable)
    mutable.task = this.run(mutable, resolved)
    return { jobId }
  }

  get(jobId: string): TranslationJobView {
    const job = this.jobs.get(jobId)
    if (job === undefined) throw new Error(`unknown translation job "${jobId}"`)
    return cloneJob(job.view)
  }

  cancel(jobId: string): TranslationJobView {
    const job = this.jobs.get(jobId)
    if (job === undefined) throw new Error(`unknown translation job "${jobId}"`)
    if (job.view.status === 'running') job.controller.abort()
    return cloneJob(job.view)
  }

  /** Total persisted history entries (for usage analytics). */
  countHistory(): number {
    return this.history.size
  }

  listHistory(cursor: string | null, limit: number): TranslationHistoryPage {
    const bounded = Math.min(MAX_HISTORY_PAGE, Math.max(1, Math.trunc(limit)))
    const ordered = [...this.history.values()].sort((left, right) => right.createdAt - left.createdAt)
    const offset = cursor === null ? 0 : Number.parseInt(cursor, 10)
    if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('invalid translation history cursor')
    const items = ordered.slice(offset, offset + bounded).map(item => structuredClone(item))
    const next = offset + items.length
    return { items, ...(next < ordered.length ? { nextCursor: String(next) } : {}) }
  }

  deleteHistory(id: TranslationHistoryId): { absent: true } {
    this.history.delete(id)
    return { absent: true }
  }

  starHistory(id: TranslationHistoryId, starred: boolean): TranslationHistoryItem {
    const item = this.history.get(id)
    if (item === undefined) throw new Error(`unknown translation history "${id}"`)
    item.starred = starred
    return structuredClone(item)
  }

  clearHistory(): { cleared: number } {
    const cleared = this.history.size
    this.history.clear()
    return { cleared }
  }

  getPrompt(): string {
    return this.scope === null ? (this.promptOverride ?? '') : this.scope.get().prompt
  }

  async setPrompt(prompt: string): Promise<{ saved: true }> {
    const resolved = prompt.slice(0, 4_000)
    if (this.scope === null) {
      this.promptOverride = resolved
    } else {
      await this.scope.update({ prompt: resolved })
    }
    return { saved: true }
  }

  /** One-shot language detection via the selected model (LLM detection method). */
  async detectLanguage(text: string, selection: TranslationModelSelection): Promise<{ language: string | null }> {
    const sample = (typeof text === 'string' ? text : '').slice(0, 4_000)
    if (sample.trim().length === 0) return { language: null }
    const llm = this.llm
    const callConfig = {
      provider: selection.provider,
      model: selection.model,
      ...(selection.reasoningEffort === undefined ? {} : { reasoningEffort: ReasoningEffortId(selection.reasoningEffort) }),
    }
    const prepared = await llm.prepareCall(callConfig, new AbortController().signal)
    const message = createUserMessage({
      source: { kind: 'user' },
      content: [{ type: 'text', text: `Detect the language of the following text. Reply with ONLY a language code from this list: zh-CN, zh-TW, en, ja, ko, fr, de, es, it, pt, ru, ar, hi, th, vi, id, tr, nl, pl, uk. If unsure reply auto.

${sample}` }],
    })
    let output = ''
    for await (const chunk of prepared.stream({
      ...prepared.config,
      messages: [message],
      system: 'You are a language detection helper. Reply with a single language code.',
      signal: new AbortController().signal,
    })) {
      if (chunk.type === 'text-delta') output += chunk.text
    }
    const code = output.trim().toLowerCase().match(/[a-z]{2,3}(-[a-z]{2,3})?/)?.[0]
    if (code === undefined || code === 'auto') return { language: null }
    return { language: code }
  }

  languages(): TranslationLanguagesView {
    const custom = [...this.customLanguages.values()].sort((left, right) => left.label.localeCompare(right.label))
    return {
      source: [...BUILTIN_LANGUAGES.map(item => ({ ...item })), ...custom.map(item => ({ ...item }))],
      target: [...BUILTIN_LANGUAGES.filter(item => item.id !== 'auto').map(item => ({ ...item })), ...custom.map(item => ({ ...item }))],
    }
  }

  putLanguage(id: string, label: string): TranslationLanguage {
    const resolvedId = language(id, false)
    if (BUILTIN_LANGUAGES.some(item => item.id === resolvedId)) throw new Error(`language "${resolvedId}" is built in`)
    const resolvedLabel = label.trim()
    if (resolvedLabel.length === 0) throw new Error('translation language label must not be blank')
    const item: TranslationLanguage = { id: resolvedId, label: resolvedLabel, builtin: false }
    this.customLanguages.set(resolvedId, item)
    return { ...item }
  }

  deleteLanguage(id: string): { absent: true } {
    this.customLanguages.delete(id)
    return { absent: true }
  }

  private async run(job: MutableJob, request: TranslationRequest): Promise<void> {
    try {
      const llm = this.llm
      const callConfig = {
        provider: request.selection.provider,
        model: request.selection.model,
        ...(request.selection.reasoningEffort === undefined
          ? {}
          : { reasoningEffort: ReasoningEffortId(request.selection.reasoningEffort) }),
      }
      const prepared = await llm.prepareCall(callConfig, job.controller.signal)
      const message = createUserMessage({ source: { kind: 'user' }, content: [{ type: 'text', text: request.text }] })
      const startedAt = Date.now()
      let recorded = false
      for await (const chunk of prepared.stream({
        ...prepared.config,
        messages: [message],
        system: prompt(request, this.scope === null ? (this.promptOverride ?? '') : this.scope.get().prompt),
        signal: job.controller.signal,
      })) {
        if (chunk.type === 'usage' && !recorded) {
          recorded = true
          recordUsage(this.ctx, {
            provider: request.selection.provider,
            model: request.selection.model,
            kind: 'translation',
            inputTokens: chunk.usage.inputTokens,
            outputTokens: chunk.usage.outputTokens,
            cacheReadTokens: chunk.usage.cacheReadTokens ?? 0,
            cacheWriteTokens: chunk.usage.cacheWriteTokens ?? 0,
            latencyMs: Date.now() - startedAt,
          })
        }
        if (chunk.type === 'text-delta') job.view.output += chunk.text
        if (chunk.type === 'finish') {
          if (chunk.reason.kind === 'aborted') job.view.status = 'cancelled'
          else if (chunk.reason.kind === 'error') {
            job.view.status = 'error'
            job.view.failure = chunk.reason.failure
          } else job.view.status = 'completed'
        }
        job.view.updatedAt = Date.now()
      }
      if (job.view.status === 'running') job.view.status = job.controller.signal.aborted ? 'cancelled' : 'completed'
      if (job.view.status === 'completed') {
        const id = `history-${randomUUID()}`
        const item: TranslationHistoryItem = {
          id,
          sourceLanguage: request.sourceLanguage,
          targetLanguage: request.targetLanguage,
          sourceText: request.text,
          translatedText: job.view.output,
          selection: structuredClone(request.selection),
          starred: false,
          createdAt: Date.now(),
        }
        this.history.set(id, item)
        job.view.historyId = id
      }
    } catch (error) {
      job.view.status = job.controller.signal.aborted ? 'cancelled' : 'error'
      if (job.view.status === 'error') job.view.failure = failureOf(error)
    } finally {
      job.view.updatedAt = Date.now()
    }
  }
}

export default TranslationService
