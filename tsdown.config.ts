import { defineConfig } from 'tsdown'

// Node half only. The bundle's lib/client.js is NOT built here: it must be a
// classic-script-safe CJS closure, but bundling the client re-export as ESM
// stamps `export {};` onto the output (which a classic <script> cannot parse).
// The served client bundle is a byte copy of the control-center client bundle
// (already built by the clientBundle preset with the matching loader id) — see
// build/copy-bundle-client.mjs.
export default defineConfig({
  entry: ['packages/bundle/lib/types/index.js', 'packages/bundle/lib/types/invariant.js'],
  outDir: 'packages/bundle/lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
})
