import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { LocalCredentialProvider } from '@deepseek-ai/dsh-credentials-local'
import { FileSettingsProvider } from '@deepseek-ai/dsh-settings-file'
import { ProvidersService } from '../packages/control-center/src/providers.ts'
import type { CreateProviderDto } from '../packages/control-center/src/provider-types.ts'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('ProvidersService', () => {
  let ctx: Context
  let tmpDir: string
  let service: ProvidersService

  beforeEach(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'dsh-cc-providers-test-'))
    ctx = new Context()
    const settingsFiber = ctx.plugin(FileSettingsProvider, { path: join(tmpDir, 'settings.yaml') })
    ctx.plugin(LocalCredentialProvider, { projectEnvPath: join(tmpDir, '.env') })
    await settingsFiber
    service = new ProvidersService(ctx)
  })

  afterEach(() => {
    if (service[Symbol.dispose]) service[Symbol.dispose]()
    if (ctx[Symbol.dispose]) ctx[Symbol.dispose]()
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
    const provider = await service.create({ dto })
    expect(provider.id).toBe('openai-test')
    expect(provider.name).toBe('OpenAI Test')
    expect(provider.type).toBe('openai')
    expect(provider.hasApiKey).toBe(true)
  })

  it('gets provider by ID', async () => {
    await service.create({
      dto: { name: 'Test Provider', type: 'openai', baseURL: 'https://api.test.com', apiKey: 'key-test' }
    })
    const provider = await service.getById({ providerId: 'test-provider' })
    expect(provider).not.toBeNull()
    expect(provider?.name).toBe('Test Provider')
  })

  it('deletes provider', async () => {
    await service.create({
      dto: { name: 'To Delete', type: 'openai', baseURL: 'https://api.delete.com', apiKey: 'delete-key' }
    })
    // Small delay to ensure file operations complete on Windows
    await new Promise(resolve => setTimeout(resolve, 50))
    await service.delete({ providerId: 'to-delete' })
    const providers = await service.list()
    expect(providers).toHaveLength(0)
  })

  it('updates model enabled state', async () => {
    // Create provider with models
    const provider = await service.create({
      dto: { name: 'Test Provider', type: 'openai', baseURL: 'https://api.test.com', apiKey: 'test-key' }
    })

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
    const updated = await service.updateModel({
      providerId: provider.id,
      modelId: 'gpt-4',
      dto: { enabled: false }
    })

    expect(updated.id).toBe('gpt-4')
    expect(updated.enabled).toBe(false)

    // Verify via getById
    const refreshed = await service.getById({ providerId: provider.id })
    const model = refreshed?.models.find(m => m.id === 'gpt-4')
    expect(model?.enabled).toBe(false)
  })
})
