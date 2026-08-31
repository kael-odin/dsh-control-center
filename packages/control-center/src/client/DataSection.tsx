/**
 * 数据 (Data management) section — Cherry DataSettings parity.
 *
 * 重新设计为 Cherry 风格的子菜单结构：
 * - 左侧菜单列表（13 项，4 个分隔组）
 * - 右侧面板渲染对应子工具
 *
 * 已实现的面板：基础数据（备份/恢复/导出/导入/清除）、本地目录备份、Markdown 导出
 * 其余面板如实标注能力状态。
 */

import { useCallback, useEffect, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { DataExport, WebDavVendor } from '../data-types.ts'
import { parseVendorConversations, renderArchiveMarkdown } from './vendor-import.ts'
import {
  SettingDivider, SettingGroup, SettingRow, SettingRowTitle, SettingsPageShell, SettingSwitch, SettingTitle,
} from './SettingsPages.tsx'
import css from './DataSection.module.css'

export interface DataSectionInjected {
  getData: () => NonNullable<ClientRemote['controlCenterData']>
  getExport: () => NonNullable<ClientRemote['controlCenterExport']>
  getDesktop: () => NonNullable<ClientRemote['controlCenterDesktop']>
  getSystem?: (() => NonNullable<ClientRemote['controlCenterSystem']>) | undefined
  hooks: { dataReady: HostObservable<boolean>; exportReady: HostObservable<boolean>; desktopReady: HostObservable<boolean>; systemReady: HostObservable<boolean> }
}

export type DataSectionProps = PropsRuntime<'settings.section'> & InjectFace<DataSectionInjected>

/** Menu item definition matching Cherry's DataSettings.tsx sub-menu structure. */
interface MenuItem {
  key: string
  label: string
  divider?: string | undefined
}

const MENU_ITEMS: readonly MenuItem[] = [
  { key: 'data', label: '基本数据' },
  { key: 'divider_1', label: '', divider: '云存储' },
  { key: 'local_backup', label: '本地备份' },
  { key: 'webdav', label: 'WebDAV' },
  { key: 'nutstore', label: '坚果云' },
  { key: 's3', label: 'S3 兼容存储' },
  { key: 'divider_2', label: '', divider: '导入设置' },
  { key: 'import_settings', label: '导入' },
  { key: 'divider_3', label: '', divider: '导出设置' },
  { key: 'markdown_export', label: 'Markdown 导出' },
  { key: 'divider_note_export', label: '', divider: '笔记导出' },
  { key: 'notion', label: 'Notion' },
  { key: 'yuque', label: '语雀' },
  { key: 'joplin', label: 'Joplin' },
  { key: 'obsidian', label: 'Obsidian' },
  { key: 'siyuan', label: '思源笔记' },
]

function snapshotName(): string {
  return `dsh-control-center-${new Date().toISOString().slice(0, 10)}.json`
}

function textToBase64(text: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(text)))
}

function base64ToText(base64: string): string {
  return new TextDecoder().decode(Uint8Array.from(atob(base64), character => character.charCodeAt(0)))
}

