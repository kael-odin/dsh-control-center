/**
 * host-in-main inner probe — executed with cwd at the DSH harness so bare
 * specifiers (including @deepseek-ai/cordis) resolve against harness node_modules.
 * Mounts app-boot's profile boot trunk and prepares the web profile.
 */
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { existsSync } from 'node:fs'

const harness = process.env.DSH_HARNESS_DIR || 'D:/Github_Open/deepseek-harness'
const profileName = process.env.DSH_PROBE_PROFILE || 'web'

if (!existsSync(resolve(harness, 'apps/cli/package.json'))) {
  console.error(`HOST_IN_MAIN=FAIL harness not found at ${harness}`)
  process.exit(1)
}

try {
  const profileMod = await import(pathToFileURL(resolve(harness, 'apps/cli/src/profile-boot.ts')).href)
  const profile = profileMod.prepareProfile(profileName)
  if (!profile || !profile.dir) throw new Error('profile.dir missing')
  console.log(`PREPARE_PROFILE=OK ${profile.dir}`)
  console.log(`HOST_IN_MAIN=OK`)
  process.exit(0)
} catch (e) {
  console.error(`HOST_IN_MAIN=FAIL ${String((e && e.message) || e).slice(0, 300)}`)
  process.exit(1)
}
