import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = resolve(root, 'packages/bundle')
const stage = resolve(root, '.pack-bundle')
rmSync(stage, { recursive: true, force: true })
mkdirSync(stage, { recursive: true })
for (const name of ['cordis.patch.yml', 'lib']) cpSync(resolve(source, name), resolve(stage, name), { recursive: true })
cpSync(resolve(root, 'LICENSE'), resolve(stage, 'LICENSE'))
const manifest = JSON.parse(readFileSync(resolve(source, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>
  scripts?: unknown
  [key: string]: unknown
}
manifest.dependencies = {
  ...manifest.dependencies,
  '@dsh-control-center/control-center': `file:${resolve(root, '.packs/dsh-control-center-control-center-0.1.0.tgz').replaceAll('\\', '/')}`,
}
delete manifest.scripts
writeFileSync(resolve(stage, 'package.json'), `${JSON.stringify(manifest, undefined, 2)}\n`)
