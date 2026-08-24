import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  clearWechatCredentials,
  isWechatSessionExpired,
  loadWechatCredentials,
  WechatApiError,
  wechatAesEcbDecrypt,
  wechatCredentialsPath,
} from '../src/wechat-bot.ts'
import { createCipheriv, randomBytes } from 'node:crypto'

const realHome = process.env.DSH_HOME
const tempHome = mkdtempSync(join(tmpdir(), 'wechat-spec-'))

beforeEach(() => {
  process.env.DSH_HOME = tempHome
})

afterEach(() => {
  if (realHome === undefined) delete process.env.DSH_HOME
  else process.env.DSH_HOME = realHome
})

describe('wechat credentials storage', () => {
  it('resolves token paths under the DSH home and rejects traversal ids', () => {
    const path = wechatCredentialsPath('channel-123')
    expect(path.startsWith(tempHome.replace(/\\/g, '/')) || path.startsWith(tempHome)).toBe(true)
    expect(path.endsWith('channel-123.json')).toBe(true)
    expect(() => wechatCredentialsPath('../escape')).toThrow()
    expect(() => wechatCredentialsPath('a/b')).toThrow()
  })

  it('round-trips credentials through save/load/clear', async () => {
    await clearWechatCredentials('chan-x')
    expect(await loadWechatCredentials('chan-x')).toBeUndefined()

    const { writeFile, mkdir } = await import('node:fs/promises')
    const tokenPath = wechatCredentialsPath('chan-x')
    await mkdir(join(tokenPath, '..'), { recursive: true })
    await writeFile(tokenPath, JSON.stringify({
      token: 'tok',
      baseUrl: 'https://ilinkai.weixin.qq.com',
      accountId: 'bot1',
      userId: 'user1',
    }, null, 2), 'utf8')
    const loaded = await loadWechatCredentials('chan-x')
    expect(loaded).toMatchObject({ token: 'tok', accountId: 'bot1' })

    // A malformed document reads as "no credentials", not a crash.
    await writeFile(tokenPath, '{"token": 42}', 'utf8')
    expect(await loadWechatCredentials('chan-x')).toBeUndefined()

    await clearWechatCredentials('chan-x')
    expect(await loadWechatCredentials('chan-x')).toBeUndefined()
  })
})

describe('session expiry detection', () => {
  it('recognizes server code -14 as expiry and nothing else', () => {
    expect(isWechatSessionExpired(new WechatApiError('expired', { status: 200, code: -14 }))).toBe(true)
    expect(isWechatSessionExpired(new WechatApiError('other', { status: 200, code: 5 }))).toBe(false)
    expect(isWechatSessionExpired(new Error('plain'))).toBe(false)
  })
})

describe('AES-128-ECB media helper', () => {
  it('decrypts what aes-128-ecb encrypts', () => {
    const key = randomBytes(16)
    const cipher = createCipheriv('aes-128-ecb', key, null)
    const plain = Buffer.from('wechat media bytes')
    const encrypted = Buffer.concat([cipher.update(plain), cipher.final()])
    expect(wechatAesEcbDecrypt(new Uint8Array(encrypted), new Uint8Array(key))).toEqual(plain)
  })
})
