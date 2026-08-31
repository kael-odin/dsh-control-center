/**
 * Data management Host service: export / import / clear the Control Center
 * settings namespaces as one JSON snapshot (credentials stay in the DSH
 * credentials store and are never part of the export).
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import { bindTypertRemote } from '@deepseek-ai/dsh-typert-protocol'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import Schema from '@deepseek-ai/schemastery'
import { readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { createHash, createHmac } from 'node:crypto'
import { join } from 'node:path'
import { stripFileProcessingSecrets } from './file-processing-settings.ts'

const FILE_PROCESSING_NAMESPACE = settingsNamespace('control-center-file-processing')

/**
 * Every settings namespace the Control Center plugin owns — the full backup
 * surface. Credentials stay in the DSH credentials store and are never part of
 * an export.
 */
export const DATA_NAMESPACES = [
  'control-center-providers',
  'control-center-provider-stash',
  'control-center-repos',
  'control-center-skills',
  'control-center-mcp',
  'control-center-websearch',
  'control-center-file-processing',
  'control-center-model-prefs',
  'control-center-translation',
  'control-center-channels',
  'control-center-tasks',
  'control-center-local-models',
  'control-center-appearance',
  'control-center-notifications',
  'control-center-webdav',
  'control-center-webdav-nutstore',
  'control-center-s3',
  'control-center-export',
].map(name => settingsNamespace(name))

export interface DataExport {
  version: 1
  exportedAt: string
  namespaces: Record<string, object>
}

/** Regex matching a backup file produced by backupToDirectory. The short hex
 * suffix is optional so backups from before it existed still restore. */
const BACKUP_FILE_PATTERN = /^dsh-control-center-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z(?:-[0-9a-f]{4})?\.json$/

/**
 * Collision-proof backup file name. Two backups can legitimately land in the
 * same millisecond (small payloads on a fast host), and a bare timestamp
 * would silently overwrite the first — so every name carries a random suffix.
 */
function backupFileName(now = new Date()): string {
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 23) + 'Z'
  const suffix = Math.floor(Math.random() * 0x1_0000).toString(16).padStart(4, '0')
  return `dsh-control-center-${timestamp}-${suffix}.json`
}

// ─── S3-compatible cloud backup (AWS Signature V4 over plain fetch) ────────

export const S3_NS = settingsNamespace('control-center-s3')

export interface S3Config {
  endpoint: string
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  /** Optional prefix under the bucket (e.g. `backups/`). */
  prefix: string
}

export interface S3ConfigView {
  endpoint: string
  bucket: string
  region: string
  accessKeyId: string
  prefix: string
  secretSet: boolean
}

export interface S3ConfigUpdate {
  endpoint: string
  bucket: string
  region: string
  accessKeyId: string
  prefix: string
  secret?: string
}

const S3_SCHEMA = Schema.object({
  endpoint: Schema.string().default(''),
  bucket: Schema.string().default(''),
  region: Schema.string().default(''),
  accessKeyId: Schema.string().default(''),
  secretAccessKey: Schema.string().role('secret').default(''),
  prefix: Schema.string().default(''),
})

/** RFC 3986 encode a path segment / query component (AWS requires this form). */
function awsEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
}

/** Sign and perform one S3 request. Returns the raw fetch Response. */
async function s3Request(
  config: S3Config,
  method: 'GET' | 'PUT' | 'HEAD' | 'POST',
  key: string,
  query: string,
  body: Buffer | undefined,
): Promise<Response> {
  const base = config.endpoint.replace(/\/+$/, '')
  const prefix = config.prefix.replace(/^\/+|\/+$/g, '')
  const keyPath = prefix === '' ? key : `${prefix}/${key}`
  const canonicalUri = `/${config.bucket}/${keyPath}`.split('/').map(seg => awsEncode(seg)).join('/')
  const payloadHash = createHash('sha256').update(body ?? Buffer.alloc(0)).digest('hex')

  const host = new URL(base).host
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)
  const service = 's3'

  const signedHeaders = ['host', 'x-amz-content-sha256', 'x-amz-date']
  const canonicalHeaders = [
    `host:${host}\n`,
    `x-amz-content-sha256:${payloadHash}\n`,
    `x-amz-date:${amzDate}\n`,
  ].join('')

  const canonicalRequest = [
    method,
    canonicalUri,
    query,
    canonicalHeaders,
    signedHeaders.join(';'),
    payloadHash,
  ].join('\n')

  const scope = `${dateStamp}/${config.region}/${service}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n')

  const hmac = (key: Buffer, data: string): Buffer => createHmac('sha256', key).update(data).digest()
  const dateKey = hmac(Buffer.from(`AWS4${config.secretAccessKey}`), dateStamp)
  const regionKey = hmac(dateKey, config.region)
  const serviceKey = hmac(regionKey, service)
  const signingKey = hmac(serviceKey, 'aws4_request')
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex')

  const url = `${base}${canonicalUri}${query === '' ? '' : `?${query}`}`
  const init: RequestInit = {
    method,
    headers: {
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      'Authorization': `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders.join(';')}, Signature=${signature}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
  }
  if (body !== undefined) init.body = new Uint8Array(body)
  return fetch(url, init)
}

