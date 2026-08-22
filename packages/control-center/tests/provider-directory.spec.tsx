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
import { modelGroupName } from '../src/client/ModelListEditor.tsx'
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
  hasPath: (value: unknown, path: readonly string[]) => {
    let current: unknown = value
    for (const key of path) {
      if (typeof current !== 'object' || current === null || !(key in current as Record<string, unknown>)) return false
      current = (current as Record<string, unknown>)[key]
    }
    return true
  },
  // Immutable, like the host seam: an in-place mutation would hand React the
  // same object reference and silently skip the re-render.
  setPath: (root: Record<string, unknown>, path: readonly string[], value: unknown) => {
    const clone = structuredClone(root)
    let current = clone
    for (const key of path.slice(0, -1)) current = (current[key] ??= {}) as Record<string, unknown>
    current[path[path.length - 1]!] = value
    return clone
  },
  deletePath: (root: Record<string, unknown>, path: readonly string[]) => {
    const clone = structuredClone(root)
    let current = clone
    for (const key of path.slice(0, -1)) current = (current[key] ??= {}) as Record<string, unknown>
    delete current[path[path.length - 1]!]
    return clone
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
    llm: {
      providers: vi.fn(),
      models: vi.fn(async () => ({ rpcId: 't', result: { ok: true as const, value: { groups: [], failures: [] } } })),
      discoverModels: vi.fn(),
    },
  }
}

type ApiMock = ReturnType<typeof apiMock>

function t(key: keyof typeof en): string { return en[key] }

afterEach(() => { cleanup() })

function readyState(
  rows: readonly ProviderRow[],
  stashProviders: Record<string, unknown> = {},
  defaultModel?: { provider: string; model: string },
): ModelsSettingsState {
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
  const defaultsNs: SettingsNamespaceView | undefined = defaultModel === undefined ? undefined : {
    ns: 'agent-default-model', schema: {} as never,
    value: { ...defaultModel }, user: { ...defaultModel },
    base: {}, revision: 3, writable: true,
  } as unknown as SettingsNamespaceView
  return {
    status: 'ready', error: null, credentialError: null, writable: true, rows,
    namespaces: new Map<string, SettingsNamespaceView>([
      ['llm-pi-ai', ns],
      [STASH_NS, stashNamespace(stashProviders)],
      ...(defaultsNs === undefined ? [] : [['agent-default-model', defaultsNs] as const]),
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
      getCheck={() => undefined}
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
    const deepseekRow = screen
      .getAllByRole('button', { name: /深度求索/ })
      .find(element => element.getAttribute('aria-pressed') !== null)!
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
    const deepseekRow = screen
      .getAllByRole('button', { name: /深度求索/ })
      .find(element => element.getAttribute('aria-pressed') !== null)!
    fireEvent.click(deepseekRow)
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

describe('modelGroupName', () => {
  it('follows Cherry’s derivation rule', () => {
    expect(modelGroupName('openai/gpt-4o')).toBe('openai')
    expect(modelGroupName('deepseek-v4-pro')).toBe('deepseek')
    expect(modelGroupName('glm-5.5')).toBe('glm')
    expect(modelGroupName('glm')).toBeUndefined()
    expect(modelGroupName('accounts/fireworks/models/k2')).toBe('accounts')
  })
})

describe('ProviderDirectorySection kebab menu', () => {
  it('deletes a configured provider: credential, profile, then stash', async () => {
    const api = apiMock()
    renderSection([row('deepseek', '深度求索 (DeepSeek)', true)], { api, stash: { deepseek: { baseURL: 'x' } } })
    // Open the row's kebab menu (the button whose label names the edit action).
    const kebab = screen.getAllByRole('button', { name: /Edit 深度求索|编辑 深度求索/ })[0]!
    fireEvent.click(kebab)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    // Confirm in the dialog.
    const dialog = within(screen.getByRole('dialog'))
    fireEvent.click(dialog.getAllByRole('button', { name: /Delete 深度求索/ })[0])
    await waitFor(() => {
      expect(api.credentials.unset).toHaveBeenCalledWith({ ref: 'DEEPSEEK_API_KEY' })
      expect(api.settings.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ ns: 'llm-pi-ai', ops: [{ op: 'unset', path: ['providers', 'deepseek'] }] }),
      )
      expect(api.settings.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ ns: STASH_NS, ops: [{ op: 'unset', path: ['providers', 'deepseek'] }] }),
      )
    })
  })

  it('offers no delete for a never-configured preset', () => {
    renderSection([])
    const siliconRow = screen.getAllByText('硅基流动 (Silicon)')[0]!.closest('[aria-pressed]')!
    const kebab = within(siliconRow as HTMLElement).getByRole('button')
    fireEvent.click(kebab)
    const deleteItem = screen.getByRole('menuitem', { name: 'Delete' }) as HTMLButtonElement
    expect(deleteItem.disabled).toBe(true)
  })
})

