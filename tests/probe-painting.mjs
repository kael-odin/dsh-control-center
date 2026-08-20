// Interaction probe for the painting workspace against the live DSH web.
import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', err => errors.push(`pageerror: ${err.message}`))
page.on('console', msg => { if (msg.type() === 'error') errors.push(`console.error: ${msg.text().slice(0, 200)}`) })

await page.goto('http://127.0.0.1:3080/', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(2600)

// Enter painting workspace.
await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find(b => (b.textContent ?? '').trim() === '绘画')
  if (button) button.click()
})
await page.waitForTimeout(1500)

const results = {}

// 1. Click the center template card → prompt fills in textarea.
const promptBefore = await page.evaluate(() => {
  const ta = document.querySelector('textarea')
  return ta ? ta.value : null
})
await page.evaluate(() => {
  const card = document.querySelector('[data-testid="painting-template-stage"] button')
  if (card) card.click()
})
await page.waitForTimeout(1200)
results.promptAfterClick = await page.evaluate(() => {
  const ta = document.querySelector('textarea')
  return ta ? ta.value.slice(0, 80) : null
})
results.promptFilled = promptBefore === '' && results.promptAfterClick !== null && results.promptAfterClick.length > 0

// 2. Open params popover.
await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') ?? '').startsWith('设置:'))
  if (button) button.click()
})
await page.waitForTimeout(400)
results.paramsText = await page.evaluate(() => {
  const selects = [...document.querySelectorAll('select')].map(s => s.value)
  const chips = [...document.querySelectorAll('button')].filter(b => /1024×1024|自动|1536×1024/.test(b.textContent ?? '')).map(b => b.textContent.trim())
  return { selects, chips: chips.slice(0, 6) }
})
// Close params, open quick panel.
await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') ?? '').startsWith('设置:'))
  if (button) button.click()
})
await page.waitForTimeout(200)
await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find(b => (b.title ?? '') === '输入快捷面板')
  if (button) button.click()
})
await page.waitForTimeout(400)
results.quickPanel = await page.evaluate(() => document.body.innerText.includes('上传附件') && document.body.innerText.includes('提示词管理'))

// 3. Open prompt library from quick panel.
await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find(b => (b.textContent ?? '').includes('提示词管理'))
  if (button) button.click()
})
await page.waitForTimeout(300)
results.promptLib = await page.evaluate(() => document.body.innerText.includes('添加提示词...'))

// 4. Check the session strip renders.
results.strip = await page.evaluate(() => {
  const aside = document.querySelector('aside')
  return aside ? aside.innerText.slice(0, 60) : null
})

console.log(JSON.stringify(results, null, 1))
console.log('--- errors ---')
console.log(errors.length === 0 ? '(none)' : errors.join('\n'))
await browser.close()
