/**
 * One provider's editor card, hand-written per adapter family: the primary
 * field is a single write-only **API key** input (the page never asks for an
 * environment-variable name — a typed key stores through `credentials.set`
 * under the profile's reference, deriving `<ROUTE>_API_KEY` when the profile
 * has none. The pi-ai profile records that derivation as `apiKeyEnv` only when
 * a key is entered; a blank key materializes a reference-free profile for
 * provider-native authentication);
 * the collapsed 自定义设置 area carries the per-family extras (`baseURL` for
 * both families, DeepSeek's id/name/context-window model catalog, and the
 * display name and wire protocol of a pi-ai route the adapter does not ship —
 * the two fields the create card asked that route for, editable here for the
 * same reason).
 * Reasoning effort is deliberately absent: it is a per-MODEL capability, and
 * the models under one provider disagree about it, so a provider-scoped
 * control can only be set to a value some of them reject. The composer's
 * model picker offers each model its own levels; `settings.yaml` keeps the
 * profile field for a deployment that knows its route. Everything else stays
 * owned by `settings.yaml`. Profile edits land as minimal `settings.mutate`
 * path ops against the stored section — the card names only the fields it can
 * see instead of rebuilding the whole subtree from a partial descriptor.
 */

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { CredentialInfo, ClientRemote, SettingsNamespaceView, SettingsPathOpView,JsonValue } from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import {
  DeepSeekModelsEditor, modelDrafts, validateDeepSeekModels,
} from './DeepSeekModelsEditor.tsx'
import { apiKeyFailure } from './apiKey.ts'
import { ApiKeysController } from './api-keys-store.ts'
import { ApiKeyListDrawer } from './ApiKeyListDrawer.tsx'
import { EditorFooter } from './EditorFooter.tsx'
import { ModelListEditor } from './ModelListEditor.tsx'
import { deriveKeyRef, messageOf, protocolChoices } from './store.ts'
import type { en } from './locales.ts'
import styles from './ModelsSection.module.css'

/** Per-adapter-family curated field sets (unknown namespaces get the hint alone). */
type EditorLayout = 'deepseek' | 'pi-ai' | 'unknown'

/** The public DeepSeek endpoint shown as the deepseek base-URL placeholder. */
const DEEPSEEK_PUBLIC_BASE_URL = 'https://api.deepseek.com'

/** Props of {@link ProviderEditor}. */
export interface ProviderEditorProps {
  /** Provider route id. */
  provider: string
  /** Display name for the card title. */
  displayName: string
  /** Hide the title row (the add card renders its own provider select). */
  hideTitle?: boolean
  /**
   * Defaults pre-filled into the profile when no stored profile exists yet.
   * The directory page uses this to seed the right panel with the preset's
   * base URL and wire protocol, so a fresh pick is ready to save without
   * extra field edits.
   */
  defaults?: { baseURL?: string; api?: string }
  /**
   * Render as an always-expanded Cherry-style panel: the base URL, protocol,
   * and model list stand visible instead of folded behind 自定义设置. The
   * Model Services page sets this; the compact Models page keeps the fold.
   */
  panelStyle?: boolean
  /**
   * Offer the 检测 action beside the key field: a real endpoint interrogation
   * through `llm.discoverModels`, reporting model count and latency.
   */
  showCheck?: boolean
  /**
   * Registry links for this provider: its official site (unused here — the
   * directory header owns that link) and where to apply for a key, shown as a
   * help link beside the key label like Cherry's 获取 API 卡密.
   */
  helpLinks?: { apiKeyUrl?: string }
  /** Official site for Cherry's FileText docs link on the model list toolbar. */
  docsUrl?: string | undefined
  /** The host default-model selection, passed through to the model list's
   * default marker. */
  defaultModel?: { provider?: unknown; model?: unknown }
  /** Mark one of this provider's models as the default for future sessions. */
  onSetDefault?: (modelId: string) => void
  /** The provider's served-catalog candidates for the eye-toggle merge. */
  catalogModels?: readonly { id: string; name?: string }[]
  /** Open the route's request-options panel (the Cherry gear beside the
   * base URL); absent on surfaces that host their own entry point. */
  onOpenRequestOptions?: () => void
  /**
   * Whether the adapter reports this route as hand-declared — absent from its
   * installed catalog. Such a route carries its own wire protocol, chosen when
   * it was created and editable here for the same reason; a catalog route's
   * models each carry theirs, so a route-level protocol there could only
   * override every one of them and the card does not offer it.
   */
  declared?: boolean
  /** The owning namespace view (schema, layers, secrets). */
  namespace: SettingsNamespaceView
  /** Path from the section root to this provider's profile. */
  settingsPath: readonly string[]
  /** Wire faces for writes and for interrogating a provider endpoint. */
  api: Pick<ClientRemote, 'settings' | 'credentials' | 'llm'>
  /** Bound schema callbacks for namespace introspection and draft edits. */
  schema: SettingsSchemaOperations
  /** Section copy. */
  t: (key: keyof typeof en) => string
  /** Disable writes (read-only settings provider). */
  readOnly: boolean
  /** Render only the credential field and actions, without provider settings. */
  credentialOnly?: boolean
  /** Require a newly entered credential before this editor can submit. */
  credentialRequired?: boolean
  /** Give the credential field initial focus when this editor mounts. */
  autoFocusCredential?: boolean
  /** Override the dismiss action copy. */
  cancelLabel?: keyof typeof en
  /** Override the idle commit action copy. */
  submitLabel?: keyof typeof en
  /** Override the in-flight commit action copy. */
  submitBusyLabel?: keyof typeof en
  /** Close the editor; `changed` reports whether an Apply committed. */
  onClose: (changed: boolean) => void
}

