// Quick visual capture against the live DSH web at 127.0.0.1:3080.
// Usage: node tests/shots.mjs [out-dir] [--wait-ms N]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const OUT = resolve(process.argv[2] ?? 'shots')
mkdirSync(OUT, { recursive: true })
const WAIT = Number(process.argv[4] ?? 2600)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', err => errors.push(`pageerror: ${err.message}`))
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(`console.error: ${msg.text().slice(0, 200)}`)
})

const url = process.env.DSH_WEB_URL ?? 'http://127.0.0.1:3080/'
console.log(`opening ${url}`)
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(WAIT)

const name = process.argv[3] ?? 'default'
await page.screenshot({ path: join(OUT, `${name}.jpg`), type: 'jpeg', quality: 72, fullPage: false })
console.log(`saved shots/${name}.jpg`)

// dump the visible text of the main area for orientation
const text = await page.evaluate(() => {
  const main = document.querySelector('main') ?? document.body
  return main.innerText.slice(0, 1200)
})
console.log('--- visible text ---')
console.log(text)
console.log('--- errors ---')
console.log(errors.length === 0 ? '(none)' : errors.join('\n'))

await browser.close()
