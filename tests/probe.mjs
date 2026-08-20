// Structural capture against the live DSH web at 127.0.0.1:3080.
// Usage: node tests/probe.mjs <workspace|settings|nav> [out-name]
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const OUT = resolve('shots')
mkdirSync(OUT, { recursive: true })
const target = process.argv[2] ?? 'nav'
const name = process.argv[3] ?? target

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', err => errors.push(`pageerror: ${err.message}`))
page.on('console', msg => { if (msg.type() === 'error') errors.push(`console.error: ${msg.text().slice(0, 160)}`) })

await page.goto(process.env.DSH_WEB_URL ?? 'http://127.0.0.1:3080/', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(2800)

if (target !== 'nav') {
  // Click the workspace nav entry (sidebar 工作区 section items)
  const clicked = await page.evaluate((label) => {
    const buttons = [...document.querySelectorAll('button, [role="button"], a')]
    const found = buttons.find(b => (b.textContent ?? '').trim() === label)
    if (found === undefined) return false
    found.click()
    return true
  }, target)
  console.log(`clicked ${target}: ${clicked}`)
  await page.waitForTimeout(1200)
}

const report = await page.evaluate(() => {
  const main = document.querySelector('main')
  const dump = (el) => {
    if (!el) return null
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return {
      tag: el.tagName, cls: el.className.slice(0, 120),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      bg: cs.backgroundColor, color: cs.color, font: cs.fontSize + '/' + cs.lineHeight, radius: cs.borderRadius,
    }
  }
  const texts = (el) => el ? el.innerText.slice(0, 2500) : ''
  return {
    main: dump(main),
    mainText: texts(main),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    buttons: [...document.querySelectorAll('button')].slice(0, 60).map(b => ({ t: (b.textContent ?? '').trim().slice(0, 40), cls: b.className.slice(0, 80) })),
  }
})
writeFileSync(join(OUT, `${name}.json`), JSON.stringify(report, null, 2))
console.log(`--- main rect/bg ---`)
console.log(JSON.stringify(report.main, null, 1))
console.log(`--- body bg --- ${report.bodyBg}`)
console.log(`--- main text ---`)
console.log(report.mainText)
console.log(`--- errors ---`)
console.log(errors.length === 0 ? '(none)' : errors.join('\n'))
await browser.close()
