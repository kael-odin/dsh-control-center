// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, within, cleanup, waitFor } from '@testing-library/react'
import { createSettingsSchemaOperations } from '../src/client/schema-operations.ts'
import {
  STASH_NS,
  buildDirectory,
  identityOf,
  ProviderDirectorySection,
} from '../src/client/ProviderDirectorySection.tsx'
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

function stashNamespace(providers: Record<string, unknown> = {}): SettingsNamespaceView {
  return {
    ns: STASH_NS, schema: {} as never, value: { providers }, user: { providers },
    base: {}, revision: 7, writable: true,
  } as unknown as SettingsNamespaceView
}

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
  let revision = 10
  const describe = vi.fn(async () => ({
    rpcId: 't',
    result: { ok: true as const, value: { writable: true, namespaces: [modelsNamespace, stashNamespace()] } },
  }))
  const mutate = vi.fn(async () => ({ rpcId: 't', result: { ok: true as const, value: { revision: ++revision, user: {} } } }))
  return {
    settings: { describe, mutate },
    credentials: {
      describe: vi.fn(async () => ({ rpcId: 't', result: { ok: true as const, value: { credentials: {} } } })),
      set: vi.fn(async () => ({ rpcId: 't', result: { ok: true as const, value: {} } })),
      unset: vi.fn(async () => ({ rpcId: 't', result: { ok: true as const, value: {} } })),
    },
    llm: { providers: vi.fn(), models: vi.fn(), discoverModels: vi.fn() },
  }
}

type ApiMock = ReturnType<typeof apiMock>

function t(key: keyof typeof en): string { return en[key] }

afterEach(() => { cleanup() })

function readyState(rows: readonly ProviderRow[], stashProviders: Record<string, unknown> = {}): ModelsSettingsState {
  // A configured row implies a stored profile at its settings path, which is
  // what the toggle reads when it stashes.
  const storedProfiles = Object.fromEntries(
    rows.filter(r => r.configured && r.entry.settingsPath.length > 0)
      .map(r => [r.entry.provider, { baseURL: 'https://stored.example', models: [{ id: 'm1' }] }]),
  )
  const ns: SettingsNamespaceView = {
    ns: 'llm-pi-ai', schema: { type: 'object' } as never,
    value: { providers: storedProfiles }, user: { providers: structuredClone(storedProfiles) },
    base: {}, revision: 0, writable: true,
  } as unknown as SettingsNamespaceView
  return {
    status: 'ready', error: null, credentialError: null, writable: true, rows,
    namespaces: new Map<string, SettingsNamespaceView>([
      ['llm-pi-ai', ns],
      [STASH_NS, stashNamespace(stashProviders)],
    ]),
  }
}

function renderSection(rows: readonly ProviderRow[], options?: { stash?: Record<string, unknown>; api?: ApiMock }) {
  const api = options?.api ?? apiMock()
  const snapshot = readyState(rows, options?.stash)
  const useSnapshot = (selector: (state: ModelsSettingsState) => unknown) => selector(snapshot)
  render(
    <ProviderDirectorySection
      controller={{ load: vi.fn(async () => {}) } as never}
      useSnapshot={useSnapshot as never}
      api={api as never}
      schema={schema}
      t={t}
    />,
  )
  return { api }
}

