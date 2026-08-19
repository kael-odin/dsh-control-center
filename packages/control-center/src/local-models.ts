/**
 * Local Models Host service: manage local model servers (Ollama,
 * llama.cpp, any OpenAI-compatible localhost endpoint) and discover their
 * models. Configuration persists in the control-center-local-models
 * namespace; models can be adopted into the provider catalog with one click.
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { settingsNamespace, type SettingsScope } from '@deepseek-ai/dsh-settings'
import Schema from '@deepseek-ai/schemastery'

const LOCAL_MODELS_NAMESPACE = settingsNamespace('control-center-local-models')

export interface LocalModelServer {
  id: string
  name: string
  /** Base URL, e.g. http://127.0.0.1:11434/v1 (Ollama) */
  baseUrl: string
  kind: 'ollama' | 'llamacpp' | 'openai-compatible'
  addedAt: string
}

export interface LocalModelEntry {
  id: string
  name: string
}

interface LocalModelsSettings {
  servers: LocalModelServer[]
}

const KIND_DEFAULTS: Record<LocalModelServer['kind'], string> = {
  ollama: 'http://127.0.0.1:11434/v1',
  llamacpp: 'http://127.0.0.1:8080/v1',
  'openai-compatible': 'http://127.0.0.1:8000/v1',
}

export class LocalModelsService extends Service {
  static inject = ['settings'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterLocalModels')
  private scope: SettingsScope<LocalModelsSettings>

  constructor(ctx: Context, _config?: { logger?: Context['logger'] }) {
    super(ctx, 'controlCenterLocalModels')
    this.scope = ctx.settings.register(LOCAL_MODELS_NAMESPACE, Schema.object({
      servers: Schema.array(Schema.object({
        id: Schema.string(),
        name: Schema.string(),
        baseUrl: Schema.string(),
        kind: Schema.union(['ollama', 'llamacpp', 'openai-compatible'] as const),
        addedAt: Schema.string()
      })).default([])
    }), {
      base: { servers: [] }
    })
  }

  async listServers(): Promise<LocalModelServer[]> {
    return this.scope.get().servers
  }

  async addServer(input: { name: string; kind: LocalModelServer['kind']; baseUrl?: string }): Promise<LocalModelServer> {
    const server: LocalModelServer = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: input.name,
      kind: input.kind,
      baseUrl: (input.baseUrl ?? KIND_DEFAULTS[input.kind]).replace(/\/+$/, ''),
      addedAt: new Date().toISOString(),
    }
    await this.scope.update({ servers: [...this.scope.get().servers, server] })
    this.ctx.logger.info('Registered local model server', { id: server.id, kind: server.kind, baseUrl: server.baseUrl })
    return server
  }

  async removeServer(serverId: string): Promise<{ absent: true }> {
    const servers = this.scope.get().servers
    const next = servers.filter(server => server.id !== serverId)
    if (next.length === servers.length) return { absent: true }
    await this.scope.update({ servers: next })
    return { absent: true }
  }

  /** Probe a local server: GET {baseUrl}/models, return reachable models. */
  async discoverModels(serverId: string): Promise<LocalModelEntry[]> {
    const server = this.scope.get().servers.find(candidate => candidate.id === serverId)
    if (server === undefined) throw new Error(`Local model server not found: ${serverId}`)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    try {
      const response = await fetch(`${server.baseUrl}/models`, { signal: controller.signal })
      if (!response.ok) throw new Error(`HTTP ${response.status} from ${server.baseUrl}/models`)
      const payload = await response.json() as { data?: Array<{ id?: string }> } | { models?: Array<{ name?: string }> }
      const data = 'data' in payload && Array.isArray(payload.data)
        ? payload.data.map(model => ({ id: model.id ?? 'unknown', name: model.id ?? 'unknown' }))
        : 'models' in payload && Array.isArray(payload.models)
          ? payload.models.map(model => ({ id: model.name ?? 'unknown', name: model.name ?? 'unknown' }))
          : []
      return data
    } finally {
      clearTimeout(timer)
    }
  }

  [Symbol.dispose]() {
    // Settings scope owns its lifecycle.
  }
}
