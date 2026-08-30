import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { LocalCredentialProvider } from '@deepseek-ai/dsh-credentials-local'
import { FileSettingsProvider } from '@deepseek-ai/dsh-settings-file'
import { ProvidersService } from '../packages/control-center/src/providers.ts'
import type { CreateProviderDto } from '../packages/control-center/src/provider-types.ts'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Each test boots a full cordis Context with file-backed settings and
// credentials providers; on Windows that setup alone approaches vitest's
// default 5s limit, so the suite gets an explicit budget.
describe('ProvidersService', { timeout: 60_000 }, () => {
  let ctx: Context
  let tmpDir: string
  let service: ProvidersService

  beforeEach(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'dsh-cc-providers-test-'))
    // Isolate the user-level credentials file from the real DSH home so the
    // atomic-write rename cannot collide with a running server's handle.
    process.env.DSH_HOME = tmpDir
    ctx = new Context()
    const settingsFiber = ctx.plugin(FileSettingsProvider, { path: join(tmpDir, 'settings.yaml') })
    const credentialsFiber = ctx.plugin(LocalCredentialProvider, { projectEnvPath: join(tmpDir, '.env') })
    await Promise.all([settingsFiber, credentialsFiber])
    service = new ProvidersService(ctx)
  })

  afterEach(() => {
    if (service[Symbol.dispose]) service[Symbol.dispose]()
    if (ctx[Symbol.dispose]) ctx[Symbol.dispose]()
    delete process.env.DSH_HOME
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('lists providers (initially empty)', async () => {
    const providers = await service.list()
    expect(providers).toEqual([])
  })

  it('creates a provider', async () => {
    const dto: CreateProviderDto = {
      name: 'OpenAI Test',
      type: 'openai',
      baseURL: 'https://api.openai.com',
      apiKey: 'sk-test-key-123',
      enabled: true
    }
    const provider = await service.create(dto)
    expect(provider.id).toBe('openai-test')
    expect(provider.name).toBe('OpenAI Test')
    expect(provider.type).toBe('openai')
    expect(provider.hasApiKey).toBe(true)
  })

  it('gets provider by ID', async () => {
    await service.create({ name: 'Test Provider', type: 'openai', baseURL: 'https://api.test.com', apiKey: 'key-test' })
    const provider = await service.getById('test-provider')
    expect(provider).not.toBeNull()
    expect(provider?.name).toBe('Test Provider')
  })

  it('deletes provider', async () => {
    await service.create({ name: 'To Delete', type: 'openai', baseURL: 'https://api.delete.com', apiKey: 'delete-key' })
    // Small delay to ensure file operations complete on Windows
    await new Promise(resolve => setTimeout(resolve, 50))
    await service.delete('to-delete')
    const providers = await service.list()
    expect(providers).toHaveLength(0)
  })

  it('updates model enabled state', async () => {
    // Create provider with models
    const provider = await service.create({ name: 'Test Provider', type: 'openai', baseURL: 'https://api.test.com', apiKey: 'test-key' })

    // Add some models to the provider via direct settings update (simulating discovery)
    const settings = service['scope'].get()
    const providerIndex = settings.providers.findIndex(p => p.id === provider.id)
    if (providerIndex !== -1) {
      const updatedProviders = [...settings.providers]
      updatedProviders[providerIndex] = {
        ...updatedProviders[providerIndex]!,
        models: [
          { id: 'gpt-4', name: 'GPT-4', enabled: true },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', enabled: true }
        ]
      }
      await ctx.settings.update('control-center-providers', { providers: updatedProviders })
    }

    // Update model enabled state
    const updated = await service.updateModel(provider.id, 'gpt-4', { enabled: false })

    expect(updated.id).toBe('gpt-4')
    expect(updated.enabled).toBe(false)

    // Verify via getById
    const refreshed = await service.getById(provider.id)
    const model = refreshed?.models.find(m => m.id === 'gpt-4')
    expect(model?.enabled).toBe(false)
  })
})
