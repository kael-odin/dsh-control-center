/**
 * DSH 0.1.2 lazy-CJS client preset, reproduced out of tree because the DSH
 * preset is not a published package export (upstream authority:
 * packages/client/web/src/platform.ts + packages/client/tsdown.client.ts at
 * deepseek-harness cd5ef814). Keep this file locked to the compatibility
 * table in packages/control-center/src/compatibility.ts.
 */
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, dirname, resolve as resolvePath } from 'node:path'
import type { UserConfig } from 'tsdown'
import { transform } from 'lightningcss'

const CSS_VIRTUAL_PREFIX = '\0dsh-control-center-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'
const PLAIN_CSS_VIRTUAL_PREFIX = '\0dsh-control-center-plain-css:'
const PLAIN_CSS_VIRTUAL_SUFFIX = '.mjs'

/** Seed-table keys (platform singletons) — upstream PLATFORM_MODULES at 0.1.2. */
export const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
] as const

/**
 * Module-table specifiers this package requests beyond the seed. Matching is
 * exact (never normalized): declare the literal specifier the code imports.
 * Mirrors `dsh.client.external` in packages/control-center/package.json.
 */
const REQUESTED_MODULE_TABLE: readonly string[] = [
  '@deepseek-ai/dsh-api-remotes/client',
  '@deepseek-ai/dsh-client-connection/client',
  '@deepseek-ai/dsh-client-locale/client',
  '@deepseek-ai/dsh-client-ui-layout/client',
  '@deepseek-ai/dsh-client-ui-session/client',
  '@deepseek-ai/dsh-client-ui-settings/client',
  '@deepseek-ai/dsh-client-ui-sidebar/client',
]

export const CLIENT_EXTERNALS: readonly string[] = [...PLATFORM_MODULES, ...REQUESTED_MODULE_TABLE]

const INLINE_SAFE = /^@deepseek-ai\/dsh-(session|llm|tools|brand)(\/|$)/
const VENDORED_LIBRARY = /^@deepseek-ai\/(cosmokit|schemastery)(\/|$)/
const GENERATED_REMOTE = /^@deepseek-ai\/dsh-[a-z0-9]+(?:-[a-z0-9]+)*\/remote$/

/** Build one dual-face DSH Client package. */
export function clientBundle(id: string, libEntry: readonly string[]): UserConfig[] {
  return [
    {
      name: id,
      entry: [...libEntry],
      outDir: 'lib',
      format: ['esm'],
      platform: 'node',
      target: 'es2024',
      fixedExtension: false,
      dts: false,
      clean: false,
    },
    {
      name: `${id}/client`,
      entry: { client: 'lib/types/client/index.js' },
      outDir: 'lib',
      format: 'cjs',
      platform: 'browser',
      dts: false,
      sourcemap: true,
      clean: false,
      deps: {
        neverBundle: [...CLIENT_EXTERNALS],
        alwaysBundle: (source: string) => CLIENT_EXTERNALS.includes(source) ? undefined : true,
        onlyBundle: false,
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
        'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
        'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
      },
      plugins: [
        {
          name: 'dsh-control-center-client-purity',
          resolveId(source: string) {
            if (!source.startsWith('@deepseek-ai/')) return null
            if (CLIENT_EXTERNALS.includes(source)) return null
            if (VENDORED_LIBRARY.test(source) || INLINE_SAFE.test(source) || GENERATED_REMOTE.test(source)) return null
            throw new Error(
              `client bundle purity: ${JSON.stringify(source)} is not a DSH platform module or inline-safe wire package`,
            )
          },
        },
        {
          name: 'dsh-control-center-css-modules',
          resolveId(source: string, importer: string | undefined) {
            if (!source.endsWith('.module.css')) return null
            const absolute = importer === undefined ? source : sourceAssetPath(source, importer)
            return CSS_VIRTUAL_PREFIX + absolute + CSS_VIRTUAL_SUFFIX
          },
          async load(virtualId: string) {
            if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
            const fileId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
            this.addWatchFile(fileId)
            const source = await readFile(fileId)
            const result = transform({
              filename: fileId,
              code: source,
              cssModules: { pattern: '[hash]_[local]' },
              minify: true,
            })
            const classMap: Record<string, string> = {}
            for (const [local, value] of Object.entries(result.exports ?? {})) classMap[local] = value.name
            return [
              `const css = ${JSON.stringify(result.code.toString())};`,
              `const tagId = ${JSON.stringify(`${id}/${basename(fileId)}`)};`,
              'if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {',
              '  const tag = document.createElement("style");',
              `  tag.dataset.plugin = ${JSON.stringify(id)};`,
              '  tag.dataset.pluginCss = tagId;',
              '  tag.textContent = css;',
              '  document.head.appendChild(tag);',
              '}',
              `export default ${JSON.stringify(classMap)};`,
            ].join('\n')
          },
        },
        {
          name: 'dsh-control-center-plain-css',
          resolveId(source: string, importer: string | undefined) {
            if (!source.endsWith('.css') || source.endsWith('.module.css')) return null
            const absolute = importer === undefined ? source : sourceAssetPath(source, importer)
            return PLAIN_CSS_VIRTUAL_PREFIX + absolute + PLAIN_CSS_VIRTUAL_SUFFIX
          },
          async load(virtualId: string) {
            if (!virtualId.startsWith(PLAIN_CSS_VIRTUAL_PREFIX)) return null
            const fileId = virtualId.slice(PLAIN_CSS_VIRTUAL_PREFIX.length, -PLAIN_CSS_VIRTUAL_SUFFIX.length)
            this.addWatchFile(fileId)
            const code = await readFile(fileId)
            const result = transform({ filename: fileId, code, minify: true })
            const tagId = `${id}/${basename(fileId)}`
            return [
              `const css = ${JSON.stringify(result.code.toString())};`,
              `const tagId = ${JSON.stringify(tagId)};`,
              'if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {',
              '  const tag = document.createElement("style");',
              `  tag.dataset.plugin = ${JSON.stringify(id)};`,
              '  tag.dataset.pluginCss = tagId;',
              '  tag.textContent = css;',
              '  document.head.appendChild(tag);',
              '}',
            ].join('\n')
          },
        },
      ],
      outputOptions: {
        entryFileNames: 'client.js',
        banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
        footer: 'return module.exports; } });',
        intro: 'var module = { exports: {} }; var exports = module.exports;',
      },
    },
  ]
}

function sourceAssetPath(source: string, importer: string): string {
  const emitted = resolvePath(dirname(importer), source)
  if (existsSync(emitted)) return emitted
  const normalized = emitted.replaceAll('\\', '/')
  const boundary = normalized.indexOf('/lib/types/')
  if (boundary < 0) return emitted
  return resolvePath(normalized.slice(0, boundary), 'src', normalized.slice(boundary + '/lib/types/'.length))
}
