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
  ['@deepseek-ai/dsh-host-apiproxy', true],
  ['@deepseek-ai/dsh-settings', false],
] as const

function fixture(version = SUPPORTED_DSH_VERSION): NodeJS.Require {
  const root = mkdtempSync(join(tmpdir(), 'control-center-compat-'))
  writeFileSync(join(root, 'package.json'), '{"type":"module"}')
  for (const [name, client] of required) {
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
  it('accepts the exact rc.7 contract package set', () => {
    expect(() => assertCompatibleDsh(fixture())).not.toThrow()
  })

  it('fails before activation when one resolved package version drifts', () => {
    expect(() => assertCompatibleDsh(fixture('0.1.0-rc.8')))
      .toThrow('expected 0.1.0-rc.7, resolved 0.1.0-rc.8')
  })
})
