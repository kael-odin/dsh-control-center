/**
 * DSH rc.7 lazy-CJS client preset, reproduced out of tree because the DSH
 * preset is not a published package export. Keep this file locked to the
 * compatibility table in packages/control-center/src/compatibility.ts.
 */
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, dirname, resolve as resolvePath } from 'node:path'
import type { UserConfig } from 'tsdown'
import { transform } from 'lightningcss'

const CSS_VIRTUAL_PREFIX = '\0dsh-control-center-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

export const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-attachment',
  '@deepseek-ai/dsh-client-schema-form',
] as const

const RUNTIME_STORE_EXEMPTION = '@deepseek-ai/dsh-client-runtime/client'
export const CLIENT_EXTERNALS: readonly string[] = [...PLATFORM_MODULES, RUNTIME_STORE_EXEMPTION]

const INLINE_SAFE = /^@deepseek-ai\/dsh-(host-apiproxy|session|llm|tools|brand)(\/|$)/
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
