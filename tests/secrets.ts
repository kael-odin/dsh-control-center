import { readdir, readFile } from 'node:fs/promises'
import { dirname, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = new URL('../', import.meta.url)
const ROOT_PATH = dirname(fileURLToPath(new URL('package.json', ROOT)))
const IGNORED_DIRECTORIES = new Set([
  '.git', '.materialized', '.pack-bundle', '.packs', 'lib', 'node_modules', 'playwright-report', 'test-results',
])
const TEXT_EXTENSIONS = new Set([
  '', '.cjs', '.css', '.js', '.json', '.jsx', '.md', '.mjs', '.ts', '.tsx', '.txt', '.yaml', '.yml',
])
const SYNTHETIC_CREDENTIAL = ['local', 'fixture', 'key'].join('-')
/** Test fixtures that materialize the documented synthetic credential. */
const ALLOWED_FIXTURE_FILES = new Set(['tests/packed-browser-e2e.ts', 'tests/visual-probe.ts'])
const SCANNER_FILE = 'tests/secrets.ts'
const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'OpenAI-style secret key', pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { name: 'GitHub token', pattern: /\bgh(?:p|o|s|u|r)_[A-Za-z0-9_]{20,}\b/g },
  { name: 'Google API key', pattern: /\bAIza[0-9A-Za-z_-]{20,}\b/g },
  { name: 'private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'embedded Zen endpoint credential', pattern: /opencode\.ai\/zen\/go[\s\S]{0,300}\bsk-[A-Za-z0-9_-]{20,}\b/g },
]

async function collect(directory: URL): Promise<URL[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: URL[] = []
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) files.push(...await collect(new URL(`${entry.name}/`, directory)))
      continue
    }
    if (entry.isFile() && TEXT_EXTENSIONS.has(extname(entry.name))) files.push(new URL(entry.name, directory))
  }
  return files
}

const findings: string[] = []
for (const file of await collect(ROOT)) {
  const path = relative(ROOT_PATH, fileURLToPath(file)).replaceAll('\\', '/')
  const text = await readFile(file, 'utf8')
  for (const { name, pattern } of SECRET_PATTERNS) {
    pattern.lastIndex = 0
    for (const match of text.matchAll(pattern)) findings.push(`${path}: ${name}: ${match[0].slice(0, 24)}…`)
  }
  for (const match of text.matchAll(/\b[A-Z][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD):\s*([^\s$<{][^\s'"\\n]*)/g)) {
    const syntheticFixture = match[1] === SYNTHETIC_CREDENTIAL
      && (ALLOWED_FIXTURE_FILES.has(path) || path === SCANNER_FILE)
    if (!syntheticFixture) {
      findings.push(`${path}: credential-like assignment: ${match[1]?.slice(0, 8) ?? ''}…`)
    }
  }
}

if (findings.length > 0) throw new Error(`secret scan failed:\n${findings.join('\n')}`)
process.stdout.write('secrets: tracked source tree contains no embedded credentials\n')
