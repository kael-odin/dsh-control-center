import { chromium } from 'playwright'
const browser = await chromium.launch({
  executablePath: 'C:/Users/user/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:3080/', { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => window.__DSH_BOOT__, { timeout: 15000 })
await page.waitForTimeout(6000)
const info = await page.evaluate(() => {
  // All CSS custom props on :root
  const root = getComputedStyle(document.documentElement)
  const vars = []
  for (let i = 0; i < root.length; i++) {
    const name = root[i]
    if (name.startsWith('--')) vars.push(name)
  }
  // data-theme / class on html/body
  const html = document.documentElement
  return {
    htmlClass: html.className,
    htmlDataset: JSON.stringify(html.dataset),
    bodyClass: document.body.className,
    varCount: vars.length,
    varsSample: vars.slice(0, 80),
  }
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
