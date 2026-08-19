import { useMemo } from 'react'
import type { ProviderView, ModelView } from '../provider-types.ts'
import css from './ProviderModelList.module.css'

interface ProviderModelListProps {
  provider: ProviderView
  onToggleModel?: (modelId: string, enabled: boolean) => Promise<void>
}

export function ProviderModelList({ provider, onToggleModel }: ProviderModelListProps) {
  const { enabledModels, disabledModels } = useMemo(() => {
    const enabled = provider.models.filter(m => m.enabled)
    const disabled = provider.models.filter(m => !m.enabled)
    return { enabledModels: enabled, disabledModels: disabled }
  }, [provider.models])

  if (provider.models.length === 0) {
    return (
      <section className={css.section}>
        <div className={css.sectionHeaderRow}>
          <h3 className={css.sectionHeading}>Models</h3>
          <span className={css.countBadge}>0</span>
        </div>
        <div className={css.emptyState}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className={css.emptyIcon}>
            <rect x="8" y="8" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path d="M14 20H26M20 14V26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
          </svg>
          <div className={css.emptyText}>No models discovered yet</div>
          <div className={css.emptyHint}>Click "Discover Models" to fetch available models from this provider</div>
        </div>
      </section>
    )
  }

  return (
    <section className={css.section}>
      <div className={css.sectionHeaderRow}>
        <h3 className={css.sectionHeading}>Models</h3>
        <div className={css.headerMeta}>
          <span className={css.countBadge}>{provider.models.length}</span>
          {enabledModels.length > 0 && (
            <span className={css.enabledCount}>{enabledModels.length} enabled</span>
          )}
        </div>
      </div>

      {enabledModels.length > 0 && (
        <div className={css.modelGroup}>
          <div className={css.groupHeader}>
            <span className={css.groupTitle}>Enabled</span>
            <span className={css.groupCount}>{enabledModels.length}</span>
          </div>
          <div className={css.modelList}>
            {enabledModels.map(model => (
              <ModelItem
                key={model.id}
                model={model}
                onToggle={onToggleModel}
              />
            ))}
          </div>
        </div>
      )}

      {disabledModels.length > 0 && (
        <div className={css.modelGroup}>
          <div className={css.groupHeader}>
            <span className={css.groupTitle}>Disabled</span>
            <span className={css.groupCount}>{disabledModels.length}</span>
          </div>
          <div className={css.modelList}>
            {disabledModels.map(model => (
              <ModelItem
                key={model.id}
                model={model}
                onToggle={onToggleModel}
              />
            ))}
          </div>
        </div>
      )}

      {provider.lastDiscoveredAt && (
        <div className={css.discoveryInfo}>
          Last discovered: {new Date(provider.lastDiscoveredAt).toLocaleString()}
        </div>
      )}
    </section>
  )
}

interface ModelItemProps {
  model: ModelView
  onToggle?: ((modelId: string, enabled: boolean) => Promise<void>) | undefined
}

function ModelItem({ model, onToggle }: ModelItemProps) {
  const handleToggle = async () => {
    if (onToggle) {
      await onToggle(model.id, !model.enabled)
    }
  }

  return (
    <div className={`${css.modelItem} ${model.enabled ? css.modelItemEnabled : css.modelItemDisabled}`}>
      <div className={css.modelMain}>
        <div className={css.modelIcon}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect width="16" height="16" rx="3" fill="currentColor" opacity="0.1" />
            <path
              d="M8 5V8L10 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className={css.modelInfo}>
          <div className={css.modelName}>{model.name}</div>
          <div className={css.modelMeta}>
            {model.contextWindow && (
              <span className={css.metaItem}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1" />
                </svg>
                {formatContextWindow(model.contextWindow)}
              </span>
            )}
            {model.maxOutputTokens && (
              <span className={css.metaItem}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5H8M5 2V8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
                {formatTokens(model.maxOutputTokens)} out
              </span>
            )}
            {model.capabilities && (
              <span className={css.metaItem}>
                {getCapabilityBadges(model.capabilities)}
              </span>
            )}
          </div>
        </div>
      </div>
      <button
        type="button"
        className={`${css.toggleButton} ${model.enabled ? css.toggleButtonEnabled : css.toggleButtonDisabled}`}
        onClick={handleToggle}
        aria-label={model.enabled ? 'Disable model' : 'Enable model'}>
        <span className={css.toggleTrack}>
          <span className={css.toggleThumb} />
        </span>
      </button>
    </div>
  )
}

function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M ctx`
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(0)}K ctx`
  }
  return `${tokens} ctx`
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(0)}K`
  }
  return `${tokens}`
}

function getCapabilityBadges(capabilities: ModelView['capabilities']): string {
  const badges: string[] = []
  if (capabilities?.chat) badges.push('chat')
  if (capabilities?.vision) badges.push('vision')
  if (capabilities?.functionCalling) badges.push('tools')
  if (capabilities?.embedding) badges.push('embedding')
  return badges.join(' · ')
}
