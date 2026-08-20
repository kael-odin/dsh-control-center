/**
 * v6 synth unit test: materialize a minimal synthetic harness (1 workspace
 * package + top-level @deepseek-ai link) and assert the top-level link becomes a
 * junction to the materialized out/packages (no recursion / no loop).
 *
 * Script creates fixtures under .materialize-test/synth, materializes to
 * .materialize-test/synth-out, then inspects the top-level @deepseek-ai link.
 *
 * Usage:
 *   node tests/v6-synth.mjs
 */
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, symlinkSync, lstatSync, realpathSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { join, resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const synth = resolve(root, '.materialize-test/synth')
const out = resolve(root, '.materialize-test/synth-out')
const script = resolve(root, 'scripts/materialize-harness.mjs')

// Build synthetic harness.
rmSync(synth, { recursive: true, force: true })
const pkg = join(synth, 'packages/demo-pkg')
mkdirSync(pkg, { recursive: true })
writeFileSync(join(pkg, 'package.json'), JSON.stringify({ name: 'demo-pkg', main: 'index.js', version: '1.0.0' }))
writeFileSync(join(pkg, 'index.js'), 'demo-ok-1.0.0\n')

const nm = join(synth, 'node_modules')
mkdirSync(join(nm, '@deepseek-ai'), { recursive: true })
// top-level workspace link: node_modules/@deepseek-ai/demo-pkg -> packages/demo-pkg
symlinkSync(relative(join(nm, '@deepseek-ai'), pkg).replace(/\\/g, '/'), join(nm, '@deepseek-ai', 'demo-pkg'), 'junction')

// a .pnpm virtual package whose body is the same workspace package (deps are empty)
const vp = join(nm, '.pnpm/@deepseek-ai+demo-pkg@1.0.0/node_modules/@deepseek-ai')
mkdirSync(vp, { recursive: true })
symlinkSync(relative(vp, pkg).replace(/\\/g, '/'), join(vp, 'demo-pkg'), 'junction')

// Materialize.
rmSync(out, { recursive: true, force: true })
const child = spawn(process.execPath, [script, synth, out], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], shell: false })
let err = ''
child.stderr.on('data', (b) => { err += b.toString() })
child.on('close', (code) => {
  if (code !== 0) { console.error(`v6-synth FAIL: materialize exit=${code} stderr=${err.slice(0, 300)}`); process.exit(1) }
  // Assert top-level @deepseek-ai/demo-pkg is a junction pointing at the materialized packages.
  const link = join(out, 'node_modules/@deepseek-ai/demo-pkg')
  let st
  try { st = lstatSync(link) } catch { console.error(`v6-synth FAIL: top-level link missing`); process.exit(1) }
  if (!st.isSymbolicLink()) { console.error(`v6-synth FAIL: top-level @deepseek-ai/demo-pkg is not a link (isSymbolicLink=false)`); process.exit(1) }
  const real = realpathSync(link).replace(/\\/g, '/').toLowerCase()
  const want = resolve(out, 'packages/demo-pkg').replace(/\\/g, '/').toLowerCase()
  if (real !== want) { console.error(`v6-synth FAIL: link resolves to ${real}, want ${want}`); process.exit(1) }
  const idx = join(real.replace(/\//g, '\\'), 'packages') // real is already packages/demo-pkg
  void idx
  const src = readFileSync(join(out, 'packages/demo-pkg/index.js'), 'utf8')
  if (src.split('\n')[0] !== 'demo-ok-1.0.0') { console.error(`v6-synth FAIL: materialized package content mismatch`); process.exit(1) }
  console.log(`v6-synth PASS: top-level @deepseek-ai/demo-pkg -> ${real}`)
  process.exit(0)
})
child.on('error', (e) => { console.error(`v6-synth FAIL: spawn ${String(e && e.message)}`); process.exit(1) })
