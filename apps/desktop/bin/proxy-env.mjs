/**
 * Cherry 代理设置 → 真实消费。The General page stores `proxyMode`/
 * `proxyUrl`/`proxyBypass` in `control-center-general`; this module is the
 * consumer side: it derives (a) Electron's session proxy config and
 * (b) the env vars handed to the self-hosted harness child (Node ≥24 honors
 * them for global fetch when NODE_USE_ENV_PROXY=1).
 *
 * Plain JS + JSDoc on purpose: the Electron main imports this directly.
 *
 * @typedef {Object} ProxyPrefs
 * @property {string} proxyMode
 * @property {string} proxyUrl
 * @property {string} proxyBypass
 *
 * @typedef {Object} ElectronProxyConfig
 * @property {'direct'|'system'|'fixed_servers'} mode
 * @property {string} [proxyRules]
 * @property {string} [proxyBypassList]
 *
 * @typedef {Object} ChildProxyEnv
 * @property {string} [HTTP_PROXY]
 * @property {string} [HTTPS_PROXY]
 * @property {string} [NO_PROXY]
 * @property {string} [NODE_USE_ENV_PROXY]
 */

/**
 * @param {ProxyPrefs} prefs
 * @returns {string|undefined} semicolon-separated bypass rules, loopback first
 */
function bypassList(prefs) {
  const entries = prefs.proxyBypass
    .split(/[;,\s]+/)
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0)
  // Loopback goes first and is deduped: the DSH surface itself must never
  // ride the proxy, and a user-listed 127.0.0.1 must not appear twice.
  const withLoopback = ['127.0.0.1', 'localhost', ...entries]
  const deduped = [...new Set(withLoopback)]
  if (deduped.length === 0) return undefined
  return deduped.join(';')
}

/**
 * Electron session proxy configuration for the surface.
 * @param {ProxyPrefs} prefs
 * @returns {ElectronProxyConfig}
 */
export function electronProxyConfig(prefs) {
  if (prefs.proxyMode === 'custom' && prefs.proxyUrl.trim().length > 0) {
    /** @type {ElectronProxyConfig} */
    const config = { mode: 'fixed_servers', proxyRules: prefs.proxyUrl.trim() }
    const bypass = bypassList(prefs)
    if (bypass !== undefined) config.proxyBypassList = bypass
    return config
  }
  if (prefs.proxyMode === 'system') return { mode: 'system' }
  return { mode: 'direct' }
}

/**
 * Env vars for the self-hosted harness child. Cherry 'off' means direct:
 * inherited proxy env is explicitly blanked so the child cannot pick one up.
 * 'system' inherits the environment untouched (empty result).
 * @param {ProxyPrefs} prefs
 * @returns {ChildProxyEnv}
 */
export function childProxyEnv(prefs) {
  if (prefs.proxyMode === 'custom' && prefs.proxyUrl.trim().length > 0) {
    /** @type {ChildProxyEnv} */
    const env = {
      HTTP_PROXY: prefs.proxyUrl.trim(),
      HTTPS_PROXY: prefs.proxyUrl.trim(),
      NODE_USE_ENV_PROXY: '1',
    }
    const bypass = bypassList(prefs)
    if (bypass !== undefined) env.NO_PROXY = bypass.replaceAll(';', ',')
    return env
  }
  if (prefs.proxyMode === 'off') {
    return { HTTP_PROXY: '', HTTPS_PROXY: '', NO_PROXY: '', NODE_USE_ENV_PROXY: '1' }
  }
  return {}
}
