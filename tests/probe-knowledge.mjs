// Interaction probe: knowledge workspace create/add/index/recall against live DSH web.
import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', err => errors.push(`pageerror: ${err.message}`))
page.on('console', msg => { if (msg.type() === 'error') errors.push(`console.error: ${msg.text().slice(0, 200)}`) })

await page.goto('http://127.0.0.1:3080/', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(2600)

await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find(b => (b.textContent ?? '').trim() === '知识库')
  if (button) button.click()
})
await page.waitForTimeout(1500)

const results = {}

// Create a knowledge base.
await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find(b => (b.textContent ?? '').includes('新建知识库'))
  if (button) button.click()
})
await page.waitForTimeout(300)
await page.fill('#cc-kb-name', 'probe 手册')
await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '创建')
  if (button) button.click()
})
await page.waitForTimeout(1200)
results.baseCreated = await page.evaluate(() => document.body.innerText.includes('probe 手册'))

// Add a note source.
await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find(b => (b.textContent ?? '').includes('添加数据源'))
  if (button) button.click()
})
await page.waitForTimeout(300)
await page.evaluate(() => {
  const item = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '笔记')
  if (item) item.click()
})
await page.waitForTimeout(400)
await page.fill('#cc-note-body', '发布流程要求所有变更先经过本地检查，再进入发布流水线。')
await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '添加')
  if (button) button.click()
})
await page.waitForTimeout(1000)
results.noteAdded = await page.evaluate(() => document.body.innerText.includes('发布流程要求所有变更先经过本地检查'))

// Index.
await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find(b => (b.textContent ?? '').includes('建立索引'))
  if (button) button.click()
})
await page.waitForTimeout(1500)
results.indexed = await page.evaluate(() => document.body.innerText.includes('已索引 1 个来源'))

// Recall test drawer.
await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find(b => (b.textContent ?? '').includes('召回测试'))
  if (button) button.click()
})
await page.waitForTimeout(400)
await page.fill('input[placeholder="输入测试 Query..."]', '发布流程')
await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find(b => (b.textContent ?? '').includes('检索'))
  if (button) button.click()
})
await page.waitForTimeout(1500)
results.recallHits = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('button')].filter(b => (b.textContent ?? '').includes('发布流程要求所有变更'))
  return cards.length > 0
})
results.recallText = await page.evaluate(() => document.body.innerText.includes('个结果') && document.body.innerText.includes('最高:'))

console.log(JSON.stringify(results, null, 1))
console.log('--- errors ---')
console.log(errors.length === 0 ? '(none)' : errors.join('\n'))
await browser.close()
