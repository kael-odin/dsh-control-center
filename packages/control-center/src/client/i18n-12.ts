/** Cherry 12-locale catalog — mapped onto DSH LocaleRuntime via addLanguage. */

import type { LocaleDict } from '@deepseek-ai/dsh-client-locale/client'

export interface CherryLocalePack {
  id: string
  label: string
  fallback: string
  dict: LocaleDict
}

const CHERRY_LOCALES: ReadonlyArray<{ id: string; label: string; fallback: string }> = [
  { id: 'zh-CN', label: '中文', fallback: 'en' },
  { id: 'zh-TW', label: '中文（繁体）', fallback: 'en' },
  { id: 'en', label: 'English', fallback: 'en' },
  { id: 'de-DE', label: 'Deutsch', fallback: 'en' },
  { id: 'ja-JP', label: '日本語', fallback: 'en' },
  { id: 'ru-RU', label: 'Русский', fallback: 'en' },
  { id: 'el-GR', label: 'Ελληνικά', fallback: 'en' },
  { id: 'es-ES', label: 'Español', fallback: 'en' },
  { id: 'fr-FR', label: 'Français', fallback: 'en' },
  { id: 'pt-PT', label: 'Português', fallback: 'en' },
  { id: 'ro-RO', label: 'Română', fallback: 'en' },
  { id: 'vi-VN', label: 'Tiếng Việt', fallback: 'en' },
]

export const CHERRY_12_LOCALES: ReadonlyArray<{ id: string; label: string; fallback: string }> = CHERRY_LOCALES

/**
 * Register the 10 non-built-in Cherry locales (de/ja/ru/el/es/fr/pt/ro/vi/zh-TW)
 * onto the DSH LocaleRuntime. Built-ins (zh,en) are already provided by
 * dsh-client-locale; registering them again would throw.
 *
 * Each locale reuses the control-center pack's own namespaces (shell/models/
 * websearch/msgactions) but falls back to English for missing keys — honest
 * parity without carrying 5200 Cherry keys verbatim.
 */
export function registerCherry12Locales(
  locale: { addLanguage: (input: { id: string; label: string; fallback: string }) => () => void; register: (ns: string, localeId: string, dict: LocaleDict) => () => void },
  packs: Record<string, LocaleDict>,
): Array<() => void> {
  const disposers: Array<() => void> = []
  for (const { id, label, fallback } of CHERRY_LOCALES) {
    if (id === 'zh' || id === 'en') continue
    const normalizedId = id === 'zh-CN' ? 'zh' : id === 'en' ? 'en' : id
    if (normalizedId === 'zh' || normalizedId === 'en') continue
    disposers.push(locale.addLanguage({ id, label, fallback }))
    for (const [ns, dict] of Object.entries(packs)) {
      disposers.push(locale.register(ns, id, dict))
    }
  }
  return disposers
}