/** Extract `.json` object keys from a ListObjectsV2 XML body. */
function parseS3Keys(body: string): string[] {
  const keys = new Set<string>()
  const pattern = /<Key>([^<]+)<\/Key>/gi
  let match: RegExpExecArray | null
  while ((match = pattern.exec(body)) !== null) {
    const key = match[1]!.trim()
    if (key.endsWith('.json')) {
      const name = key.split('/').filter(Boolean).pop()
      if (name !== undefined && BACKUP_FILE_PATTERN.test(name)) keys.add(name)
    }
  }
  return [...keys].sort().reverse()
}

/**
 * WebDAV cloud-backup vendors. 坚果云 (nutstore) is plain WebDAV, but users
 * keep separate accounts (and Nutstore requires an app-specific password), so
 * each vendor owns an isolated config namespace under one shared schema.
 */
export type WebDavVendor = 'webdav' | 'nutstore'
export const WEBDAV_VENDORS: readonly WebDavVendor[] = ['webdav', 'nutstore']

export const WEBDAV_NS = settingsNamespace('control-center-webdav')
const WEBDAV_NS_BY_VENDOR: Record<WebDavVendor, ReturnType<typeof settingsNamespace>> = {
  webdav: WEBDAV_NS,
  nutstore: settingsNamespace('control-center-webdav-nutstore'),
}

function webdavNsOf(vendor: WebDavVendor): ReturnType<typeof settingsNamespace> {
  return WEBDAV_NS_BY_VENDOR[vendor] ?? WEBDAV_NS
}

export interface WebDavConfig {
  host: string
  user: string
  pass: string
  path: string
}

/** Config view safe for the wire: the password never leaves the host. */
export interface WebDavConfigView {
  host: string
  user: string
  path: string
  passSet: boolean
}

/** Config update; `pass` is written only when non-empty (write-only input). */
export interface WebDavConfigUpdate {
  host: string
  user: string
  path: string
  pass?: string
}

const WEBDAV_SCHEMA = Schema.object({
  host: Schema.string().default(''),
  user: Schema.string().default(''),
  pass: Schema.string().role('secret').default(''),
  path: Schema.string().default(''),
})

/** Append a path segment to a WebDAV server URL, both trailing-slash tolerant. */
function webdavUrl(config: WebDavConfig, segment: string): string {
  const base = config.host.replace(/\/+$/, '')
  const folder = config.path.replace(/^\/+|\/+$/g, '')
  const name = segment.replace(/^\/+/, '')
  return folder === '' ? `${base}/${name}` : `${base}/${folder}/${name}`
}

function basicAuth(config: WebDavConfig): string {
  return 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64')
}

function webdavError(status: number, statusText: string): Error {
  return new Error(`WebDAV 请求失败 (${status}) ${statusText}`)
}

/** Extract `.json` file hrefs from a PROPFIND Multi-Status body. */
function parsePropfindFiles(body: string): string[] {
  const hrefs = new Set<string>()
  const pattern = /<d?:href[^>]*>([^<]+)<\/d?:href>/gi
  let match: RegExpExecArray | null
  while ((match = pattern.exec(body)) !== null) {
    const href = match[1]!.trim()
    if (href.endsWith('.json')) {
      const name = href.split('/').filter(Boolean).pop()
      if (name !== undefined && BACKUP_FILE_PATTERN.test(name)) hrefs.add(name)
    }
  }
  return [...hrefs].sort().reverse()
}

export class DataService extends Service {
  static inject = ['settings'] as const

  readonly typertRemote = bindTypertRemote(this, 'controlCenterData')

  constructor(ctx: Context, _config?: { logger?: Context['logger'] }) {
    super(ctx, 'controlCenterData')
    for (const vendor of WEBDAV_VENDORS) ctx.settings.register(webdavNsOf(vendor), WEBDAV_SCHEMA)
    ctx.settings.register(S3_NS, S3_SCHEMA)
  }