export function DataSection({ getData, getExport, getDesktop, getSystem, useDataReady, useExportReady, useDesktopReady, useSystemReady }: DataSectionProps) {
  const dataReady = useDataReady(value => value)
  const exportReady = useExportReady(value => value)
  const desktopReady = useDesktopReady(value => value)
  const systemReady = useSystemReady(value => value)
  const data = dataReady ? getData() : undefined
  const exportMatrix = exportReady ? getExport() : undefined
  const desktop = desktopReady ? getDesktop() : undefined
  const [dshHome, setDshHome] = useState<string | null>(null)
  useEffect(() => {
    if (!systemReady || getSystem === undefined) return
    void getSystem().getInfo().then(result => {
      if (result.ok) setDshHome(result.value.dshHome)
    }).catch(() => { /* data path row degrades to absent */ })
  }, [systemReady, getSystem])
  const [activeMenu, setActiveMenu] = useState('data')
  /** 坚果云 shares the WebDAV implementation over an isolated config namespace. */
  const activeVendor: WebDavVendor = activeMenu === 'nutstore' ? 'nutstore' : 'webdav'
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const report = (message: string): void => { setStatus(message); setError(null) }
  const fail = (err: unknown): void => {
    setError(err instanceof Error ? err.message : String(err))
    setStatus(null)
  }

  const importSnapshot = useCallback(async (snapshot: DataExport): Promise<void> => {
    setStatus('导入中…')
    const result = await data!.importControlCenter(snapshot)
    if (!result.ok) throw new Error(result.error.message)
    report('已导入，相关设置已恢复')
  }, [data])

  const handleBackupToFile = useCallback(async (): Promise<void> => {
    if (data === undefined || desktop === undefined) return
    setError(null)
    setStatus('选择保存位置…')
    try {
      const picked = await desktop.pickSaveFile(snapshotName())
      if (!picked.ok) throw new Error(picked.error.message)
      if (picked.value.canceled === true || picked.value.filePath === undefined) { setStatus(null); return }
      const snapshot = await data.exportControlCenter()
      if (!snapshot.ok) throw new Error(snapshot.error.message)
      const written = await desktop.writeFile(picked.value.filePath, textToBase64(JSON.stringify(snapshot.value, null, 2)))
      if (!written.ok) throw new Error(written.error.message)
      report(`已备份到 ${picked.value.filePath}`)
    } catch (err) { fail(err) }
  }, [data, desktop])

  const handleRestoreFromFile = useCallback(async (): Promise<void> => {
    if (data === undefined || desktop === undefined) return
    setError(null)
    setStatus('选择备份文件…')
    try {
      const picked = await desktop.pickFile(['openFile'])
      if (!picked.ok) throw new Error(picked.error.message)
      const path = picked.value.filePaths?.[0]
      if (picked.value.canceled === true || path === undefined) { setStatus(null); return }
      const read = await desktop.readFile(path)
      if (!read.ok) throw new Error(read.error.message)
      await importSnapshot(JSON.parse(base64ToText(read.value.contentBase64 ?? '')) as DataExport)
    } catch (err) { fail(err) }
  }, [data, desktop, importSnapshot])

  const handleExport = useCallback(async (): Promise<void> => {
    if (data === undefined) return
    setError(null)
    setStatus('导出中…')
    try {
      const result = await data.exportControlCenter()
      if (!result.ok) throw new Error(result.error.message)
      const blob = new Blob([JSON.stringify(result.value, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url; link.download = snapshotName(); link.click()
      URL.revokeObjectURL(url)
      report('已导出，请保存下载的文件')
    } catch (err) { fail(err) }
  }, [data])

  const handleImport = useCallback(async (file: File | undefined): Promise<void> => {
    if (data === undefined || file === undefined) return
    setError(null)
    try { await importSnapshot(JSON.parse(await file.text()) as DataExport) }
    catch (err) { fail(err) }
  }, [data, importSnapshot])

  const handleClear = useCallback(async (): Promise<void> => {
    if (data === undefined) return
    if (!window.confirm('确定清空 Control Center 的所有数据吗？此操作不可撤销（凭据保留）。')) return
    setError(null)
    setStatus('清空中…')
    try {
      const result = await data.clearControlCenter()
      if (!result.ok) throw new Error(result.error.message)
      report('已清空')
    } catch (err) { fail(err) }
  }, [data])

  // Local backup directory state
  const [backupDir, setBackupDir] = useState<string>(() => localStorage.getItem('cc.backup.dir') ?? '')
  const [maxBackups, setMaxBackups] = useState(() => parseInt(localStorage.getItem('cc.backup.maxBackups') ?? '5', 10))
  const [skipBackupFile, setSkipBackupFile] = useState(() => localStorage.getItem('cc.backup.skipFile') === 'true')
  const [syncInterval, setSyncInterval] = useState(() => parseInt(localStorage.getItem('cc.backup.syncInterval') ?? '0', 10))

  useEffect(() => { localStorage.setItem('cc.backup.dir', backupDir) }, [backupDir])
  useEffect(() => { localStorage.setItem('cc.backup.maxBackups', String(maxBackups)) }, [maxBackups])
  useEffect(() => { localStorage.setItem('cc.backup.skipFile', String(skipBackupFile)) }, [skipBackupFile])
  useEffect(() => { localStorage.setItem('cc.backup.syncInterval', String(syncInterval)) }, [syncInterval])

  const handleBackupToDir = useCallback(async (): Promise<void> => {
    if (data === undefined || !backupDir) return
    setError(null)
    setStatus('备份到本地目录…')
    try {
      const result = await data.backupToDirectory(backupDir, maxBackups)
      if (!result.ok) throw new Error(result.error.message)
      report(`已备份到: ${result.value}`)
      void refreshBackups()
    } catch (err) { fail(err) }
  }, [data, backupDir, maxBackups])

  const [backupFiles, setBackupFiles] = useState<string[]>([])
  const refreshBackups = useCallback(async (): Promise<void> => {
    if (data === undefined || !backupDir) return
    const result = await data.listBackupFiles(backupDir)
    if (result.ok) setBackupFiles(result.value)
  }, [data, backupDir])
  useEffect(() => { void refreshBackups() }, [refreshBackups])

  const restoreFromBackup = useCallback(async (file: string): Promise<void> => {
    if (data === undefined || !backupDir) return
    if (!window.confirm(`确定要从备份 "${file}" 恢复吗？当前设置将被覆盖。`)) return
    setError(null)
    setStatus('恢复中…')
    try {
      const result = await data.importFromFile(`${backupDir.replace(/\\/g, '/').replace(/\/$/, '')}/${file}`)
      if (!result.ok) throw new Error(result.error.message)
      report(`已从 ${file} 恢复`)
    } catch (err) { fail(err) }
  }, [data, backupDir])

  // WebDAV cloud backup state
  const [webdavHost, setWebdavHost] = useState('')
  const [webdavUser, setWebdavUser] = useState('')
  const [webdavPass, setWebdavPass] = useState('')
  const [webdavPath, setWebdavPath] = useState('')
  const [webdavPassSet, setWebdavPassSet] = useState(false)
  const [webdavBackups, setWebdavBackups] = useState<string[]>([])
  const [webdavTesting, setWebdavTesting] = useState(false)
  const [webdavBusy, setWebdavBusy] = useState(false)

  useEffect(() => {
    if (data === undefined) return
    void data.getWebdavConfig(activeVendor).then(result => {
      if (result.ok) {
        setWebdavHost(result.value.host)
        setWebdavUser(result.value.user)
        setWebdavPath(result.value.path)
        setWebdavPassSet(result.value.passSet)
      }
    }).catch(() => {})
  }, [data, activeVendor])

  const webdavConfigComplete = webdavHost !== '' && webdavUser !== '' && (webdavPassSet || webdavPass !== '')

  const saveWebdav = useCallback(async (): Promise<void> => {
    if (data === undefined) return
    setError(null)
    const result = await data.setWebdavConfig({
      host: webdavHost.trim(),
      user: webdavUser.trim(),
      path: webdavPath.trim(),
      pass: webdavPass,
    }, activeVendor)
    if (!result.ok) throw new Error(result.error.message)
    setWebdavPass('')
    setWebdavPassSet(webdavPass !== '' || webdavPassSet)
  }, [data, activeVendor, webdavHost, webdavUser, webdavPath, webdavPass, webdavPassSet])

  const testWebdav = useCallback(async (): Promise<void> => {
    if (data === undefined) return
    setError(null)
    setWebdavTesting(true)
    try {
      await saveWebdav()
      const result = await data.testWebdavConnection(activeVendor)
      if (!result.ok) throw new Error(result.error.message)
      if (result.value.ok) report(result.value.message)
      else setError(result.value.message)
    } catch (err) { fail(err) } finally { setWebdavTesting(false) }
  }, [data, activeVendor, saveWebdav])

  const backupWebdav = useCallback(async (): Promise<void> => {
    if (data === undefined) return
    setError(null)
    setWebdavBusy(true)
    setStatus('备份到 WebDAV…')
    try {
      await saveWebdav()
      const result = await data.webdavBackup(activeVendor)
      if (!result.ok) throw new Error(result.error.message)
      report(`已备份到 WebDAV: ${result.value}`)
      void refreshWebdavBackups()
    } catch (err) { fail(err) } finally { setWebdavBusy(false) }
  }, [data, activeVendor, saveWebdav])

  const refreshWebdavBackups = useCallback(async (): Promise<void> => {
    if (data === undefined) return
    try {
      const result = await data.listWebdavBackups(activeVendor)
      if (result.ok) setWebdavBackups(result.value)
    } catch { /* keep current list */ }
  }, [data, activeVendor])

  const restoreWebdav = useCallback(async (file: string): Promise<void> => {
    if (data === undefined) return
    if (!window.confirm(`确定要从 WebDAV 备份 "${file}" 恢复吗？当前设置将被覆盖。`)) return
    setError(null)
    setWebdavBusy(true)
    setStatus('从 WebDAV 恢复…')
    try {
      const result = await data.webdavRestore(file, activeVendor)
      if (!result.ok) throw new Error(result.error.message)
      report(`已从 ${file} 恢复`)
    } catch (err) { fail(err) } finally { setWebdavBusy(false) }
  }, [data, activeVendor])

  // S3-compatible cloud backup state
  const [s3, setS3] = useState({
    endpoint: '', bucket: '', region: '', accessKeyId: '', prefix: '', secret: '',
    secretSet: false, backups: [] as string[], testing: false, busy: false,
  })

  useEffect(() => {
    if (data === undefined) return
    void data.getS3Config().then(result => {
      if (result.ok) {
        setS3(current => ({
          ...current,
          endpoint: result.value.endpoint,
          bucket: result.value.bucket,
          region: result.value.region,
          accessKeyId: result.value.accessKeyId,
          prefix: result.value.prefix,
          secretSet: result.value.secretSet,
        }))
      }
    }).catch(() => {})
  }, [data])

  const s3Complete = s3.endpoint !== '' && s3.bucket !== '' && s3.accessKeyId !== '' && (s3.secretSet || s3.secret !== '')

  const saveS3 = useCallback(async (): Promise<void> => {
    if (data === undefined) return
    const result = await data.setS3Config({
      endpoint: s3.endpoint.trim(),
      bucket: s3.bucket.trim(),
      region: s3.region.trim() || 'us-east-1',
      accessKeyId: s3.accessKeyId.trim(),
      prefix: s3.prefix.trim(),
      secret: s3.secret,
    })
    if (!result.ok) throw new Error(result.error.message)
    setS3(current => ({ ...current, secret: '', secretSet: s3.secret !== '' || current.secretSet }))
  }, [data, s3.endpoint, s3.bucket, s3.region, s3.accessKeyId, s3.prefix, s3.secret])

  const testS3 = useCallback(async (): Promise<void> => {
    if (data === undefined) return
    setError(null)
    setS3(current => ({ ...current, testing: true }))
    try {
      await saveS3()
      const result = await data.testS3Connection()
      if (!result.ok) throw new Error(result.error.message)
      if (result.value.ok) report(result.value.message)
      else setError(result.value.message)
    } catch (err) { fail(err) } finally {
      setS3(current => ({ ...current, testing: false }))
    }
  }, [data, saveS3])

  const backupS3 = useCallback(async (): Promise<void> => {
    if (data === undefined) return
    setError(null)
    setS3(current => ({ ...current, busy: true }))
    setStatus('备份到 S3…')
    try {
      await saveS3()
      const result = await data.s3Backup()
      if (!result.ok) throw new Error(result.error.message)
      report(`已备份到 S3: ${result.value}`)
      void refreshS3Backups()
    } catch (err) { fail(err) } finally {
      setS3(current => ({ ...current, busy: false }))
    }
  }, [data, saveS3])

  const refreshS3Backups = useCallback(async (): Promise<void> => {
    if (data === undefined) return
    try {
      const result = await data.listS3Backups()
      if (result.ok) setS3(current => ({ ...current, backups: result.value }))
    } catch { /* keep current list */ }
  }, [data])

  const restoreS3 = useCallback(async (file: string): Promise<void> => {
    if (data === undefined) return
    if (!window.confirm(`确定要从 S3 备份 "${file}" 恢复吗？当前设置将被覆盖。`)) return
    setError(null)
    setS3(current => ({ ...current, busy: true }))
    setStatus('从 S3 恢复…')
    try {
      const result = await data.s3Restore(file)
      if (!result.ok) throw new Error(result.error.message)
      report(`已从 ${file} 恢复`)
    } catch (err) { fail(err) } finally {
      setS3(current => ({ ...current, busy: false }))
    }
  }, [data])

  const handleMarkdownExport = useCallback(async (): Promise<void> => {
    if (data === undefined) return
    setError(null)
    setStatus('生成 Markdown 导出…')
    try {
      const result = await data.exportControlCenter()
      if (!result.ok) throw new Error(result.error.message)
      const snapshot = result.value
      const lines: string[] = [
        '# DSH Control Center 设置快照',
        '',
        `> 导出时间: ${snapshot.exportedAt}`,
        `> 版本: ${snapshot.version}`,
        '',
        '---',
        '',
      ]
      for (const [ns, value] of Object.entries(snapshot.namespaces)) {
        lines.push(`## ${ns}`)
        lines.push('')
        lines.push('```json')
        lines.push(JSON.stringify(value, null, 2))
        lines.push('```')
        lines.push('')
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url; link.download = `dsh-control-center-${new Date().toISOString().slice(0, 10)}.md`; link.click()
      URL.revokeObjectURL(url)
      report('Markdown 文件已下载')
    } catch (err) { fail(err) }
  }, [data])

  const renderPanel = (): React.ReactNode => {
    switch (activeMenu) {
      case 'data': return <BasicDataPanel />
      case 'local_backup': return <LocalBackupPanel />
      case 'webdav': return <WebDavPanel />
      case 'nutstore': return <WebDavPanel />
      case 's3': return <S3Panel />
      case 'import_settings': return <ImportPanel />
      case 'markdown_export': return <MarkdownExportPanel />
      case 'notion': return <NotionPanel />
      case 'yuque': return <YuquePanel />
      case 'joplin': return <JoplinPanel />
      case 'obsidian': return <ObsidianPanel />
      case 'siyuan': return <SiyuanPanel />
      default: return null
    }
  }

  return (
    <div className={css.container}>
      <aside className={css.sidebar}>
        <div className={css.sidebarTitle}>数据</div>
        <div className={css.sidebarList}>
          {MENU_ITEMS.map(item => {
            if (item.divider !== undefined) {
              return <div key={item.key} className={css.sidebarDivider}>{item.divider}</div>
            }
            return (
              <button
                key={item.key}
                type="button"
                className={`${css.sidebarItem} ${activeMenu === item.key ? css.sidebarItemActive : ''}`}
                onClick={() => { setActiveMenu(item.key); setError(null); setStatus(null) }}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </aside>
      <main className={css.content}>
        {error !== null && <div className="cc-notice-error">{error}</div>}
        {status !== null && <div className={css.statusNotice}>{status}</div>}
        {renderPanel()}
      </main>
    </div>
  )

  /** 基础数据 — 备份/恢复/导出/导入/清除 */
  function BasicDataPanel() {
    return (
      <SettingsPageShell>
        <SettingGroup>
          <SettingTitle>备份与恢复</SettingTitle>
          <SettingDivider />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="cc-btn cc-btn-primary" onClick={() => void handleBackupToFile()}
              disabled={desktop === undefined}
              title={desktop === undefined ? '需要桌面版' : undefined}>
              备份到本地文件
            </button>
            <button type="button" className="cc-btn cc-btn-secondary" onClick={() => void handleRestoreFromFile()}
              disabled={desktop === undefined}
              title={desktop === undefined ? '需要桌面版' : undefined}>
              从本地文件恢复
            </button>
          </div>
          {desktop === undefined && (
            <p style={{ marginTop: 8, color: 'var(--muted-foreground)', fontSize: 12 }}>
              当前是浏览器环境，没有本地文件对话框；请使用下方的快照导出/导入。
            </p>
          )}
        </SettingGroup>

        {dshHome !== null && (
          <SettingGroup>
            <SettingTitle>应用数据路径</SettingTitle>
            <SettingDivider />
            <SettingRow>
              <SettingRowTitle>DSH 主目录</SettingRowTitle>
              <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--foreground-tertiary)' }}>{dshHome}</span>
            </SettingRow>
          </SettingGroup>
        )}

        <SettingGroup>
          <SettingTitle>快照导出</SettingTitle>
          <SettingDivider />
          <p style={{ marginTop: 8, marginBottom: 8, color: 'var(--foreground-tertiary)', fontSize: 12 }}>
            将供应商、模型偏好、仓库、技能、MCP、网络搜索、文档处理、翻译、频道、任务等全部配置导出为一个 JSON 文件
          </p>
          <button type="button" className="cc-btn cc-btn-primary" onClick={() => void handleExport()}>导出快照</button>
        </SettingGroup>

        <SettingGroup>
          <SettingTitle>快照导入</SettingTitle>
          <SettingDivider />
          <p style={{ marginTop: 8, marginBottom: 8, color: 'var(--foreground-tertiary)', fontSize: 12 }}>
            从之前导出的 JSON 快照恢复配置
          </p>
          <label className="cc-btn cc-btn-secondary" style={{ cursor: 'pointer' }}>
            选择文件导入
            <input type="file" accept="application/json,.json" style={{ display: 'none' }}
              onChange={(e) => void handleImport(e.target.files?.[0])} />
          </label>
        </SettingGroup>

        <SettingGroup>
          <SettingTitle>清空数据</SettingTitle>
          <SettingDivider />
          <p style={{ marginTop: 8, marginBottom: 8, color: 'var(--foreground-tertiary)', fontSize: 12 }}>
            重置所有 Control Center 配置（API 密钥凭据保留）。此操作不可撤销。
          </p>
          <button type="button" className="cc-btn cc-btn-danger" onClick={() => void handleClear()}>清空数据</button>
        </SettingGroup>
      </SettingsPageShell>
    )
  }

  /** 本地备份到指定目录 */
  function LocalBackupPanel() {
    return (
      <SettingsPageShell>
        <SettingGroup>
          <SettingTitle>本地备份目录</SettingTitle>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>备份目录</SettingRowTitle>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text" className={css.pathInput} value={backupDir}
                onChange={e => setBackupDir(e.target.value)}
                placeholder="选择或输入备份目录路径"
              />
              <button type="button" className="cc-btn cc-btn-secondary" disabled={desktop === undefined}
                onClick={async () => {
                  if (desktop === undefined) return
                  const picked = await desktop.pickFile(['openDirectory'])
                  if (picked.ok && !picked.value.canceled && picked.value.filePaths?.[0]) {
                    setBackupDir(picked.value.filePaths[0])
                  }
                }}>
                选择目录
              </button>
            </div>
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>最大备份数</SettingRowTitle>
            <select className={css.select} value={maxBackups} onChange={e => setMaxBackups(parseInt(e.target.value, 10))}>
              {[0, 1, 3, 5, 10, 20, 50].map(n => (
                <option key={n} value={n}>{n === 0 ? '不限' : n}</option>
              ))}
            </select>
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>自动同步间隔</SettingRowTitle>
            <select className={css.select} value={syncInterval} onChange={e => setSyncInterval(parseInt(e.target.value, 10))}>
              {[
                [0, '关闭'], [1, '1 分钟'], [5, '5 分钟'], [15, '15 分钟'],
                [30, '30 分钟'], [60, '1 小时'], [120, '2 小时'],
                [360, '6 小时'], [720, '12 小时'], [1440, '24 小时'],
              ].map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </SettingRow>
          <SettingDivider />
          <SettingSwitch
            label="跳过文件数据"
            checked={skipBackupFile}
            onChange={setSkipBackupFile}
            description="备份时不包括文件附件数据，只备份配置和偏好设置"
          />
          <SettingDivider />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="cc-btn cc-btn-primary"
              disabled={!backupDir}
              onClick={() => void handleBackupToDir()}>
              立即备份到目录
            </button>
            <button type="button" className="cc-btn cc-btn-secondary"
              disabled={!backupDir}
              onClick={() => void refreshBackups()}>
              刷新备份列表
            </button>
          </div>
          {backupFiles.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--foreground)' }}>已有备份</div>
              {backupFiles.map(file => (
                <div key={file} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--foreground-tertiary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file}</span>
                  <button type="button" className="cc-btn cc-btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }}
                    onClick={() => void restoreFromBackup(file)}>
                    恢复
                  </button>
                </div>
              ))}
            </div>
          )}
          {syncInterval > 0 && (
            <p style={{ marginTop: 8, color: 'var(--foreground-tertiary)', fontSize: 12 }}>
              自动同步已开启（每 {syncInterval} 分钟）。桌面版上线后生效。
            </p>
          )}
        </SettingGroup>
      </SettingsPageShell>
    )
  }

  /** Markdown 导出面板 */
  function MarkdownExportPanel() {
    return (
      <SettingsPageShell>
        <SettingGroup>
          <SettingTitle>Markdown 导出</SettingTitle>
          <SettingDivider />
          <p style={{ marginTop: 8, marginBottom: 8, color: 'var(--foreground-tertiary)', fontSize: 12 }}>
            将当前 Control Center 配置快照导出为 Markdown 格式文档。
          </p>
          <button type="button" className="cc-btn cc-btn-primary" onClick={() => void handleMarkdownExport()}>
            导出为 Markdown
          </button>
        </SettingGroup>
      </SettingsPageShell>
    )
  }

  /** WebDAV 云备份面板 */
  function WebDavPanel() {
    const vd = activeVendor === 'nutstore'
      ? {
          title: '坚果云备份',
          desc: '坚果云提供 WebDAV 兼容端点，配置独立于通用 WebDAV。需在坚果云网页端「账户信息 → 安全选项」生成应用密码。',
          hostPlaceholder: 'https://dav.jianguoyun.com/dav/',
          userPlaceholder: '坚果云账户邮箱',
          backupLabel: '备份到坚果云',
        }
      : {
          title: 'WebDAV 备份',
          desc: '将配置快照备份到 WebDAV 兼容的云存储（如 NextCloud、ownCloud 等）。',
          hostPlaceholder: 'https://example.com/remote.php/dav/files/user/',
          userPlaceholder: 'WebDAV 用户名',
          backupLabel: '备份到 WebDAV',
        }
    return (
      <SettingsPageShell>
        <SettingGroup>
          <SettingTitle>{vd.title}</SettingTitle>
          <SettingDivider />
          <p style={{ marginTop: 8, marginBottom: 8, color: 'var(--foreground-tertiary)', fontSize: 12 }}>
            {vd.desc}
          </p>
          <SettingRow>
            <SettingRowTitle>服务器地址</SettingRowTitle>
            <input type="text" className={css.pathInput} value={webdavHost}
              onChange={e => setWebdavHost(e.target.value)}
              placeholder={vd.hostPlaceholder} />
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>用户名</SettingRowTitle>
            <input type="text" className={css.pathInput} value={webdavUser}
              onChange={e => setWebdavUser(e.target.value)}
              placeholder={vd.userPlaceholder} />
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>密码</SettingRowTitle>
            <input type="password" className={css.pathInput} value={webdavPass}
              onChange={e => setWebdavPass(e.target.value)}
              placeholder={webdavPassSet ? '••••••••（已保存，留空保持不变）' : '输入密码'} />
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>目标路径</SettingRowTitle>
            <input type="text" className={css.pathInput} value={webdavPath}
              onChange={e => setWebdavPath(e.target.value)}
              placeholder="可选，例如 backups/" />
          </SettingRow>
          <SettingDivider />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="cc-btn cc-btn-secondary"
              disabled={!webdavConfigComplete || webdavTesting}
              onClick={() => void testWebdav()}>
              {webdavTesting ? '测试中…' : '测试连接'}
            </button>
            <button type="button" className="cc-btn cc-btn-primary"
              disabled={!webdavConfigComplete || webdavBusy}
              onClick={() => void backupWebdav()}>
              {webdavBusy ? '备份中…' : vd.backupLabel}
            </button>
            <button type="button" className="cc-btn cc-btn-secondary"
              disabled={webdavBusy}
              onClick={() => void refreshWebdavBackups()}>
              刷新列表
            </button>
          </div>
          {webdavBackups.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--foreground)' }}>已有备份</div>
              {webdavBackups.map(file => (
                <div key={file} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--foreground-tertiary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file}</span>
                  <button type="button" className="cc-btn cc-btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }}
                    disabled={webdavBusy}
                    onClick={() => void restoreWebdav(file)}>
                    恢复
                  </button>
                </div>
              ))}
            </div>
          )}
        </SettingGroup>
      </SettingsPageShell>
    )
  }

  /** S3-compatible cloud backup (AWS SigV4 over plain fetch, no AWS SDK). */
  function S3Panel() {
    const input = (key: keyof typeof s3, placeholder: string, type: 'text' | 'password' = 'text') => (
      <SettingRow>
        <SettingRowTitle>{placeholder}</SettingRowTitle>
        <input type={type} className={css.pathInput} value={s3[key] as string}
          onChange={e => { setS3(current => ({ ...current, [key]: e.target.value })) }}
          placeholder={placeholder} />
      </SettingRow>
    )
    return (
      <SettingsPageShell>
        <SettingGroup>
          <SettingTitle>S3 兼容存储备份</SettingTitle>
          <SettingDivider />
          <p style={{ marginTop: 8, marginBottom: 8, color: 'var(--foreground-tertiary)', fontSize: 12 }}>
            备份到 S3 兼容存储（AWS S3、MinIO、Cloudflare R2、阿里云 OSS 等）。使用 AWS Signature V4 签名，凭据以写保护方式存储。
          </p>
          {input('endpoint', '端点 Endpoint', 'text')}
          <SettingDivider />
          {input('bucket', '存储桶 Bucket', 'text')}
          <SettingDivider />
          {input('region', '区域 Region（默认 us-east-1）', 'text')}
          <SettingDivider />
          {input('accessKeyId', 'Access Key ID', 'text')}
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>Secret Access Key</SettingRowTitle>
            <input type="password" className={css.pathInput} value={s3.secret}
              onChange={e => { setS3(current => ({ ...current, secret: e.target.value })) }}
              placeholder={s3.secretSet ? '••••••••（已保存，留空保持不变）' : '输入 Secret Key'} />
          </SettingRow>
          <SettingDivider />
          {input('prefix', '对象前缀（可选，例如 backups/）', 'text')}
          <SettingDivider />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="cc-btn cc-btn-secondary"
              disabled={!s3Complete || s3.testing}
              onClick={() => void testS3()}>
              {s3.testing ? '测试中…' : '测试连接'}
            </button>
            <button type="button" className="cc-btn cc-btn-primary"
              disabled={!s3Complete || s3.busy}
              onClick={() => void backupS3()}>
              {s3.busy ? '备份中…' : '备份到 S3'}
            </button>
            <button type="button" className="cc-btn cc-btn-secondary"
              disabled={s3.busy}
              onClick={() => void refreshS3Backups()}>
              刷新列表
            </button>
          </div>
          {s3.backups.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--foreground)' }}>已有备份</div>
              {s3.backups.map(file => (
                <div key={file} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--foreground-tertiary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file}</span>
                  <button type="button" className="cc-btn cc-btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }}
                    disabled={s3.busy}
                    onClick={() => void restoreS3(file)}>
                    恢复
                  </button>
                </div>
              ))}
            </div>
          )}
        </SettingGroup>
      </SettingsPageShell>
    )
  }

  // ── Export-matrix panels: Cherry Notion/Yuque/Joplin/Obsidian/Siyuan parity ──
  // Each panel is Host-backed via controlCenterExport (credentials never leave
  // Host except as auth headers); the client only handles form state + wiring.

  function NotionPanel() {
    const [config, setConfig] = useState({ apiKey: '', databaseId: '', pageNameKey: 'Name', exportReasoning: false })
    const [loaded, setLoaded] = useState(false)
    const [busy, setBusy] = useState(false)
    useEffect(() => {
      if (exportMatrix === undefined) return
      void (async () => {
        try {
          const cfg = await exportMatrix.getConfig() as unknown as { notion: typeof config }
          setConfig(cfg.notion ?? config)
        } catch { /* keep defaults */ }
        setLoaded(true)
      })()
    }, [])
    const save = async (): Promise<void> => {
      if (exportMatrix === undefined) return
      setBusy(true)
      try {
        await (exportMatrix.setConfig as unknown as (patch: unknown) => Promise<unknown>)({ notion: config })
        report('Notion 配置已保存')
      } catch (err) { fail(err) } finally { setBusy(false) }
    }
    if (!loaded) return <SettingsPageShell><p style={{ color: 'var(--muted-foreground)', fontSize: 12, marginTop: 8 }}>加载中…</p></SettingsPageShell>
    return (
      <SettingsPageShell>
        <SettingGroup>
          <SettingTitle>Notion</SettingTitle>
          <SettingDivider />
          <p style={{ marginTop: 8, marginBottom: 8, color: 'var(--foreground-tertiary)', fontSize: 12 }}>
            将笔记导出到 Notion 数据库。需在 Notion 创建集成并授权数据库。数据库 ID 为分享链接中 32 位 hex（去掉连字符前即是）。
          </p>
          <SettingRow>
            <SettingRowTitle>Integration Token</SettingRowTitle>
            <input type="password" className={css.pathInput} value={config.apiKey} onChange={e => setConfig(s => ({ ...s, apiKey: e.target.value }))} placeholder="secret_..." />
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>Database ID</SettingRowTitle>
            <input type="text" className={css.pathInput} value={config.databaseId} onChange={e => setConfig(s => ({ ...s, databaseId: e.target.value }))} placeholder="32 位 hex" />
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>标题字段名</SettingRowTitle>
            <input type="text" className={css.pathInput} value={config.pageNameKey} onChange={e => setConfig(s => ({ ...s, pageNameKey: e.target.value }))} placeholder="Name" />
          </SettingRow>
          <SettingDivider />
          <SettingSwitch label="导出思考过程" checked={config.exportReasoning} onChange={v => setConfig(s => ({ ...s, exportReasoning: v }))} description="开启后将思考块一并写入 Notion" />
          <SettingDivider />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="cc-btn cc-btn-primary" disabled={busy} onClick={() => void save()}>{busy ? '保存中…' : '保存配置'}</button>
          </div>
        </SettingGroup>
      </SettingsPageShell>
    )
  }

  function YuquePanel() {
    const [config, setConfig] = useState({ token: '', repoId: '' })
    const [loaded, setLoaded] = useState(false)
    const [busy, setBusy] = useState(false)
    useEffect(() => {
      if (exportMatrix === undefined) return
      void (async () => {
        try {
          const cfg = await exportMatrix.getConfig() as unknown as { yuque: typeof config }
          setConfig(cfg.yuque ?? config)
        } catch { /* keep defaults */ }
        setLoaded(true)
      })()
    }, [])
    const save = async (): Promise<void> => {
      if (exportMatrix === undefined) return
      setBusy(true)
      try {
        await (exportMatrix.setConfig as unknown as (patch: unknown) => Promise<unknown>)({ yuque: config })
        report('语雀配置已保存')
      } catch (err) { fail(err) } finally { setBusy(false) }
    }
    if (!loaded) return <SettingsPageShell><p style={{ color: 'var(--muted-foreground)', fontSize: 12, marginTop: 8 }}>加载中…</p></SettingsPageShell>
    return (
      <SettingsPageShell>
        <SettingGroup>
          <SettingTitle>语雀</SettingTitle>
          <SettingDivider />
          <p style={{ marginTop: 8, marginBottom: 8, color: 'var(--foreground-tertiary)', fontSize: 12 }}>
            将笔记导出到语雀知识库。Token 在语雀「设置 → Token」生成，知识库 ID 为 URL 中 `yuque.com/&lt;group&gt;/&lt;book&gt;` 对应的数字 ID（或直接填 `group/book` 也可在导出时解析）。
          </p>
          <SettingRow>
            <SettingRowTitle>Token</SettingRowTitle>
            <input type="password" className={css.pathInput} value={config.token} onChange={e => setConfig(s => ({ ...s, token: e.target.value }))} placeholder="语雀 personal token" />
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>知识库 ID</SettingRowTitle>
            <input type="text" className={css.pathInput} value={config.repoId} onChange={e => setConfig(s => ({ ...s, repoId: e.target.value }))} placeholder="例如 123456" />
          </SettingRow>
          <SettingDivider />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="cc-btn cc-btn-primary" disabled={busy} onClick={() => void save()}>{busy ? '保存中…' : '保存配置'}</button>
          </div>
        </SettingGroup>
      </SettingsPageShell>
    )
  }

  function JoplinPanel() {
    const [config, setConfig] = useState({ url: '', token: '', exportReasoning: false })
    const [loaded, setLoaded] = useState(false)
    const [busy, setBusy] = useState(false)
    useEffect(() => {
      if (exportMatrix === undefined) return
      void (async () => {
        try {
          const cfg = await exportMatrix.getConfig() as unknown as { joplin: typeof config }
          setConfig(cfg.joplin ?? config)
        } catch { /* keep defaults */ }
        setLoaded(true)
      })()
    }, [])
    const save = async (): Promise<void> => {
      if (exportMatrix === undefined) return
      setBusy(true)
      try {
        await (exportMatrix.setConfig as unknown as (patch: unknown) => Promise<unknown>)({ joplin: config })
        report('Joplin 配置已保存')
      } catch (err) { fail(err) } finally { setBusy(false) }
    }
    if (!loaded) return <SettingsPageShell><p style={{ color: 'var(--muted-foreground)', fontSize: 12, marginTop: 8 }}>加载中…</p></SettingsPageShell>
    return (
      <SettingsPageShell>
        <SettingGroup>
          <SettingTitle>Joplin</SettingTitle>
          <SettingDivider />
          <p style={{ marginTop: 8, marginBottom: 8, color: 'var(--foreground-tertiary)', fontSize: 12 }}>
            将笔记导出到 Joplin（需开启 Web Clipper 服务，默认端口 41184）。
          </p>
          <SettingRow>
            <SettingRowTitle>Web Clipper 地址</SettingRowTitle>
            <input type="text" className={css.pathInput} value={config.url} onChange={e => setConfig(s => ({ ...s, url: e.target.value }))} placeholder="http://127.0.0.1:41184/" />
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>Token</SettingRowTitle>
            <input type="password" className={css.pathInput} value={config.token} onChange={e => setConfig(s => ({ ...s, token: e.target.value }))} placeholder="Joplin Web Clipper token" />
          </SettingRow>
          <SettingDivider />
          <SettingSwitch label="导出思考过程" checked={config.exportReasoning} onChange={v => setConfig(s => ({ ...s, exportReasoning: v }))} />
          <SettingDivider />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="cc-btn cc-btn-primary" disabled={busy} onClick={() => void save()}>{busy ? '保存中…' : '保存配置'}</button>
          </div>
        </SettingGroup>
      </SettingsPageShell>
    )
  }

  function ObsidianPanel() {
    const [vault, setVault] = useState('')
    const [loaded, setLoaded] = useState(false)
    const [busy, setBusy] = useState(false)
    useEffect(() => {
      if (exportMatrix === undefined) return
      void (async () => {
        try {
          const cfg = await exportMatrix.getConfig() as unknown as { obsidian: { vault: string } }
          setVault(cfg.obsidian?.vault ?? '')
        } catch { /* keep defaults */ }
        setLoaded(true)
      })()
    }, [])
    const save = async (): Promise<void> => {
      if (exportMatrix === undefined) return
      setBusy(true)
      try {
        await (exportMatrix.setConfig as unknown as (patch: unknown) => Promise<unknown>)({ obsidian: { vault } })
        report('Obsidian 配置已保存')
      } catch (err) { fail(err) } finally { setBusy(false) }
    }
    if (!loaded) return <SettingsPageShell><p style={{ color: 'var(--muted-foreground)', fontSize: 12, marginTop: 8 }}>加载中…</p></SettingsPageShell>
    return (
      <SettingsPageShell>
        <SettingGroup>
          <SettingTitle>Obsidian</SettingTitle>
          <SettingDivider />
          <p style={{ marginTop: 8, marginBottom: 8, color: 'var(--foreground-tertiary)', fontSize: 12 }}>
            Obsidian 通过 `obsidian://` 协议调用本地应用创建笔记，需已安装 Obsidian 桌面版并打开目标 vault。
          </p>
          <SettingRow>
            <SettingRowTitle>Vault 名称</SettingRowTitle>
            <input type="text" className={css.pathInput} value={vault} onChange={e => setVault(e.target.value)} placeholder="例如 MyVault" />
          </SettingRow>
          <SettingDivider />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="cc-btn cc-btn-primary" disabled={busy} onClick={() => void save()}>{busy ? '保存中…' : '保存配置'}</button>
          </div>
        </SettingGroup>
      </SettingsPageShell>
    )
  }

  function SiyuanPanel() {
    const [config, setConfig] = useState({ apiUrl: '', token: '', boxId: '', rootPath: '/CherryStudio' })
    const [loaded, setLoaded] = useState(false)
    const [busy, setBusy] = useState(false)
    useEffect(() => {
      if (exportMatrix === undefined) return
      void (async () => {
        try {
          const cfg = await exportMatrix.getConfig() as unknown as { siyuan: typeof config }
          setConfig(cfg.siyuan ?? config)
        } catch { /* keep defaults */ }
        setLoaded(true)
      })()
    }, [])
    const save = async (): Promise<void> => {
      if (exportMatrix === undefined) return
      setBusy(true)
      try {
        await (exportMatrix.setConfig as unknown as (patch: unknown) => Promise<unknown>)({ siyuan: config })
        report('思源笔记配置已保存')
      } catch (err) { fail(err) } finally { setBusy(false) }
    }
    if (!loaded) return <SettingsPageShell><p style={{ color: 'var(--muted-foreground)', fontSize: 12, marginTop: 8 }}>加载中…</p></SettingsPageShell>
    return (
      <SettingsPageShell>
        <SettingGroup>
          <SettingTitle>思源笔记</SettingTitle>
          <SettingDivider />
          <p style={{ marginTop: 8, marginBottom: 8, color: 'var(--foreground-tertiary)', fontSize: 12 }}>
            将笔记导出到思源笔记。需开启思源的 API 服务并填入 API 地址、Token、笔记本 ID 与导出根路径。
          </p>
          <SettingRow>
            <SettingRowTitle>API 地址</SettingRowTitle>
            <input type="text" className={css.pathInput} value={config.apiUrl} onChange={e => setConfig(s => ({ ...s, apiUrl: e.target.value }))} placeholder="http://127.0.0.1:6806" />
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>Token</SettingRowTitle>
            <input type="password" className={css.pathInput} value={config.token} onChange={e => setConfig(s => ({ ...s, token: e.target.value }))} placeholder="思源 API token" />
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>笔记本 ID</SettingRowTitle>
            <input type="text" className={css.pathInput} value={config.boxId} onChange={e => setConfig(s => ({ ...s, boxId: e.target.value }))} placeholder="boxId" />
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>根路径</SettingRowTitle>
            <input type="text" className={css.pathInput} value={config.rootPath} onChange={e => setConfig(s => ({ ...s, rootPath: e.target.value }))} placeholder="/CherryStudio" />
          </SettingRow>
          <SettingDivider />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="cc-btn cc-btn-primary" disabled={busy} onClick={() => void save()}>{busy ? '保存中…' : '保存配置'}</button>
          </div>
        </SettingGroup>
      </SettingsPageShell>
    )
  }

  /** 导入面板 — ChatGPT/Claude 导出转 Markdown 归档（DSH 无会话导入 RPC，诚实归档） */
  function ImportPanel() {
    const [importState, setImportState] = useState<{ name: string; conversations: number } | null>(null)
    const [importError, setImportError] = useState<string | null>(null)

    const handleVendorImport = (file: File | undefined): void => {
      setImportError(null)
      setImportState(null)
      if (file === undefined) return
      void file.text().then((text) => {
        const parsed = parseVendorConversations(file.name, text)
        if (!parsed.ok) {
          setImportError(parsed.error)
          return
        }
        const markdown = renderArchiveMarkdown(parsed.value)
        const blob = new Blob([markdown], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${file.name.replace(/\.json$/i, '')}-archive.md`
        link.click()
        URL.revokeObjectURL(url)
        setImportState({ name: file.name, conversations: parsed.value.length })
      }).catch((reason: unknown) => {
        setImportError(reason instanceof Error ? reason.message : String(reason))
      })
    }

    return (
      <SettingsPageShell>
        <SettingGroup>
          <SettingTitle>导入设置</SettingTitle>
          <SettingDivider />
          <div className={css.capabilityNotice}>
            <div className={css.capabilityNoticeIcon}>📋</div>
            <div className={css.capabilityNoticeText}>
              DSH 没有会话导入接口，第三方对话无法成为可继续聊天的原生会话。这里把 ChatGPT / Claude
              导出 JSON 解析成 Markdown 归档下载——完整保留问答内容，可读可搜索。
              你也可以使用下方的快照导入恢复完整的 Control Center 设置。
            </div>
          </div>
          <SettingDivider />
          <div style={{ display: 'flex', gap: 8, paddingTop: 8, flexWrap: 'wrap' }}>
            <label className="cc-btn cc-btn-secondary" style={{ cursor: 'pointer' }}>
              导入 ChatGPT 对话 JSON
              <input type="file" accept="application/json,.json" style={{ display: 'none' }}
                onChange={(e) => handleVendorImport(e.target.files?.[0])} />
            </label>
            <label className="cc-btn cc-btn-secondary" style={{ cursor: 'pointer' }}>
              导入 Claude 对话 JSON
              <input type="file" accept="application/json,.json" style={{ display: 'none' }}
                onChange={(e) => handleVendorImport(e.target.files?.[0])} />
            </label>
            <label className="cc-btn cc-btn-secondary" style={{ cursor: 'pointer' }}>
              导入快照
              <input type="file" accept="application/json,.json" style={{ display: 'none' }}
                onChange={(e) => void handleImport(e.target.files?.[0])} />
            </label>
          </div>
          {importError !== null && <div className="cc-notice-error" style={{ marginTop: 8 }}>{importError}</div>}
          {importState !== null && (
            <div className={css.capabilityNotice} style={{ marginTop: 8 }}>
              <div className={css.capabilityNoticeIcon}>✅</div>
              <div className={css.capabilityNoticeText}>
                已解析 {importState.name}：{String(importState.conversations)} 个对话，Markdown 归档已开始下载。
              </div>
            </div>
          )}
        </SettingGroup>
      </SettingsPageShell>
    )
  }
}