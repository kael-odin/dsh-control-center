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
await page.waitForTimeout(6000)

// Open settings via sidebar trigger
const clicked = await page.evaluate(() => {
  const els = [...document.querySelectorAll('button, [role="button"], [role="tab"]')]
  const settings = els.find((el) => (el.textContent || '').trim() === '设置' || (el.getAttribute('aria-label') || '') === '设置')
  if (!settings) return false
  settings.click()
  return true
})
await page.waitForTimeout(2500)
const afterOpen = await page.evaluate(() => document.body.innerText.slice(0, 800))
writeFileSync('.probe-settings-open.txt', afterOpen)
console.log('=== after clicking 设置 (first 800 chars) ===')
console.log(afterOpen)
console.log('=== console errors ===')
console.log(consoleErrors.length ? consoleErrors : 'none')
await browser.close()
