import { describe, expect, it } from 'vitest'
import { childProxyEnv, electronProxyConfig } from '../apps/desktop/bin/proxy-env.mjs'

describe('electronProxyConfig', () => {
  it('direct mode for off, even with a stale url', () => {
    expect(electronProxyConfig({ proxyMode: 'off', proxyUrl: 'http://127.0.0.1:7890', proxyBypass: '' }))
      .toEqual({ mode: 'direct' })
  })

  it('system mode passes through', () => {
    expect(electronProxyConfig({ proxyMode: 'system', proxyUrl: '', proxyBypass: '' }))
      .toEqual({ mode: 'system' })
  })

  it('custom mode carries rules and a loopback-safe bypass list', () => {
    const config = electronProxyConfig({ proxyMode: 'custom', proxyUrl: 'http://127.0.0.1:7890', proxyBypass: '*.internal.com, 10.0.0.0/8' })
    expect(config.mode).toBe('fixed_servers')
    expect(config.proxyRules).toBe('http://127.0.0.1:7890')
    expect(config.proxyBypassList).toBe('127.0.0.1;localhost;*.internal.com;10.0.0.0/8')
  })

  it('dedupes a user-listed loopback entry in the bypass list', () => {
    const config = electronProxyConfig({ proxyMode: 'custom', proxyUrl: 'http://p:1', proxyBypass: '127.0.0.1, x.com' })
    expect(config.proxyBypassList).toBe('127.0.0.1;localhost;x.com')
  })

  it('custom without a url degrades to direct', () => {
    expect(electronProxyConfig({ proxyMode: 'custom', proxyUrl: '   ', proxyBypass: '' }))
      .toEqual({ mode: 'direct' })
  })
})

describe('childProxyEnv', () => {
  it('custom sets both proxies with Node env-proxy enabled and NO_PROXY', () => {
    const env = childProxyEnv({ proxyMode: 'custom', proxyUrl: 'http://127.0.0.1:7890', proxyBypass: 'a.com;b.com' })
    expect(env).toEqual({
      HTTP_PROXY: 'http://127.0.0.1:7890',
      HTTPS_PROXY: 'http://127.0.0.1:7890',
      NODE_USE_ENV_PROXY: '1',
      NO_PROXY: '127.0.0.1,localhost,a.com,b.com',
    })
  })

  it('off blanks inherited proxy env so the child stays direct', () => {
    expect(childProxyEnv({ proxyMode: 'off', proxyUrl: '', proxyBypass: '' })).toEqual({
      HTTP_PROXY: '',
      HTTPS_PROXY: '',
      NO_PROXY: '',
      NODE_USE_ENV_PROXY: '1',
    })
  })

  it('system inherits the environment untouched', () => {
    expect(childProxyEnv({ proxyMode: 'system', proxyUrl: '', proxyBypass: '' })).toEqual({})
  })
})
