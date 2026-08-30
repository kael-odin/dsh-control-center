/**
 * Theme probe: capture the Appearance page (theme-colour swatches) plus a
 * primary-button contrast audit, in light and dark.
 *
 * Proves the pieces the unit tests cannot: that the picked colour actually
 * reaches --primary / --primary-foreground / --ring on a real surface, and that
 * the derived on-primary text clears WCAG AA against it in both themes.
 *
 * Run: npx tsx tests/probe-theme.ts
 */
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawn, type ChildProcess } from 'node:child_process'
import { chromium } from 'playwright'
import { bundlePack } from './packs.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DSH = resolve(ROOT, '..', 'deepseek-harness')
const CLI = join(DSH, 'apps/cli/src/bin.ts')
const SHOTS = join(ROOT, 'shots')

async function run(args: string[], env: NodeJS.ProcessEnv): Promise<{ code: number; output: string }> {
  const loader = pathToFileURL(join(DSH, 'node_modules/tsx/dist/loader.mjs')).href
  return await new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, ['--import', loader, CLI, ...args], { cwd: DSH, env, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', chunk => { output += chunk.toString() })
    child.stderr.on('data', chunk => { output += chunk.toString() })
    child.on('error', reject)
    child.on('close', code => { resolveRun({ code: code ?? 1, output }) })
  })
}

async function startHost(home: string): Promise<{ child: ChildProcess; url: string }> {
  const loader = pathToFileURL(join(DSH, 'node_modules/tsx/dist/loader.mjs')).href
  const child = spawn(process.execPath, ['--import', loader, CLI, 'web', '--host', '127.0.0.1', '--port', '3200', '--no-open'], {
    cwd: DSH,
    env: { ...process.env, DSH_HOME: home, DSH_PERMISSION_MODE: 'danger-full-access' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  const url = await new Promise<string>((resolveUrl, reject) => {
    const timeout = setTimeout(() => reject(new Error(`DSH startup timed out\n${output}`)), 60_000)
    const consume = (chunk: Buffer): void => {
      output += chunk.toString()
      const match = /dsh web: (http:\/\/127\.0\.0\.1:\d+)/.exec(output)
      if (match?.[1] !== undefined) { clearTimeout(timeout); resolveUrl(match[1]) }
    }
    child.stdout.on('data', consume)
    child.stderr.on('data', consume)
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`DSH exited ${String(code)}\n${output}`)) })
  })
  return { child, url }
}

/** WCAG 2.0 contrast ratio between two rendered colours. */
function contrast(a: [number, number, number], b: [number, number, number]): number {
  const lum = ([r, g, bl]: [number, number, number]): number => {
    const n = (c: number): number => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4) }
    return 0.2126 * n(r) + 0.7152 * n(g) + 0.0722 * n(bl)
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

function parseRgb(value: string): [number, number, number] {
  const nums = value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0]
  return [nums[0] ?? 0, nums[1] ?? 0, nums[2] ?? 0]
}

async function main(): Promise<void> {
  const pack = bundlePack()
  const home = await mkdtemp(join(tmpdir(), 'dsh-theme-probe-'))
  await writeFile(join(home, '.credentials.yaml'), 'CONTROL_CENTER_E2E_API_KEY: local-fixture-key\n')
  await writeFile(join(home, 'settings.yaml'), [
    'ui-onboarding:',
    '  welcomeNoticeVersion: 2026-08-13.1',
    '',
  ].join('\n'))
  const install = await run(['plugin', '--profile', 'web', 'add', pack], { ...process.env, DSH_HOME: home })
  if (install.code !== 0) throw new Error(`install failed\n${install.output}`)
  const host = await startHost(home)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, locale: 'zh-CN' })
    await page.goto(host.url, { waitUntil: 'load' })
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
    const dialog0 = page.getByRole('dialog')
    if (await dialog0.count() > 0) {
      const dismiss = dialog0.getByRole('button', { name: /知道了|稍后|关闭|继续/ }).last()
      if (await dismiss.count() > 0) await dismiss.click().catch(() => {})
      await page.keyboard.press('Escape')
      await dialog0.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {})
    }
    const mask = page.locator('[aria-hidden="true"][class*="mask"]')
    if (await mask.count() > 0) {
      await mask.first().click({ position: { x: 4, y: 4 } }).catch(() => {})
      await mask.first().waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {})
    }
    await page.getByRole('button', { name: '设置', exact: true }).evaluate((b: HTMLButtonElement) => { b.click() })
    const dialog = page.getByRole('dialog', { name: '设置' })
    await dialog.waitFor({ timeout: 15_000 })
    // Click through the DOM: a leftover presentation mask can still intercept
    // synthetic pointer events even after the dialog opens.
    await dialog.getByRole('button', { name: '外观', exact: true }).evaluate((b: HTMLButtonElement) => { b.click() })
    await page.waitForTimeout(1200)

    // The DeepSeek onboarding prompt surfaces on first visit and covers the page.
    const later = page.getByRole('button', { name: /稍后配置|稍后|知道了/ })
    if (await later.count() > 0) {
      await later.last().evaluate((b: HTMLButtonElement) => { b.click() })
      await page.waitForTimeout(600)
    }

    for (const theme of ['light', 'dark'] as const) {
      await page.evaluate((mode) => {
        if (mode === 'dark') document.body.setAttribute('data-ds-dark-theme', '')
        else document.body.removeAttribute('data-ds-dark-theme')
      }, theme)
      await page.waitForTimeout(400)
      await page.screenshot({ path: join(SHOTS, `probe-theme-appearance-${theme}.png`) })

      // No inner named functions here: esbuild's keepNames transform would wrap
      // them in a __name() helper that does not exist in the page context.
      const audit = await page.evaluate(() => {
        const surface = document.querySelector('.cc-surface')
        if (surface === null) return null
        const styles = getComputedStyle(surface)
        // Resolve the tokens as actually rendered by painting a probe element.
        const probe = document.createElement('div')
        probe.style.cssText = 'background: var(--primary); color: var(--primary-foreground)'
        surface.appendChild(probe)
        const painted = getComputedStyle(probe)
        const result = {
          primary: styles.getPropertyValue('--primary').trim(),
          primaryForeground: styles.getPropertyValue('--primary-foreground').trim(),
          ring: styles.getPropertyValue('--ring').trim(),
          paintedBg: painted.backgroundColor,
          paintedFg: painted.color,
        }
        probe.remove()
        return result
      })
      if (audit === null) throw new Error('no .cc-surface found')
      const ratio = contrast(parseRgb(audit.paintedBg), parseRgb(audit.paintedFg))
      console.log(`THEME_${theme.toUpperCase()} ${JSON.stringify({ ...audit, contrast: Number(ratio.toFixed(2)), passesAA: ratio >= 4.5 })}`)
      if (ratio < 4.5) throw new Error(`${theme}: on-primary contrast ${ratio.toFixed(2)}:1 fails WCAG AA (needs 4.5:1)`)
    }
    console.log('theme screenshots written to shots/')
  } finally {
    await browser.close()
    host.child.kill('SIGTERM')
  }
}

await main()
