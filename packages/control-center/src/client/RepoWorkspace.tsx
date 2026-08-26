/**
 * Repo workspace (Cherry CodeCliPage parity, detection-first): the AI coding
 * CLIs visible on this machine's PATH, with versions and install hints.
 * Cherry also manages install/launch; DSH keeps that with the operator's
 * package manager — this surface is an honest capability map of the machine.
 */

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { EnvCheckEntry } from '../system-types.ts'
import { SettingDivider, SettingGroup, SettingTitle, SettingsPageShell } from './SettingsPages.tsx'

export interface RepoWorkspaceInjected {
  listCodeClis: () => Promise<EnvCheckEntry[]>
}

export function RepoWorkspace({ listCodeClis }: RepoWorkspaceInjected): ReactNode {
  const [clis, setClis] = useState<EnvCheckEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stopped = false
    void listCodeClis().then((entries) => {
      if (!stopped) setClis(entries)
    }, (reason: unknown) => {
      if (!stopped) setError(reason instanceof Error ? reason.message : String(reason))
    })
    return () => { stopped = true }
  }, [listCodeClis])

  const present = clis?.filter(entry => entry.present) ?? []
  const absent = clis?.filter(entry => !entry.present) ?? []

  return (
    <SettingsPageShell>
      <SettingGroup>
        <SettingTitle>Code CLI</SettingTitle>
        <SettingDivider />
        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', padding: '8px 0' }}>
          本机 PATH 上检测到的 AI 编程 CLI。安装与启动由你的包管理器负责（npm / mise / 安装器）；此处是真实能力探测。
        </div>
      </SettingGroup>
      {error !== null && <div className="cc-notice-error">{error}</div>}
      {clis === null && error === null && (
        <SettingGroup><div className="cc-loading" style={{ minHeight: 80 }}>检测中…</div></SettingGroup>
      )}
      {present.length > 0 && (
        <SettingGroup>
          <SettingTitle>已检测到（{String(present.length)}）</SettingTitle>
          <SettingDivider />
          {present.map(entry => (
            <div key={entry.name} className="cc-field-row">
              <span className="cc-field-label">{entry.name}{entry.hint === undefined ? '' : ` · ${entry.hint}`}</span>
              <span className="cc-field-label" style={{ fontFamily: 'var(--ds-font-family-code), monospace', color: 'var(--success-subtle-foreground)' }}>
                {entry.version ?? '已安装'}
              </span>
            </div>
          ))}
        </SettingGroup>
      )}
      {absent.length > 0 && (
        <SettingGroup>
          <SettingTitle>未检测到（{String(absent.length)}）</SettingTitle>
          <SettingDivider />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {absent.map(entry => (
              <span key={entry.name} title={entry.hint}
                style={{ fontSize: 12, border: '1px solid var(--border)', borderRadius: 999, padding: '2px 10px', color: 'var(--muted-foreground)' }}>
                {entry.name}
              </span>
            ))}
          </div>
        </SettingGroup>
      )}
    </SettingsPageShell>
  )
}