describe('buildDirectory', () => {
  it('lists all 61 Cherry presets plus non-preset host rows last', () => {
    const directory = buildDirectory([])
    expect(directory).toHaveLength(61)
    expect(directory.find(e => e.provider === 'silicon')).toMatchObject({ displayName: '硅基流动 (Silicon)' })
    const withCustom = buildDirectory([row('acme-gateway', 'Acme Gateway', true)])
    expect(withCustom).toHaveLength(62)
    const custom = withCustom.at(-1)!
    expect(custom.provider).toBe('acme-gateway')
    expect('preset' in custom).toBe(false)
  })

  it('joins a configured preset row onto its preset entry', () => {
    const directory = buildDirectory([row('deepseek', '深度求索 (DeepSeek)', true, true)])
    const deepseek = directory.find(e => e.provider === 'deepseek')
    expect(deepseek?.row?.configured).toBe(true)
    expect(deepseek?.row?.entry.active).toBe(true)
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
})

describe('ProviderDirectorySection list', () => {
  it('renders a flat catalog and filters by search', () => {
    renderSection([])
    expect(screen.getByText('硅基流动 (Silicon)')).toBeTruthy()
    expect(screen.getByText('Ollama')).toBeTruthy()
    const search = screen.getByLabelText('Search providers')
    fireEvent.change(search, { target: { value: 'deepseek' } })
    expect(screen.getAllByText('深度求索 (DeepSeek)').length).toBeGreaterThan(0)
    expect(screen.queryByText('Ollama')).toBeNull()
  })

  it('marks configured providers with an enabled dot and selected state', () => {
    renderSection([row('deepseek', '深度求索 (DeepSeek)', true, true)])
    const deepseekRow = screen.getByRole('button', { name: /深度求索/ })
    fireEvent.click(deepseekRow)
    expect(deepseekRow.getAttribute('aria-pressed')).toBe('true')
    expect(within(deepseekRow).getByLabelText('Active')).toBeTruthy()
    expect(screen.getByText('API key')).toBeTruthy()
  })
})

describe('ProviderDirectorySection enable switch', () => {
  it('disables a live provider through stash-then-unset', async () => {
    const api = apiMock()
    renderSection([row('deepseek', '深度求索 (DeepSeek)', true)], { api })
    fireEvent.click(screen.getByRole('button', { name: /深度求索/ }))
    const switchControl = screen.getByRole('switch')
    expect(switchControl.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(switchControl)
    await waitFor(() => {
      expect(api.settings.mutate).toHaveBeenCalledTimes(2)
    })
    const [first, second] = api.settings.mutate.mock.calls.map(call => call[0])
    // Stash first so a crash between the writes leaves both copies.
    expect(first).toMatchObject({
      ns: STASH_NS,
      ops: [{ op: 'set', path: ['providers', 'deepseek'] }],
    })
    expect(second).toMatchObject({
      ns: 'llm-pi-ai',
      expectedRevision: 11,
      ops: [{ op: 'unset', path: ['providers', 'deepseek'] }],
    })
  })

  it('re-enables a stashed provider by restoring its profile', async () => {
    const api = apiMock()
    renderSection([], { api, stash: { deepseek: { baseURL: 'https://x', models: [] } } })
    const siliconButton = screen.getByRole('button', { name: '深度求索 (DeepSeek)' })
    fireEvent.click(siliconButton)
    const switchControl = screen.getByRole('switch')
    expect(switchControl.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(switchControl)
    await waitFor(() => {
      expect(api.settings.mutate).toHaveBeenCalledTimes(2)
    })
    const [first, second] = api.settings.mutate.mock.calls.map(call => call[0])
    expect(first).toMatchObject({
      ns: 'llm-pi-ai',
      ops: [{ op: 'set', path: ['providers', 'deepseek'], value: { baseURL: 'https://x', models: [] } }],
    })
    expect(second).toMatchObject({
      ns: STASH_NS,
      ops: [{ op: 'unset', path: ['providers', 'deepseek'] }],
    })
  })

  it('keeps the switch unreachable for an unconfigured hand-declared preset', () => {
    renderSection([])
    fireEvent.click(screen.getByRole('button', { name: '硅基流动 (Silicon)' }))
    const switchControl = screen.getByRole('switch')
    expect(switchControl.getAttribute('aria-checked')).toBe('false')
    expect((switchControl as HTMLButtonElement).disabled).toBe(true)
    expect(switchControl.getAttribute('title')).toBe(en.enableNeedsProfile)
  })
})

describe('ProviderDirectorySection editor', () => {
  it('writes a fresh preset profile with the preset defaults on apply', async () => {
    const api = apiMock()
    const snapshot = readyState([])
    const useSnapshot = (selector: (state: ModelsSettingsState) => unknown) => selector(snapshot)
    render(
      <ProviderDirectorySection
        controller={{ load: vi.fn(async () => {}) } as never}
        useSnapshot={useSnapshot as never}
        api={api as never}
        schema={schema}
        t={t}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '硅基流动 (Silicon)' }))
    fireEvent.change(screen.getByLabelText('API key'), { target: { value: 'sk-test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => {
      expect(api.settings.mutate).toHaveBeenCalledWith({
        ns: 'llm-pi-ai',
        expectedRevision: expect.any(Number),
        ops: expect.arrayContaining([
          { op: 'set', path: ['providers', 'silicon', 'api'], value: 'openai-completions' },
          { op: 'set', path: ['providers', 'silicon', 'baseURL'], value: 'https://api.siliconflow.cn/v1' },
          { op: 'set', path: ['providers', 'silicon', 'apiKeyEnv'], value: 'SILICON_API_KEY' },
        ]),
      })
    })
    expect(api.credentials.set).toHaveBeenCalledWith({ ref: 'SILICON_API_KEY', value: 'sk-test' })
  })
})