function draftAt(
  namespace: SettingsNamespaceView,
  path: readonly string[],
  schema: SettingsSchemaOperations,
  defaults?: { baseURL?: string; api?: string },
): Record<string, unknown> {
  const subtree = schema.getPath(namespace.user, [...path])
  if (typeof subtree === 'object' && subtree !== null && !Array.isArray(subtree)) {
    return structuredClone(subtree) as Record<string, unknown>
  }
  // No stored profile yet: seed the draft with the preset defaults so a fresh
  // pick from the directory applies a complete profile (pi-ai requires a
  // hand-declared route to name both the wire protocol and the endpoint).
  const seeded: Record<string, unknown> = {}
  if (defaults?.api !== undefined) seeded.api = defaults.api
  if (defaults?.baseURL !== undefined) seeded.baseURL = defaults.baseURL
  return seeded
}

/**
 * The minimal path ops carrying `after` over `before`, both as the card sees
 * them. Only keys the card observed are named; fields absent from both sides
 * produce no op, which is why edits are path-addressed rather than a rebuilt
 * section.
 * @param base - path of the edited subtree inside the user section.
 * @param before - the subtree as loaded, or undefined when it is new.
 * @param after - the subtree as edited.
 * @returns ordered set/unset ops; empty when nothing changed.
 */
export function pathOps(
  base: readonly string[],
  before: unknown,
  after: Record<string, unknown>,
): SettingsPathOpView[] {
  const previous = typeof before === 'object' && before !== null && !Array.isArray(before)
    ? before as Record<string, unknown>
    : {}
  const ops: SettingsPathOpView[] = []
  for (const [key, value] of Object.entries(after)) {
    if (JSON.stringify(previous[key]) === JSON.stringify(value)) continue
    ops.push({ op: 'set', path: [...base, key], value: value as JsonValue })
  }
  for (const key of Object.keys(previous)) {
    if (!(key in after)) ops.push({ op: 'unset', path: [...base, key] })
  }
  return ops
}

/** The editor layout the owning namespace selects. */
function layoutOf(ns: string): EditorLayout {
  if (ns === 'llm-deepseek') return 'deepseek'
  if (ns === 'llm-pi-ai') return 'pi-ai'
  return 'unknown'
}

/** The credential reference this profile resolves keys through. */
function refFor(
  namespace: SettingsNamespaceView,
  path: readonly string[],
  provider: string,
  schema: SettingsSchemaOperations,
): string {
  const profile = schema.getPath(namespace.value, [...path])
  const named = typeof profile === 'object' && profile !== null
    ? (profile as { apiKeyEnv?: unknown }).apiKeyEnv
    : undefined
  return typeof named === 'string' && named.length > 0 ? named : deriveKeyRef(provider)
}

