/**
 * Cherry's model health-check dialog, mapped onto the real host capability:
 * each enabled model gets one tiny streamed completion through
 * controlCenterModelCheck — the same adapter registry and credential path a
 * production request takes. Statuses run sequentially (a provider rate limit
 * should surface as a failure on the model that caused it, not a storm), with
 * per-row re-check and a run-all.
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type { en } from './locales.ts'
import styles from './ModelsSection.module.css'

/** One check's display state. */
interface CheckState {
  status: 'idle' | 'checking' | 'ok' | 'fail'
  latencyMs?: number | undefined
  error?: string | undefined
}

export interface ModelHealthDialogProps {
  open: boolean
  /** The route under test. */
  provider: string
  /** The profile's served models (the rows to check). */
  models: readonly string[]
  /** The host check call; undefined when the remote is not mounted yet. */
  getCheck: () => {
    check(provider: string, model: string): Promise<
      { ok: true; value: { ok: boolean; latencyMs?: number | undefined; reply?: string | undefined; error?: string | undefined } }
      | { ok: false; error: { code: string; message: string; details: object } }
    >
  } | undefined
  t: (key: keyof typeof en) => string
  onClose: () => void
}

/**
 * Render the health-check dialog for one provider's models.
 * @param props - open state, route, models, wire face, and copy.
 * @returns the dialog, or null while closed.
 */
export function ModelHealthDialog(props: ModelHealthDialogProps): ReactNode {
  const { provider, models, getCheck, t } = props
  const [states, setStates] = useState<ReadonlyMap<string, CheckState>>(new Map())
  const [running, setRunning] = useState(false)

  const setModel = (model: string, state: CheckState): void => {
    setStates(current => new Map(current).set(model, state))
  }

  const checkOne = async (model: string): Promise<void> => {
    const check = getCheck?.()
    if (check === undefined) {
      setModel(model, { status: 'fail', error: t('loadFailed') })
      return
    }
    setModel(model, { status: 'checking' })
    try {
      const response = await check.check(provider, model)
      if (!response.ok) {
        setModel(model, { status: 'fail', error: response.error.message })
        return
      }
      const result = response.value
      setModel(model, result.ok
        ? { status: 'ok', latencyMs: result.latencyMs }
        : { status: 'fail', error: result.error })
    } catch (error) {
      setModel(model, { status: 'fail', error: error instanceof Error ? error.message : String(error) })
    }
  }

  const checkAll = async (): Promise<void> => {
    setRunning(true)
    try {
      for (const model of models) await checkOne(model)
    } finally {
      setRunning(false)
    }
  }

  const close = (): void => {
    if (running) return
    props.onClose()
  }

  return (
    <Modal
      open={props.open}
      onClose={close}
      title={t('checkModels')}
      closeLabel={t('close')}
      description={t('checkModelsHint')}
      className={styles['deleteDialog'] as string}
      footer={(
        <>
          <Button variant="outline" disabled={running || models.length === 0} onClick={() => { void checkAll() }}>
            {running ? t('checking') : t('checkAll')}
          </Button>
          <Button variant="outline" disabled={running} onClick={props.onClose}>{t('close')}</Button>
        </>
      )}
    >
      {models.length === 0 ? <p className={styles['endpointPreview']}>{t('modelsEmpty')}</p> : null}
      <ul className={styles['candidateList']}>
        {models.map(model => {
          const state = states.get(model) ?? { status: 'idle' as const }
          return (
            <li key={model} className={styles['candidate']}>
              <span className={`${styles['healthDot']} ${
                state.status === 'ok' ? styles['healthOk']
                  : state.status === 'fail' ? styles['healthFail']
                    : state.status === 'checking' ? styles['healthChecking'] : ''}`}
                role="img"
                aria-label={state.status}
              />
              <span className={styles['candidateId']}>{model}</span>
              <span className={`${styles['healthMeta']} ${state.status === 'fail' ? styles['healthFailText'] : ''}`}>
                {state.status === 'ok'
                  ? `${state.latencyMs ?? 0} ms`
                  : state.status === 'checking'
                    ? t('checking')
                    : state.status === 'fail'
                      ? state.error
                      : t('notChecked')}
              </span>
              <button
                type="button"
                className={styles['iconButton']}
                aria-label={`${t('recheck')} ${model}`}
                title={t('recheck')}
                disabled={running || !getCheck?.()}
                onClick={() => { void checkOne(model) }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
              </button>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
