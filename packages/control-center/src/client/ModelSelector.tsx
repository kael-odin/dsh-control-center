/**
 * Cherry ModelSelector parity: provider-avatared, grouped model picker with
 * search and a "配置自定义模型" footer that jumps to the settings models page.
 */
import { Combobox, type ComboboxGroup, type ComboboxOption } from './Combobox.tsx'
import { IconSettings2 } from './painting-icons.tsx'
import { providerIconSvg } from './provider-icons-data.ts'
import css from './ModelSelector.module.css'

/** Stable provider brand colors for avatar chips. */
const PROVIDER_COLORS: Record<string, string> = {
  'deepseek': '#4d6bfe',
  'deepseek-official': '#4d6bfe',
  'openai': '#0d0d0d',
  'anthropic': '#d97757',
  'google': '#4285f4',
  'gemini': '#4285f4',
  'openrouter': '#8b5cf6',
  'azure': '#0078d4',
  'moonshot': '#1a1a2e',
  'ollama': '#1f2937',
  'zhipu': '#4c6fff',
  'siliconflow': '#10b981',
  'dashscope': '#ff6a00',
  'groq': '#f55036',
  'mistral': '#f7a600',
  'openrouter-test': '#8b5cf6',
}

function colorOf(providerId: string): string {
  const known = PROVIDER_COLORS[providerId]
  if (known !== undefined) return known
  let hash = 0
  for (const char of providerId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  const hue = hash % 360
  return `hsl(${hue} 55% 45%)`
}

function initialOf(name: string): string {
  const trimmed = name.trim()
  return trimmed.length === 0 ? '?' : trimmed[0]!.toUpperCase()
}

export interface ModelOption {
  value: string
  label: string
  providerId: string
  providerName: string
}

export interface ModelSelectorProps {
  models: readonly ModelOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Opens the settings models section (bridged to the settings shell). */
  onConfigure?: () => void
  ariaLabel?: string
  className?: string
  align?: 'start' | 'end'
}

export function ModelSelector({ models, value, onChange, placeholder = '选择模型', onConfigure, ariaLabel, className, align }: ModelSelectorProps) {
  const groups = useModelGroups(models)
  const options: ComboboxOption[] = models.map(model => ({
    value: model.value,
    label: model.label,
    sublabel: model.providerName,
    group: model.providerId,
    icon: <ProviderAvatar id={model.providerId} name={model.providerName} />,
  }))

  return (
    <Combobox
      value={value}
      options={options}
      onChange={onChange}
      placeholder={placeholder}
      searchable
      groups={groups}
      className={className}
      ariaLabel={ariaLabel}
      align={align}
      footer={onConfigure === undefined ? undefined : (
        <button type="button" className={css.configureButton} onClick={onConfigure}>
          <IconSettings2 size={13} />
          <span>配置自定义模型</span>
        </button>
      )}
    />
  )
}

function useModelGroups(models: readonly ModelOption[]): ComboboxGroup[] {
  const ids = [...new Set(models.map(model => model.providerId))]
  return ids.map(id => {
    const name = models.find(model => model.providerId === id)?.providerName ?? id
    return { id, label: name }
  })
}

export function ProviderAvatar({ id, name, size = 22 }: { id: string; name: string; size?: number }) {
  const glyph = providerIconSvg(id, size)
  if (glyph !== '') {
    return (
      <span
        className={css.avatar}
        style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), background: 'var(--background-subtle)' }}
        aria-hidden
        dangerouslySetInnerHTML={{ __html: glyph }}
      />
    )
  }
  return (
    <span
      className={css.avatar}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), background: colorOf(id), fontSize: Math.round(size * 0.55) }}
      aria-hidden
    >
      {initialOf(name)}
    </span>
  )
}
