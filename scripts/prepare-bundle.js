#!/usr/bin/env node
/**
 * Prepare bundle artifacts for the desktop shell:
 * - copy the built bundle tarball from packages/bundle to apps/desktop/vendor
 * - stamp bundle-version.json from the tarball filename
 */

import { cp, cpSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'

const repoRoot = join(__dirname, '..')
const bundleDir = join(repoRoot, 'packages', 'bundle')
const vendorDir = join(repoRoot, 'apps', 'desktop', 'vendor')

// 1. copy bundle tarball to vendor dir
const files = readdirSync(bundleDir).filter(f => f.startsWith('dsh-control-center-bundle-') && f.endsWith('.tgz'))
if (files.length === 0) {
  console.error('No bundle tarball found in', bundleDir)
  process.exit(1)
}
const tarball = files[0]
const srcPath = join(bundleDir, tarball)
const destDir = join(process.cwd(), 'apps', 'desktop', 'vendor')
cpSync(srcPath, join(destDir, tarball))
console.log(`Copied ${tarball} to vendor/`)

// 2. extract version from filename
const match = tarball.match(/-([0-9][^-]*)\.tgz$/)
if (!match) {
  console.error('Cannot parse version from tarball name:', tarball)
  process.exit(1)
}
const version = match[1]

// 3. write bundle-version.json
const vendorDir = join(process.cwd(), 'apps', 'desktop', 'vendor')
writeFileSync(join(destDir, 'bundle-version.json'), JSON.stringify({ version: match[1] }))
console.log('bundled plugin version:', version)

// 4. rename tarball to bundle.tgz
const files = readdirSync(destDir).filter(f => f.startsWith('dsh-control-center-bundle-') && f.endsWith('.tgz'))
if (files.length === 0) {
  console.error('No bundle tarball found in vendor dir')
  process.exit(1)
}
const tarball = files[0]
const oldPath = join(destDir, tarball)
const newPath = join(destDir, 'bundle.tgz')
import { renameSync } from 'node:fs'
renameSync(oldPath, newPath)
console.log('Prepared bundle.tgz and bundle-version.json for the shell')