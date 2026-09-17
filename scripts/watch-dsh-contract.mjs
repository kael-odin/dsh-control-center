/**
 * DSH contract watch: compare the contract line this repo pins
 * (SUPPORTED_DSH_VERSION in compatibility.ts) against the npm registry and
 * open a tracking issue when a newer 0.1.x contract release exists. CI runs
 * this on a schedule (see .github/workflows/contract-watch.yml); locally it is
 * a read-only report unless GH_TOKEN plus --issue are provided.
 *
 * Prerelease-aware: 0.1.6-alpha.2 ranks above 0.1.6-alpha.1 and below
 * 0.1.6-rc.1 / 0.1.7. Only the same 0.1.x window is reported — a new minor
 * deserves the deliberate compatibility review PLUGINIZATION §1.2 asks for,
 * which the issue body says in plain words.
 */
import { readFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const REPO = 'kael-odin/dsh-control-center'
const PROBE_PACKAGE = '@deepseek-ai/dsh-settings'

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(version)
  if (match === null) return null
  return {
    version,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    pre: match[4] === undefined ? null : match[4].split('.').map(part => /^\d+$/.test(part) ? Number(part) : part),
  }
}

/** Semver precedence for the shapes the DSH release line actually ships. */
function compareVersions(a, b) {
  const left = parseVersion(a)
  const right = parseVersion(b)
  if (left === null || right === null) return a < b ? -1 : a > b ? 1 : 0
  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] !== right[key]) return left[key] < right[key] ? -1 : 1
  }
  if (left.pre === null && right.pre === null) return 0
  if (left.pre === null) return 1
  if (right.pre === null) return -1
  for (let i = 0; i < Math.max(left.pre.length, right.pre.length); i++) {
    const l = left.pre[i]
    const r = right.pre[i]
    if (l === undefined) return -1
    if (r === undefined) return 1
    if (l === r) continue
    const lNumber = typeof l === 'number'
    const rNumber = typeof r === 'number'
    if (lNumber && rNumber) return l < r ? -1 : 1
    if (lNumber) return -1
    if (rNumber) return 1
    return l < r ? -1 : 1
  }
  return 0
}

async function main() {
  const source = await readFile('packages/control-center/src/compatibility.ts', 'utf8')
  const pinned = /export const SUPPORTED_DSH_VERSION = '([^']+)'/.exec(source)?.[1]
  if (pinned === undefined) throw new Error('SUPPORTED_DSH_VERSION not found in compatibility.ts')

  const packument = await fetch(`https://registry.npmjs.org/${PROBE_PACKAGE.replace('/', '%2F')}`, {
    headers: { accept: 'application/vnd.npm.install-v1+json, application/json' },
  })
  if (!packument.ok) throw new Error(`registry fetch failed: HTTP ${packument.status}`)
  const versions = Object.keys((await packument.json()).versions ?? {})

  const pinnedParsed = parseVersion(pinned)
  const newer = versions
    .filter(candidate => {
      const parsed = parseVersion(candidate)
      return parsed !== null
        && parsed.major === pinnedParsed.major
        && parsed.minor === pinnedParsed.minor
        && compareVersions(candidate, pinned) > 0
    })
    .sort(compareVersions)

  if (newer.length === 0) {
    console.log(`contract watch: ${PROBE_PACKAGE} has nothing newer than ${pinned} in the ${pinnedParsed.major}.${pinnedParsed.minor} line`)
    return
  }

  const latest = newer.at(-1)
  // Scripting mode for the canary workflow: print just the newest version.
  if (process.argv.includes('--next')) {
    console.log(latest)
    return
  }
  const acrossMinor = versions.some(candidate => {
    const parsed = parseVersion(candidate)
    return parsed !== null && parsed.major === pinnedParsed.major && parsed.minor > pinnedParsed.minor
  })
  const title = `DSH contract update available: ${latest} (pinned ${pinned})`
  const body = [
    '`scripts/watch-dsh-contract.mjs` found contract releases newer than the pinned baseline.',
    '',
    `- Pinned: \`${pinned}\``,
    `- Newer in the ${pinnedParsed.major}.${pinnedParsed.minor} line: ${newer.map(v => `\`${v}\``).join(', ')}`,
    acrossMinor ? '- A newer **minor** exists too: that means a deliberate compatibility review per PLUGINIZATION §1.2, not a routine bump.' : '',
    '',
    '### Suggested next steps',
    '',
    '1. Diff the contract surface between the pinned version and the newest release',
    '   (the harness checkout is the reference: its `packages/**` sources at the release commit).',
    '2. Bump via the documented one-shot migration (`scripts/migrate-dsh-0.1.6.mjs` as the template),',
    '   adjust `SUPPORTED_DSH_VERSION`, `DSH_SOURCE_BASELINE`, and `build/client-bundle.ts` to the new upstream',
    '   platform tables, then run `pnpm check` and the browser E2E.',
    '3. Record the migration in `docs/MIGRATION_PLAN.md`.',
    '',
    '_Automated issue — close it when the pin catches up._',
  ].filter(line => line !== '').join('\n')

  console.log(`contract watch: ${title}`)
  if (process.argv.includes('--issue') === false || process.env.GITHUB_TOKEN === undefined) {
    console.log(`(report only — issue body follows)\n\n${body}`)
    return
  }
  // GitHub Actions runs provide GH_TOKEN implicitly via `gh` auth.
  const existing = await exec('gh', ['issue', 'list', '--repo', REPO, '--state', 'open', '--search', 'in:title "DSH contract update available"', '--json', 'number,title'], {
    env: { ...process.env, GH_TOKEN: process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN },
  }).then(r => JSON.parse(r.stdout)).catch(() => [])
  const open = existing.find(issue => issue.title === title)
  if (open !== undefined) {
    console.log(`contract watch: issue #${open.number} already tracks this version`)
    return
  }
  await exec('gh', ['issue', 'create', '--repo', REPO, '--title', title, '--body', body, '--label', 'contract-watch'], {
    env: { ...process.env, GH_TOKEN: process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN },
  })
  console.log('contract watch: tracking issue created')
}

await main()
