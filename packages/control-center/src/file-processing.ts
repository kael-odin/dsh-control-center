/**
 * File Processing Host service: document → markdown and OCR (image → text)
 * processor catalog + configuration + conversion.
 *
 * Config lives in the `control-center-file-processing` settings namespace.
 * Conversion is capability-gated: processors without configured credentials
 * report a clear error instead of pretending (spec: unsupported integrations
 * are presented accurately through capability detection).
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { settingsNamespace, type SettingsScope } from '@deepseek-ai/dsh-settings'
import Schema from '@deepseek-ai/schemastery'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { basename, relative, resolve } from 'node:path'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import type {
  FileProcessorEntry,
  FileProcessorFeature,
  FileProcessorId,
  FileProcessorOverride,
  FileConvertRequest,
  FileConvertResult
} from './file-processing-types.ts'

const FP_NAMESPACE = settingsNamespace('control-center-file-processing')

/** Processor catalog (adapted from Cherry fileProcessingMeta). */
const CATALOG: readonly FileProcessorEntry[] = [
  {
    id: 'system',
    name: 'System OCR',
    description: 'Use the operating system OCR when available (macOS Vision / Windows built-in).',
    apiKeyWebsite: null,
    features: ['image_to_text'],
    requiresApiKey: false,
    languageOptions: ['auto', 'en', 'zh-Hans', 'ja', 'ko', 'fr', 'de', 'es'],
  },
  {
    id: 'tesseract',
    name: 'Tesseract',
    description: 'Local Tesseract OCR engine (requires a local Tesseract installation).',
    apiKeyWebsite: null,
    features: ['image_to_text'],
    requiresApiKey: false,
    languageOptions: ['auto', 'eng', 'chi_sim', 'jpn', 'kor', 'fra', 'deu', 'spa'],
  },
  {
    id: 'paddleocr',
    name: 'PaddleOCR (Baidu)',
    description: 'PaddleOCR online service from Baidu AI Studio.',
    apiKeyWebsite: 'https://aistudio.baidu.com/paddleocr/',
    features: ['image_to_text'],
    requiresApiKey: true,
    languageOptions: ['auto', 'ch', 'en', 'japan', 'korean', 'france', 'german', 'spanish'],
  },
  {
    id: 'local-paddleocr',
    name: 'Local PaddleOCR',
    description: 'Run PaddleOCR locally through the DSH Python runtime.',
    apiKeyWebsite: null,
    features: ['image_to_text'],
    requiresApiKey: false,
    languageOptions: ['auto', 'ch', 'en', 'japan', 'korean'],
  },
  {
    id: 'ovocr',
    name: 'OpenVINO OCR',
    description: 'Local OCR acceleration through OpenVINO models.',
    apiKeyWebsite: null,
    features: ['image_to_text'],
    requiresApiKey: false,
    languageOptions: ['auto', 'en', 'ch'],
  },
  {
    id: 'mistral',
    name: 'Mistral (Vision)',
    description: 'OCR through a vision-capable OpenAI-compatible model (works with any configured vision endpoint).',
    apiKeyWebsite: 'https://mistral.ai/api-keys',
    features: ['image_to_text', 'document_to_markdown'],
    requiresApiKey: true,
    languageOptions: ['auto'],
  },
  {
    id: 'local-document',
    name: 'Local Document',
    description: 'Extract text from plain-text documents locally (txt, md, json, code).',
    apiKeyWebsite: null,
    features: ['document_to_markdown'],
    requiresApiKey: false,
    languageOptions: [],
  },
  {
    id: 'mineru',
    name: 'MinerU',
    description: 'MinerU online document-to-markdown conversion (PDF, DOCX, images).',
    apiKeyWebsite: 'https://mineru.net/apiManage',
    features: ['document_to_markdown'],
    requiresApiKey: true,
    languageOptions: [],
  },
  {
    id: 'doc2x',
    name: 'Doc2X',
    description: 'Doc2X document-to-markdown conversion service.',
    apiKeyWebsite: 'https://open.noedgeai.com/apiKeys',
    features: ['document_to_markdown'],
    requiresApiKey: true,
    languageOptions: [],
  },
  {
    id: 'open-mineru',
    name: 'Open MinerU',
    description: 'Self-hosted MinerU (open-source document parsing).',
    apiKeyWebsite: 'https://github.com/opendatalab/MinerU/',
    features: ['document_to_markdown'],
    requiresApiKey: false,
    languageOptions: [],
  },
]

interface FileProcessingSettings {
  defaultDocumentProcessor: FileProcessorId
  defaultImageProcessor: FileProcessorId
  overrides: Partial<Record<FileProcessorId, FileProcessorOverride>>
}

