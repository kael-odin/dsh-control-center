/**
 * 添加 MCP 服务器 dialog — Cherry AddMcpServerModal + QuickCreate + Npx
 * 市场, mapped to our host: two tabs (手动创建 / Npx 市场), a 快速导入 box
 * that parses an npx line / JSON definition / URL into the form, and the
 * market search running host-side against the public npm registry
 * (controlCenterMcp.searchNpxRegistry).
 */
import { useState } from 'react'
import type { CreateMcpServerDto, McpNpxPackage } from '../mcp-types'
import { parseServerSpec, type ParsedServerSpec } from './mcp-import'
import css from './AddMcpServerDialog.module.css'

interface AddMcpServerDialogProps {
  visible: boolean
  onClose: () => void
  onSubmit: (dto: CreateMcpServerDto) => Promise<void>
  /** Host npx-market search; absent until the remote mounts. */
  searchNpx?: ((scope: string) => Promise<McpNpxPackage[]>) | undefined
}

export function AddMcpServerDialog({ visible, onClose, onSubmit, searchNpx }: AddMcpServerDialogProps) {
  const [tab, setTab] = useState<'manual' | 'market'>('manual')
  const [name, setName] = useState('')
  const [command, setCommand] = useState('')
  const [args, setArgs] = useState('')
  const [env, setEnv] = useState('')
  const [type, setType] = useState<'stdio' | 'sse' | 'streamableHttp'>('stdio')
  const [baseUrl, setBaseUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 快速导入
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [pasteError, setPasteError] = useState('')

  // Npx 市场
  const [scope, setScope] = useState('@modelcontextprotocol')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [results, setResults] = useState<McpNpxPackage[]>([])
  const [addedNames, setAddedNames] = useState<ReadonlySet<string>>(new Set())

  const resetForm = (): void => {
    setName('')
    setCommand('')
    setArgs('')
    setEnv('')
    setType('stdio')
    setBaseUrl('')
    setError('')
  }

  const applySpec = (spec: ParsedServerSpec): void => {
    if (spec.name !== undefined && name.trim().length === 0) setName(spec.name)
    if (spec.type !== undefined) setType(spec.type)
    if (spec.command !== undefined) setCommand(spec.command)
    else setCommand('')
    if (spec.args !== undefined && spec.args.length > 0) setArgs(JSON.stringify(spec.args))
    else setArgs('')
    if (spec.env !== undefined && Object.keys(spec.env).length > 0) setEnv(JSON.stringify(spec.env, null, 0))
    else setEnv('')
    if (spec.baseUrl !== undefined) setBaseUrl(spec.baseUrl)
    else setBaseUrl('')
  }

  const handleParse = (): void => {
    setPasteError('')
    const result = parseServerSpec(pasteText)
    if (!result.ok) {
      setPasteError(result.error)
      return
    }
    applySpec(result.spec)
    setPasteText('')
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('服务器名称不能为空')
      return
    }

    if (type === 'stdio' && !command.trim()) {
      setError('命令不能为空')
      return
    }

    if ((type === 'sse' || type === 'streamableHttp') && !baseUrl.trim()) {
      setError('Base URL 不能为空')
      return
    }

    try {
      setLoading(true)

      let parsedArgs: string[] = []
      if (args.trim()) {
        try {
          parsedArgs = JSON.parse(args)
          if (!Array.isArray(parsedArgs)) {
            setError('Args 必须是 JSON 数组')
            return
          }
        } catch {
          setError('Args JSON 格式错误')
          return
        }
      }

      let parsedEnv: Record<string, string> = {}
      if (env.trim()) {
        try {
          parsedEnv = JSON.parse(env)
          if (typeof parsedEnv !== 'object' || Array.isArray(parsedEnv)) {
            setError('Env 必须是 JSON 对象')
            return
          }
        } catch {
          setError('Env JSON 格式错误')
          return
        }
      }

      const dto: CreateMcpServerDto = {
        name: name.trim(),
        type,
        timeout: 30000,
        longRunning: false,
      }

      if (type === 'stdio') {
        if (command.trim()) dto.command = command.trim()
        if (parsedArgs.length > 0) dto.args = parsedArgs
        if (Object.keys(parsedEnv).length > 0) dto.env = parsedEnv
      } else {
        if (baseUrl.trim()) dto.baseUrl = baseUrl.trim()
      }

      await onSubmit(dto)

      resetForm()
      setPasteText('')
      setResults([])
      setAddedNames(new Set())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (): Promise<void> => {
    if (searchNpx === undefined || searching) return
    setSearching(true)
    setSearchError('')
    try {
      const found = await searchNpx(scope.trim())
      setResults(found)
      if (found.length === 0) setSearchError('该 scope 下没有找到包')
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : String(err))
    } finally {
      setSearching(false)
    }
  }

  const handleAddFromMarket = async (pkg: McpNpxPackage): Promise<void> => {
    setAddedNames(current => new Set([...current, pkg.fullName]))
    await onSubmit({
      name: pkg.name.length > 0 ? pkg.name : pkg.fullName,
      type: 'stdio',
      command: 'npx',
      args: ['-y', pkg.fullName],
      description: pkg.description,
      providerUrl: pkg.link,
      timeout: 30000,
      longRunning: false,
    })
  }

  if (!visible) return null

  return (
    <div className={css.overlay} onClick={onClose}>
      <div className={`${css.dialog} cc-surface`} onClick={(e) => e.stopPropagation()}>
        <div className={css.header}>
          <h2 className={css.title}>添加 MCP 服务器</h2>
          <button className={css.closeButton} onClick={onClose} type="button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={css.tabRow} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'manual'}
            className={`${css.tabButton} ${tab === 'manual' ? css.tabActive : ''}`}
            onClick={() => { setTab('manual') }}
          >
            手动创建
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'market'}
            className={`${css.tabButton} ${tab === 'market' ? css.tabActive : ''}`}
            onClick={() => { setTab('market') }}
          >
            Npx 市场
          </button>
        </div>

        {tab === 'manual' && (
          <form className={css.form} onSubmit={handleSubmit}>
            {error && <div className={css.error}>{error}</div>}

            <details className={css.quickImport} open={pasteOpen} onToggle={(e) => { setPasteOpen((e.target as HTMLDetailsElement).open) }}>
              <summary className={css.quickImportSummary}>快速导入 — 粘贴 npx 命令 / JSON 定义 / URL</summary>
              <textarea
                className={css.textarea}
                value={pasteText}
                onChange={(e) => { setPasteText(e.target.value) }}
                placeholder={'npx -y @modelcontextprotocol/server-filesystem\n或 {"command":"npx","args":["-y","@scope/pkg"]}\n或 https://example.com/mcp'}
                rows={4}
              />
              <div className={css.quickImportActions}>
                {pasteError !== '' && <span className={css.error}>{pasteError}</span>}
                <button type="button" className={css.cancelButton} onClick={handleParse}>解析并填充</button>
              </div>
            </details>

            <div className={css.field}>
              <label className={css.label}>服务器名称 *</label>
              <input
                type="text"
                className={css.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-mcp-server"
              />
            </div>

            <div className={css.field}>
              <label className={css.label}>传输类型</label>
              <select className={css.select} value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="stdio">stdio</option>
                <option value="sse">SSE</option>
                <option value="streamableHttp">Streamable HTTP</option>
              </select>
            </div>

            {type === 'stdio' ? (
              <>
                <div className={css.field}>
                  <label className={css.label}>命令 *</label>
                  <input
                    type="text"
                    className={css.input}
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="npx"
                  />
                </div>

                <div className={css.field}>
                  <label className={css.label}>参数（JSON 数组）</label>
                  <textarea
                    className={css.textarea}
                    value={args}
                    onChange={(e) => setArgs(e.target.value)}
                    placeholder='["-y", "@modelcontextprotocol/server-filesystem"]'
                    rows={3}
                  />
                </div>

                <div className={css.field}>
                  <label className={css.label}>环境变量（JSON 对象）</label>
                  <textarea
                    className={css.textarea}
                    value={env}
                    onChange={(e) => setEnv(e.target.value)}
                    placeholder='{"PATH": "/usr/local/bin"}'
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <div className={css.field}>
                <label className={css.label}>Base URL *</label>
                <input
                  type="text"
                  className={css.input}
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:3000"
                />
              </div>
            )}

            <div className={css.footer}>
              <button type="button" className={css.cancelButton} onClick={onClose}>
                取消
              </button>
              <button type="submit" className={css.submitButton} disabled={loading}>
                {loading ? '创建中...' : '创建'}
              </button>
            </div>
          </form>
        )}

        {tab === 'market' && (
          <div className={css.form}>
            {error && <div className={css.error}>{error}</div>}
            {searchError !== '' && <div className={css.error}>{searchError}</div>}
            <div className={css.field}>
              <label className={css.label}>npm scope</label>
              <div className={css.marketRow}>
                <input
                  type="text"
                  className={css.input}
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  placeholder="@modelcontextprotocol"
                />
                <button
                  type="button"
                  className={css.submitButton}
                  disabled={searching || searchNpx === undefined || scope.trim().length === 0}
                  title={searchNpx === undefined ? '远程服务未挂载' : undefined}
                  onClick={() => { void handleSearch() }}
                >
                  {searching ? '搜索中…' : '搜索'}
                </button>
              </div>
            </div>
            {results.length === 0
              ? <div className={css.marketEmpty}>{searchNpx === undefined ? '远程服务未挂载，无法搜索。' : '输入 scope 后搜索 npm 上的 MCP 服务器包。'}</div>
              : (
                <ul className={css.marketList}>
                  {results.map(pkg => (
                    <li key={pkg.fullName} className={css.marketItem}>
                      <div className={css.marketMain}>
                        <span className={css.marketName}>{pkg.fullName}</span>
                        {pkg.version !== '' && <span className={css.marketVersion}>v{pkg.version}</span>}
                        {pkg.description !== '' && <span className={css.marketDesc}>{pkg.description}</span>}
                      </div>
                      <button
                        type="button"
                        className={css.submitButton}
                        disabled={loading || addedNames.has(pkg.fullName)}
                        onClick={() => { void handleAddFromMarket(pkg) }}
                      >
                        {addedNames.has(pkg.fullName) ? '已添加' : '添加'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            <div className={css.footer}>
              <button type="button" className={css.cancelButton} onClick={onClose}>关闭</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
