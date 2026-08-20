// Real-model end-to-end: translate via the live DeepSeek provider, then
// verify the usage analytics page records the call with real tokens.
import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', err => errors.push(`pageerror: ${err.message}`))
page.on('console', msg => { if (msg.type() === 'error') errors.push(`console.error: ${msg.text().slice(0, 160)}`) })

await page.goto('http://127.0.0.1:3080/', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(8000)

const results = {}

// Enter the translation workspace.
await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find(b => (b.textContent ?? '').trim() === '翻译')
  if (button) button.click()
})
await page.waitForTimeout(1800)

// Pick the DeepSeek flash model and translate a real sentence.
const modelSelect = page.getByLabel('翻译模型')
await modelSelect.waitFor({ timeout: 15000 })
const options = await modelSelect.locator('option').allTextContents()
results.availableModels = options
const deepseekOption = options.find(text => text.includes('DeepSeek'))
if (deepseekOption) {
  await modelSelect.selectOption({ label: deepseekOption })
  results.modelSelected = deepseekOption
} else {
  results.modelSelected = null
}

await page.getByLabel('待翻译文本').fill('The quick brown fox jumps over the lazy dog. Machine learning is transforming how we work.')
await page.getByRole('main').getByRole('button', { name: '翻译', exact: true }).click()
await page.waitForTimeout(12000)

results.outputText = await page.getByLabel('翻译结果').innerText().catch(() => '(not found)')
results.translationOk = results.outputText.length > 10 && !results.outputText.includes('翻译中')

// Open settings → usage analytics.
await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find(b => (b.textContent ?? '').trim() === '设置' && b.className.includes('trigger'))
  if (button) button.click()
})
await page.waitForTimeout(800)
await page.evaluate(() => {
  const cell = [...document.querySelectorAll('button')].find(b => (b.textContent ?? '').trim() === '用量统计')
  if (cell) cell.click()
})
await page.waitForTimeout(1500)

results.usageText = await page.evaluate(() => {
  const dialog = document.querySelector('[role="dialog"]')
  return dialog ? dialog.innerText.slice(0, 1600) : '(no dialog)'
})
results.usageHasRequests = /请求数\s*\d+/.test(results.usageText)
results.usageHasDeepSeek = results.usageText.includes('deepseek-v4-flash') || results.usageText.includes('DeepSeek')
results.usageHasTokens = /\d+(\.\d+)?K|\d+M/.test(results.usageText)

console.log(JSON.stringify(results, null, 1))
console.log('--- errors ---')
console.log(errors.length === 0 ? '(none)' : errors.join('\n'))
await browser.close()
