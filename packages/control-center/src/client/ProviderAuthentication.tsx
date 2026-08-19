import { useState, useCallback, useEffect } from 'react'
import type { ProviderView } from '../provider-types.ts'
import css from './ProviderAuthentication.module.css'

interface ProviderAuthenticationProps {
  provider: ProviderView
  onUpdateProvider: (updates: { apiKey?: string; baseURL?: string; customHeaders?: Record<string, string> }) => Promise<void>
  onTestConnection: () => Promise<void>
  onDiscoverModels: () => Promise<void>
  isTestingConnection: boolean
  isDiscoveringModels: boolean
  connectionTestResult: { success: boolean; latencyMs?: number; error?: string } | null
}

export function ProviderAuthentication({
  provider,
  onUpdateProvider,
  onTestConnection,
  onDiscoverModels,
  isTestingConnection,
  isDiscoveringModels,
  connectionTestResult
}: ProviderAuthenticationProps) {
  const [apiKey, setApiKey] = useState('')
  const [baseURL, setBaseURL] = useState(provider.baseURL || '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [hasEdits, setHasEdits] = useState(false)

  useEffect(() => {
    setBaseURL(provider.baseURL || '')
    setApiKey('')
    setHasEdits(false)
  }, [provider.id, provider.baseURL])

  const handleApiKeyChange = useCallback((value: string) => {
    setApiKey(value)
    setHasEdits(true)
  }, [])

  const handleBaseURLChange = useCallback((value: string) => {
    setBaseURL(value)
    setHasEdits(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!hasEdits) return
    await onUpdateProvider({
      ...(apiKey ? { apiKey } : {}),
      ...(baseURL !== provider.baseURL ? { baseURL } : {})
    })
    setHasEdits(false)
    setApiKey('')
  }, [hasEdits, apiKey, baseURL, provider.baseURL, onUpdateProvider])

  return (
    <section className={css.section}>
      <div className={css.sectionTitle}>Authentication</div>

      <div className={css.field}>
        <div className={css.fieldLabel}>
          <span>API Key</span>
          <a
            href={getApiKeyUrl(provider.type)}
            target="_blank"
            rel="noopener noreferrer"
            className={css.fieldLink}>
            Get API Key
          </a>
        </div>
        <div className={css.inputRow}>
          <div className={css.inputGroup}>
            <input
              type={showApiKey ? 'text' : 'password'}
              className={css.input}
              value={apiKey}
              placeholder={provider.hasApiKey ? '••••••••••••••••' : 'Enter your API key'}
              onChange={(e) => handleApiKeyChange(e.target.value)}
            />
            <button
              type="button"
              className={css.inputAddon}
              onClick={() => setShowApiKey(!showApiKey)}
              title={showApiKey ? 'Hide API key' : 'Show API key'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {showApiKey ? (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>
          <button
            type="button"
            className={css.iconButton}
            onClick={onTestConnection}
            disabled={isTestingConnection || (!provider.hasApiKey && !apiKey)}
            title="Test connection">
            {isTestingConnection ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={css.spin}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            )}
          </button>
        </div>
        {connectionTestResult && (
          <div className={connectionTestResult.success ? css.successMessage : css.errorMessage}>
            {connectionTestResult.success
              ? `Connected successfully (${connectionTestResult.latencyMs}ms)`
              : connectionTestResult.error}
          </div>
        )}
      </div>

      <div className={css.field}>
        <div className={css.fieldLabel}>
          <span>Base URL</span>
        </div>
        <input
          type="text"
          className={css.input}
          value={baseURL}
          placeholder="https://api.example.com"
          onChange={(e) => handleBaseURLChange(e.target.value)}
        />
      </div>

      {hasEdits && (
        <div className={css.actionRow}>
          <button
            type="button"
            className={css.primaryButton}
            onClick={handleSave}>
            Save Changes
          </button>
          <button
            type="button"
            className={css.secondaryButton}
            onClick={() => {
              setApiKey('')
              setBaseURL(provider.baseURL || '')
              setHasEdits(false)
            }}>
            Cancel
          </button>
        </div>
      )}

      <div className={css.actionRow}>
        <button
          type="button"
          className={css.secondaryButton}
          onClick={onDiscoverModels}
          disabled={isDiscoveringModels || (!provider.hasApiKey && !apiKey)}>
          {isDiscoveringModels ? 'Discovering...' : 'Discover Models'}
        </button>
        {provider.lastDiscoveredAt && (
          <span className={css.timestamp}>
            Last discovered: {new Date(provider.lastDiscoveredAt).toLocaleString()}
          </span>
        )}
      </div>
    </section>
  )
}

function getApiKeyUrl(providerType: string): string {
  const urls: Record<string, string> = {
    openai: 'https://platform.openai.com/api-keys',
    anthropic: 'https://console.anthropic.com/settings/keys',
    gemini: 'https://aistudio.google.com/app/apikey',
    deepseek: 'https://platform.deepseek.com/api_keys',
    groq: 'https://console.groq.com/keys',
    'mistral-ai': 'https://console.mistral.ai/api-keys',
    cohere: 'https://dashboard.cohere.com/api-keys'
  }
  return urls[providerType] || '#'
}
