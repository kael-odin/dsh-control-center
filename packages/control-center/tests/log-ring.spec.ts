import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { drainPluginLogs, installLogRing, recordPluginLog } from '../src/log-ring.ts'

describe('plugin log ring', () => {
  it('records entries newest-last and mirrors wrapped logger calls', () => {
    recordPluginLog('info', ['hello', { a: 1 }])
    const drained = drainPluginLogs()
    const last = drained.at(-1)
    expect(last?.level).toBe('info')
    expect(last?.message).toBe('hello {"a":1}')
  })

  it('installLogRing keeps original behavior and mirrors into the ring', () => {
    const calls: string[] = []
    const ctx = new Context()
    ;(ctx as unknown as { logger: unknown }).logger = {
      warn: (...parts: unknown[]) => { calls.push(parts.join(' ')) },
    }
    installLogRing(ctx)
    ctx.logger.warn('bridge failed:', new Error('x').message)
    expect(calls).toEqual(['bridge failed: x'])
    expect(drainPluginLogs().some(entry => entry.level === 'warn' && entry.message.includes('bridge failed'))).toBe(true)
  })

  it('caps the ring at capacity', () => {
    for (let index = 0; index < 600; index++) recordPluginLog('debug', [String(index)])
    const drained = drainPluginLogs()
    expect(drained.length).toBeLessThanOrEqual(500)
    expect(drained.at(-1)?.message).toBe('599')
  })
})