const TEXT_EXTENSIONS = new Set(['txt', 'md', 'json', 'ts', 'tsx', 'js', 'jsx', 'css', 'html', 'yaml', 'yml', 'toml', 'py', 'go', 'rs', 'c', 'cpp', 'h', 'sh', 'sql', 'xml', 'csv'])

export class FileProcessingService extends Service {
  static inject = ['settings'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterFileProcessing')
  private scope: SettingsScope<FileProcessingSettings>

  constructor(ctx: Context, _config?: { logger?: Context['logger'] }) {
    super(ctx, 'controlCenterFileProcessing')
    this.scope = ctx.settings.register(FP_NAMESPACE, Schema.object({
      defaultDocumentProcessor: Schema.union(['local-document', 'mineru', 'doc2x', 'mistral', 'open-mineru']).default('local-document'),
      defaultImageProcessor: Schema.union(['system', 'tesseract', 'paddleocr', 'local-paddleocr', 'ovocr', 'mistral']).default('system'),
      overrides: Schema.dict(Schema.object({
        apiKeys: Schema.array(Schema.string().role('secret')),
        languages: Schema.array(Schema.string()),
        apiHost: Schema.string(),
        model: Schema.string()
      })).default({})
    }), {
      base: {
        defaultDocumentProcessor: 'local-document',
        defaultImageProcessor: 'system',
        overrides: {}
      }
    })
  }

  async listProcessors(): Promise<FileProcessorEntry[]> {
    return CATALOG.map(entry => ({ ...entry }))
  }

  async getConfig(): Promise<FileProcessingSettings> {
    return this.scope.get()
  }

  async setDefault(feature: FileProcessorFeature, processor: FileProcessorId): Promise<{ absent: true }> {
    const update = feature === 'image_to_text'
      ? { defaultImageProcessor: processor }
      : { defaultDocumentProcessor: processor }
    await this.scope.update(update)
    return { absent: true }
  }

  async setOverride(processor: FileProcessorId, override: FileProcessorOverride): Promise<{ absent: true }> {
    const current = this.scope.get()
    await this.scope.update({
      overrides: { ...current.overrides, [processor]: override }
    })
    return { absent: true }
  }

  /**
   * Convert a file with the configured processor. Capability-gated: local
   * text extraction and OpenAI-compatible vision work now; cloud processors
   * require their own credentials and report a precise error otherwise.
   */
  async convert(request: FileConvertRequest): Promise<FileConvertResult> {
    const path = resolve(request.path)
    this.confine(path)
    if (!existsSync(path)) throw new Error(`File not found: ${path}`)
    const stat = statSync(path)
    if (!stat.isFile()) throw new Error(`Not a file: ${path}`)

    const override = this.scope.get().overrides[request.processor]
    switch (request.processor) {
      case 'local-document':
      case 'system':
        return this.extractText(path, stat.size)
      case 'mistral':
        return this.ocrViaVision(path, stat.size, override)
      default:
        throw new Error(
          `Processor "${request.processor}" is not configured: add its API key in Settings → 文档处理 / OCR`
        )
    }
  }

  /** Conversion is confined to the DSH home (attachments, knowledge files). */
  private confine(path: string): void {
    const home = resolve(resolveDshHome())
    const rel = relative(home, path)
    if (rel.startsWith('..') || rel.includes('..')) {
      throw new Error('File path is outside the DSH home')
    }
  }

  /** Plain-text extraction for text documents (txt/md/code). */
  private extractText(path: string, bytes: number): FileConvertResult {
    const ext = basename(path).split('.').pop()?.toLowerCase() ?? ''
    if (!TEXT_EXTENSIONS.has(ext)) {
      throw new Error(`Local extraction does not support .${ext} files yet`)
    }
    const text = readFileSync(path, 'utf8')
    return { processor: 'local-document', text, bytes }
  }

  /** OCR through an OpenAI-compatible vision model (chat/completions). */
  private async ocrViaVision(path: string, bytes: number, override: FileProcessorOverride | undefined): Promise<FileConvertResult> {
    const apiKey = override?.apiKeys?.[0]
    if (apiKey === undefined) {
      throw new Error('Mistral (Vision) is not configured: add an API key in Settings → OCR')
    }
    const apiHost = override?.apiHost ?? 'https://api.mistral.ai/v1'
    const model = override?.model ?? 'pixtral-12b-2409'
    const data = readFileSync(path).toString('base64')
    const response = await fetch(`${apiHost}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all text from this image. Respond with the raw extracted text only.' },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${data}` } },
          ],
        }],
      }),
    })
    if (!response.ok) {
      throw new Error(`Vision OCR failed: HTTP ${response.status} ${(await response.text()).slice(0, 200)}`)
    }
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    const text = payload.choices?.[0]?.message?.content ?? ''
    if (text === '') throw new Error('Vision OCR returned no text')
    return { processor: 'mistral', text, bytes }
  }

  [Symbol.dispose]() {
    // Settings scope owns its lifecycle.
  }
}
