/**
 * Notification settings adapted from Cherry NotificationSettings. Preferences
 * are stored in an authoritative DSH settings namespace rather than browser
 * storage so they follow the installed plugin across clients.
 */
import { useEffect, useRef, useState } from 'react'
import type { IApiClient } from '@deepseek-ai/dsh-client-connection/client'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { HelpTooltip } from './panel-ui.tsx'
import { NOTIFICATION_SETTINGS_NAMESPACE } from './notification-runtime.ts'
import {
  SettingDivider, SettingGroup, SettingsPageShell, SettingSwitch, SettingTitle,
} from './SettingsPages.tsx'

const NOTIFICATION_NS = NOTIFICATION_SETTINGS_NAMESPACE

type NotificationKey = 'assistant' | 'backup' | 'knowledge' | 'update'

interface NotificationPrefs {
  assistant: boolean
  backup: boolean
  knowledge: boolean
  update: boolean
}

const DEFAULT_PREFS: NotificationPrefs = {
  assistant: false,
  backup: false,
  knowledge: false,
  update: false,
}

export interface NotificationSectionInjected {
  api: IApiClient
}

export type NotificationSectionProps = PropsRuntime<'settings.section'> & InjectFace<NotificationSectionInjected>

function notificationPrefs(value: unknown): NotificationPrefs {
  const record = typeof value === 'object' && value !== null ? value as Partial<NotificationPrefs> : {}
  return {
    assistant: record.assistant === true,
    backup: record.backup === true,
    knowledge: record.knowledge === true,
    update: record.update === true,
  }
}

export function NotificationSection({ api }: NotificationSectionProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS)
  const [revision, setRevision] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const prefsRef = useRef(prefs)
  const revisionRef = useRef(revision)
  const writeQueueRef = useRef(Promise.resolve())
  const pendingWritesRef = useRef(0)

  useEffect(() => {
    prefsRef.current = prefs
  }, [prefs])

  useEffect(() => {
    revisionRef.current = revision
  }, [revision])

  useEffect(() => {
    let active = true
    setLoading(true)
    void api.settings.describe({}).then(response => {
      if (!active) return
      if (!response.result.ok) {
        setError('通知偏好加载失败，请重试。')
        setLoading(false)
        return
      }
      const namespace = response.result.value.namespaces.find(view => view.ns === NOTIFICATION_NS)
      if (namespace === undefined) {
        setError('通知偏好不可用，请重试。')
        setLoading(false)
        return
      }
      const nextPrefs = notificationPrefs(namespace.value)
      prefsRef.current = nextPrefs
      revisionRef.current = namespace.revision
      setPrefs(nextPrefs)
      setRevision(namespace.revision)
      setError('')
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setError('通知偏好加载失败，请重试。')
      setLoading(false)
    })
    return () => { active = false }
  }, [api])

  const set = (key: NotificationKey) => (next: boolean): void => {
    const previous = prefsRef.current[key]
    prefsRef.current = { ...prefsRef.current, [key]: next }
    setPrefs(prefsRef.current)
    setError('')
    pendingWritesRef.current += 1
    setLoading(true)
    writeQueueRef.current = writeQueueRef.current.then(async () => {
      const response = await api.settings.mutate({
        ns: NOTIFICATION_NS,
        ops: [{ op: 'set', path: [key], value: next }],
        expectedRevision: revisionRef.current!,
      })
      if (!response.result.ok) {
        prefsRef.current = { ...prefsRef.current, [key]: previous }
        setPrefs(prefsRef.current)
        setError(response.result.error.message)
        return
      }
      revisionRef.current = response.result.value.revision
      setRevision(response.result.value.revision)
    }).catch(() => {
      prefsRef.current = { ...prefsRef.current, [key]: previous }
      setPrefs(prefsRef.current)
      setError('通知偏好保存失败，请重试。')
    }).finally(() => {
      pendingWritesRef.current -= 1
      if (pendingWritesRef.current === 0) setLoading(false)
    })
  }

  return (
    <SettingsPageShell>
      <SettingGroup>
        <SettingTitle>通知</SettingTitle>
        <SettingDivider />
        <SettingSwitch
          label={<><span>对话完成通知</span><HelpTooltip text="仅控制后台系统通知，应用内通知始终开启。" /></>}
          checked={prefs.assistant}
          onChange={set('assistant')}
          disabled={loading}
        />
        <SettingDivider />
        <SettingSwitch label="备份" checked={prefs.backup} onChange={set('backup')} disabled={loading} />
        <SettingDivider />
        <SettingSwitch label="知识库" checked={prefs.knowledge} onChange={set('knowledge')} disabled={loading} />
        <SettingDivider />
        <SettingSwitch label="应用更新" checked={prefs.update} onChange={set('update')} disabled={loading} />
      </SettingGroup>
      {error === '' ? null : <p role="alert" className="cc-error">{error}</p>}
    </SettingsPageShell>
  )
}