describe('provider drag ordering', () => {
  it('persists a drag reorder and sorts the list by it', () => {
    localStorage.setItem('settings.provider.order', JSON.stringify(['silicon']))
    renderSection([])
    // silicon currently first via saved order; drag zhipu (catalog-first) onto it.
    const zhipuRow = screen
      .getAllByRole('button', { name: /智谱开放平台/ })
      .find(element => element.getAttribute('aria-pressed') !== null)!
    const siliconRow = screen
      .getAllByRole('button', { name: /硅基流动/ })
      .find(element => element.getAttribute('aria-pressed') !== null)!
    fireEvent.dragStart(zhipuRow)
    fireEvent.dragOver(siliconRow)
    fireEvent.drop(siliconRow)
    fireEvent.dragEnd(siliconRow)
    const order = JSON.parse(localStorage.getItem('settings.provider.order') ?? '[]') as string[]
    expect(order[0]).toBe('zhipu')
    expect(order[1]).toBe('silicon')
    // The saved order now leads the rendered list.
    const names = screen.getAllByRole('button', { name: /智谱开放平台|硅基流动/ })
      .filter(element => element.getAttribute('aria-pressed') !== null)
    expect(names[0]?.textContent).toContain('智谱开放平台')
    localStorage.removeItem('settings.provider.order')
  })
})

describe('RequestOptionsPanel', () => {
  it('saves custom headers as a profile headers dict', async () => {
    const api = apiMock()
    renderSection([row('deepseek', '深度求索 (DeepSeek)', true)], { api })
    const deepseekRow = screen
      .getAllByRole('button', { name: /深度求索/ })
      .find(element => element.getAttribute('aria-pressed') !== null)!
    fireEvent.click(deepseekRow)
    fireEvent.click(screen.getAllByRole('button', { name: 'Request options' })[0]!)
    const dialog = within(screen.getByRole('dialog'))
    fireEvent.click(dialog.getByRole('button', { name: 'Add header' }))
    fireEvent.change(dialog.getByLabelText('Header name 1'), { target: { value: 'X-Test' } })
    fireEvent.change(dialog.getByLabelText('Value 1'), { target: { value: 'v1' } })
    fireEvent.click(dialog.getByRole('button', { name: 'Apply' }))
    await waitFor(() => {
      expect(api.settings.mutate).toHaveBeenCalledWith({
        ns: 'llm-pi-ai',
        expectedRevision: 0,
        ops: [{ op: 'set', path: ['providers', 'deepseek', 'headers'], value: { 'X-Test': 'v1' } }],
      })
    })
  })
})

