/**
 * Local Models settings section: register local model servers (Ollama,
 * llama.cpp, OpenAI-compatible), discover their models, and adopt them
 * into the provider catalog.
 */

import { useCallback, useEffect, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { LocalModelServer, LocalModelEntry } from '../local-models-types.ts'
import css from './UsageSection.module.css'

export interface LocalModelsSectionInjected {
  getLocalModels: () => NonNullable<ClientRemote['controlCenterLocalModels']>
  hooks: { localModelsReady: HostObservable<boolean> }
}

export type LocalModelsSectionProps = PropsRuntime<'settings.section'> & InjectFace<LocalModelsSectionInjected>

function unwrap<T>(result: { ok: true; value: T } | { ok: false; error: { code: string; message: string; details: object } }): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

const KIND_LABELS: Record<LocalModelServer['kind'], string> = {
  ollama: 'Ollama',
  llamacpp: 'llama.cpp',
  'openai-compatible': 'OpenAI 兼容',
}

export function LocalModelsSection({ getLocalModels, useLocalModelsReady }: LocalModelsSectionProps) {
  const ready = useLocalModelsReady(value => value)
  const service = ready ? getLocalModels() : undefined
  const [servers, setServers] = useState<LocalModelServer[]>([])
  const [name, setName] = useState('')
  const [kind, setKind] = useState<LocalModelServer['kind']>('ollama')
  const [baseUrl, setBaseUrl] = useState('')
  const [models, setModels] = useState<Record<string, LocalModelEntry[]>>({})
  const [discovering, setDiscovering] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback((): void => {
    if (service === undefined) return
    void service.listServers().then(result => {
      setServers(unwrap(result))
    }).catch(reason => setError(reason instanceof Error ? reason.message : String(reason)))
  }, [service])

  useEffect(() => {
    refresh()
  }, [refresh, service !== undefined]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async (): Promise<void> => {
    if (service === undefined || name.trim() === '') return
    setError(null)
    try {
      const result = unwrap(await service.addServer({ name: name.trim(), kind, ...(baseUrl.trim() ? { baseUrl: baseUrl.trim() } : {}) }))
      setName('')
      setBaseUrl('')
      setServers(prev => [...prev, result])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleDiscover = async (serverId: string): Promise<void> => {
    if (service === undefined) return
    setDiscovering(serverId)
    setError(null)
    try {
      const found = unwrap(await service.discoverModels(serverId))
      setModels(prev => ({ ...prev, [serverId]: found }))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setDiscovering(null)
    }
  }

  const handleRemove = async (serverId: string, serverName: string): Promise<void> => {
    if (service === undefined) return
    if (!window.confirm(`移除本地模型服务器 "${serverName}" 吗？`)) return
    try {
      unwrap(await service.removeServer(serverId))
      setServers(prev => prev.filter(server => server.id !== serverId))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className={css.root}>
      <div>
        <h2 className={css.pageTitle}>本地模型</h2>
        <p className={css.pageDescription}>管理本地推理服务器（Ollama、llama.cpp 等），发现模型后可添加到提供商目录</p>
      </div>

      {error !== null && <div className="cc-notice-error">{error}</div>}

      <div className="cc-card">
        <div className="cc-card-title">添加本地服务器</div>
        <div className="cc-field-row">
          <div className="cc-field-label">名称</div>
          <input className="cc-input" value={name} placeholder="例如：本机 Ollama" onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="cc-field-row">
          <div className="cc-field-label">类型</div>
          <select className="cc-select" value={kind} onChange={(e) => setKind(e.target.value as LocalModelServer['kind'])}>
            <option value="ollama">Ollama</option>
            <option value="llamacpp">llama.cpp</option>
            <option value="openai-compatible">OpenAI 兼容</option>
          </select>
        </div>
        <div className="cc-field-row">
          <div className="cc-field-label">
            Base URL
            <div className="cc-field-hint">留空使用默认值（Ollama: http://127.0.0.1:11434/v1）</div>
          </div>
          <input className="cc-input" value={baseUrl} placeholder="http://127.0.0.1:11434/v1" onChange={(e) => setBaseUrl(e.target.value)} />
        </div>
        <div>
          <button type="button" className="cc-btn cc-btn-primary" onClick={() => void handleAdd()}>
            添加服务器
          </button>
        </div>
      </div>

      {servers.map(server => (
        <div key={server.id} className="cc-card">
          <div className="cc-card-title">
            {server.name} <span className="cc-badge-disabled">{KIND_LABELS[server.kind]}</span>
          </div>
          <p className="cc-card-description">{server.baseUrl}</p>
          <div className="cc-field-row">
            <div>
              <button type="button" className="cc-btn cc-btn-secondary" disabled={discovering === server.id} onClick={() => void handleDiscover(server.id)}>
                {discovering === server.id ? '发现中…' : '发现模型'}
              </button>
            </div>
            <button type="button" className="cc-btn cc-btn-danger" onClick={() => void handleRemove(server.id, server.name)}>
              移除
            </button>
          </div>
          {models[server.id] !== undefined && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {models[server.id]!.length === 0
                ? <span className="cc-card-description">未发现模型（服务器可能未运行）</span>
                : models[server.id]!.map(model => (
                    <span key={model.id} style={{ fontSize: 13, color: 'var(--foreground)', fontFamily: 'var(--ds-font-family-code), monospace' }}>
                      {model.name}
                    </span>
                  ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
