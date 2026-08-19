import { useState } from 'react'
import type { CreateMcpServerDto } from '../mcp-types'
import css from './AddMcpServerDialog.module.css'

interface AddMcpServerDialogProps {
  visible: boolean
  onClose: () => void
  onSubmit: (dto: CreateMcpServerDto) => Promise<void>
}

export function AddMcpServerDialog({ visible, onClose, onSubmit }: AddMcpServerDialogProps) {
  const [name, setName] = useState('')
  const [command, setCommand] = useState('')
  const [args, setArgs] = useState('')
  const [env, setEnv] = useState('')
  const [type, setType] = useState<'stdio' | 'sse' | 'streamableHttp'>('stdio')
  const [baseUrl, setBaseUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Only add optional fields if they have values
      if (type === 'stdio') {
        if (command.trim()) dto.command = command.trim()
        if (parsedArgs.length > 0) dto.args = parsedArgs
        if (Object.keys(parsedEnv).length > 0) dto.env = parsedEnv
      } else {
        if (baseUrl.trim()) dto.baseUrl = baseUrl.trim()
      }

      await onSubmit(dto)

      // Reset form
      setName('')
      setCommand('')
      setArgs('')
      setEnv('')
      setType('stdio')
      setBaseUrl('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setLoading(false)
    }
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

        <form className={css.form} onSubmit={handleSubmit}>
          {error && <div className={css.error}>{error}</div>}

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
      </div>
    </div>
  )
}