describe('ModelHealthDialog', () => {
  it('checks each model through the host and reports latency or failure', async () => {
    const calls: string[] = []
    const check = vi.fn(async (provider: string, model: string) => {
      calls.push(model)
      return model === 'bad'
        ? { ok: true as const, value: { ok: false, error: 'auth refused' } }
        : { ok: true as const, value: { ok: true, latencyMs: 42, reply: 'OK' } }
    })
    // Render the section for its locale/t context is overkill; mount the dialog directly.
    const { ModelHealthDialog } = await import('../src/client/ModelHealthDialog.tsx')
    render(
      <ModelHealthDialog
        open
        provider="deepseek"
        models={['good', 'bad']}
        getCheck={() => ({ check })}
        t={t}
        onClose={() => {}}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Check all' }))
    await waitFor(() => {
      expect(calls).toEqual(['good', 'bad'])
    })
    expect(await screen.findByText('42 ms')).toBeTruthy()
    expect(screen.getByText('auth refused')).toBeTruthy()
  })

  it('reports a missing remote as a failure instead of hanging', async () => {
    const { ModelHealthDialog } = await import('../src/client/ModelHealthDialog.tsx')
    render(
      <ModelHealthDialog open provider="p" models={['m1']} getCheck={() => undefined} t={t} onClose={() => {}} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Check all' }))
    expect(await screen.findByText(/failed/i)).toBeTruthy()
  })
})

describe('ProviderDirectorySection eye toggle', () => {
  it('merges the served catalog: re-enable appends, disable removes, apply persists', async () => {
    const api = apiMock()
    api.llm.models.mockImplementation(async () => ({
      rpcId: 't',
      result: {
        ok: true as const,
        value: {
          groups: [{ id: 'deepseek', name: 'DeepSeek', models: [{ id: 'm1', name: 'M1' }, { id: 'm2', name: 'M2' }] }],
          failures: [],
        },
      },
    }))
    renderSection([row('deepseek', '深度求索 (DeepSeek)', true)], { api })
    const deepseekRow = screen
      .getAllByRole('button', { name: /深度求索/ })
      .find(element => element.getAttribute('aria-pressed') !== null)!
    fireEvent.click(deepseekRow)
    // m2 is in the route catalog but not in the profile array → disabled row.
    const enableM2 = await screen.findByRole('button', { name: 'Re-enable this model m2' })
    fireEvent.click(enableM2)
    // It joins the draft as an editable second row.
    const secondRow = await screen.findByLabelText('Model ID 2') as HTMLInputElement
    expect(secondRow.value).toBe('m2')
    // Eye-off on m1 removes it from the draft; m2 shifts to row 1.
    fireEvent.click(screen.getByRole('button', { name: 'Stop serving this model 1' }))
    const firstRow = screen.getByLabelText('Model ID 1') as HTMLInputElement
    expect(firstRow.value).toBe('m2')
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => {
      expect(api.settings.mutate).toHaveBeenCalledWith(expect.objectContaining({
        ns: 'llm-pi-ai',
        ops: expect.arrayContaining([
          { op: 'set', path: ['providers', 'deepseek', 'models'], value: [{ id: 'm2', name: 'M2' }] },
        ]),
      }))
    })
  })
})

describe('ProviderDirectorySection default marker', () => {
  it('shows the brush on the default row and writes agent-default-model on click', async () => {
    const api = apiMock()
    const snapshot = readyState(
      [row('deepseek', '深度求索 (DeepSeek)', true)],
      {},
      { provider: 'deepseek', model: 'm1' },
    )
    const useSnapshot = (selector: (state: ModelsSettingsState) => unknown) => selector(snapshot)
    render(
      <ProviderDirectorySection
        controller={{ load: vi.fn(async () => {}) } as never}
        useSnapshot={useSnapshot as never}
        api={api as never}
        schema={schema}
        t={t}
        getCheck={() => undefined}
      />,
    )
    const deepseekRow = screen
      .getAllByRole('button', { name: /深度求索/ })
      .find(element => element.getAttribute('aria-pressed') !== null)!
    fireEvent.click(deepseekRow)
    const brush = screen.getByRole('button', { name: /Set as default model 1/ })
    expect(brush.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(brush)
    await waitFor(() => {
      expect(api.settings.mutate).toHaveBeenCalledWith({
        ns: 'agent-default-model',
        expectedRevision: 3,
        ops: [
          { op: 'set', path: ['provider'], value: 'deepseek' },
          { op: 'set', path: ['model'], value: 'm1' },
          { op: 'unset', path: ['reasoningEffort'] },
        ],
      })
    })
    expect(await screen.findByText(/Default model set/)).toBeTruthy()
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
        getCheck={() => undefined}
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
