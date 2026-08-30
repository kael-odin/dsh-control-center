import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { assertCompatibleDsh, SUPPORTED_DSH_VERSION } from '../src/compatibility.ts'

const required = [
  ['@deepseek-ai/dsh-api-remotes', true],
  ['@deepseek-ai/dsh-client-runtime', true],
  ['@deepseek-ai/dsh-client-ui-settings', true],
  ['@deepseek-ai/dsh-client-ui-layout', true],
  ['@deepseek-ai/dsh-client-ui-slots', false],
  ['@deepseek-ai/dsh-client-modules', true],
  ['@deepseek-ai/dsh-api-session-controller', false],
  ['@deepseek-ai/dsh-agent-presets', false],
  ['@deepseek-ai/dsh-settings', false],
] as const

function fixture(
  version = SUPPORTED_DSH_VERSION,
  opts: { onlyHostContract?: boolean } = {},
): NodeJS.Require {
  const root = mkdtempSync(join(tmpdir(), 'control-center-compat-'))
  writeFileSync(join(root, 'package.json'), '{"type":"module"}')
  for (const [name, client] of required) {
    if (opts.onlyHostContract && name !== '@deepseek-ai/dsh-settings') continue
    const directory = join(root, 'node_modules', name)
    mkdirSync(directory, { recursive: true })
    writeFileSync(join(directory, 'package.json'), JSON.stringify({
      name,
      version,
      exports: {
        './package.json': './package.json',
        ...(client ? { './client': './client.js' } : {}),
      },
    }))
  }
  return createRequire(join(root, 'package.json'))
}

describe('DSH compatibility preflight', () => {
  it('accepts the exact 0.1.2 contract package set', () => {
    expect(() => assertCompatibleDsh(fixture())).not.toThrow()
  })

  it('accepts later 0.1.x releases inside the support window (§1.2)', () => {
    expect(() => assertCompatibleDsh(fixture('0.1.1-rc.7'))).not.toThrow()
    expect(() => assertCompatibleDsh(fixture('0.1.4'))).not.toThrow()
  })

  it('fails before activation when the resolved version leaves the window', () => {
    expect(() => assertCompatibleDsh(fixture('0.2.0')))
      .toThrow('expected a version in the 0.1.2 window')
  })

  it('accepts a bundled deployment where only the host contract is on the graph', () => {
    // Packed profiles inline client contract packages into the client bundle,
    // so only dsh-settings (a dependency) is present on the host graph. The
    // gate must not reject the profile for the absent client packages.
    expect(() => assertCompatibleDsh(fixture(SUPPORTED_DSH_VERSION, { onlyHostContract: true })))
      .not.toThrow()
  })
})
