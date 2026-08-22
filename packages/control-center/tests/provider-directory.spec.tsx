// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react'
import { createSettingsSchemaOperations } from '../src/client/schema-operations.ts'
import { buildDirectory, identityOf, ProviderDirectorySection } from '../src/client/ProviderDirectorySection.tsx'
import type { ConfigurableProviderView, CredentialView, SettingsNamespaceView } from '@deepseek-ai/dsh-api-remotes/client'
import type { ProviderRow, ModelsSettingsState } from '../src/client/store.ts'
import { en } from '../src/client/locales.ts'

function entry(provider: string, displayName: string, active: boolean): ConfigurableProviderView {
  return { provider, displayName, settingsNs: 'llm-pi-ai', settingsPath: ['providers', provider], active }
}

function row(provider: string, displayName: string, configured: boolean, active = false): ProviderRow {
  return {
    entry: entry(provider, displayName, active),
    configured,
    removable: false,
    apiKeyEnv: configured ? `${provider.toUpperCase()}_API_KEY` : undefined,
    credential: configured ? { ref: `${provider.toUpperCase()}_API_KEY`, configured: true, writable: true } as CredentialView : undefined,
  }
}

const namespace: SettingsNamespaceView = {
  ns: 'llm-pi-ai', schema: { type: 'object' } as never, value: { providers: {} }, user: { providers: {} },
  base: {}, revision: 0, writable: true,
} as unknown as SettingsNamespaceView

const schemaService = {
  rehydrate: (value: unknown) => value,
  validate: () => undefined,
  nodeAtPath: () => ({ type: 'object' }),
  getPath: (value: unknown, path: readonly string[]) => path.reduce((current: any, key) => current?.[key], value),
  hasPath: () => false,
  setPath: (root: Record<string, unknown>, path: readonly string[], value: unknown) => {
    let current = root
    for (const key of path.slice(0, -1)) current = (current[key] ??= {}) as Record<string, unknown>
    current[path[path.length - 1]!] = value
    return root
  },
  deletePath: (root: Record<string, unknown>, path: readonly string[]) => {
    let current = root
    for (const key of path.slice(0, -1)) current = (current[key] ??= {}) as Record<string, unknown>
    delete current[path[path.length - 1]!]
    return root
  },
} as never

const schema = createSettingsSchemaOperations(schemaService)

function apiMock() {
  return {
    settings: {
      describe: vi.fn(async () => ({ rpcId: 't', result: { ok: true as const, value: { writable: true, namespaces: [namespace] } } })),
      mutate: vi.fn(async () => ({ rpcId: 't', result: { ok: true as const, value: { revision: 1, user: {} } } })),
    },
    credentials: {
      describe: vi.fn(async () => ({ rpcId: 't', result: { ok: true as const, value: { credentials: {} } } })),
      set: vi.fn(async () => ({ rpcId: 't', result: { ok: true as const, value: {} } })),
      unset: vi.fn(async () => ({ rpcId: 't', result: { ok: true as const, value: {} } })),
    },
    llm: { providers: vi.fn(), models: vi.fn(), discoverModels: vi.fn() },
  }
}

function t(key: keyof typeof en): string { return en[key] }

afterEach(() => { cleanup() })

function readyState(rows: readonly ProviderRow[]): ModelsSettingsState {
  return {
    status: 'ready', error: null, credentialError: null, writable: true, rows,
    namespaces: new Map([['llm-pi-ai', namespace]]),
  }
}

function renderSection(rows: readonly ProviderRow[]) {
  const api = apiMock()
  const useSnapshot = (selector: (state: ModelsSettingsState) => unknown) => selector(readyState(rows))
  render(
    <ProviderDirectorySection
      controller={{ load: vi.fn() } as never}
      useSnapshot={useSnapshot as never}
      api={api as never}
      schema={schema}
      t={t}
    />,
  )
  return { api }
}

