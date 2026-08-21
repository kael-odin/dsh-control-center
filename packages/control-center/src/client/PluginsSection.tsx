import { useEffect, useState } from 'react'
import type { HostObservable, InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { PluginInventory, PluginOperation } from '../system-types.ts'
import css from './SystemSection.module.css'

export interface PluginsSectionInjected {
  getSystem: () => NonNullable<ClientRemote['controlCenterSystem']>
  hooks: { systemReady: HostObservable<boolean> }
}
export type PluginsSectionProps = PropsRuntime<'settings.section'> & InjectFace<PluginsSectionInjected>

export function PluginsSection({ getSystem, useSystemReady }: PluginsSectionProps) {
  const ready = useSystemReady(value => value)
  const system = ready ? getSystem() : undefined
  const [profile, setProfile] = useState('web')
  const [spec, setSpec] = useState('')
  const [inventory, setInventory] = useState<PluginInventory | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const refresh = () => { if (system !== undefined) void system.listPlugins(profile).then(result => { if (result.ok) setInventory(result.value); else setNotice(result.error.message) }).catch(error => setNotice(String(error))) }
  useEffect(refresh, [system, profile]) // eslint-disable-line react-hooks/exhaustive-deps
  const manage = async (operation: PluginOperation) => {
    if (system === undefined || spec.trim() === '') return
    setBusy(true); setNotice(null)
    try {
      const result = await system.managePlugin(profile, operation, spec.trim())
      if (!result.ok) setNotice(result.error.message)
      else { setInventory(result.value.inventory); setNotice(result.value.exitCode === 0 ? '操作已完成；重启 DSH 后生效。' : result.value.stderr || '操作失败。') }
    } catch (error) { setNotice(error instanceof Error ? error.message : String(error)) } finally { setBusy(false) }
  }
  if (!ready || inventory === null) return <div className={css.loading}>Loading...</div>
  return <div className={css.root}>
    <div><h2 className={css.pageTitle}>插件</h2><p className={css.pageDescription}>管理 DSH profile 的真实插件依赖；操作由官方 CLI 的 pnpm 契约执行。</p></div>
    <div className={css.card}>
      <div className={css.infoRow}><label className={css.infoLabel}>Profile</label><input value={profile} onChange={event => setProfile(event.target.value)} disabled={busy} /></div>
      <div className={css.infoRow}><label className={css.infoLabel}>插件包或 spec</label><input value={spec} onChange={event => setSpec(event.target.value)} placeholder="@scope/plugin 或 git spec" disabled={busy} /></div>
      <div className={css.infoRow}><span className={css.infoLabel}>已安装依赖</span><span className={css.infoValue}>{inventory.dependencies.length} 个</span></div>
      {inventory.dependencies.map(plugin => <div className={css.infoRow} key={plugin.name}><span className={css.infoLabel}>{plugin.name}</span><span className={css.infoValue}>{plugin.spec}{plugin.bundle ? ' · bundle' : ''}{plugin.active ? ' · 已启用' : ' · 未解析'}</span></div>)}
      <div><button type="button" className="cc-btn cc-btn-primary" disabled={busy || spec.trim() === ''} onClick={() => void manage('add')}>安装</button>{' '}<button type="button" className="cc-btn cc-btn-secondary" disabled={busy || spec.trim() === ''} onClick={() => void manage('update')}>更新</button>{' '}<button type="button" className="cc-btn cc-btn-danger" disabled={busy || spec.trim() === ''} onClick={() => void manage('remove')}>卸载</button>{' '}<button type="button" className="cc-btn cc-btn-secondary" disabled={busy} onClick={refresh}>刷新</button></div>
      <p className={css.pageDescription}>热启用、热禁用、回滚和恢复：当前官方 Host 不支持，操作按钮不会伪造这些能力。修改后需要重启 DSH。</p>
      {notice === null ? null : <div className="cc-notice-error">{notice}</div>}
    </div>
  </div>
}
