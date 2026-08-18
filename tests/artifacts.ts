import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const client = readFileSync(resolve(root, 'packages/control-center/lib/client.js'), 'utf8')
const handoff = /window\.__ModuleLoader__\.load\(\{\s*id:\s*["']@dsh-control-center\/control-center["'],\s*factory:\s*\(require\)\s*=>\s*\{/g
if ([...client.matchAll(handoff)].length !== 1) throw new Error('artifact: client bundle must register exactly one expected lazy factory')
const factory = client.search(handoff)
const style = client.indexOf('data-plugin-css')
if (factory < 0 || style < factory) throw new Error('artifact: CSS injection escaped the lazy factory')
if (!/return module\.exports;\s*\}\s*\}\);/.test(client)) throw new Error('artifact: lazy factory footer is missing')
if (!readFileSync(resolve(root, 'packages/control-center/lib/client.js.map'), 'utf8').includes('sourcesContent')) {
  throw new Error('artifact: client source map lacks embedded sources')
}
const forbidden = [
  '@deepseek-ai/dsh-client-ui-settings-general/client',
  '@deepseek-ai/dsh-client-ui-settings-models/client',
  '@cherrystudio/ui',
  '@tanstack/react-router',
]
for (const specifier of forbidden) {
  if (client.includes(specifier)) throw new Error(`artifact: forbidden runtime dependency ${specifier}`)
}
process.stdout.write(`artifact: lazy client bundle verified (${String(client.length)} bytes)\n`)
