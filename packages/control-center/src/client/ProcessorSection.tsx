/**
 * File Processing / OCR settings section.
 *
 * One page per feature (document_to_markdown / image_to_text) over the
 * controlCenterFileProcessing Remote service, composed like Cherry's
 * ProcessorPanel: default-processor select + per-processor config cards.
 */

import { useCallback, useEffect, useState } from 'react'
import type { TypertClientRemote } from '@deepseek-ai/dsh-typert-protocol'
import type {
  FileProcessorEntry,
  FileProcessorFeature,
  FileProcessorId,
  FileProcessorOverride,
} from '../file-processing-types.ts'
import css from './ProcessorSection.module.css'

export interface ProcessorSectionProps {
  feature: FileProcessorFeature
  title: string
  description: string
  service: NonNullable<TypertClientRemote['controlCenterFileProcessing']>
}

function unwrap<T>(result: { ok: true; value: T } | { ok: false; error: { code: string; message: string; details: object } }): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

export function ProcessorSection({ feature, title, description, service }: ProcessorSectionProps) {
  const [processors, setProcessors] = useState<FileProcessorEntry[]>([])
  const [config, setConfig] = useState<{ defaultDocumentProcessor: FileProcessorId; defaultImageProcessor: FileProcessorId; overrides: Partial<Record<FileProcessorId, FileProcessorOverride>> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([service.listProcessors(), service.getConfig()])
      setProcessors(unwrap(p))
      setConfig(unwrap(c))
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setLoading(false)
    }
  }, [service])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <div className={css.loading}>Loading...</div>
  if (error !== null || config === null) {
    return (
      <div className={css.root}>
        <div className="cc-notice-error">{error ?? 'Failed to load'}</div>
      </div>
    )
  }

  const entries = processors.filter(p => p.features.includes(feature))
  const defaultId = feature === 'image_to_text' ? config.defaultImageProcessor : config.defaultDocumentProcessor
  const selectedId = entries.some(p => p.id === defaultId) ? defaultId : entries[0]?.id ?? ''

  const setDefault = async (processor: FileProcessorId): Promise<void> => {
    try {
      unwrap(await service.setDefault(feature, processor))
      setConfig(prev => prev === null ? prev : {
        ...prev,
        ...(feature === 'image_to_text' ? { defaultImageProcessor: processor } : { defaultDocumentProcessor: processor }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const setOverride = async (processor: FileProcessorId, override: FileProcessorOverride): Promise<void> => {
    try {
      unwrap(await service.setOverride(processor, override))
      setConfig(prev => prev === null ? prev : {
        ...prev,
        overrides: { ...prev.overrides, [processor]: override },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className={css.root}>
      <div>
        <h2 className={css.pageTitle}>{title}</h2>
        <p className={css.pageDescription}>{description}</p>
      </div>

      <div className={css.card}>
        <div className={css.cardTitle}>默认处理器</div>
        <div className={css.fieldRow}>
          <div className={css.fieldLabel}>用于{feature === 'image_to_text' ? '图片文字识别' : '文档转 Markdown'}的处理器</div>
          <select
            value={selectedId}
            onChange={(e) => void setDefault(e.target.value as FileProcessorId)}
            className={css.select}
          >
            {entries.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {entries.map(processor => {
        const override = config.overrides[processor.id]
        const apiKeys = override?.apiKeys ?? []
        const languages = override?.languages ?? []
        return (
          <div key={processor.id} className={css.card}>
            <div>
              <div className={css.cardTitle}>{processor.name}</div>
              <div className={css.cardDescription}>{processor.description}</div>
            </div>

            {processor.requiresApiKey && (
              <div className={css.fieldRow}>
                <div className={css.fieldLabel}>
                  API Key
                  {processor.apiKeyWebsite !== null
                    ? <div className={css.fieldHint}><a href={processor.apiKeyWebsite} target="_blank" rel="noreferrer" style={{ color: 'var(--link, var(--primary))' }}>获取 API Key</a></div>
                    : null}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  {(apiKeys.length > 0 ? apiKeys : ['']).map((key, index) => (
                    <div key={index} className={css.apiKeyRow}>
                      <input
                        type="password"
                        value={key}
                        placeholder="Enter API key"
                        onChange={async (e) => {
                          const next = [...apiKeys]
                          next[index] = e.target.value
                          await setOverride(processor.id, { ...override, apiKeys: next.filter(Boolean) })
                        }}
                        className={css.input}
                      />
                      {apiKeys.length > 1 && (
                        <button
                          type="button"
                          className={css.iconButton}
                          onClick={() => void setOverride(processor.id, { ...override, apiKeys: apiKeys.filter((_, i) => i !== index) })}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className={css.iconButton}
                    onClick={() => void setOverride(processor.id, { ...override, apiKeys: [...apiKeys, ''] })}
                  >
                    Add API Key
                  </button>
                </div>
              </div>
            )}

            {processor.id === 'mistral' && (
              <>
                <div className={css.fieldRow}>
                  <div className={css.fieldLabel}>
                    API Host
                    <div className={css.fieldHint}>OpenAI 兼容的视觉模型端点，例如 https://api.deepseek.com/v1</div>
                  </div>
                  <input
                    type="text"
                    value={override?.apiHost ?? ''}
                    placeholder="https://api.mistral.ai/v1"
                    onChange={(e) => void setOverride(processor.id, { ...override, apiHost: e.target.value })}
                    className={css.input}
                  />
                </div>
                <div className={css.fieldRow}>
                  <div className={css.fieldLabel}>模型</div>
                  <input
                    type="text"
                    value={override?.model ?? ''}
                    placeholder="pixtral-12b-2409"
                    onChange={(e) => void setOverride(processor.id, { ...override, model: e.target.value })}
                    className={css.input}
                  />
                </div>
              </>
            )}

            {processor.languageOptions.length > 0 && (
              <div className={css.fieldRow}>
                <div className={css.fieldLabel}>识别语言</div>
                <select
                  value={languages[0] ?? processor.languageOptions[0] ?? 'auto'}
                  onChange={(e) => void setOverride(processor.id, { ...override, languages: [e.target.value] })}
                  className={css.select}
                >
                  {processor.languageOptions.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
