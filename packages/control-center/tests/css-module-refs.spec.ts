/**
 * CSS-module reference integrity.
 *
 * `import css from './X.module.css'` is typed as a string index signature, so
 * `css.thing` / `css['thing']` type-checks even when `.thing` was never
 * declared. React then receives `className={undefined}` and the element renders
 * with UA defaults — no error, no warning, just an unstyled control. That is how
 * every provider card's save button (EditorFooter -> ModelsSection.module.css
 * `.primaryButton`) shipped unstyled.
 *
 * This asserts every class a component reads actually exists in the stylesheet
 * it read it from.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const CLIENT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'client')

/** Class names declared in a CSS module, including `composes` targets. */
function declaredClasses(cssPath: string): Set<string> {
  const source = readFileSync(cssPath, 'utf8')
  // Strip :global(...) bodies — those names belong to third-party DOM, not to
  // this module's exported mapping.
  const scoped = source.replace(/:global\([^)]*\)/g, '')
  return new Set(Array.from(scoped.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g), match => match[1] as string))
}

/** `import css from './Foo.module.css'` -> local identifier + stylesheet path. */
function styleImports(tsxSource: string): Array<{ binding: string; file: string }> {
  return Array.from(
    tsxSource.matchAll(/import\s+(\w+)\s+from\s+'\.\/([^']+\.module\.css)'/g),
    match => ({ binding: match[1] as string, file: match[2] as string }),
  )
}

describe('CSS module references', () => {
  it('every class read in a component exists in the stylesheet it came from', () => {
    const tsxFiles = readdirSync(CLIENT).filter(name => name.endsWith('.tsx'))
    const missing: string[] = []

    for (const tsx of tsxFiles) {
      const source = readFileSync(join(CLIENT, tsx), 'utf8')
      for (const { binding, file } of styleImports(source)) {
        let declared: Set<string>
        try { declared = declaredClasses(join(CLIENT, file)) } catch { continue }

        // `css.foo` and `css['foo']`, but not `css.foo` inside a longer chain.
        const dotted = source.matchAll(new RegExp(`\\b${binding}\\.([A-Za-z_]\\w*)`, 'g'))
        const bracketed = source.matchAll(new RegExp(`\\b${binding}\\['([^']+)'\\]`, 'g'))

        for (const match of [...dotted, ...bracketed]) {
          const key = match[1] as string
          if (!declared.has(key)) missing.push(`${tsx}: ${binding}.${key} not declared in ${file}`)
        }
      }
    }

    expect([...new Set(missing)], 'component reads a CSS class its stylesheet never declares (renders unstyled)').toEqual([])
  })
})
