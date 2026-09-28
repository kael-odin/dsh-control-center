import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { composeEntries } from '@deepseek-ai/dsh-app-boot'
import { loadOverlayPatches } from '@deepseek-ai/dsh-app-boot'

const root = fileURLToPath(new URL('../../../', import.meta.url))

// The upstream cordis patches ship in a deepseek-harness checkout, not on
// npm. Resolve it the way the desktop shell does (DSH_HARNESS_DIR, then the
// sibling layouts the workspace has lived in) and skip when absent — CI has
// no harness checkout; release and self-host machines do.
const dsh = [
  process.env.DSH_HARNESS_DIR,
  resolve(root, '..', '..', 'deepseek-harness'),
  resolve(root, '..', 'deepseek-harness'),
].find(p => p && existsSync(join(p, 'packages', 'bundle', 'base', 'cordis.patch.yml')))

describe('bundle composition', () => {
  it.skipIf(!dsh)('replaces only the native shell and models rows', () => {
    const base = loadOverlayPatches('test', `${dsh}/packages/bundle/base/cordis.patch.yml`)
    const web = loadOverlayPatches('test', `${dsh}/packages/bundle/web-app/cordis.patch.yml`)
    const control = loadOverlayPatches('test', `${root}/packages/bundle/cordis.patch.yml`)
    const rows = composeEntries([base, web, control])
    const byId = new Map(rows.map(row => [row.id, row]))
    expect(byId.get('ui-settings-general')?.disabled).toBe(true)
    expect(byId.get('ui-settings-models')?.disabled).toBe(true)
    expect(byId.get('spill-policy')?.disabled).toBe(true)
    expect(byId.get('dsh-control-center')?.name).toBe('@dsh-control-center/bundle')
    for (const kept of ['ui-settings', 'ui-settings-plugin-inventory', 'ui-settings-plugins', 'ui-permission', 'ui-agent-preset', 'ui-model-selection']) {
      expect(byId.get(kept)?.disabled).not.toBe(true)
    }
  })

  it('ships a bundle manifest pointing at the profile patch', () => {
    const manifest = JSON.parse(readFileSync(`${root}/packages/bundle/package.json`, 'utf8')) as { dsh?: { bundle?: { patch?: string } } }
    expect(manifest.dsh?.bundle?.patch).toBe('./cordis.patch.yml')
  })
})