  async exportControlCenter(): Promise<DataExport> {
    const namespaces: Record<string, object> = {}
    for (const ns of DATA_NAMESPACES) {
      const value = this.ctx.settings.get(ns)
      // JSON round-trip: guarantees every exported value is JSON-safe at the
      // Typert boundary (drops Date/Map/undefined). Uninitialized namespaces
      // export as `{}` so the key is always present in a backup.
      const snapshotValue = ns === FILE_PROCESSING_NAMESPACE
        ? stripFileProcessingSecrets(value)
        : value
      namespaces[ns] = typeof snapshotValue === 'object' && snapshotValue !== null
        ? JSON.parse(JSON.stringify(snapshotValue)) as object
        : {}
    }
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      namespaces,
    }
  }

  async importControlCenter(snapshot: DataExport): Promise<{ absent: true }> {
    if (snapshot?.version !== 1 || typeof snapshot.namespaces !== 'object' || snapshot.namespaces === null) {
      throw new Error('Invalid Control Center data snapshot')
    }
    for (const ns of DATA_NAMESPACES) {
      const value = snapshot.namespaces[ns]
      if (value !== undefined && typeof value === 'object' && value !== null) {
        await this.ctx.settings.update(
          ns,
          ns === FILE_PROCESSING_NAMESPACE ? stripFileProcessingSecrets(value) : value as object,
        )
      }
    }
    this.ctx.logger.info('Imported Control Center data snapshot', { namespaces: Object.keys(snapshot.namespaces).length })
    return { absent: true }
  }

  /** Reset every Control Center settings namespace to its default. */
  async clearControlCenter(): Promise<{ absent: true }> {
    for (const ns of DATA_NAMESPACES) {
      await this.ctx.settings.update(ns, {})
    }
    this.ctx.logger.info('Cleared Control Center data')
    return { absent: true }
  }

  /** Write the snapshot to a file (backup to a local path). */
  async exportToFile(path: string): Promise<{ absent: true }> {
    const snapshot = await this.exportControlCenter()
    writeFileSync(path, JSON.stringify(snapshot, null, 2), 'utf8')
    return { absent: true }
  }

  /** Read a snapshot from a file and import it. */
  async importFromFile(path: string): Promise<{ absent: true }> {
    const raw = readFileSync(path, 'utf8')
    const snapshot = JSON.parse(raw) as DataExport
    return this.importControlCenter(snapshot)
  }

  /**
   * Backup to a directory: create a timestamped snapshot file and prune
   * old backups beyond maxBackups (0 = unlimited).
   * Returns the newly created file path. The Typert gateway wraps this in
   * `{ ok: true, value: string }` on the client side; failures are thrown.
   */
  async backupToDirectory(dir: string, maxBackups: number): Promise<string> {
    try {
            const fileName = backupFileName()
      const filePath = join(dir, fileName)
      const snapshot = await this.exportControlCenter()
      writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf8')

      if (maxBackups > 0) {
        const files = readdirSync(dir)
          .filter(name => BACKUP_FILE_PATTERN.test(name))
          .sort()
        while (files.length > maxBackups) {
          const oldest = files.shift()
          if (oldest !== undefined) unlinkSync(join(dir, oldest))
        }
      }
      this.ctx.logger.info('Backup created', { path: filePath })
      return filePath
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.ctx.logger.error('Backup failed', { dir, error: message })
      throw error instanceof Error ? error : new Error(message)
    }
  }

  /**
   * List existing backup files in a directory, sorted newest-first.
   * Returns the file names; the Typert gateway wraps them in `{ ok, value }`.
   */
  async listBackupFiles(dir: string): Promise<string[]> {
    return readdirSync(dir)
      .filter(name => BACKUP_FILE_PATTERN.test(name))
      .sort()
      .reverse()
  }

  /** Read the stored WebDAV config (password omitted on the wire). */
  async getWebdavConfig(vendor: WebDavVendor = 'webdav'): Promise<WebDavConfigView> {
    const raw = this.ctx.settings.get(webdavNsOf(vendor)) as Partial<WebDavConfig> | undefined
    return {
      host: typeof raw?.host === 'string' ? raw.host : '',
      user: typeof raw?.user === 'string' ? raw.user : '',
      path: typeof raw?.path === 'string' ? raw.path : '',
      passSet: typeof raw?.pass === 'string' && raw.pass.length > 0,
    }
  }

  /** Save the WebDAV config. `pass` is write-only: it replaces the stored
   * secret only when provided and non-empty. */
  async setWebdavConfig(config: WebDavConfigUpdate, vendor: WebDavVendor = 'webdav'): Promise<{ absent: true }> {
    const current = (this.ctx.settings.get(webdavNsOf(vendor)) ?? {}) as Partial<WebDavConfig>
    const next: WebDavConfig = {
      host: config.host,
      user: config.user,
      path: config.path,
      pass: typeof config.pass === 'string' && config.pass.length > 0 ? config.pass : (current.pass ?? ''),
    }
    await this.ctx.settings.update(webdavNsOf(vendor), next)
    return { absent: true }
  }

  private async loadWebdavConfig(vendor: WebDavVendor = 'webdav'): Promise<WebDavConfig> {
    const raw = this.ctx.settings.get(webdavNsOf(vendor)) as Partial<WebDavConfig> | undefined
    const config: WebDavConfig = {
      host: typeof raw?.host === 'string' ? raw.host : '',
      user: typeof raw?.user === 'string' ? raw.user : '',
      pass: typeof raw?.pass === 'string' ? raw.pass : '',
      path: typeof raw?.path === 'string' ? raw.path : '',
    }
    if (!config.host || !config.user || !config.pass) {
      throw new Error('WebDAV 配置不完整：请填写服务器地址、用户名和密码')
    }
    return config
  }

  /** PROPFIND the target collection to verify host + credentials. */
  async testWebdavConnection(vendor: WebDavVendor = 'webdav'): Promise<{ ok: boolean; message: string }> {
    const config = await this.loadWebdavConfig(vendor)
    try {
      const url = webdavUrl(config, '')
      const response = await fetch(url, {
        method: 'PROPFIND',
        headers: {
          Authorization: basicAuth(config),
          Depth: '0',
        },
      })
      if (response.status === 401 || response.status === 403) return { ok: false, message: '认证失败：用户名或密码不正确' }
      if (response.status === 404) return { ok: false, message: `目标路径不存在：${url}` }
      if (response.ok || response.status === 207) return { ok: true, message: '连接成功' }
      return { ok: false, message: webdavError(response.status, response.statusText).message }
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error) }
    }
  }

  /** PUT a timestamped snapshot to the WebDAV collection. Returns the remote file name. */
  async webdavBackup(vendor: WebDavVendor = 'webdav'): Promise<string> {
    const config = await this.loadWebdavConfig(vendor)
        const fileName = backupFileName()
    const snapshot = await this.exportControlCenter()
    const response = await fetch(webdavUrl(config, fileName), {
      method: 'PUT',
      headers: {
        Authorization: basicAuth(config),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snapshot, null, 2),
    })
    if (!response.ok && response.status !== 201 && response.status !== 204) {
      throw webdavError(response.status, response.statusText)
    }
    this.ctx.logger.info('WebDAV backup created', { fileName })
    return fileName
  }

  /** GET a snapshot from the WebDAV collection and import it. */
  async webdavRestore(fileName: string, vendor: WebDavVendor = 'webdav'): Promise<{ absent: true }> {
    const config = await this.loadWebdavConfig(vendor)
    const response = await fetch(webdavUrl(config, fileName), {
      method: 'GET',
      headers: { Authorization: basicAuth(config) },
    })
    if (!response.ok) throw webdavError(response.status, response.statusText)
    const snapshot = await response.json() as DataExport
    await this.importControlCenter(snapshot)
    return { absent: true }
  }

  /** PROPFIND Depth:1 to list snapshot files in the WebDAV collection. */
  async listWebdavBackups(vendor: WebDavVendor = 'webdav'): Promise<string[]> {
    const config = await this.loadWebdavConfig(vendor)
    const response = await fetch(webdavUrl(config, ''), {
      method: 'PROPFIND',
      headers: {
        Authorization: basicAuth(config),
        Depth: '1',
      },
    })
    if (!response.ok && response.status !== 207) throw webdavError(response.status, response.statusText)
    return parsePropfindFiles(await response.text())
  }

  [Symbol.dispose]() {
    // Nothing to release.
  }

  // ─── S3-compatible cloud backup ───────────────────────────────────────────

  /** Read the stored S3 config (secret omitted on the wire). */
  async getS3Config(): Promise<S3ConfigView> {
    const raw = this.ctx.settings.get(S3_NS) as Partial<S3Config> | undefined
    return {
      endpoint: typeof raw?.endpoint === 'string' ? raw.endpoint : '',
      bucket: typeof raw?.bucket === 'string' ? raw.bucket : '',
      region: typeof raw?.region === 'string' ? raw.region : '',
      accessKeyId: typeof raw?.accessKeyId === 'string' ? raw.accessKeyId : '',
      prefix: typeof raw?.prefix === 'string' ? raw.prefix : '',
      secretSet: typeof raw?.secretAccessKey === 'string' && raw.secretAccessKey.length > 0,
    }
  }

  /** Save the S3 config; `secret` is write-only (keeps the stored one when empty). */
  async setS3Config(config: S3ConfigUpdate): Promise<{ absent: true }> {
    const current = (this.ctx.settings.get(S3_NS) ?? {}) as Partial<S3Config>
    const next: S3Config = {
      endpoint: config.endpoint.trim(),
      bucket: config.bucket.trim(),
      region: config.region.trim(),
      accessKeyId: config.accessKeyId.trim(),
      prefix: config.prefix.trim(),
      secretAccessKey: typeof config.secret === 'string' && config.secret.length > 0 ? config.secret : (current.secretAccessKey ?? ''),
    }
    await this.ctx.settings.update(S3_NS, next)
    return { absent: true }
  }

  private async loadS3Config(): Promise<S3Config> {
    const raw = this.ctx.settings.get(S3_NS) as Partial<S3Config> | undefined
    const config: S3Config = {
      endpoint: typeof raw?.endpoint === 'string' ? raw.endpoint : '',
      bucket: typeof raw?.bucket === 'string' ? raw.bucket : '',
      region: typeof raw?.region === 'string' ? raw.region : '',
      accessKeyId: typeof raw?.accessKeyId === 'string' ? raw.accessKeyId : '',
      secretAccessKey: typeof raw?.secretAccessKey === 'string' ? raw.secretAccessKey : '',
      prefix: typeof raw?.prefix === 'string' ? raw.prefix : '',
    }
    if (!config.endpoint || !config.bucket || !config.accessKeyId || !config.secretAccessKey) {
      throw new Error('S3 配置不完整：请填写端点、存储桶、Access Key 和 Secret Key')
    }
    return config
  }

  /** HEAD the bucket to verify endpoint + credentials. */
  async testS3Connection(): Promise<{ ok: boolean; message: string }> {
    try {
      const config = await this.loadS3Config()
      const response = await s3Request(config, 'HEAD', '', '', undefined)
      if (response.status === 401 || response.status === 403) return { ok: false, message: '认证失败：Access Key 或 Secret 不正确' }
      if (response.status === 404) return { ok: false, message: '存储桶不存在，请检查名称' }
      if (response.ok || response.status === 200) return { ok: true, message: '连接成功' }
      return { ok: false, message: `S3 请求失败 (${response.status}) ${response.statusText}` }
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error) }
    }
  }

  /** PUT a timestamped snapshot to the bucket. Returns the remote object name. */
  async s3Backup(): Promise<string> {
    const config = await this.loadS3Config()
        const fileName = backupFileName()
    const snapshot = await this.exportControlCenter()
    const response = await s3Request(config, 'PUT', fileName, '', Buffer.from(JSON.stringify(snapshot, null, 2), 'utf8'))
    if (!response.ok && response.status !== 201 && response.status !== 204 && response.status !== 200) {
      throw new Error(`S3 备份失败 (${response.status}) ${(await response.text()).slice(0, 200)}`)
    }
    this.ctx.logger.info('S3 backup created', { fileName })
    return fileName
  }

  /** GET a snapshot from the bucket and import it. */
  async s3Restore(fileName: string): Promise<{ absent: true }> {
    const config = await this.loadS3Config()
    const response = await s3Request(config, 'GET', fileName, '', undefined)
    if (!response.ok) throw new Error(`S3 恢复失败 (${response.status}) ${response.statusText}`)
    const snapshot = await response.json() as DataExport
    await this.importControlCenter(snapshot)
    return { absent: true }
  }

  /** ListObjectsV2 (prefix-scoped) to enumerate snapshot objects. */
  async listS3Backups(): Promise<string[]> {
    const config = await this.loadS3Config()
    const prefix = config.prefix.replace(/^\/+|\/+$/g, '')
    const query = `list-type=2${prefix === '' ? '' : `&prefix=${encodeURIComponent(prefix)}`}`
    const response = await s3Request(config, 'GET', '', query, undefined)
    if (!response.ok && response.status !== 200) throw new Error(`S3 列表失败 (${response.status}) ${response.statusText}`)
    return parseS3Keys(await response.text())
  }
}