/**
 * Emit the bundle package's served client bundle as a byte copy of the
 * control-center client bundle.
 *
 * The profile serves /plugins/@dsh-control-center/bundle/client.js from
 * packages/bundle/lib/client.js. That file must be classic-script-safe: the
 * client module system loads bundles via a plain <script> (no type="module"),
 * so a trailing ESM `export {};` aborts the whole script and nothing registers
 * ("loaded without registering"). Bundling the bundle's client re-export
 * through tsdown always re-stamps that marker (rolldown emits it on any ESM
 * chunk). The control-center client bundle is ALREADY the correct artifact —
 * built by the clientBundle preset with the matching loader id
 * (@dsh-control-center/bundle) and a clean CJS closure ending — so this copies
 * it verbatim. Runs after control-center's own bundle step (pnpm -r sorts by
 * the workspace dependency bundle → control-center).
 */
import { copyFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const src = fileURLToPath(new URL('../packages/control-center/lib/client.js', import.meta.url))
const dst = fileURLToPath(new URL('../packages/bundle/lib/client.js', import.meta.url))

mkdirSync(fileURLToPath(new URL('../packages/bundle/lib/', import.meta.url)), { recursive: true })
copyFileSync(src, dst)
console.log(`copy-bundle-client: ${dst} <- ${src}`)
