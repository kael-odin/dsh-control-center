/**
 * The 请求选项 panel behind the header's bolt icon (Cherry's API options
 * drawer, mapped to what the profile really serves): the route's custom
 * request headers, a first-class pi-ai profile field (`headers` dict) that
 * every request to this provider carries.
 *
 * Edits are path ops against the stored section — `headers` is set wholesale
 * (an absent dict and an empty one are the same wire request, so an emptied
 * panel unsets rather than storing `{}`), with the namespace revision captured
 * at open so a concurrent edit elsewhere is a refusal, not an overwrite.
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { IApiClient, SettingsNamespaceView } from '@deepseek-ai/dsh-api-remotes/client'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import { messageOf } from './store.ts'
import type { en } from './locales.ts'
import styles from './ModelsSection.module.css'

/** One drafted header row. */
interface HeaderDraft {
  key: string
  value: string
}

export interface RequestOptionsPanelProps {
  open: boolean
  /** The owning namespace view (revision + redacted value). */
  namespace: SettingsNamespaceView
  /** Path to the provider profile inside the section. */
  settingsPath: readonly string[]
  api: Pick<IApiClient, 'settings'>
  schema: SettingsSchemaOperations
  t: (key: keyof typeof en) => string
  readOnly: boolean
  onClose: () => void
  /** Called after a successful save (the owner reloads). */
  onSaved: () => void
}

/**
 * Render the custom-headers editor for one provider profile.
 * @param props - open state, profile address, wire face, and copy.
 * @returns the dialog, or null while closed.
 */
export function RequestOptionsPanel(props: RequestOptionsPanelProps): ReactNode {
  const { namespace, settingsPath, api, schema, t } = props
  const [rows, setRows] = useState<readonly HeaderDraft[]>(() => {
    const stored = schema.getPath(namespace.value, [...settingsPath, 'headers'])
    if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) return []
    return Object.entries(stored as Record<string, unknown>)
      .filter(([, value]) => typeof value === 'string')
      .map(([key, value]) => ({ key, value: value as string }))
  })
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | undefined>(undefined)
  // Revision captured at open: the dialog judges its write against the
  // section it read, exactly like the editor cards.
  const [openedAt] = useState(() => namespace.revision)

  const patch = (index: number, next: Partial<HeaderDraft>): void => {
    setRows(current => current.map((row, at) => at === index ? { ...row, ...next } : row))
  }

  const apply = async (): Promise<void> => {
    setBusy(true)
    setFailure(undefined)
    try {
      const cleaned = rows
        .map(row => ({ key: row.key.trim(), value: row.value }))
        .filter(row => row.key.length > 0)
      const dict = Object.fromEntries(cleaned.map(row => [row.key, row.value]))
      const op = cleaned.length === 0
        ? { op: 'unset' as const, path: [...settingsPath, 'headers'] }
        : { op: 'set' as const, path: [...settingsPath, 'headers'], value: dict }
      const response = await api.settings.mutate({ ns: namespace.ns, expectedRevision: openedAt, ops: [op] })
      if (!response.result.ok) {
        setFailure(response.result.error.message)
        return
      }
      props.onSaved()
      props.onClose()
    } catch (error) {
      setFailure(messageOf(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('requestOptions')}
      closeLabel={t('close')}
      description={t('requestHeadersHint')}
      className={styles['deleteDialog'] as string}
      footer={(
        <>
          <Button variant="outline" disabled={busy} onClick={props.onClose}>{t('cancel')}</Button>
          <Button variant="outline" disabled={props.readOnly || busy} onClick={() => { void apply() }}>
            {busy ? t('applying') : t('apply')}
          </Button>
        </>
      )}
    >
      <div className={styles['field']}>
        <span className={styles['fieldLabel']}>{t('requestHeaders')}</span>
        {rows.length === 0 ? <p className={styles['endpointPreview']}>{t('requestHeadersEmpty')}</p> : null}
        {rows.map((row, index) => (
          <div key={index} className={styles['headerRow']}>
            <input
              className={styles['input']}
              type="text"
              value={row.key}
              placeholder={t('headerName')}
              aria-label={`${t('headerName')} ${index + 1}`}
              disabled={props.readOnly || busy}
              onChange={(event) => { patch(index, { key: event.target.value }) }}
            />
            <input
              className={styles['input']}
              type="text"
              value={row.value}
              placeholder={t('headerValue')}
              aria-label={`${t('headerValue')} ${index + 1}`}
              disabled={props.readOnly || busy}
              onChange={(event) => { patch(index, { value: event.target.value }) }}
            />
            <button
              type="button"
              className={styles['iconButton']}
              aria-label={`${t('removeModel')} ${index + 1}`}
              title={t('removeModel')}
              disabled={props.readOnly || busy}
              onClick={() => { setRows(current => current.filter((_row, at) => at !== index)) }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M5 12h14" />
              </svg>
            </button>
          </div>
        ))}
        <button
          type="button"
          className={styles['addModelButton']}
          disabled={props.readOnly || busy}
          onClick={() => { setRows(current => [...current, { key: '', value: '' }]) }}
        >
          {t('addHeader')}
        </button>
      </div>
      {failure === undefined ? null : <p className={styles['error']}>{failure}</p>}
    </Modal>
  )
}
