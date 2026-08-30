/**
 * Design-token integrity guard.
 *
 * The Control Center consumes Cherry's unprefixed token contract
 * (`--background`, `--foreground`, `--border`, …) defined in
 * `src/client/cherry-tokens.css` and scoped to `.cc-surface`.
 *
 * Two failure modes are invisible to review and to grep, but do change what
 * renders, so they are asserted here instead:
 *
 *  1. A component consumes a token name that is never defined. Without a
 *     fallback the whole declaration is dropped at computed-value time; with
 *     one, the fallback wins forever and the token is decorative. Either way
 *     the intended value never applies.
 *  2. A surface consumes the contract without establishing `.cc-surface`, so
 *     every token in its stylesheet resolves against nothing. The DSH host
 *     only supplies `--ds-*` / `--dsw-* `/ `--dsh-*`, never the unprefixed
 *     contract, so there is no ambient fallback.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DEFAULT_THEME_OVERRIDES, getForegroundColor, THEME_COLOR_PRESETS } from '../src/client/theme-overrides.ts'

const CLIENT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'client')
const TOKENS_FILE = 'cherry-tokens.css'

/** Tokens owned by the DSH host theme, not by our token layer. */
const HOST_PREFIXES = ['--ds-', '--dsw-', '--dsh-']

/** Per-element custom properties set inline from TSX, not theme tokens. */
const INLINE_LAYOUT_VARS = new Set(['--cols', '--ratio'])

function clientFiles(): string[] {
  const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return /\.(module\.css|tsx|ts)$/.test(entry.name) ? [full] : []
  })
  return walk(CLIENT)
}

/** Custom properties declared anywhere in the token layer. */
function definedTokens(): Set<string> {
  const css = readFileSync(join(CLIENT, TOKENS_FILE), 'utf8')
  return new Set(Array.from(css.matchAll(/(--[a-z0-9-]+)\s*:/g), match => match[1] as string))
}

/** Every `var(--x)` reference, with the file it came from. */
function tokenReferences(files: string[]): Map<string, string[]> {
  const refs = new Map<string, string[]>()
  for (const file of files) {
    if (file.endsWith(TOKENS_FILE)) continue
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
      const name = match[1] as string
      const seen = refs.get(name) ?? []
      seen.push(file.slice(CLIENT.length + 1).replaceAll('\\', '/'))
      refs.set(name, seen)
    }
  }
  return refs
}

describe('design tokens', () => {
  it('every consumed token is defined by the token layer or the host contract', () => {
    const defined = definedTokens()
    const orphans: string[] = []

    for (const [token, users] of tokenReferences(clientFiles())) {
      if (defined.has(token)) continue
      if (HOST_PREFIXES.some(prefix => token.startsWith(prefix))) continue
      if (INLINE_LAYOUT_VARS.has(token)) continue
      orphans.push(`${token} <- ${[...new Set(users)].join(', ')}`)
    }

    expect(orphans, `undefined tokens consumed (define them in ${TOKENS_FILE} or use the real contract name)`).toEqual([])
  })

  it('every application.surface establishes the .cc-surface token scope it depends on', () => {
    const indexSource = readFileSync(join(CLIENT, 'index.ts'), 'utf8')

    // Each surface registration ends `}, ComponentName))`; take the first such
    // tail after every `name: 'application.surface'` marker.
    const components = new Set<string>()
    for (const marker of indexSource.matchAll(/name:\s*'application\.surface'/g)) {
      const tail = /\},\s*(\w+)\)\)/.exec(indexSource.slice(marker.index))
      if (tail?.[1] !== undefined) components.add(tail[1])
    }
    expect(components.size, 'no application.surface registrations found — has index.ts changed shape?').toBeGreaterThan(0)

    // The unprefixed contract only resolves inside .cc-surface.
    const contract = [...definedTokens()].filter(token => !token.startsWith('--cs-'))
    const violations: string[] = []

    for (const component of components) {
      const tsx = join(CLIENT, `${component}.tsx`)
      const styles = join(CLIENT, `${component}.module.css`)
      const tsxSource = readFileSync(tsx, 'utf8')
      if (tsxSource.includes('cc-surface')) continue

      // No scope established — then it must not consume the contract at all.
      const consumed = new Set<string>()
      for (const file of [tsx, styles]) {
        let source: string
        try { source = readFileSync(file, 'utf8') } catch { continue }
        for (const match of source.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
          if (contract.includes(match[1] as string)) consumed.add(match[1] as string)
        }
      }
      if (consumed.size > 0) {
        violations.push(`${component} consumes ${consumed.size} contract token(s) (${[...consumed].slice(0, 4).join(', ')}…) but never sets cc-surface`)
      }
    }

    expect(violations, 'surfaces consuming the Cherry contract without establishing its scope').toEqual([])
  })
})

describe('theme colour derivation', () => {
  // Cherry's getForegroundColor (src/renderer/utils/style.ts): WCAG 2.0
  // relative luminance, black above 0.179. Every one of Cherry's own presets
  // lands above the threshold, so all of them take black text — which is why
  // a fixed `--primary-foreground` cannot serve them.
  it('matches Cherry for every shipped preset', () => {
    for (const preset of THEME_COLOR_PRESETS) {
      expect(getForegroundColor(preset), `preset ${preset}`).toBe('#000000')
    }
  })

  it('picks white only for genuinely dark colours', () => {
    expect(getForegroundColor('#000000')).toBe('#FFFFFF')
    expect(getForegroundColor('#1a1a1e')).toBe('#FFFFFF')
    expect(getForegroundColor('#FFFFFF')).toBe('#000000')
    expect(getForegroundColor('#fff')).toBe('#000000') // 3-digit shorthand
  })

  it('falls back to white for malformed input instead of throwing', () => {
    expect(getForegroundColor('not-a-colour')).toBe('#FFFFFF')
    expect(getForegroundColor('')).toBe('#FFFFFF')
  })

  it('keeps the host-side schema default in sync with the client default', () => {
    // The host half never imports client code, so the literal is duplicated in
    // src/index.ts. Assert it rather than letting the two drift apart.
    const hostSource = readFileSync(resolve(CLIENT, '..', 'index.ts'), 'utf8')
    const declared = /colorPrimary:\s*z\.string\(\)\.default\('([^']+)'\)/.exec(hostSource)?.[1]
    expect(declared, 'could not find the appearance colorPrimary schema default in src/index.ts').toBeDefined()
    expect(declared).toBe(DEFAULT_THEME_OVERRIDES.colorPrimary)
  })

  it('emits themed values at dark-theme specificity so they are not overridden', () => {
    // cherry-tokens.css re-declares --cs-primary-foreground and --cs-ring under
    // `body[data-ds-dark-theme] .cc-surface`, which outranks a bare
    // `.cc-surface`. The override layer must restate them at that specificity.
    const tokens = readFileSync(join(CLIENT, TOKENS_FILE), 'utf8')
    const darkBlock = tokens.slice(tokens.indexOf('body[data-ds-dark-theme] .cc-surface'))
    const source = readFileSync(join(CLIENT, 'theme-overrides.ts'), 'utf8')

    for (const token of ['--cs-primary-foreground', '--cs-ring']) {
      if (!darkBlock.includes(`${token}:`)) continue
      expect(
        source.includes('body[data-ds-dark-theme] .cc-surface'),
        `${token} is re-declared in the dark block, so applyThemeOverrides must also target body[data-ds-dark-theme] .cc-surface`,
      ).toBe(true)
    }
  })
})
