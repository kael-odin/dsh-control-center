/**
 * Provider Add/Edit Dialog Component
 *
 * Modal dialog for creating new providers or editing existing ones.
 * Follows the Settings + Credentials + TypertRemote pattern.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CreateProviderDto, ProviderType, ProviderView, UpdateProviderDto } from '../provider-types'
import { DEFAULT_BASE_URLS, PROVIDER_PRESETS, PROVIDER_PRESET_GROUPS, PROVIDER_TYPES, type ProviderPreset } from './provider-presets.ts'
import css from './ProviderDialog.module.css'

interface ProvidersService {
  create(dto: CreateProviderDto): Promise<{ ok: true; value: ProviderView } | { ok: false; error: { code: string; message: string; details: object } }>
  update(providerId: string, dto: UpdateProviderDto): Promise<{ ok: true; value: ProviderView } | { ok: false; error: { code: string; message: string; details: object } }>
}

interface ProviderDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  provider?: ProviderView | undefined // Only for edit mode
  providersService?: ProvidersService | undefined
  onClose: () => void
  onSuccess?: (() => void) | undefined
}

export function ProviderDialog({ open, mode, provider, providersService, onClose, onSuccess }: ProviderDialogProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ProviderType>('openai-compatible')
  const [baseURL, setBaseURL] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [customHeaders, setCustomHeaders] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [presetSearch, setPresetSearch] = useState('')

  const matchingPresets = useMemo(() => {
    const query = presetSearch.trim().toLowerCase()
    if (query === '') return PROVIDER_PRESETS
    return PROVIDER_PRESETS.filter(preset =>
      preset.name.toLowerCase().includes(query) || preset.id.toLowerCase().includes(query) || preset.baseURL.toLowerCase().includes(query))
  }, [presetSearch])

  // Initialize form when provider changes (edit mode)
  useEffect(() => {
    if (mode === 'edit' && provider) {
      setName(provider.name)
      setType(provider.type)
      setBaseURL(provider.baseURL)
      setApiKey('') // Never pre-fill API key
      setCustomHeaders(provider.customHeaders ? JSON.stringify(provider.customHeaders, null, 2) : '')
      setEnabled(provider.enabled)
    } else if (mode === 'create') {
      // Reset form for create mode
      setName('')
      setType('openai-compatible')
      setBaseURL('')
      setApiKey('')
      setCustomHeaders('')
      setEnabled(true)
    }
    setError(null)
  }, [mode, provider, open])

  // Auto-fill base URL when type changes (create mode only)
  useEffect(() => {
    if (mode === 'create' && type) {
      setBaseURL(DEFAULT_BASE_URLS[type])
    }
  }, [type, mode])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!providersService) {
      setError('Providers service not available')
      return
    }

    setError(null)
    setSaving(true)

    try {
      // Parse custom headers if provided
      let parsedHeaders: Record<string, string> | undefined
      if (customHeaders.trim()) {
        try {
          parsedHeaders = JSON.parse(customHeaders)
          if (typeof parsedHeaders !== 'object' || Array.isArray(parsedHeaders)) {
            throw new Error('Headers must be a JSON object')
          }
        } catch (err) {
          setError(`Invalid JSON in custom headers: ${err instanceof Error ? err.message : String(err)}`)
          setSaving(false)
          return
        }
      }

      if (mode === 'create') {
        const dto: CreateProviderDto = {
          name: name.trim(),
          type,
          baseURL: baseURL.trim(),
          ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
          ...(parsedHeaders ? { customHeaders: parsedHeaders } : {}),
          enabled,
        }
        const result = await providersService.create(dto)
        if (!result.ok) throw new Error(result.error.message)
      } else if (mode === 'edit' && provider) {
        const dto: UpdateProviderDto = {
          name: name.trim(),
          baseURL: baseURL.trim(),
          ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
          ...(parsedHeaders ? { customHeaders: parsedHeaders } : {}),
          enabled,
        }
        const result = await providersService.update(provider.id, dto)
        if (!result.ok) throw new Error(result.error.message)
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }, [providersService, mode, provider, name, type, baseURL, apiKey, customHeaders, enabled, onSuccess, onClose])

  const applyPreset = (preset: ProviderPreset): void => {
    setName(preset.name)
    setType(preset.type)
    setBaseURL(preset.baseURL)
    setPresetSearch('')
    setError(null)
  }

  const handleCancel = useCallback(() => {
    onClose()
  }, [onClose])

  if (!open) return null

  return (
    <div className={css.overlay} onClick={handleCancel}>
      <div className={`${css.dialog} cc-surface`} onClick={(e) => e.stopPropagation()}>
        <div className={css.header}>
          <h2 className={css.title}>
            {mode === 'create' ? '添加提供商' : '编辑提供商'}
          </h2>
        </div>

        <form className={css.content} onSubmit={handleSubmit}>
          {error && (
            <div className={css.error}>{error}</div>
          )}

          <div className={css.field}>
            <label className={css.label} htmlFor="provider-name">
              名称 <span className={css.required}>*</span>
            </label>
            <input
              id="provider-name"
              className={css.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：My OpenAI Provider"
              required
              autoFocus
            />
          </div>

          {mode === 'create' && (
            <div className={css.field}>
              <label className={css.label} htmlFor="provider-preset-search">
                从 Provider 预设创建（可选）
              </label>
              <input
                id="provider-preset-search"
                className={css.input}
                type="text"
                value={presetSearch}
                onChange={(e) => setPresetSearch(e.target.value)}
                placeholder="搜索平台，如 DeepSeek、OpenRouter、硅基流动…"
              />
              <div className={css.presetList}>
                {PROVIDER_PRESET_GROUPS.map(group => {
                  const entries = matchingPresets.filter(preset => preset.group === group.id)
                  if (entries.length === 0) return null
                  return (
                    <div key={group.id} className={css.presetGroup}>
                      <div className={css.presetGroupTitle}>{group.label}</div>
                      {entries.map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          className={css.presetItem}
                          onClick={() => { applyPreset(preset) }}
                        >
                          <span className={css.presetName}>{preset.name}</span>
                          <span className={css.presetUrl}>{preset.baseURL || '自定义地址'}</span>
                        </button>
                      ))}
                    </div>
                  )
                })}
                {matchingPresets.length === 0 && <div className={css.presetEmpty}>无匹配的预设</div>}
              </div>
            </div>
          )}

          {mode === 'create' && (
            <div className={css.field}>
              <label className={css.label} htmlFor="provider-type">
                类型 <span className={css.required}>*</span>
              </label>
              <select
                id="provider-type"
                className={css.select}
                value={type}
                onChange={(e) => setType(e.target.value as ProviderType)}
                required
              >
                {PROVIDER_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={css.field}>
            <label className={css.label} htmlFor="provider-baseurl">
              Base URL <span className={css.required}>*</span>
            </label>
            <input
              id="provider-baseurl"
              className={css.input}
              type="text"
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
              placeholder="https://api.example.com/v1"
              required
            />
            <div className={css.hint}>完整的 API 端点地址（不含路径后缀）</div>
          </div>

          <div className={css.field}>
            <label className={css.label} htmlFor="provider-apikey">
              API Key
            </label>
            <input
              id="provider-apikey"
              className={css.input}
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={mode === 'edit' ? '留空则不修改' : '可选'}
            />
            <div className={css.hint}>
              {mode === 'edit' ? '仅在需要更新时填写' : 'API 密钥将安全存储'}
            </div>
          </div>

          <div className={css.field}>
            <label className={css.label} htmlFor="provider-headers">
              自定义 Headers (JSON)
            </label>
            <textarea
              id="provider-headers"
              className={css.textarea}
              value={customHeaders}
              onChange={(e) => setCustomHeaders(e.target.value)}
              placeholder='{"X-Custom-Header": "value"}'
              rows={3}
            />
            <div className={css.hint}>可选，JSON 格式的额外请求头</div>
          </div>

          <div className={css.checkboxField}>
            <label className={css.checkboxLabel}>
              <input
                type="checkbox"
                className={css.checkbox}
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span>启用此提供商</span>
            </label>
          </div>

          <div className={css.footer}>
            <button
              type="button"
              className={css.cancelButton}
              onClick={handleCancel}
              disabled={saving}
            >
              取消
            </button>
            <button
              type="submit"
              className={css.submitButton}
              disabled={saving}
            >
              {saving ? '保存中...' : mode === 'create' ? '创建' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
