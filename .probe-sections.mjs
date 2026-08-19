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
await page.waitForTimeout(5000)

const clickByText = async (label) => {
  const ok = await page.evaluate((text) => {
    const els = [...document.querySelectorAll('button, [role="button"], [role="tab"]')]
    const el = els.find((e) => (e.textContent || '').trim() === text || (e.textContent || '').trim().startsWith(text))
    if (!el) return false
    el.click()
    return true
  }, label)
  return ok
}

const results = {}
// Open settings
await clickByText('设置')
await page.waitForTimeout(2000)

for (const section of ['Skills', 'API 提供商', 'MCP', '网络搜索']) {
  await clickByText(section)
  await page.waitForTimeout(2500)
  const content = await page.evaluate(() => {
    // content area: capture main text, excluding sidebar nav labels
    const body = document.body.innerText
    const sections = [...document.querySelectorAll('[role="tabpanel"], section, main')].map((el) => (el.textContent || '').trim().slice(0, 400))
    return { body: body.slice(0, 600), panels: sections.filter((s) => s && s.length > 20).slice(0, 5) }
  })
  results[section] = content
  console.log(`\n========== ${section} ==========`)
  console.log(content.body.slice(0, 400))
  if (content.panels.length) console.log('--- panel:', content.panels[0].slice(0, 300))
}

console.log('\n=== console errors ===')
console.log(consoleErrors.length ? consoleErrors : 'none')
writeFileSync('.probe-sections.json', JSON.stringify({ results, consoleErrors }, null, 2))
await browser.close()
