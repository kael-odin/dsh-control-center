import { chromium } from 'playwright'
const browser = await chromium.launch({
  executablePath: 'C:/Users/user/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:3080/', { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => window.__DSH_BOOT__, { timeout: 15000 })
await page.waitForTimeout(6000)
await page.evaluate(() => { const els = [...document.querySelectorAll('button,[role="button"],[role="tab"]')]; const s = els.find((el) => (el.textContent||'').trim() === '设置'); if (s) s.click() })
await page.waitForTimeout(2500)
const data = await page.evaluate(() => {
  const cs = (sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const c = getComputedStyle(el)
    return { bg: c.backgroundColor, color: c.color, font: c.fontFamily.slice(0, 60), size: c.fontSize, radius: c.borderRadius, border: c.borderColor, padding: c.padding, radius2: c.borderTopLeftRadius }
  }
  // CSS variables from :root
  const root = getComputedStyle(document.documentElement)
  const vars = {}
  const interesting = ['--background', '--foreground', '--border', '--card', '--muted', '--accent', '--primary', '--sidebar', '--destructive', '--ring']
  for (const v of interesting) vars[v] = root.getPropertyValue(v).trim() || undefined
  return {
    vars,
    body: cs('body'),
    shell: cs('[class*="settings"]'),
    main: cs('main'),
  }
})
console.log(JSON.stringify(data, null, 1))
await browser.close()
