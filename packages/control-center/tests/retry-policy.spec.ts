import { describe, expect, it } from 'vitest'
import { dshRetryPolicyOf, groupByNamespace, retryPolicyOps } from '../src/client/retry-policy.ts'
import type { RetryConfig } from '../src/client/model-prefs-store.ts'

function config(patch: Partial<RetryConfig>): RetryConfig {
  return { enabled: false, maxAttempts: 3, backoff: true, fallbacks: [], ...patch }
}

describe('dshRetryPolicyOf', () => {
  it('projects disabled to an explicit zero-retry policy, not the harness default', () => {
    expect(dshRetryPolicyOf(config())).toEqual({ mode: 'normal', maxRetries: 0 })
  })

  it('omits backoff when enabled so adapter defaults apply', () => {
    expect(dshRetryPolicyOf(config({ enabled: true, maxAttempts: 5, backoff: true })))
      .toEqual({ mode: 'normal', maxRetries: 5 })
  })

  it('uses a minimal positive delay without jitter when backoff is off', () => {
    expect(dshRetryPolicyOf(config({ enabled: true, maxAttempts: 2, backoff: false })))
      .toEqual({ mode: 'normal', maxRetries: 2, backoff: { initialDelayMs: 1, jitterRatio: 0 } })
  })
})

describe('retryPolicyOps', () => {
  it('addresses every live profile plus the stash copies', () => {
    const writes = retryPolicyOps(
      config({ enabled: true, maxAttempts: 4 }),
      [
        { ns: 'llm-pi-ai', path: ['providers', 'deepseek'] },
        { ns: 'llm-deepseek', path: [] },
      ],
      ['openrouter'],
    )
    expect(writes).toHaveLength(3)
    expect(writes[0]).toMatchObject({
      ns: 'llm-pi-ai',
      op: { op: 'set', path: ['providers', 'deepseek', 'retryPolicy'], value: { mode: 'normal', maxRetries: 4 } },
    })
    // llm-deepseek's section root IS the profile.
    expect(writes[1]).toMatchObject({
      ns: 'llm-deepseek',
      op: { op: 'set', path: ['retryPolicy'] },
    })
    expect(writes[2]).toMatchObject({
      ns: 'control-center-provider-stash',
      op: { op: 'set', path: ['providers', 'openrouter', 'retryPolicy'] },
    })
    // Each write carries its own detached copy.
    const first = writes[0]!.op.value as Record<string, unknown>
    first.mode = 'mutated'
    expect((writes[1]!.op.value as Record<string, unknown>).mode).toBe('normal')
  })

  it('groups flat writes into one payload per namespace in first-seen order', () => {
    const payloads = groupByNamespace(retryPolicyOps(
      config(),
      [
        { ns: 'llm-pi-ai', path: ['providers', 'a'] },
        { ns: 'llm-deepseek', path: [] },
        { ns: 'llm-pi-ai', path: ['providers', 'b'] },
      ],
      [],
    ))
    expect(payloads.map(payload => payload.ns)).toEqual(['llm-pi-ai', 'llm-deepseek'])
    expect(payloads[0]!.ops.map(op => op.path)).toEqual([['providers', 'a', 'retryPolicy'], ['providers', 'b', 'retryPolicy']])
  })
})
