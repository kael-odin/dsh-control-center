import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const browser = await chromium.launch({
  executablePath: 'C:/Users/user/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe',
  headless: true,
})
const page = await browser.newPage()
const consoleErrors = []
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300)) })
page.on('pageerror', (err) => consoleErrors.push(`PAGEERROR: ${String(err).slice(0, 300)}`))

await page.goto('http://127.0.0.1:3080/', { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => window.__DSH_BOOT__ && window.__DSH_BOOT__.entries.length > 0, { timeout: 15000 })
await page.waitForTimeout(6000) // let client modules boot + mount

const dump = await page.evaluate(() => {
  const text = document.body.innerText
  const buttons = [...document.querySelectorAll('button, [role="button"], a, [role="tab"]')]
    .map((el) => ({ text: (el.textContent || '').trim().slice(0, 40), aria: el.getAttribute('aria-label') || '' }))
    .filter((b) => b.text || b.aria)
    .slice(0, 60)
  return { text: text.slice(0, 1500), buttons }
})
writeFileSync('.probe-structure.json', JSON.stringify({ dump, consoleErrors }, null, 2))
console.log('=== body text (first 1500 chars) ===')
console.log(dump.text)
console.log('=== console errors ===')
console.log(consoleErrors.length ? consoleErrors : 'none')
await browser.close()
