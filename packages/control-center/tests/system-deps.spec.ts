import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SystemService } from '../src/system.ts'

const spawnSpy = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>()
  return { ...actual, spawnSync: spawnSpy }
})

function setup(): { service: SystemService } {
  const ctx = new Context()
  ;(ctx as unknown as { settings: unknown }).settings = {
    describe: () => ([]),
    register: vi.fn(() => ({ get: () => ({}) })),
  }
  return { service: new SystemService(ctx) }
}

describe('SystemService environment check', () => {
  afterEach(() => { spawnSpy.mockReset() })

  it('reports present tools with a version and missing tools honestly', async () => {
    spawnSpy
      .mockReturnValueOnce({ status: 0, stdout: '/usr/bin/ffmpeg\n' }) // which ffmpeg
      .mockReturnValueOnce({ status: 0, stdout: 'ffmpeg version 6.1\n' }) // ffmpeg -version
      .mockReturnValueOnce({ status: 1, stdout: '' }) // which tesseract → missing
      .mockReturnValueOnce({ status: 0, stdout: '/usr/bin/git\n' }) // which git
      .mockReturnValueOnce({ status: 0, stdout: 'git version 2.40.1\n' }) // git --version
    const { service } = setup()
    const result = await service.checkDependencies()
    const ffmpeg = result.find(entry => entry.name === 'ffmpeg')
    const tesseract = result.find(entry => entry.name === 'tesseract')
    expect(ffmpeg).toEqual({ name: 'ffmpeg', present: true, version: 'ffmpeg version 6.1', hint: '音频/视频处理、媒体消息' })
    expect(tesseract?.present).toBe(false)
  })
})