/**
 * Render one provider's editing card.
 * @param props - the addressed profile plus wire faces and copy.
 * @returns the editor card.
 */
export function ProviderEditor(props: ProviderEditorProps): ReactNode {
  const { namespace, settingsPath, api, t, schema } = props
  // Local aliases keep the rc.7 helper signatures intact inside the card; they
  // all delegate to the bound `ctx.settingsSchema` service callbacks.
  const { getPath, hasPath, nodeAtPath, rehydrate, deletePath, setPath, validate } = schema
  const [draft, setDraft] = useState<Record<string, unknown>>(
    () => draftAt(namespace, settingsPath, schema, props.defaults),
  )
  const [keyDraft, setKeyDraft] = useState('')
  const [keyState, setKeyState] = useState<CredentialInfo | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | undefined>(undefined)
  const [showKey, setShowKey] = useState(false)
  const [keysOpen, setKeysOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<{ ok: boolean; text: string } | undefined>(undefined)
  // A settings success advances both retry baselines immediately. Keeping the
  // derived fields in the draft prevents a pushed namespace refresh from
  // turning them into deletions when the following credential write is retried.
  const [committedOriginal, setCommittedOriginal] = useState<unknown>(
    () => getPath(namespace.user, [...settingsPath]),
  )
  const [expectedRevision, setExpectedRevision] = useState(() => namespace.revision)
  const root = useMemo(() => rehydrate(namespace.schema), [namespace.schema])
  const node = useMemo(() => nodeAtPath(root, [...settingsPath]), [root, settingsPath])
  const fallback = getPath(namespace.value, [...settingsPath])
  const disabled = props.readOnly || busy
  const layout = layoutOf(namespace.ns)
  const keyRef = refFor(namespace, settingsPath, props.provider, schema)
  // The same schema read the create card makes, so the choices offered here
  // and there cannot drift apart: both come from the adapter's own `Config`.
  // Only the pi-ai layout has a per-route protocol for the read to find, and
  // it rehydrates the whole section schema, so the other layouts skip it.
  const protocols = useMemo(
    () => layout === 'pi-ai' ? protocolChoices(namespace, schema) : [],
    [layout, namespace, schema],
  )

  useEffect(() => {
    let stale = false
    setKeyState(undefined)
    // The key state is a placeholder hint, not a precondition for editing:
    // neither a business rejection nor a transport failure may reach the
    // browser as an unhandled rejection, so the card simply renders without
    // the "already configured" hint.
    void api.credentials.describe([keyRef]).then(
      (response) => {
        if (stale || !response.ok) return
        setKeyState(response.value[keyRef])
      },
      () => undefined,
    )
    return () => { stale = true }
  }, [api.credentials, keyRef])

  const stringAt = (source: unknown, key: string): string | undefined => {
    const value = getPath(source, [key])
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined
  }
  const setField = (key: string, next: string | undefined): void => {
    // A value of nothing but whitespace is cleared, not stored: `stringAt`
    // already reports it as absent, so the field would otherwise render empty
    // while the draft still carried the spaces into `settings.yaml`, where
    // both adapters would accept that non-empty string as a real value.
    const value = next === undefined || next.trim().length === 0 ? undefined : next
    setDraft(current => {
      const result = value === undefined ? deletePath(current, [key]) : setPath(current, [key], value)
      return result as Record<string, unknown>
    })
  }

  // The model list is validated by the same per-row checker for both families,
  // so a bad row is named by its position rather than by a blanket message.
  const modelFailure = validateDeepSeekModels(getPath(draft, ['models']))
  const keyFailure = apiKeyFailure(keyDraft)
  // What a probe or a write must carry: the typed key with paste whitespace
  // removed. A blank field yields an empty string, which both call sites read
  // as "no key supplied" rather than as a key — that is how a card whose
  // provider already has a stored key is edited without re-entering it.
  const keyValue = keyDraft.trim()
  const credentialRequiredFailure = props.credentialRequired === true
    && keyDraft.length > 0 && keyValue.length === 0
    ? 'keyRequired' as const
    : undefined
  const shownKeyFailure = credentialRequiredFailure ?? keyFailure
  // What the form currently shows, which is what an interrogation must ask:
  // an edited-but-unsaved endpoint, and a key typed but not yet stored.
  const probeApi = stringAt(draft, 'api') ?? stringAt(fallback, 'api')
  const probeBaseURL = stringAt(draft, 'baseURL') ?? stringAt(fallback, 'baseURL')
  // Naming the route lets an adapter that already describes it answer from
  // its own registry — better metadata, no network call, no endpoint needed.
  const probe = {
    settingsNs: namespace.ns,
    provider: props.provider,
    ...probeBaseURL === undefined ? {} : { baseURL: probeBaseURL },
    ...probeApi === undefined ? {} : { api: probeApi },
    ...keyValue.length === 0 ? {} : { apiKey: keyValue },
  }
  /**
   * The 检测 action: interrogate the endpoint the form currently shows, exactly
   * as a fetch would, and report what came back without adopting anything. A
   * shipped catalog route answers from the adapter's registry; every other
   * route is a real wire probe carrying the typed key (or the stored one the
   * adapter resolves for its own route). Either way the reply is evidence.
   */
  const runCheck = async (): Promise<void> => {
    setChecking(true)
    setCheckResult(undefined)
    const startedAt = Date.now()
    try {
      const response = await api.llm.discoverModels(namespace.ns, probe)
      if (!response.ok) {
        setCheckResult({ ok: false, text: response.error.message })
        return
      }
      const ms = Math.max(1, Date.now() - startedAt)
      const count = String(response.value.length)
      setCheckResult({ ok: true, text: t('checkSuccess').replace('{count}', count).replace('{ms}', String(ms)) })
    } catch (error) {
      setCheckResult({ ok: false, text: messageOf(error) })
    } finally {
      setChecking(false)
    }
  }
  /** The request URL the current protocol would hit, shown under the base-URL
   * field the way Cherry previews its Anthropic endpoint. */
  const endpointPreview = (() => {
    const base = probeBaseURL ?? props.defaults?.baseURL
    if (base === undefined || base.length === 0) return undefined
    const trimmed = base.replace(/\/+$/, '')
    return probeApi === 'anthropic-messages' ? `${trimmed}/v1/messages` : `${trimmed}/chat/completions`
  })()
  /**
   * The write for this card, or a failure message. Every edit travels as
   * path ops against the STORED section: the draft comes from the redacted
   * descriptor, so a wholesale replace rebuilt from it could delete fields
   * outside the card. Ops name only the fields this card can see.
   */
  const applyOnce = async (): Promise<string | undefined> => {
    const ns = namespace.ns
    // A pi-ai profile names the conventional reference only when this page is
    // about to store a key. Otherwise the provider keeps its native auth path.
    const next = layout === 'pi-ai' && stringAt(draft, 'apiKeyEnv') === undefined
      && stringAt(fallback, 'apiKeyEnv') === undefined && keyValue.length > 0
      ? setPath(draft, ['apiKeyEnv'], keyRef) as Record<string, unknown>
      : draft
    if (props.credentialOnly !== true) {
      // The same checker gates the submit button, so a card cannot reach this
      // with a bad row; it stays because the schema check below would refuse
      // the write with a message naming a path instead of the row, and because
      // nothing but this function decides what is written.
      const failure = validateDeepSeekModels(getPath(next, ['models']))
      /* v8 ignore next 3 -- unreachable from the card: the same failure disables submit */
      if (failure !== undefined) {
        return `${t('model')} ${String(failure.index + 1)}: ${t(failure.key)}`
      }
    }
    /* v8 ignore next -- apply is only reachable from the rendered card, which required a resolved node */
    if (props.credentialOnly !== true && node !== undefined && settingsPath.length === 0) {
      const sectionError = validate(node, next)
      if (sectionError !== undefined) return sectionError
    }
    const materializesNativeProfile = layout === 'pi-ai'
      && fallback === undefined
      && committedOriginal === undefined
      && Object.keys(next as Record<string, unknown>).length === 0
    const ops: SettingsPathOpView[] = props.credentialOnly === true
      ? []
      : materializesNativeProfile
        ? [{ op: 'set', path: [...settingsPath], value: {} }]
        : pathOps([...settingsPath], committedOriginal, next)
    if (ops.length > 0) {
      const response = await api.settings.mutate(ns, ops, expectedRevision)
      if (!response.ok) {
        return response.error.code === 'settings-conflict'
          ? t('conflict')
          : response.error.message
      }
      setCommittedOriginal(getPath(response.value.user, [...settingsPath]))
      setExpectedRevision(response.value.revision)
      setDraft(next as Record<string, unknown>)
    }
    if (keyValue.length > 0) {
      const stored = await api.credentials.set(keyRef, keyValue )
      if (!stored.ok) return stored.error.message
    }
    setKeyDraft('')
    return undefined
  }

  const apply = async (): Promise<void> => {
    setBusy(true)
    setFailure(undefined)
    try {
      const failure = await applyOnce()
      if (failure !== undefined) {
        setFailure(failure)
        return
      }
      props.onClose(true)
    } catch (error) {
      // A transport failure (disconnect, a request the host refuses) rejects
      // rather than answering; without this the card would stay busy forever
      // with no error shown.
      setFailure(messageOf(error))
    } finally {
      setBusy(false)
    }
  }

  if (node === undefined) {
    // A directory entry addressing a position its schema cannot resolve is a
    // host-side inconsistency; showing it beats a blank card.
    return <p className={styles['error']}>{`${props.provider}: unresolvable settings path`}</p>
  }

  const keyLocked = keyState?.writable === false

  /**
   * The catalog beneath the user layer: what the composition entry pinned, or
   * else the schema default that `resolve` would supply. The effective value
   * cannot answer this — it still carries the stored override until the unset
   * is applied, so reading it would echo that override straight back the
   * moment reset drops it, leaving the rows unchanged until a reload.
   */
  const inheritedModels = (): unknown => {
    const pinned = getPath(namespace.base, [...settingsPath, 'models'])
    const node = nodeAtPath(root, [...settingsPath, 'models']) as { meta?: { default?: unknown } } | undefined
    return pinned ?? node?.meta?.default
  }

  /**
   * The curated fields of one known adapter family. The family arrives
   * narrowed so the per-family branches below are total: an unknown namespace
   * renders the hint instead and never reaches this body.
   */
  const curatedFields = (family: 'deepseek' | 'pi-ai'): ReactNode => {
    // What a hand-declared route names for itself and nothing else can supply.
    // A whole-section `llm-deepseek` profile is a composition fact with no
    // per-route identity for its schema to carry, hence the family test.
    const ownsIdentity = family === 'pi-ai' && props.declared === true
    const customModels = getPath(draft, ['models'])
    const modelsOverridden = hasPath(draft, ['models'])
    const models = modelDrafts(modelsOverridden ? customModels : inheritedModels())
    const defaultContextWindow = getPath(fallback, ['defaultContextWindow'])
    const defaultMaxTokens = getPath(fallback, ['maxTokens'])
    const keyPlaceholder = keyLocked
      ? t('keyEnvLocked')
      : keyState?.configured === true && props.credentialRequired !== true
        ? t('keyStored')
        : family === 'pi-ai' ? t('keyPlaceholderNative') : t('keyPlaceholder')
    /** What both family editors take: the rows, whose layer owns them, and the two writes. */
    const catalogProps = {
      models,
      overridden: modelsOverridden,
      t,
      disabled,
      onChange: (next: Record<string, unknown>[]) => {
        setDraft(current => setPath(current, ['models'], next) as Record<string, unknown>)
      },
      onReset: () => { setDraft(current => deletePath(current, ['models']) as Record<string, unknown>) },
    }
    const keyField = (
      <div className={styles['field']}>
        <span className={styles['fieldLabelRow']}>
          <span className={styles['fieldLabel']}>{t('keyInput')}</span>
          {props.helpLinks?.apiKeyUrl === undefined
            ? null
            : (
              <a className={styles['helpLink']} href={props.helpLinks.apiKeyUrl} target="_blank" rel="noreferrer">
                {t('getApiKey')}
              </a>
            )}
        </span>
        <div className={styles['inputRow']}>
          <div className={styles['inputGroup']}>
            <input
              className={styles['input']}
              type={showKey ? 'text' : 'password'}
              autoComplete="off"
              value={keyDraft}
              placeholder={keyPlaceholder}
              aria-label={t('keyInput')}
              aria-invalid={shownKeyFailure !== undefined}
              required={props.credentialRequired === true}
              autoFocus={props.autoFocusCredential === true}
              disabled={disabled || keyLocked}
              onChange={(event) => { setKeyDraft(event.target.value) }}
            />
            <button
              type="button"
              className={styles['eyeButton']}
              aria-label={showKey ? t('hideKey') : t('showKey')}
              title={showKey ? t('hideKey') : t('showKey')}
              disabled={disabled || keyLocked}
              onClick={() => { setShowKey(value => !value) }}
            >
              {showKey
                ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                )
                : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
            </button>
          </div>
          {props.showCheck === true
            ? (
              <button
                type="button"
                className={styles['checkButton']}
                disabled={disabled || checking || probeBaseURL === undefined && props.defaults?.baseURL === undefined}
                onClick={() => { void runCheck() }}
              >
                {checking ? t('checking') : t('checkConnection')}
              </button>
            )
            : null}
          {props.showCheck === true && namespace.ns === 'llm-pi-ai' && !props.readOnly
            ? (
              <button
                type="button"
                className={styles['keyListButton']}
                aria-label={t('keysTitle')}
                title={t('keysTitle')}
                disabled={disabled}
                onClick={() => { setKeysOpen(true) }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              </button>
            )
            : null}
        </div>
        {shownKeyFailure === undefined ? null : <p className={styles['error']}>{t(shownKeyFailure)}</p>}
        {checkResult === undefined
          ? null
          : (
            <p
              className={`${styles['checkResult']} ${checkResult.ok ? styles['checkResultOk'] : styles['checkResultFail']}`}
              role="status"
            >
              {checkResult.ok ? checkResult.text : `${t('checkFailed')}: ${checkResult.text}`}
            </p>
          )}
      </div>
    )
    /** The profile fields past the credential: identity, endpoint, catalog. */
    const panelBody = (
      <>
        {/* The name and the protocol are the create card's two remaining
            profile fields; a route the adapter ships defaults both from
            its catalog entry and neither belongs on its card. */}
        {ownsIdentity
          ? (
            <div className={styles['field']}>
              <span className={styles['fieldLabel']}>{t('customDisplayName')}</span>
              <input
                className={styles['input']}
                type="text"
                value={stringAt(draft, 'displayName') ?? ''}
                // What this route is called the moment the field is
                // cleared, which is the layer beneath the one this field
                // edits: a `cordis.yml` may pin a name for a route the
                // catalog does not ship, and only when nothing does is
                // the answer the route id. Reading the effective value
                // instead would echo the stored override back as the
                // thing clearing restores.
                placeholder={stringAt(getPath(namespace.base, [...settingsPath]), 'displayName')
                  ?? props.provider}
                aria-label={t('customDisplayName')}
                disabled={disabled}
                onChange={(event) => { setField('displayName', event.target.value) }}
              />
            </div>
          )
          : null}
        <div className={styles['field']}>
          <span className={styles['fieldLabelRow']}>
            <span className={styles['fieldLabel']}>{t('baseUrl')}</span>
          </span>
          <div className={styles['inputRow']}>
          <input
            className={`${styles['input']} ${styles['monoInput']}`}
            type="text"
            value={stringAt(draft, 'baseURL') ?? ''}
            placeholder={family === 'deepseek'
              ? DEEPSEEK_PUBLIC_BASE_URL
              : stringAt(fallback, 'baseURL') ?? props.defaults?.baseURL ?? t('baseUrlDefault')}
            aria-label={t('baseUrl')}
            disabled={disabled}
            onChange={(event) => {
              setField('baseURL', event.target.value === '' ? undefined : event.target.value)
            }}
          />
          {props.onOpenRequestOptions !== undefined
            ? (
              <button
                type="button"
                className={styles['iconButton']}
                aria-label={t('requestOptions')}
                title={t('requestOptions')}
                disabled={disabled}
                onClick={() => { props.onOpenRequestOptions?.() }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </button>
            )
            : null}
          </div>
          {endpointPreview === undefined
            ? null
            : (
              <p className={styles['endpointPreview']} title={endpointPreview}>
                {t('endpointPreview').replace('{url}', endpointPreview)}
              </p>
            )}
        </div>
        {/* The protocol sits beside the endpoint it describes, as it does
            on the create card. */}
        {ownsIdentity
          ? (
            <div className={styles['field']}>
              <span className={styles['fieldLabel']}>{t('customApi')}</span>
              <select
                className={`${styles['input']} ${styles['selectInput']}`}
                value={probeApi ?? ''}
                aria-label={t('customApi')}
                disabled={disabled}
                onChange={(event) => { setField('api', event.target.value) }}
              >
                {/* A profile naming no protocol — hand-written into
                    settings.yaml with no model to need one — selects
                    nothing rather than reading as if it had picked the
                    first choice. The option is named because a screen
                    reader announces it either way, and an empty one is
                    announced as a choice with no identity. */}
                {probeApi === undefined ? <option value="">{t('customApiUnset')}</option> : null}
                {protocols.map(choice => <option key={choice} value={choice}>{choice}</option>)}
              </select>
            </div>
          )
          : null}
        {/* Both families edit the same rows through the same contract; only
            the extras differ — DeepSeek's inherited capacities, pi-ai's
            endpoint interrogation. */}
        {family === 'deepseek'
          ? (
            <DeepSeekModelsEditor
              {...catalogProps}
              defaultContextWindow={typeof defaultContextWindow === 'number'
                ? defaultContextWindow
                : undefined}
              defaultMaxTokens={typeof defaultMaxTokens === 'number' ? defaultMaxTokens : undefined}
            />
          )
          : (
            <ModelListEditor
              {...catalogProps}
              probe={probe}
              probeBlocked={keyFailure}
              api={api}
              {...props.defaultModel === undefined ? {} : { defaultModel: props.defaultModel }}
              {...props.onSetDefault === undefined ? {} : { onSetDefault: props.onSetDefault }}
              {...props.catalogModels === undefined ? {} : { catalogModels: props.catalogModels }}
              {...props.docsUrl === undefined ? {} : { docsUrl: props.docsUrl }}
            />
          )}
      </>
    )
    if (props.panelStyle === true || props.credentialOnly === true) {
      return props.credentialOnly === true
        ? keyField
        : <div className={styles['panelBody']}>{keyField}{panelBody}</div>
    }
    return (
      <>
        {keyField}
        <details className={styles['customized']}>
          <summary className={styles['customizedSummary']}>{t('customized')}</summary>
          <div className={styles['customizedBody']}>{panelBody}</div>
        </details>
      </>
    )
  }

  return (
    <div className={props.credentialOnly === true ? styles['addBlock'] : styles['editor']}>
      {props.hideTitle === true
        ? null
        : (
          <div className={styles['editorHeader']}>
            <span className={styles['editorTitle']}>{props.displayName}</span>
            {props.provider !== props.displayName
              ? <span className={styles['editorRoute']}>{props.provider}</span>
              : null}
          </div>
        )}
      {layout === 'unknown'
        ? <p className={styles['advancedHint']}>{`${t('advancedHint')} (${namespace.ns})`}</p>
        : curatedFields(layout)}
      {failure !== undefined ? <p className={styles['error']}>{failure}</p> : null}
      {props.credentialOnly === true || modelFailure === undefined
        ? null
        : (
          <p className={styles['advancedHint']}>
            {`${t('model')} ${String(modelFailure.index + 1)}: ${t(modelFailure.key)}`}
          </p>
        )}
      <EditorFooter
        t={t}
        busy={busy}
        submitDisabled={disabled || layout === 'unknown'
          || (props.credentialOnly !== true && modelFailure !== undefined)
          || shownKeyFailure !== undefined
          || (props.credentialRequired === true && keyValue.length === 0)}
        submitLabel={props.submitLabel ?? 'apply'}
        submitBusyLabel={props.submitBusyLabel ?? 'applying'}
        {...props.cancelLabel === undefined ? {} : { cancelLabel: props.cancelLabel }}
        onCancel={() => { props.onClose(false) }}
        onSubmit={() => { void apply() }}
      />
      <ApiKeyListDrawer
        open={keysOpen}
        onClose={() => { setKeysOpen(false) }}
        buildController={() => new ApiKeysController({
          api,
          schema,
          namespaceValue: namespace.value,
          namespaceRevision: namespace.revision,
          settingsPath,
          baseRef: keyRef,
          providerId: props.provider,
        })}
        t={t}
      />
    </div>
  )
}
