import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { composeEntries } from '@deepseek-ai/dsh-app-boot'
import { loadOverlayPatches } from '@deepseek-ai/dsh-app-boot'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const dsh = resolve(root, '..', 'deepseek-harness')

describe('bundle composition', () => {
  it('replaces only the native shell and models rows', () => {
    const base = loadOverlayPatches('test', `${dsh}/packages/bundle/base/cordis.patch.yml`)
    const web = loadOverlayPatches('test', `${dsh}/packages/bundle/web-app/cordis.patch.yml`)
    const control = loadOverlayPatches('test', `${root}/packages/bundle/cordis.patch.yml`)
    const rows = composeEntries([base, web, control])
    const byId = new Map(rows.map(row => [row.id, row]))
    expect(byId.get('ui-settings-general')?.disabled).toBe(true)
    expect(byId.get('ui-settings-models')?.disabled).toBe(true)
    expect(byId.get('dsh-control-center')?.name).toBe('@dsh-control-center/control-center')
    for (const kept of ['ui-settings', 'ui-settings-plugin-inventory', 'ui-settings-plugins', 'ui-permission', 'ui-agent-preset', 'ui-model-selection']) {
      expect(byId.get(kept)?.disabled).not.toBe(true)
    }
  })

  it('ships a bundle manifest pointing at the profile patch', () => {
    const manifest = JSON.parse(readFileSync(`${root}/packages/bundle/package.json`, 'utf8')) as { dsh?: { bundle?: { patch?: string } } }
    expect(manifest.dsh?.bundle?.patch).toBe('./cordis.patch.yml')
  })
})
