import { defineConfig } from 'tsdown'

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