describe('buildDirectory', () => {
  it('lists all 61 Cherry presets grouped by their preset group', () => {
    const directory = buildDirectory([])
    expect(directory).toHaveLength(61)
    expect(directory.filter(e => e.group === 'domestic')).toHaveLength(29)
    expect(directory.filter(e => e.group === 'international')).toHaveLength(27)
    expect(directory.filter(e => e.group === 'local')).toHaveLength(5)
    expect(directory.find(e => e.provider === 'silicon')).toMatchObject({
      displayName: '硅基流动 (Silicon)', group: 'domestic',
    })
  })

  it('joins a configured preset row onto its preset entry', () => {
    const directory = buildDirectory([row('deepseek', '深度求索 (DeepSeek)', true, true)])
    const deepseek = directory.find(e => e.provider === 'deepseek')
    expect(deepseek?.row?.configured).toBe(true)
    expect(deepseek?.row?.entry.active).toBe(true)
  })

  it('puts host rows that are not presets into the custom group', () => {
    const directory = buildDirectory([row('acme-gateway', 'Acme Gateway', true, true)])
    const acme = directory.find(e => e.provider === 'acme-gateway')
    expect(acme?.group).toBe('custom')
    expect(acme?.preset).toBeUndefined()
    expect(directory).toHaveLength(62)
  })
})

describe('identityOf', () => {
  it('seeds a fresh preset with its base URL and wire protocol, declared', () => {
    const silicon = buildDirectory([]).find(e => e.provider === 'silicon')!
    const target = identityOf(silicon)
    expect(target.settingsNs).toBe('llm-pi-ai')
    expect(target.settingsPath).toEqual(['providers', 'silicon'])
    expect(target.declared).toBe(true)
    expect(target.defaults).toEqual({ baseURL: 'https://api.siliconflow.cn/v1', api: 'openai-completions' })
  })

  it('treats a pi-ai-shipped preset as a catalog route (not declared)', () => {
    const deepseek = buildDirectory([]).find(e => e.provider === 'deepseek')!
    const target = identityOf(deepseek)
    expect(target.declared).toBeUndefined()
    expect(target.defaults?.api).toBe('openai-completions')
  })

  it('uses the directory answer once a preset is configured', () => {
    const deepseek = buildDirectory([row('deepseek', '深度求索 (DeepSeek)', true)]).find(e => e.provider === 'deepseek')!
    const target = identityOf(deepseek)
    expect(target.declared).toBeUndefined()
    expect(target.settingsPath).toEqual(['providers', 'deepseek'])
  })
})

describe('ProviderDirectorySection', () => {
  it('renders the preset groups and filters by search', () => {
    renderSection([])
    expect(screen.getByText('Domestic')).toBeTruthy()
    expect(screen.getByText('International')).toBeTruthy()
    expect(screen.getByText('Local')).toBeTruthy()
    expect(screen.getByText('硅基流动 (Silicon)')).toBeTruthy()
    expect(screen.getByText('Ollama')).toBeTruthy()
    const search = screen.getByLabelText('Search providers')
    fireEvent.change(search, { target: { value: 'deepseek' } })
    // The filtered list and the auto-selected right pane both name the match.
    expect(screen.getAllByText('深度求索 (DeepSeek)').length).toBeGreaterThan(0)
    expect(screen.queryByText('Ollama')).toBeNull()
  })

  it('auto-selects the first preset and renders its editor', () => {
    renderSection([])
    const zhipu = screen.getByRole('button', { name: '智谱开放平台 (ZhiPu)' })
    expect(zhipu.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('API key')).toBeTruthy()
  })

  it('selects a provider and renders its editor in the right pane', () => {
    renderSection([row('deepseek', '深度求索 (DeepSeek)', true)])
    const deepseekButton = screen.getByRole('button', { name: /深度求索/ })
    fireEvent.click(deepseekButton)
    expect(deepseekButton.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('API key')).toBeTruthy()
  })

  it('shows a configured status dot on configured presets', () => {
    renderSection([row('deepseek', '深度求索 (DeepSeek)', true, true)])
    const deepseekRow = screen.getByRole('button', { name: /深度求索/ })
    expect(within(deepseekRow).getByTitle('API key configured')).toBeTruthy()
  })
})
